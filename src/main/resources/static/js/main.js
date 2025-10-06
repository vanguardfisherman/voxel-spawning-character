// src/main/resources/static/js/main.js
import * as THREE from 'three';
import { setupScene } from './scene.js';
import { stepWalker, createWalker, TUNE, applyTuning } from './npcs.js';
import { initUI } from './ui.js';
//import { createObstacles } from './obstacles.js';//por si deseo crear obstaculos
import { initNameEditor } from './names_ui.js';
import { initInstructions } from './instructions_ui.js';
import { initSpawnUI } from './spawn_ui.js';
import { initAudio, ensureAudioReady, playPop, createFootAudio } from './audio.js';
import { loadFloor } from './floors.js';
import { initFloorUI } from './floor_ui.js';


(async function start() {
    // Modelos disponibles y nombres guardados
    const MODELS = await fetch('/models/index.json').then(r => r.json());
    const savedNames = await fetch('/api/names').then(r => r.json()).catch(() => ({}));

    // Escena base
    const { scene, camera, renderer, labelRenderer, controls, half, setEnvironment, ground, grid } = setupScene('app');


    // Audio (listener en la cámara) — usa config.json automáticamente
    initAudio(camera);

    // Panel “Instrucciones”
    initInstructions();

    // Obstáculos
   // const obstacles = createObstacles(scene, half, 6);//

    // Estado global
    const walkers = [];
    const clickable = [];                 // raíces clicables (modelo de cada walker)
    const nameEditor = initNameEditor();
    let nextId = 1;
    let nextModelIdx = 0;                 // spawnear uno por uno
    let paused = false;

    // Aro de selección
    const selRing = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.68, 32),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    selRing.rotation.x = -Math.PI / 2;
    selRing.position.y = 0.01;
    selRing.visible = false;
    scene.add(selRing);

    const FLOORS = await fetch('/models/floors/floors.json').then(r => r.json()).catch(() => []);

    let floorMesh = null;
    let currentHalf = half; // límites actuales para los minions

    if (FLOORS.length) {
        const ui = initFloorUI(FLOORS, async (entry) => {
            floorMesh = await loadFloor(entry, scene, floorMesh);

            // Oculta el piso/grid por defecto si quieres usar SOLO el OBJ
            if (ground) ground.visible = false;
            if (grid)   grid.visible = false;

            // Actualiza los límites de movimiento si el JSON trae "size"
             // toma el half calculado por floors.js (según bbox/scale/size)
                 if (floorMesh?.userData?.half != null) {
                   currentHalf = floorMesh.userData.half;
                   for (const w of walkers) w.boundsHalf = currentHalf;
                 }
        });

        // opcional: selecciona el primero automáticamente
        ui.select(0);
    }



    // ---------- Spawner ----------
    async function spawnOne() {
        if (!MODELS.length) return;
        const entry = MODELS[nextModelIdx];
        nextModelIdx = (nextModelIdx + 1) % MODELS.length;

        // Crear walker (asíncrono)
        // dentro de spawnOne():
        const w = await createWalker(entry, scene, currentHalf);

        w.id = nextId++;

        // Nombre persistido si existe
        if (savedNames[w.key]) w.setName(savedNames[w.key]);

        // Audio de pisada (posicional) acoplado al grupo
        const foot = createFootAudio();
        if (foot) { w.foot = foot; w.group.add(foot); }

        // Animación de aparición (escalamos el GROUP, no el body)
        w.spawnT = 0;                // 0..1
        w.group.scale.setScalar(0.01);

        walkers.push(w);
        nameEditor.addWalker(w);

        // Hacer clicable toda su jerarquía: guardamos ref en la raíz del modelo
        w.model.userData.walkerRef = w;
        clickable.push(w.model);

        // POP al invocar (asegurando el contexto de audio)
        await ensureAudioReady();
        playPop();
    }

    // Botón “Invocar minion” (centro abajo)
    initSpawnUI(spawnOne);

    // UI de tuning (derecha)
    initUI(TUNE, (state) => {
        applyTuning(walkers, state);
        paused = !!state.paused;
    });

    // --------- Selección + Follow ----------
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let selected = null;
    let followOn = true; // F para togglear

    function setSelected(w) {
        selected = w;
        selRing.visible = !!w;
        if (w) selRing.position.set(w.group.position.x, 0.01, w.group.position.z);
    }

    function onPointerDown(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);

        const hits = raycaster.intersectObjects(clickable, true);
        if (hits.length) {
            let w = null;
            for (const h of hits) {
                let o = h.object;
                while (o && !o.userData.walkerRef) o = o.parent;
                if (o && o.userData.walkerRef) { w = o.userData.walkerRef; break; }
            }
            if (w) { setSelected(w); return; }
        }
        setSelected(null);
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'f' || e.key === 'F') followOn = !followOn;
        if (e.key === 'Escape') setSelected(null);
    });

    // --------- Loop robusto ----------
    const clock = new THREE.Clock();

    // Curva de aparición (easeOutBack)
    function easeOutBack(x) {
        const c1 = 1.70158, c3 = c1 + 1;
        const t = Math.min(Math.max(x, 0), 1);
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function tick() {
        const dt = Math.min(clock.getDelta(), 0.05);
        const t  = clock.getElapsedTime();

        try {
            if (!paused && walkers.length) {
                for (const w of walkers) {
                    // Steering + animación “South Park”
                    stepWalker(w, dt, t, walkers);  //si deseas agregar obstaculos, solo debes añadir
                    // stepWalker(w, dt, t, walkers, obstacles);

                    // Aparición: escala del GROUP 0→1 en ~0.35s
                    if (w.spawnT !== undefined && w.spawnT < 1) {
                        w.spawnT = Math.min(1, w.spawnT + dt * 3);
                        const s = easeOutBack(w.spawnT);
                        w.group.scale.setScalar(s);
                    }
                }
            }
        } catch (err) {
            console.error('stepWalker error:', err);
        }

        // Follow de cámara (suave)
        if (selected && followOn) {
            const behind = new THREE.Vector3(0, 2.4, 4.8);
            const rotY = selected.group.rotation.y;
            const rotMat = new THREE.Matrix4().makeRotationY(rotY);
            const offset = behind.clone().applyMatrix4(rotMat);
            const targetPos = selected.group.position.clone();
            const desiredCam = targetPos.clone().add(offset);
            const lerp = 1 - Math.exp(-dt * 3.5);
            camera.position.lerp(desiredCam, lerp);
            const lookAt = targetPos.clone(); lookAt.y += 1.2;
            controls.target.lerp(lookAt, lerp);
        }

        // Actualiza aro de selección
        if (selected) {
            selRing.position.set(selected.group.position.x, 0.01, selected.group.position.z);
        }

        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    tick();

    // Resize
    addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        labelRenderer.setSize(innerWidth, innerHeight);
    });
})();
