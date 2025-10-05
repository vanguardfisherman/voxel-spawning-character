import * as THREE from 'three';

export const CONST = {
    TARGET_HEIGHT: 1.2,
    TAG_MARGIN: 0.22,
    GROUND_SIZE: 24,
    TAU: Math.PI * 2,
};

export function humanizeName(file){
    return file.replace(/\.[^/.]+$/, '').replace(/[_\-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Escala por ALTURA y alinea base a y=0
export function alignBottomAndScale(root, targetHeight = CONST.TARGET_HEIGHT){
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const k = targetHeight / Math.max(size.y, 1e-6);
    root.scale.setScalar(k);
    const box2 = new THREE.Box3().setFromObject(root);
    root.position.y += -box2.min.y; // base al piso
    const height = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y;
    return { height };
}

export function randomPoint(half){
    return new THREE.Vector3(
        THREE.MathUtils.randFloat(-half, half), 0,
        THREE.MathUtils.randFloat(-half, half)
    );
}

export function wrapAngle(a){
    const TAU = Math.PI * 2;
    a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI;
}

export function findLimbs(root){
    const limbs = { arms: [], legs: [] };
    root.traverse(o => {
        if (!o.isMesh && !o.isGroup) return;
        const n = (o.name||'').toLowerCase();
        if (/arm|mano|brazo/.test(n)) limbs.arms.push(o);
        if (/leg|pie|pierna/.test(n)) limbs.legs.push(o);
    });
    return limbs;
}
