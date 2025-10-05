import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONST, humanizeName, randomPoint, wrapAngle, findLimbs } from './utils.js';
import { loadOBJEntry } from './loaders.js';
import { applyRandomStepBuffer } from './audio.js';

// Defaults exportados (UI los usa)
export const TUNE = {
    speedMult: 1.0,
    separationRadius: 1.25,
    separationWeight: 1.6,
    seekWeight: 0.9,
    boundaryWeight: 2.2,
    obstacleWeight: 1.8,   // ⬅ nuevo
    edgePadding: 0.8
};

export async function createWalker(entry, scene, half){
    const group = new THREE.Group();
    group.position.copy(randomPoint(half));
    scene.add(group);

    const body = new THREE.Group();
    group.add(body);

    const { object: model, height } = await loadOBJEntry(entry);
    body.add(model);
    body.position.y = 0;

    const tagEl = document.createElement('div');
    tagEl.className = 'nameTag';
    const key = entry.obj; // ⬅️ clave estable para persistir
    const initialName = humanizeName(entry.name || key);
    tagEl.textContent = initialName;

    const tag = new CSS2DObject(tagEl);
    tag.position.set(0, height + CONST.TAG_MARGIN, 0);
    body.add(tag);

    const limbs = findLimbs(model);
    const baseSpeed = THREE.MathUtils.randFloat(0.9, 1.6);

    const walker = {
        key,                          // ⬅️ guardamos la clave
        name: initialName,
        setName(newName) { this.name = newName; tagEl.textContent = newName; },
        group, body, model, limbs,
        baseSpeed,
        speed: baseSpeed * TUNE.speedMult,
        hopF: THREE.MathUtils.randFloat(1.4, 2.0),
        hopA: 0.22, tiltA: 0.12, squash: 0.12,
        target: randomPoint(half),
        yaw: 0, desiredYaw: 0, turnSpeed: 3.0,
        boundsHalf: half,
        separationRadius: TUNE.separationRadius,
        separationWeight: TUNE.separationWeight,
        seekWeight: TUNE.seekWeight,
        boundaryWeight: TUNE.boundaryWeight,
        obstacleWeight: TUNE.obstacleWeight,
        edgePadding: TUNE.edgePadding
    };

    return walker;
}



export function applyTuning(all, t){
    if (!all) return;
    Object.assign(TUNE, t);
    for (const w of all){
        w.speed = w.baseSpeed * (TUNE.speedMult ?? 1);
        w.separationRadius = TUNE.separationRadius;
        w.separationWeight = TUNE.separationWeight;
        w.seekWeight       = TUNE.seekWeight;
        w.boundaryWeight   = TUNE.boundaryWeight;
        w.obstacleWeight   = TUNE.obstacleWeight; // ⬅ nuevo
        w.edgePadding      = TUNE.edgePadding;
    }
}

function boundaryForce(pos, half, pad){
    const start = half - pad, end = half;
    let fx = 0, fz = 0;
    const ax = Math.abs(pos.x), az = Math.abs(pos.z);
    if (ax > start) fx = -Math.sign(pos.x) * ((ax - start) / (end - start));
    if (az > start) fz = -Math.sign(pos.z) * ((az - start) / (end - start));
    return new THREE.Vector3(fx, 0, fz);
}

export function stepWalker(w, dt, t, all, obstacles = []){
    // 1) Seek objetivo
    const seek = new THREE.Vector3().subVectors(w.target, w.group.position).setY(0);
    const distToTarget = seek.length();
    if (distToTarget < 0.4) { w.target = randomPoint(w.boundsHalf); return; }
    seek.normalize();

    // 2) Separación entre NPCs
    const sep = new THREE.Vector3();
    const r2 = w.separationRadius * w.separationRadius;
    for (const o of all){
        if (o === w) continue;
        const off = new THREE.Vector3().subVectors(w.group.position, o.group.position).setY(0);
        const d2 = off.lengthSq();
        if (d2 > 0 && d2 < r2) sep.add(off.multiplyScalar(1 / d2));
    }
    if (sep.lengthSq() > 0) sep.normalize();

    // 3) Evitación de obstáculos (potenciales radiales)
    const obs = new THREE.Vector3();
    for (const ob of obstacles){
        const off = new THREE.Vector3().subVectors(w.group.position, ob.position).setY(0);
        const d   = off.length();
        const thresh = ob.radius + 0.6; // “radio del NPC” ≈ 0.6
        if (d > 0 && d < thresh){
            const strength = 1 - (d / thresh);   // 0..1
            off.normalize();
            obs.addScaledVector(off, strength * strength); // suaviza cerca del borde
        }
    }
    if (obs.lengthSq() > 0) obs.normalize();

    // 4) Bordes
    const edge = boundaryForce(w.group.position, w.boundsHalf, w.edgePadding);

    // 5) Combinar fuerzas
    const steer = new THREE.Vector3()
        .addScaledVector(seek, w.seekWeight)
        .addScaledVector(sep,  w.separationWeight)
        .addScaledVector(obs,  w.obstacleWeight)   // ⬅ nuevo
        .addScaledVector(edge, w.boundaryWeight);

    if (steer.lengthSq() === 0) steer.copy(seek); else steer.normalize();

    // Mover + orientar
    w.group.position.addScaledVector(steer, w.speed * dt);
    w.desiredYaw = Math.atan2(steer.x, steer.z);
    const diff = ((w.desiredYaw - w.yaw + Math.PI) % (Math.PI*2)) - Math.PI;
    const maxTurn = w.turnSpeed * dt;
    w.yaw += Math.max(-maxTurn, Math.min(maxTurn, diff));
    w.group.rotation.y = w.yaw;

    // 6) Animación
    const TAU = Math.PI * 2;
    const ft = t * w.hopF;
    const hop01 = 0.5 * (Math.sin(ft * TAU) + 1);
    w.body.position.y = w.hopA * hop01;
    // --- Sonido de pisada en el "aterrizaje" ---
    if (w.foot) {
        const prev = w._prevHop01 ?? hop01;
        const descending = (hop01 - prev) < 0;
        const TH = 0.15;
        if (descending && prev > TH && hop01 <= TH) {
            try { w.foot.stop(); } catch {}
            applyRandomStepBuffer(w.foot); // ← elige step1/2/3
            w.foot.setPlaybackRate(THREE.MathUtils.randFloat(0.92, 1.25));
            w.foot.play();
        }
        w._prevHop01 = hop01;
    }

    w.body.rotation.z = Math.sin(ft * TAU) * w.tiltA;
    const squashAmt = w.squash * (1 - hop01) * (1 - hop01);
    const sxz = 1 + squashAmt * 0.5, sy = 1 - squashAmt;
    w.body.scale.set(sxz, sy, sxz);
    const limbSwing = Math.sin(ft * TAU) * 0.5;
    for (const a of w.limbs.arms) a.rotation.x = limbSwing;
    for (const l of w.limbs.legs) l.rotation.x = -limbSwing;
}
