// scene.js — escenarios con presets y switcher
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONST } from './utils.js';

export function setupScene(containerId){
    const app = document.getElementById(containerId);

    // Escena + cámara
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 500);
    camera.position.set(6, 6, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    app.appendChild(renderer.domElement);

    // Etiquetas 2D
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(innerWidth, innerHeight);
    Object.assign(labelRenderer.domElement.style, {
        position: 'absolute', top: '0', left: '0', pointerEvents: 'none', zIndex: '10'
    });
    document.body.appendChild(labelRenderer.domElement);

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Sala/room (para presets “estudio”)
    const room = new THREE.Mesh(
        new THREE.BoxGeometry(60, 20, 60),
        new THREE.MeshStandardMaterial({ color: 0x0b0f1a, roughness: 1, metalness: 0, side: THREE.BackSide })
    );
    scene.add(room);

    // Piso
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(CONST.GROUND_SIZE, CONST.GROUND_SIZE),
        new THREE.MeshStandardMaterial({ color: 0x1e2635, roughness: 0.95, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid de referencia (se puede ocultar por preset)
    const grid = new THREE.GridHelper(CONST.GROUND_SIZE, CONST.GROUND_SIZE, 0x555555, 0x2b2b2b);
    grid.position.y = 0.001;
    scene.add(grid);

    // Luces base (ajustamos intensidades y colores por preset)
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(8, 12, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.00025;
    key.shadow.normalBias = 0.02;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-6, 7, -8);
    fill.castShadow = false;
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.25);
    rim.position.set(-10, 6, 10);
    rim.castShadow = false;
    scene.add(rim);

    // --- Controlador de escenarios/presets ---
    function setEnvironment(name){
        // reset suave
        scene.fog = null;
        room.visible = true;
        grid.visible = true;

        switch(name){
            case 'studio-dark': // Estudio oscuro neutro
                scene.background = new THREE.Color('#0e1420');
                room.material.color.set(0x0b0f1a);
                ground.material.color.set(0x1e2635);
                ambient.color.set(0xffffff); ambient.intensity = 0.25;
                key.color.set(0xffffff); key.intensity = 2.0; key.position.set(8,12,6);
                fill.color.set(0xffffff); fill.intensity = 0.7; fill.position.set(-6,7,-8);
                rim.color.set(0xffffff); rim.intensity = 0.25;
                grid.visible = true;
                break;

            case 'studio-white': // Estudio claro
                scene.background = new THREE.Color('#eef2f7');
                room.material.color.set(0xf4f6f9);
                ground.material.color.set(0xffffff);
                ambient.color.set(0xffffff); ambient.intensity = 0.6;
                key.color.set(0xffffff); key.intensity = 1.2; key.position.set(6,10,6);
                fill.color.set(0xffffff); fill.intensity = 0.6;
                rim.intensity = 0.0;
                grid.visible = false;
                break;

            case 'outdoor': // Exterior cielo claro
                scene.background = new THREE.Color('#87ceeb');
                room.visible = false;
                ground.material.color.set(0xdfe8e1);
                ambient.color.set(0xbfd1e5); ambient.intensity = 0.45;
                key.color.set(0xfff3d1); key.intensity = 1.8; key.position.set(30,40,20);
                fill.color.set(0xffffff); fill.intensity = 0.4;
                rim.intensity = 0.0;
                scene.fog = new THREE.Fog(0xbfd1e5, 30, 120);
                grid.visible = true;
                break;

            case 'sunset-fog': // Atardecer con neblina
                scene.background = new THREE.Color('#1d1a24');
                room.visible = false;
                ground.material.color.set(0x2a2333);
                ambient.color.set(0xffddb3); ambient.intensity = 0.35;
                key.color.set(0xffb26b); key.intensity = 1.6; key.position.set(-20,25,10);
                fill.color.set(0x7aa2ff); fill.intensity = 0.15;
                rim.color.set(0xff6b6b); rim.intensity = 0.25;
                scene.fog = new THREE.Fog(0x2b2633, 20, 80);
                grid.visible = true;
                break;

            default:
                console.warn('Preset desconocido:', name);
                break;
        }
    }

    // preset inicial
    setEnvironment('studio-dark');

    // resize
    addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        labelRenderer.setSize(innerWidth, innerHeight);
    });

    return {
        scene, camera, renderer, labelRenderer, controls,
        half: CONST.GROUND_SIZE / 2 - 1,

        setEnvironment, // ⬅️ expuesto para cambiar escenario desde fuera
        ground, grid

    };
}
