const LigaPerfiles = (() => {
  // Jugadores compartidos entre los 3 juegos; el progreso de cada juego va aparte.
  const KEY = 'liga-mate:jugadores';
  const GAME_PREFIXES = ['liga-mate:crack1:', 'liga-mate:crack2:', 'liga-mate:balon:', 'liga-saltos:'];
  const map = {};                                  // id -> nombre (objeto vivo que usa el juego como `profiles`)
  let memory = null;
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && typeof v === 'object') return v; } catch {} return memory; };
  const write = () => { memory = {...map}; try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {} };
  function reload() {
    const data = read() || {};
    for (const id of Object.keys(map)) delete map[id];
    for (const [id, name] of Object.entries(data)) if (typeof name === 'string') map[id] = name;
  }
  const clean = s => s.replace(/\s+/g, ' ').trim().slice(0, 12);
  const taken = (name, except) => Object.entries(map).some(([id, n]) => id !== except && n.toLowerCase() === name.toLowerCase());
  function add(name) {
    name = clean(name);
    if (!name) return 'Escribe un nombre.';
    if (taken(name)) return 'Ya existe un jugador con ese nombre.';
    map['p' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36)] = name; write();
    return '';
  }
  function rename(id, name) {
    name = clean(name);
    if (!name) return 'Escribe un nombre.';
    if (taken(name, id)) return 'Ya existe un jugador con ese nombre.';
    map[id] = name; write(); return '';
  }
  function remove(id) {
    delete map[id]; write();
    for (const p of GAME_PREFIXES) { try { localStorage.removeItem(p + id); } catch {} }
  }

  let manage = false;
  // Añade botones de editar/borrar y el formulario "Añadir jugador" bajo las tarjetas del juego.
  function decorate(grid, {refresh, drop, notice}) {
    const ids = Object.keys(map);
    [...grid.children].forEach((card, i) => {
      const id = ids[i];
      if (!id) return;
      const row = document.createElement('div'); row.className = 'pf-row';
      grid.replaceChild(row, card); row.append(card);
      if (manage) {
        const ed = document.createElement('button'), del = document.createElement('button');
        ed.type = del.type = 'button'; ed.className = del.className = 'pf-act';
        ed.textContent = '✎'; ed.title = ed.ariaLabel = 'Cambiar nombre';
        del.textContent = '🗑'; del.title = del.ariaLabel = 'Borrar jugador';
        ed.onclick = () => { const n = prompt('Nuevo nombre (máx. 12 letras)', map[id]); if (n === null) return; const e = rename(id, n); if (e) alert(e); refresh(); };
        del.onclick = () => { if (confirm('¿Borrar a ' + map[id] + ' y toda su partida? No se puede deshacer.')) { remove(id); drop && drop(id); refresh(); } };
        row.append(ed, del);
      }
    });
    const note = document.getElementById('profileNotice');
    if (!ids.length) note.textContent = '¡Bienvenido! Añade tu primer jugador para empezar.';
    const form = document.createElement('form'); form.className = 'pf-add'; form.autocomplete = 'off';
    const input = document.createElement('input');
    input.type = 'text'; input.maxLength = 12; input.placeholder = 'Nombre del jugador'; input.enterKeyHint = 'done'; input.ariaLabel = 'Nombre del nuevo jugador';
    const go = document.createElement('button'); go.type = 'submit'; go.className = 'primary'; go.textContent = '+ Añadir jugador';
    const msg = document.createElement('small'); msg.className = 'pf-msg'; msg.setAttribute('role', 'status');
    form.append(input, go, msg);
    form.onsubmit = e => { e.preventDefault(); const err = add(input.value); if (err) { msg.textContent = err; input.focus(); } else refresh(); };
    grid.after(form);
    document.querySelectorAll('.pf-add').forEach(f => { if (f !== form) f.remove(); });
    if (ids.length) {
      const tog = document.createElement('button'); tog.type = 'button'; tog.className = 'linkbtn pf-toggle';
      tog.textContent = manage ? 'Listo' : 'Editar / borrar jugadores';
      tog.onclick = () => { manage = !manage; refresh(); };
      form.append(tog);
    }
  }
  reload();
  window.addEventListener('pageshow', reload);
  return {map, decorate, reload, add, rename, remove};
})();
