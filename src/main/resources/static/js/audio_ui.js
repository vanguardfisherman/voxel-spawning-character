// audio_ui.js — Panel para cargar sonidos locales (POP y pasos)
import { setPopFromFile, setStepFromFile, playPop, ensureAudioReady } from './audio.js';

export function initAudioUI() {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
    position:fixed; left:50%; bottom:64px; transform:translateX(-50%);
    z-index:45; background:rgba(0,0,0,.55); color:#fff; font:12px/1.3 ui-sans-serif,system-ui,Arial;
    padding:10px 12px; border-radius:10px; backdrop-filter: blur(6px); box-shadow:0 6px 20px rgba(0,0,0,.25);
  `;
    wrap.innerHTML = `
    <div style="font-weight:600; margin-bottom:6px">Sonidos</div>
    <div style="display:grid; grid-template-columns:auto 1fr auto; gap:6px; align-items:center;">
      <label for="popFile">POP:</label>
      <input id="popFile" type="file" accept="audio/*" style="color:#fff">
      <button id="testPop" style="background:#334155; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer">Probar</button>

      <label for="stepFile">Pasos:</label>
      <input id="stepFile" type="file" accept="audio/*" style="color:#fff">
      <span style="opacity:.7">(se oye al caer)</span>
    </div>
    <div style="opacity:.7; margin-top:6px">Elige .mp3, .wav u .ogg desde tu equipo.</div>
  `;
    document.body.appendChild(wrap);

    const popInput  = wrap.querySelector('#popFile');
    const stepInput = wrap.querySelector('#stepFile');
    const testBtn   = wrap.querySelector('#testPop');

    popInput.addEventListener('change', async () => {
        const f = popInput.files?.[0]; if (!f) return;
        try {
            await setPopFromFile(f);
            await ensureAudioReady();
            playPop();
        } catch (e) { console.error('Error cargando POP:', e); }
    });

    stepInput.addEventListener('change', async () => {
        const f = stepInput.files?.[0]; if (!f) return;
        try {
            await setStepFromFile(f);
        } catch (e) { console.error('Error cargando pasos:', e); }
    });

    testBtn.addEventListener('click', async () => {
        try { await ensureAudioReady(); playPop(); } catch {}
    });
}
