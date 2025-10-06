// loaders.js
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { alignBottomAndScale, CONST } from './utils.js';

export async function loadOBJEntry(entry) {
    const BASE = '/models/';

    // Normaliza rutas: si no empiezan por '/', las colgamos de /models/
    const norm = (p) => (p ? (p.startsWith('/') ? p : BASE + p) : null);
    const objURL = norm(entry.obj);
    const mtlURL = norm(entry.mtl);
    const pngURL = norm(entry.png);

    // Separa directorio y archivo (para usar setPath(dir) + loadAsync(file))
    const split = (url) => {
        const i = url.lastIndexOf('/');
        return { dir: url.slice(0, i + 1), file: url.slice(i + 1) };
    };

    let object;

    if (mtlURL) {
        const { dir: mtlDir, file: mtlFile } = split(mtlURL);
        const mtl = new MTLLoader();
        mtl.setMaterialOptions({ side: THREE.DoubleSide });
        mtl.setResourcePath(mtlDir); // ← texturas (map_Kd) relativas al .mtl
        mtl.setPath(mtlDir);         // ← base para el propio .mtl
        const materials = await mtl.loadAsync(mtlFile);
        materials.preload();

        const { dir: objDir, file: objFile } = split(objURL);
        const obj = new OBJLoader();
        obj.setMaterials(materials);
        obj.setPath(objDir);
        object = await obj.loadAsync(objFile);

    } else {
        const { dir: objDir, file: objFile } = split(objURL);
        const obj = new OBJLoader();
        obj.setPath(objDir);
        object = await obj.loadAsync(objFile);

        // Si no hay .mtl y nos dieron png explícito, lo aplicamos
        if (pngURL) {
            const { dir: pngDir, file: pngFile } = split(pngURL);
            const texLoader = new THREE.TextureLoader();
            texLoader.setPath(pngDir);
            const tex = await new Promise((res, rej) => texLoader.load(pngFile, res, undefined, rej));
            object.traverse(o => {
                if (o.isMesh) {
                    o.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.0 });
                    o.castShadow = true; o.receiveShadow = true;
                }
            });
        } else {
            object.traverse(o => {
                if (o.isMesh) {
                    o.material = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.25 });
                    o.castShadow = true; o.receiveShadow = true;
                }
            });
        }
    }

    // Asegura sombras si entró por la ruta MTL
    object.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    const { height } = alignBottomAndScale(object, CONST.TARGET_HEIGHT);
    return { object, height };
}
