// floor_ui.js — selector de suelos (arriba izq.)
export function initFloorUI(floors, onSelect) {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
    position:fixed; left:12px; top:52px; z-index:34;
    background:rgba(0,0,0,.55); color:#fff; font:12px ui-sans-serif,system-ui,Arial;
    padding:8px 10px; border-radius:10px; backdrop-filter: blur(6px);
    display:flex; gap:8px; align-items:center;
  `;
    wrap.innerHTML = `
    <span style="opacity:.9">Suelo</span>
    <select id="floorSel" style="background:#0b0f1a; color:#fff; border:1px solid #2a2f3a; border-radius:6px; padding:6px"></select>
  `;
    document.body.appendChild(wrap);

    const sel = wrap.querySelector('#floorSel');
    floors.forEach((f, i) => {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = f.name || f.id || `Suelo ${i+1}`;
        sel.appendChild(opt);
    });

    sel.addEventListener('change', () => onSelect(floors[+sel.value]));

    return {
        select(index){ sel.value = String(index); sel.dispatchEvent(new Event('change')); }
    };
}
