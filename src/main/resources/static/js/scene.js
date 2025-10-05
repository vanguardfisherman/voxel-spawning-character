// scene.js — Preset: Estudio neutro (luz suave y limpia)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONST } from './utils.js';

export function setupScene(containerId){
    const app = document.getElementById(containerId);

    // Escena y cámara
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0e1420'); // fondo neutro oscuro

    const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 500);
    camera.position.set(6, 6, 10);
    camera.lookAt(0, 0, 0);

    // Renderer (sombras suaves, tono neutro)
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ReinhardToneMapping; // más neutral que ACES para esta escena
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

    // Sala (paredes oscuras) y piso mate
    const room = new THREE.Mesh(
        new THREE.BoxGeometry(60, 20, 60),
        new THREE.MeshStandardMaterial({
            color: 0x0b0f1a, roughness: 1, metalness: 0, side: THREE.BackSide
        })
    );
    scene.add(room);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(CONST.GROUND_SIZE, CONST.GROUND_SIZE),
        new THREE.MeshStandardMaterial({
            color: 0x1e2635,    // más claro que antes
            roughness: 0.95,    // mate
            metalness: 0.0,     // sin reflejo metálico
            envMapIntensity: 0  // sin IBL (look consistente)
        })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- Iluminación: key + fill (neutra, sin tintes fuertes) ---
    // Relleno ambiental suave
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // Key principal (direccional) con sombras bien resueltas
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(8, 12, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.00025;
    key.shadow.normalBias = 0.02; // evita acne
    scene.add(key);

    // Fill secundario (sin sombras) para levantar negros
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-6, 7, -8);
    fill.castShadow = false;
    scene.add(fill);

    // Opcional: un ligero back para separar siluetas (muy sutil)
    const rim = new THREE.DirectionalLight(0xffffff, 0.25);
    rim.position.set(-10, 6, 10);
    rim.castShadow = false;
    scene.add(rim);

    return { scene, camera, renderer, labelRenderer, controls, half: CONST.GROUND_SIZE / 2 - 1 };
}
