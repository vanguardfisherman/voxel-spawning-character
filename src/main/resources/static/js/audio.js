// audio.js — POP y footsteps con WebAudio + configuración desde /config.json
import * as THREE from 'three';

let listener, ctx;
let popAudio, popBuffer, popVolume = 0.9;

// Pasos (soporta uno o varios buffers)
let stepBuffer;                 // fallback / único
let stepBuffers = [];           // lista (step1/2/3)
let stepVolume = 0.7;

// Mantiene referencias a los audios posicionales ya creados
const footNodes = new Set();

// ---------------- Síntesis fallback (si falta archivo) ----------------
function makePopBuffer(ctx) {
    const sr = ctx.sampleRate, dur = 0.12, N = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, N, sr), ch = buf.getChannelData(0);
    for (let i = 0; i < N; i++) {
        const t = i / sr, env = Math.exp(-t * 20);
        const f0 = 880, f1 = 440, f = f0 + (f1 - f0) * (t / dur);
        ch[i] = Math.sin(2 * Math.PI * f * t) * env * 0.9;
    }
    return buf;
}
function makeStepBuffer(ctx) {
    const sr = ctx.sampleRate, dur = 0.09, N = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, N, sr), ch = buf.getChannelData(0);
    for (let i = 0; i < N; i++) {
        const t = i / sr, env = Math.exp(-t * 40);
        const sine = Math.sin(2 * Math.PI * 140 * t);
        const noise = (Math.random() * 2 - 1) * 0.25;
        ch[i] = (sine * 0.85 + noise * 0.15) * env * 1.0;
    }
    return buf;
}

// ---------------- Utilidades ----------------
async function loadBufferFromURL(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} cargando ${url}`);
    const arr = await res.arrayBuffer();
    await ensureAudioReady();
    return new Promise((resolve, reject) => ctx.decodeAudioData(arr.slice(0), resolve, reject));
}
async function loadConfig() {
    try {
        const res = await fetch('/config.json', { cache: 'no-cache' });
        if (!res.ok) return null;
        const json = await res.json();
        return json?.audio ?? null;
    } catch { return null; }
}

// ---------------- Inicialización ----------------
export function initAudio(camera) {
    if (listener) return { ensureAudioReady, playPop, createFootAudio, applyRandomStepBuffer };

    listener = new THREE.AudioListener();
    camera.add(listener);
    ctx = listener.context;
    listener.setMasterVolume(1.0);

    // Buffers por defecto (por si no hay config/archivos)
    popBuffer  = makePopBuffer(ctx);
    stepBuffer = makeStepBuffer(ctx);

    // Fuente no posicional para POP
    popAudio = new THREE.Audio(listener);
    popAudio.setBuffer(popBuffer);
    popAudio.setVolume(popVolume);

    // Carga asíncrona desde /config.json (si existe)
    (async () => {
        const cfg = await loadConfig();
        if (!cfg) return;

        // POP
        try {
            if (cfg.pop) popBuffer = await loadBufferFromURL(cfg.pop);
            if (cfg.popVolume != null) popVolume = +cfg.popVolume;
            popAudio.setBuffer(popBuffer);
            popAudio.setVolume(popVolume);
        } catch (e) {
            console.warn('POP: usando síntesis fallback:', e);
            popBuffer = makePopBuffer(ctx);
            popAudio.setBuffer(popBuffer);
            popAudio.setVolume(popVolume);
        }

        // PASOS (lista o uno solo)
        try {
            if (Array.isArray(cfg.steps) && cfg.steps.length) {
                const bufs = await Promise.all(cfg.steps.map(u => loadBufferFromURL(u)));
                stepBuffers = bufs;           // varios
                stepBuffer  = bufs[0];        // por si no elegimos aleatorio aún
            } else if (cfg.step) {
                stepBuffer = await loadBufferFromURL(cfg.step);
                stepBuffers = [];             // no hay lista
            }
            if (cfg.stepVolume != null) stepVolume = +cfg.stepVolume;
        } catch (e) {
            console.warn('Pasos: usando síntesis fallback:', e);
            stepBuffer = makeStepBuffer(ctx);
            stepBuffers = [];
        }
        // Actualiza nodos ya creados
        for (const a of footNodes) { a.setBuffer(stepBuffers[0] || stepBuffer); a.setVolume(stepVolume); }
    })();

    return { ensureAudioReady, playPop, createFootAudio, applyRandomStepBuffer };
}

// ---------------- Control de contexto ----------------
export async function ensureAudioReady() {
    if (!ctx) return;
    if (ctx.state !== 'running') {
        try { await ctx.resume(); } catch (e) { console.error('Audio resume failed:', e); }
    }
}

// ---------------- Reproducción ----------------
export async function playPop() {
    if (!popAudio) return;
    await ensureAudioReady();
    try { popAudio.stop(); } catch {}
    popAudio.setBuffer(popBuffer);
    popAudio.setPlaybackRate(THREE.MathUtils.randFloat(0.9, 1.1));
    popAudio.setVolume(popVolume);
    popAudio.play();
}

// Crea el audio posicional para los pasos (buffer inicial)
export function createFootAudio() {
    if (!listener) return null;
    const a = new THREE.PositionalAudio(listener);
    a.setBuffer(stepBuffers[0] || stepBuffer);
    a.setVolume(stepVolume);
    a.setRefDistance(5);
    a.setDistanceModel('linear');
    footNodes.add(a);
    return a;
}

// Elige aleatoriamente step1/2/3 (si existen) para un audio dado
export function applyRandomStepBuffer(audio) {
    if (!audio) return;
    const pool = (stepBuffers && stepBuffers.length) ? stepBuffers : [stepBuffer];
    const idx = Math.floor(Math.random() * pool.length);
    audio.setBuffer(pool[idx]);
    audio.setVolume(stepVolume);
}
