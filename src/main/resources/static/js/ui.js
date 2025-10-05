// ui.js — mini panel para ajustar comportamiento en vivo
export function initUI(defaults, onChange){
    const wrap = document.createElement('div');
    wrap.style.cssText = `
    position:fixed; right:12px; top:12px; z-index:30;
    background:rgba(0,0,0,.55); color:#fff; font:12px/1.2 ui-sans-serif,system-ui,Arial;
    padding:10px 12px; border-radius:10px; backdrop-filter: blur(6px); width: 240px;
  `;
    wrap.innerHTML = `
    <div style="font-weight:600; margin-bottom:6px">Tuning (live)</div>
    <label>Velocidad <span id="s_speedVal"></span></label>
    <input id="s_speed" type="range" min="0.2" max="2.0" step="0.05" style="width:100%">
    <label>Sep. Radio <span id="s_radVal"></span></label>
    <input id="s_rad" type="range" min="0.3" max="2.0" step="0.05" style="width:100%">
    <label>Sep. Peso <span id="s_sepVal"></span></label>
    <input id="s_sep" type="range" min="0.0" max="3.0" step="0.05" style="width:100%">
    <label>Seek Peso <span id="s_seekVal"></span></label>
    <input id="s_seek" type="range" min="0.3" max="2.0" step="0.05" style="width:100%">
    <label>Borde Peso <span id="s_edgeVal"></span></label>
    <input id="s_edge" type="range" min="0.5" max="4.0" step="0.05" style="width:100%">
    <label>Obs. Peso <span id="s_obsVal"></span></label>
    <input id="s_obs" type="range" min="0.0" max="4.0" step="0.05" style="width:100%">
    <div style="margin-top:6px; display:flex; gap:8px; align-items:center;">
      <label style="display:flex; gap:6px; align-items:center;">
        <input id="s_pause" type="checkbox"> Pausa
      </label>
    </div>
  `;
    document.body.appendChild(wrap);

    const el = id => wrap.querySelector(id);
    const state = {
        speedMult: defaults.speedMult ?? 1,
        separationRadius: defaults.separationRadius,
        separationWeight: defaults.separationWeight,
        seekWeight: defaults.seekWeight,
        boundaryWeight: defaults.boundaryWeight,
        obstacleWeight: defaults.obstacleWeight ?? 1.8,
        paused: false,
    };

    const bind = (slider, label, key, fmt=x=>x.toFixed(2)) => {
        slider.value = state[key];
        label.textContent = fmt(+slider.value);
        slider.addEventListener('input', () => {
            state[key] = +slider.value;
            label.textContent = fmt(state[key]);
            onChange({ ...state });
        });
    };

    bind(el('#s_speed'), el('#s_speedVal'), 'speedMult');
    bind(el('#s_rad'),   el('#s_radVal'),   'separationRadius');
    bind(el('#s_sep'),   el('#s_sepVal'),   'separationWeight');
    bind(el('#s_seek'),  el('#s_seekVal'),  'seekWeight');
    bind(el('#s_edge'),  el('#s_edgeVal'),  'boundaryWeight');
    bind(el('#s_obs'),   el('#s_obsVal'),   'obstacleWeight');

    el('#s_pause').addEventListener('change', e => {
        state.paused = e.target.checked;
        onChange({ ...state });
    });

    onChange({ ...state });
    return state;
}
