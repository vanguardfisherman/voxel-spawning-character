// spawn_ui.js — Botón para invocar minions uno por uno
export function initSpawnUI(onSpawn) {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
    position:fixed; left:50%; bottom:12px; transform:translateX(-50%);
    z-index:50; pointer-events:auto;
  `;
    const btn = document.createElement('button');
    btn.textContent = 'Invocar minion';
    btn.style.cssText = `
    background:#22c55e; color:#071014; font:14px/1.1 ui-sans-serif,system-ui,Arial;
    border:none; border-radius:999px; padding:10px 16px; cursor:pointer;
    box-shadow:0 8px 24px rgba(0,0,0,.35); transition:transform .08s ease, opacity .2s ease;
  `;
    btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-1px)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
    btn.addEventListener('click', async () => {
        btn.disabled = true; btn.style.opacity = '.8';
        try { await onSpawn?.(); } finally {
            // pequeñísimo “cooldown” para evitar doble click accidental
            setTimeout(() => { btn.disabled = false; btn.style.opacity = '1'; }, 180);
        }
    });
    wrap.appendChild(btn);
    document.body.appendChild(wrap);
    return { setEnabled(v){ btn.disabled = !v; btn.style.opacity = v ? '1' : '.8'; } };
}
