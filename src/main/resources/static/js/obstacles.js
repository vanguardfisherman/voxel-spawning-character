// obstacles.js — genera cajas/cilindros y devuelve su info para evitar choques
import * as THREE from 'three';

export function createObstacles(scene, half, count = 6) {
    const obstacles = [];
    const margin = 2;                          // que no queden pegados al borde
    const minX = -half + margin, maxX = half - margin;
    const minZ = -half + margin, maxZ = half - margin;

    for (let i = 0; i < count; i++) {
        const isBox = Math.random() < 0.6;
        if (isBox) {
            const w = THREE.MathUtils.randFloat(0.8, 2.0);
            const d = THREE.MathUtils.randFloat(0.8, 2.0);
            const h = THREE.MathUtils.randFloat(0.6, 1.4);
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                new THREE.MeshStandardMaterial({ color: 0x2a3344, roughness: 0.9, metalness: 0.0 })
            );
            mesh.position.set(
                THREE.MathUtils.randFloat(minX, maxX),
                h / 2,
                THREE.MathUtils.randFloat(minZ, maxZ)
            );
            mesh.castShadow = true; mesh.receiveShadow = true;
            scene.add(mesh);
            // radio de evitación ≈ mitad footprint + colchón
            obstacles.push({ position: mesh.position, radius: Math.max(w, d) * 0.5 + 0.35, mesh });
        } else {
            const r = THREE.MathUtils.randFloat(0.5, 1.2);
            const h = THREE.MathUtils.randFloat(0.8, 1.6);
            const mesh = new THREE.Mesh(
                new THREE.CylinderGeometry(r, r, h, 20),
                new THREE.MeshStandardMaterial({ color: 0x29313f, roughness: 0.9, metalness: 0.0 })
            );
            mesh.position.set(
                THREE.MathUtils.randFloat(minX, maxX),
                h / 2,
                THREE.MathUtils.randFloat(minZ, maxZ)
            );
            mesh.castShadow = true; mesh.receiveShadow = true;
            scene.add(mesh);
            obstacles.push({ position: mesh.position, radius: r + 0.35, mesh });
        }
    }
    return obstacles;
}
