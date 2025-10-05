import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { alignBottomAndScale, CONST } from './utils.js';

export async function loadOBJEntry(entry){
    const base = '/models/';
    let object;
    if (entry.mtl){
        const materials = await new MTLLoader().setPath(base).loadAsync(entry.mtl);
        materials.preload();
        object = await new OBJLoader().setMaterials(materials).setPath(base).loadAsync(entry.obj);
    } else {
        object = await new OBJLoader().setPath(base).loadAsync(entry.obj);
        object.traverse(o => { if (o.isMesh)
            o.material = new THREE.MeshStandardMaterial({ color:0xffd700, metalness:0.85, roughness:0.25 });
        });
    }
    object.traverse(o => { if (o.isMesh) o.castShadow = true; });
    const { height } = alignBottomAndScale(object, CONST.TARGET_HEIGHT);
    return { object, height };
}
