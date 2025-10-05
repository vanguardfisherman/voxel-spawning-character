// instructions_ui.js — Panel desplegable "Instrucciones" (bottom-right)
export function initInstructions() {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
    position:fixed; right:12px; bottom:12px; z-index:35;
    width:300px; max-width:calc(100vw - 24px);
    background:rgba(0,0,0,.55); color:#fff; font:12px/1.4 ui-sans-serif,system-ui,Arial;
    border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,.25); backdrop-filter:blur(6px);
    overflow:hidden;
  `;
    wrap.innerHTML = `
    <button id="instToggle" style="all:unset; display:flex; align-items:center; justify-content:space-between;
      width:100%; padding:10px 12px; cursor:pointer; background:rgba(255,255,255,.06)">
      <span style="font-weight:600">Instrucciones</span>
      <span id="instCaret" style="opacity:.8; transform:rotate(-90deg); transition:transform .2s ease">▸</span>
    </button>
    <div id="instBody" style="display:none; padding:10px 12px; max-height:45vh; overflow:auto">
      <div style="margin-bottom:8px; opacity:.85">Controles de cámara</div>
      <ul style="margin:0 0 12px 16px; padding:0">
        <li>Arrastrar izq.: rotar</li>
        <li>Rueda: zoom</li>
        <li>Click derecho o Ctrl+arrastrar: desplazar</li>
      </ul>
      <div style="margin-bottom:8px; opacity:.85">Interacción</div>
      <ul style="margin:0 0 12px 16px; padding:0">
        <li>Click en personaje: seleccionar</li>
        <li>F: seguir / dejar de seguir al seleccionado</li>
        <li>Esc: quitar selección</li>
        <li>Panel derecha: velocidad, colisiones y obstáculos</li>
        <li>Panel izq. abajo: renombrar personaje</li>
      </ul>
      <div style="margin-bottom:8px; opacity:.85">Tips</div>
      <ul style="margin:0 0 8px 16px; padding:0">
        <li>DevTools activo = recarga automática al guardar</li>
        <li>Si algo se congela, revisa la consola (F12)</li>
      </ul>
    </div>
  `;
    document.body.appendChild(wrap);

    const toggle = wrap.querySelector('#instToggle');
    const body = wrap.querySelector('#instBody');
    const caret = wrap.querySelector('#instCaret');

    // Recuerda el estado abierto/cerrado
    const key = 'instOpen';
    let open = localStorage.getItem(key) === '1';
    applyState();

    toggle.addEventListener('click', () => {
        open = !open;
        localStorage.setItem(key, open ? '1' : '0');
        applyState();
    });

    function applyState() {
        body.style.display = open ? 'block' : 'none';
        caret.style.transform = open ? 'rotate(90deg)' : 'rotate(-90deg)';
    }

    // Por si luego quieres sobreescribir el contenido desde código
    return { setText(html){ body.innerHTML = html; } };
}
