// names_ui.js — Panel bottom-left para renombrar NPCs
export function initNameEditor() {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
    position:fixed; left:12px; bottom:12px; z-index:40;
    background:rgba(0,0,0,.55); color:#fff; font:12px/1.2 ui-sans-serif,system-ui,Arial;
    padding:10px 12px; border-radius:10px; backdrop-filter: blur(6px);
    width: 260px; box-shadow: 0 6px 20px rgba(0,0,0,.25);
  `;
    wrap.innerHTML = `
    <div style="font-weight:600; margin-bottom:6px">Renombrar personaje</div>
    <select id="selNpc" style="width:100%; margin-bottom:6px; background:#0b0f1a; color:#fff; border:1px solid #2a2f3a; border-radius:6px; padding:6px"></select>
    <div style="display:flex; gap:8px">
      <input id="inpName" type="text" placeholder="Nuevo nombre" style="flex:1; background:#0b0f1a; color:#fff; border:1px solid #2a2f3a; border-radius:6px; padding:6px">
      <button id="btnApply" style="background:#2563eb; color:#fff; border:none; border-radius:6px; padding:6px 10px; cursor:pointer">OK</button>
    </div>
    <div style="opacity:.7; margin-top:6px">Tip: Enter también aplica</div>
  `;
    document.body.appendChild(wrap);

    const sel = wrap.querySelector('#selNpc');
    const inp = wrap.querySelector('#inpName');
    const btn = wrap.querySelector('#btnApply');

    const byId = new Map(); // id -> walker
    let currentId = null;

    function addWalker(w) {
        const opt = document.createElement('option');
        opt.value = String(w.id);
        opt.textContent = w.name || `NPC #${w.id}`;
        sel.appendChild(opt);

        byId.set(String(w.id), w);
        if (currentId === null) {
            currentId = String(w.id);
            sel.value = currentId;
            inp.value = w.name || '';
        }
    }

    async function apply() {
        const id = sel.value;
        const w = byId.get(id);
        if (!w) return;

        const newName = (inp.value || '').trim();
        if (!newName) return;

        // 1) Actualiza etiqueta en escena
        w.setName(newName);

        // 2) Persiste en backend
        try {
            const res = await fetch('/api/names', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: w.key, name: newName })
            });
            if (!res.ok) console.error('Error guardando nombre:', await res.text());
        } catch (e) {
            console.error('Fetch /api/names falló:', e);
        }

        // 3) Refleja en el select
        const opt = sel.querySelector(`option[value="${id}"]`);
        if (opt) opt.textContent = newName;
    }

    sel.addEventListener('change', () => {
        currentId = sel.value;
        const w = byId.get(currentId);
        inp.value = w ? (w.name || '') : '';
    });
    btn.addEventListener('click', () => apply());
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); });

    return { addWalker };
}
