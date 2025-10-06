// floors.js — carga y coloca un modelo de suelo (OBJ/MTL/PNG)
import * as THREE from 'three';
import { loadOBJEntry } from './loaders.js'; // el mismo loader que usas para los minions

/**
 * entry: { obj, mtl?, png?, size?, scale?, rx?, ry?, rz?, y? }
 * prev:  Group anterior (si existe) para removerlo
 * return: Group nuevo con userData.half = tamaño/2 (margen 1u)
 */
export async function loadFloor(entry, scene, prev) {
    if (prev) scene.remove(prev);

    const group = new THREE.Group();

    // Carga el OBJ/MTL/PNG
    const { object } = await loadOBJEntry(entry);
    group.add(object);

    // Sombra/material
    object.traverse(o => {
        if (o.isMesh) {
            o.castShadow = false;
            o.receiveShadow = true;
            if (o.material && o.material.side !== THREE.DoubleSide) {
                o.material.side = THREE.DoubleSide; // por si las normales están invertidas
            }
        }
    });

    // --- Bounding box para centrar, orientar y escalar ---
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);

    // centrar al origen
    object.position.sub(center);

    // si es "alto" comparado con ancho/profundo, probablemente viene vertical => acuéstalo
    const maxXZ = Math.max(size.x, size.z);
    if (entry.rx == null && entry.ry == null && entry.rz == null) {
        if (size.y > maxXZ * 0.5) object.rotation.x = -Math.PI / 2;
    }

    // rotaciones desde JSON (si las pusiste)
    group.rotation.set(entry.rx ?? 0, entry.ry ?? 0, entry.rz ?? 0);

    // escala: si hay 'size' normalizamos a ese lado, si no usa 'scale' o 1
    let scl = 1;
    if (entry.size) {
        const target = entry.size; // lado deseado
        const current = Math.max(size.x, size.z) || 1;
        scl = target / current;
    } else if (entry.scale) {
        scl = entry.scale;
    }
    group.scale.setScalar(scl);

    // levantar un pelín para evitar z-fighting con el plano
    group.position.y = entry.y ?? 0.01;

    // half para límites de minions (margen 1u)
    const half = (Math.max(size.x, size.z) * scl) / 2 - 1;
    group.userData.half = half;

    scene.add(group);
    return group;
}
