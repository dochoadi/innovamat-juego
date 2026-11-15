// ===== Pantallas: jugadores, edad/curso, inicio, entrenar, duelo/torneo, álbum, trofeos, resultados =====
let view = 'vPlayers', host = null, manage = false, ageDraft = null, vsKind = 'duel', vsSel = new Set(), vsRounds = 5, allCursos = false;
const COLORS = ['#ffd23f', '#7df9ff', '#ff8fab', '#9cff8f', '#ffb066', '#c3a6ff'];
const colorOf = pid => COLORS[Math.max(0, Object.keys(LigaPerfiles.map).indexOf(pid)) % COLORS.length];
const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const players = () => Object.keys(LigaPerfiles.map).map(pid => ({pid, name: LigaPerfiles.map[pid], data: loadData(pid)}));
const cursoTxt = d => d.curso ? CURSO_NAMES[d.curso] + ' de primaria · ' + SUB_NAMES[d.sub] : 'Sin curso';

// ---------- Vistas ----------
const PARENT = {vAge: 'vPlayers', vHome: 'vPlayers', vTrain: 'vHome', vVersus: 'vHome', vAlbum: 'vHome', vTrophies: 'vHome', vResult: 'vHome'};
function setView(v) {
  view = v;
  document.querySelectorAll('.view').forEach(e => e.classList.toggle('on', e.id === v));
  $('back').hidden = v === 'vPlayers' || v === 'vHandoff';
  const d = cur ? cur.data : host ? host.data : null;
  $('stars').hidden = !d || v === 'vPlayers' || v === 'vAge'; if (d) $('stars').textContent = '⭐ ' + d.total;
  document.body.dataset.theme = d && v !== 'vPlayers' ? d.theme : 'futbol';
  $('title').textContent = d && v !== 'vPlayers' ? THEMES[d.theme].title : '⚽ Liga de Saltos';
  gameAudio.setScene(v === 'vGame' ? 'run' : 'plan', d ? THEMES[d.theme].idx : 0);
  if (v === 'vGame') requestAnimationFrame(fit);
  document.querySelector('main').scrollTop = 0;
}
$('back').onclick = () => {
  if (view === 'vGame') { if (SES && SES.ti > 0 && !confirm('¿Salir del partido? Las estrellas que ya ganaste se guardan.')) return; stopTimer(); SES = null; cur = host; renderHome(); return setView('vHome'); }
  if (view === 'vPlayers') return;
  if (view === 'vHome') { host = null; cur = null; renderPlayers(); return setView('vPlayers'); }
  if (view === 'vAge') { if (host && host.data.curso) { renderHome(); return setView('vHome'); } host = null; renderPlayers(); return setView('vPlayers'); }
  renderHome(); setView('vHome');
};

// ---------- Jugadores ----------
function renderPlayers() {
  const box = $('plist'); box.replaceChildren(); const list = players();
  list.forEach(p => {
    const row = mk('div', 'pl'), go = mk('button', 'go'), av = mk('span', 'av', esc(p.name[0].toUpperCase())); av.style.background = colorOf(p.pid);
    const tx = mk('span', '', '<b>' + esc(p.name) + '</b><small>⭐ ' + p.data.total + (p.data.curso ? ' · ' + CURSO_NAMES[p.data.curso] : '') + '</small>');
    go.append(av, tx); go.onclick = () => choose(p.pid); row.append(go);
    if (manage) {
      const ed = mk('button', 'ib', '✎'), del = mk('button', 'ib', '🗑'); ed.ariaLabel = 'Cambiar nombre'; del.ariaLabel = 'Borrar jugador';
      ed.onclick = () => { const n = prompt('Nuevo nombre (máx. 12 letras)', p.name); if (n === null) return; const e = LigaPerfiles.rename(p.pid, n); if (e) alert(e); renderPlayers(); };
      del.onclick = () => { if (confirm('¿Borrar a ' + p.name + ' y todo su progreso? No se puede deshacer.')) { delete mem[p.pid]; LigaPerfiles.remove(p.pid); try { localStorage.removeItem(KEYB + p.pid); } catch {} renderPlayers(); } };
      row.append(ed, del);
    }
    box.append(row);
  });
  if (!list.length) box.append(mk('p', 'sub', '¡Bienvenido! Escribe tu nombre abajo para empezar.'));
  $('manage').textContent = manage ? 'Listo' : 'Editar / borrar jugadores'; $('manage').hidden = !list.length;
}
$('manage').onclick = () => { manage = !manage; renderPlayers(); };
$('addf').onsubmit = e => {
  e.preventDefault(); const err = LigaPerfiles.add($('newname').value); $('addmsg').textContent = err;
  if (!err) { $('newname').value = ''; renderPlayers(); const ids = Object.keys(LigaPerfiles.map); choose(ids[ids.length - 1]); }
};
function choose(pid) {
  host = {pid, name: LigaPerfiles.map[pid], data: loadData(pid)}; cur = host; gameAudio.unlock();
  if (!host.data.edad) return openAge(); renderHome(); setView('vHome');
}

// ---------- Edad y curso ----------
function openAge() {
  const d = host.data; ageDraft = {edad: d.edad || 0, curso: d.curso || 0};
  $('ageT').textContent = d.edad ? 'Edad y curso de ' + host.name : '¿Cuántos años tienes, ' + host.name + '?';
  $('ageNote').hidden = !d.migrated; $('ageNote').textContent = '¡Versión nueva! Tus estrellas (⭐ ' + d.total + ') están a salvo. Dinos tu edad para adaptar los juegos.';
  drawAge(); setView('vAge');
}
function drawAge() {
  const a = $('ages'); a.replaceChildren();
  for (let e = 5; e <= 12; e++) { const b = mk('button', ageDraft.edad === e ? 'on' : '', String(e)); b.onclick = () => { ageDraft.edad = e; ageDraft.curso = cursoDeEdad(e); drawAge(); }; a.append(b); }
  const c = $('cursos'); c.replaceChildren();
  for (let k = 1; k <= 6; k++) { const b = mk('button', ageDraft.curso === k ? 'on' : '', CURSO_NAMES[k]); b.onclick = () => { ageDraft.curso = k; drawAge(); }; c.append(b); }
}
$('ageOk').onclick = () => {
  if (!ageDraft.edad && !ageDraft.curso) { alert('Elige tu edad o tu curso.'); return; }
  const d = host.data; d.edad = ageDraft.edad || d.edad || 7; d.curso = ageDraft.curso || cursoDeEdad(d.edad);
  if (d.migrated || !d.sub) d.sub = 2; d.migrated = false; d.up = d.down = 0; writeData(host.pid, d); renderHome(); setView('vHome');
};

// ---------- Inicio ----------
function renderHome() {
  const d = host.data; $('hAv').textContent = host.name[0].toUpperCase(); $('hAv').className = 'av'; $('hAv').style.background = colorOf(host.pid);
  $('hName').textContent = host.name; $('hCurso').textContent = cursoTxt(d);
  $('hBadges').innerHTML = '<span>⭐ ' + d.total + '</span><span>🪙 ' + d.coins + '</span><span>🔥 ' + d.streak.n + '</span>';
  const t = $('themes'); t.replaceChildren();
  for (const [k, v] of Object.entries(THEMES)) { const b = mk('button', d.theme === k ? 'on' : '', v.icon + '<small>' + v.name + '</small>'); b.onclick = () => { d.theme = k; writeData(host.pid, d); renderHome(); setView('vHome'); }; t.append(b); }
  const daily = d.daily === todayStr();
  const T = [
    ['▶️', 'Entrenar', 'Suma, resta, multiplica y divide', () => { renderTrain(); setView('vTrain'); }],
    ['🎲', 'Aleatorio', 'Operaciones y niveles al azar', () => startSession({type: 'azar', mode: 'azar', players: [host], rounds: 5, label: 'Aleatorio'})],
    ['📅', 'Reto del día', daily ? '✔ Hecho hoy · ¡repite!' : 'Gana 5 🪙 y racha', () => startSession({type: 'daily', mode: 'daily', players: [host], rounds: 5, seed: dayNum(todayStr()) * 31 + 7, label: 'Reto del día'})],
    ['⏱️', 'Contrarreloj', '90 segundos: ¡cuantas más mejor!', () => startSession({type: 'timed', mode: 'timed', players: [host], rounds: 0, secs: 90, label: 'Contrarreloj'})],
    ['⚔️', 'Duelo de hermanos', '2 jugadores por turnos', () => openVersus('duel')],
    ['🏟️', 'Torneo', '3 a 6 jugadores', () => openVersus('torneo')],
    ['🎴', 'Mi álbum', cardsOwned(d) + ' de 48 cromos', () => { renderAlbum(); setView('vAlbum'); }],
    ['🏅', 'Trofeos y retos', d.trophies.length + ' de ' + TROPHIES.length, () => { renderTrophies(); setView('vTrophies'); }],
    ['⚙️', 'Edad y curso', cursoTxt(d), openAge]
  ];
  const box = $('homeTiles'); box.replaceChildren();
  for (const [ic, name, sub, fn] of T) { const b = mk('button', 'tile', '<span class="i">' + ic + '</span><b>' + name + '</b><small>' + sub + '</small>'); b.onclick = () => { gameAudio.unlock(); fn(); }; box.append(b); }
}

// ---------- Entrenar ----------
const MODES = [
  ['suma', '➕', 'Saltos que suman', 'Suma saltando adelante'], ['resta', '➖', 'Quitar saltando', 'Resta saltando atrás'], ['dist', '🔎', '¿Cuánto falta?', 'Resta midiendo la distancia'],
  ['comp', '🔁', 'Pasa y vuelve', 'Salta de más y retrocede'], ['falta', '🧩', 'Completa el salto', 'Encuentra el salto que falta'], ['mult', '✖️', 'Saltos repetidos', 'Multiplica con saltos'],
  ['div', '➗', 'Reparto a saltos', '¿Cuántos saltos caben?'], ['mix', '🏆', 'Liga mixta', 'Sumas y restas mezcladas']
];
function renderTrain() {
  const d = host.data; $('trainSub').textContent = CURSO_NAMES[d.curso] + ' de primaria. Elige el nivel y una operación.';
  const s = $('subs'); s.replaceChildren();
  for (let k = 1; k <= 3; k++) { const b = mk('button', d.sub === k ? 'on' : '', SUB_NAMES[k] + '<small>' + ['paso a paso', 'práctica', 'para campeones'][k - 1] + '</small>'); b.onclick = () => { d.sub = k; d.up = d.down = 0; writeData(host.pid, d); renderTrain(); }; s.append(b); }
  const tl = $('tiles'); tl.replaceChildren();
  for (const [key, ic, name, sub] of MODES) {
    const best = d.best[key + '-' + d.curso + d.sub] || 0, b = mk('button', 'tile', '<span class="i">' + ic + '</span><b>' + name + '</b><small>' + sub + '</small><span class="st">' + '⭐'.repeat(Math.ceil(best / 5)) + (best ? ' ' + best + '/15' : 'Sin jugar') + '</span>');
    b.onclick = () => startSession({type: 'train', mode: key, players: [host], rounds: 5, freeSub: false, label: name}); tl.append(b);
  }
  const a = mk('button', 'tile', '<span class="i">🌍</span><b>Todos los cursos</b><small>Aleatorio de 1º a 6º</small><span class="st">Reto máximo</span>');
  a.onclick = () => startSession({type: 'azar', mode: 'azar', players: [host], rounds: 5, allCursos: true, label: 'Todos los cursos'}); tl.append(a);
}

// ---------- Duelo y torneo ----------
function openVersus(kind) {
  vsKind = kind; vsSel = new Set([host.pid]); vsRounds = 5;
  $('vsT').textContent = kind === 'duel' ? '⚔️ Duelo de hermanos' : '🏟️ Torneo'; drawVersus(); setView('vVersus');
}
function drawVersus() {
  const lim = vsKind === 'duel' ? [2, 2] : [3, 6]; $('vsSub').textContent = (vsKind === 'duel' ? 'Elige 2 jugadores. ' : 'Elige de 3 a 6 jugadores. ') + 'Cada uno juega con su curso y se pasan el dispositivo por turnos.';
  const box = $('vsPlayers'); box.replaceChildren();
  for (const p of players()) {
    const l = mk('label', vsSel.has(p.pid) ? 'on' : ''), i = mk('input'); i.type = 'checkbox'; i.checked = vsSel.has(p.pid);
    i.onchange = () => { if (i.checked) { if (vsSel.size >= lim[1]) { i.checked = false; return; } vsSel.add(p.pid); } else vsSel.delete(p.pid); drawVersus(); };
    l.append(i, mk('span', '', esc(p.name) + (p.data.curso ? ' · ' + CURSO_NAMES[p.data.curso] : ''))); box.append(l);
  }
  const r = $('vsRounds'); r.replaceChildren();
  for (const n of [3, 5, 10]) { const b = mk('button', vsRounds === n ? 'on' : '', n + '<small>rondas</small>'); b.onclick = () => { vsRounds = n; drawVersus(); }; r.append(b); }
  $('vsMsg').textContent = vsSel.size < lim[0] ? (Object.keys(LigaPerfiles.map).length < lim[0] ? 'Añade más jugadores en la pantalla de «¿Quién juega?».' : 'Selecciona ' + lim[0] + (lim[0] !== lim[1] ? ' o más' : '') + ' jugadores.') : '';
  $('vsGo').disabled = vsSel.size < lim[0];
}
$('vsGo').onclick = () => {
  const ps = players().filter(p => vsSel.has(p.pid)); for (const p of ps) { if (!p.data.curso) { p.data.curso = 2; p.data.edad = p.data.edad || 7; } }
  startSession({type: vsKind, mode: vsKind, players: ps, rounds: vsRounds, label: vsKind === 'duel' ? 'Duelo' : 'Torneo'});
};
function showHandoff(p, go) {
  $('hoAv').textContent = p.name[0].toUpperCase(); $('hoAv').className = 'av'; $('hoAv').style.background = colorOf(p.pid);
  $('hoT').textContent = 'Pasa el dispositivo a ' + p.name; $('hoS').textContent = CURSO_NAMES[p.data.curso] + ' de primaria · ¡a por las estrellas!';
  $('hoGo').onclick = () => { gameAudio.unlock(); go(); }; document.body.dataset.theme = p.data.theme; setView('vHandoff'); document.body.dataset.theme = p.data.theme;
}

// ---------- Resultados ----------
function showResult(res) {
  host.data = loadData(host.pid); cur = host;
  const solo = res.players.length === 1, vs = res.type === 'duel' || res.type === 'torneo';
  $('rtitle').textContent = vs ? (res.players[0].win ? '🏆 ¡Gana ' + res.players[0].name + '!' : '🤝 ¡Empate!') : res.type === 'timed' ? '⏱️ ¡Tiempo!' : res.players[0].stars >= 13 ? '¡Campeón! 🏆' : res.players[0].stars >= 9 ? '¡Gran partido! 🎉' : '¡Buen intento! 💪';
  $('rsub').textContent = res.label + (solo && res.type !== 'timed' ? ' · ' + res.players[0].stars + ' de ' + res.max + ' estrellas' : '');
  const body = $('rbody'); body.replaceChildren();
  if (solo && res.type !== 'timed') body.append(mk('div', 'done', '<div class="stars">' + '⭐'.repeat(Math.ceil(res.players[0].stars / 5)) + '</div>'));
  if (res.type === 'timed') body.append(mk('div', 'done', '<div class="stars">' + res.players[0].rounds + '</div><p class="sub">rondas resueltas · ' + res.players[0].pts + ' puntos</p>'));
  const pod = mk('div', 'podium');
  if (!solo) res.players.forEach((p, i) => pod.append(mk('div', 'r' + (i === 0 && p.win ? ' w' : ''), '<span class="m">' + ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'][i] + '</span><span><b>' + esc(p.name) + '</b><small>⭐ ' + p.stars + ' · ' + p.secs + ' s</small></span><b>' + p.pts + ' pts</b>')));
  body.append(pod);
  const xl = mk('div', 'xl'); for (const p of res.players) for (const e of p.extra) xl.append(mk('p', '', (solo ? '' : esc(p.name) + ': ') + esc(e))); body.append(xl);
  $('again').onclick = () => { if (vs) { const ps = players().filter(p => res.players.some(r => r.pid === p.pid)); startSession({type: res.type, mode: res.type, players: ps, rounds: res.max / 3, label: res.label}); } else restartLast(res); };
  $('again').textContent = vs ? 'Revancha' : 'Jugar otra vez';
  setView('vResult'); gameAudio.play('victory');
}
let LASTOPTS = null;
function restartLast(res) {
  const m = res.mode; const base = {players: [host], rounds: 5, label: res.label};
  if (m === 'daily') return startSession(Object.assign(base, {type: 'daily', mode: 'daily', seed: dayNum(todayStr()) * 31 + 7}));
  if (m === 'timed') return startSession(Object.assign(base, {type: 'timed', mode: 'timed', rounds: 0, secs: 90}));
  if (m === 'azar') return startSession(Object.assign(base, {type: 'azar', mode: 'azar', allCursos: res.label === 'Todos los cursos'}));
  startSession(Object.assign(base, {type: 'train', mode: m}));
}
$('rmenu').onclick = () => { renderHome(); setView('vHome'); };
$('ralbum').onclick = () => { renderAlbum(); setView('vAlbum'); };

// ---------- Álbum y sobres ----------
function renderAlbum() {
  const d = host.data, k = d.theme, box = $('cards'); box.replaceChildren();
  const own = CARDS[k].filter((_, i) => isUnlocked(d, k, i)).length;
  $('atitle').textContent = 'Álbum de ' + THEMES[k].name; $('asub').textContent = 'Tienes ' + own + ' de 12 cromos. Cada ' + STARS_PER_CARD + ' ⭐ ganas uno; con 10 🪙 abres un sobre sorpresa. Toca un cromo para jugar con él.';
  $('pack').textContent = '🎁 Abrir sobre (10 🪙 · tienes ' + d.coins + ')'; $('pack').disabled = d.coins < 10 || own >= 12;
  CARDS[k].forEach((c, i) => {
    const on = isUnlocked(d, k, i), card = mk('div', 'card' + (d.skin[k] === i && on ? ' sel' : '')), cv = mk('canvas'); cv.width = 200; cv.height = 250; drawCard(cv, k, i, !on);
    card.append(cv, mk('small', '', on ? esc(c[0]) : '??? · ' + (i * STARS_PER_CARD) + ' ⭐ o sobre'));
    if (on) card.onclick = () => { d.skin[k] = i; writeData(host.pid, d); renderAlbum(); }; box.append(card);
  });
}
$('pack').onclick = () => {
  const d = host.data, k = d.theme, locked = CARDS[k].map((_, i) => i).filter(i => !isUnlocked(d, k, i));
  if (d.coins < 10 || !locked.length) return; d.coins -= 10; const i = pick(locked); (d.extra[k] = d.extra[k] || []).push(i); d.skin[k] = i;
  const nuevos = checkTrophies(d); writeData(host.pid, d); gameAudio.play('victory'); renderAlbum();
  alert('¡Cromo nuevo: ' + CARDS[k][i][0] + '!' + (nuevos.length ? '\n🏅 Trofeo: ' + nuevos.map(t => t[2]).join(', ') : ''));
};
function drawCard(cv, theme, idx, locked) {
  const c = cv.getContext('2d'), w = cv.width, h = cv.height; ctx = c;
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, {futbol: '#1f7a4a', coches: '#6a2fb0', esqui: '#4aa8f0', dragones: '#7a1f3d'}[theme]); g.addColorStop(1, '#0b1220'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffffff22'; for (let i = 0; i < 6; i++) c.fillRect(0, i * 42, w, 20);
  if (locked) { c.fillStyle = '#ffffff55'; c.font = '900 90px system-ui'; c.textAlign = 'center'; c.fillText('?', w / 2, h / 2 + 30); return; }
  drawSprite(c, theme, idx, w / 2, h * .78, 1.9, .5, 0);
  c.fillStyle = '#000a'; c.fillRect(0, h - 34, w, 34); c.fillStyle = '#fff'; c.font = '800 17px system-ui'; c.textAlign = 'center'; c.fillText(CARDS[theme][idx][0], w / 2, h - 11);
}

// ---------- Trofeos, retos y marcador de la casa ----------
function renderTrophies() {
  const d = host.data, ch = $('chals'); ch.replaceChildren();
  for (const c of weekChals(d)) { const done = d.chal.done.includes(c[0]), pr = Math.min(c[3], d.chal.prog[c[0]] || 0); ch.append(mk('div', 'chal', '<b>' + c[1] + ' ' + esc(c[2]) + '</b> ' + (done ? '✔ (+5 🪙)' : pr + ' / ' + c[3]) + '<div class="bar"><i style="width:' + Math.round(100 * pr / c[3]) + '%"></i></div>')); }
  writeData(host.pid, d);
  const tr = $('trophies'); tr.replaceChildren();
  for (const t of TROPHIES) tr.append(mk('div', 'tr' + (d.trophies.includes(t[0]) ? '' : ' off'), '<div class="i">' + t[1] + '</div><b>' + esc(t[2]) + '</b><small>' + esc(t[3]) + '</small>'));
  const hs = $('house'); hs.replaceChildren(); const list = players().sort((a, b) => (HOUSE.wins[b.pid] || 0) - (HOUSE.wins[a.pid] || 0));
  list.forEach((p, i) => hs.append(mk('div', 'r' + (i === 0 && (HOUSE.wins[p.pid] || 0) ? ' w' : ''), '<span class="m">' + (i === 0 && (HOUSE.wins[p.pid] || 0) ? '👑' : '🏅') + '</span><span><b>' + esc(p.name) + '</b><small>' + (HOUSE.played[p.pid] || 0) + ' duelos/torneos · 🔥 ' + p.data.streak.n + '</small></span><b>' + (HOUSE.wins[p.pid] || 0) + ' ✔</b>')));
}

// ---------- Copia de seguridad ----------
const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = t => JSON.parse(decodeURIComponent(escape(atob(t.trim()))));
function exportCode() { const data = {}; for (const id of Object.keys(LigaPerfiles.map)) data[id] = loadData(id); return enc({app: 'liga-saltos', v: DATA_VERSION, players: LigaPerfiles.map, data, house: HOUSE}); }
function importCode(t) {
  const o = dec(t); if (!o || o.app !== 'liga-saltos' || !o.players) throw new Error('Código no válido');
  let pl = {}; try { pl = JSON.parse(localStorage.getItem('liga-mate:jugadores') || '{}'); } catch {}
  for (const [id, name] of Object.entries(o.players)) {
    if (typeof name !== 'string') continue; if (!pl[id]) pl[id] = name.slice(0, 12);
    const cur0 = readKey(KEYP + id) || readKey(KEYB + id) || mem[id], inc = o.data && o.data[id] ? migrate(Object.assign({}, o.data[id])) : null;
    if (inc) {
      const m = cur0 ? migrate(JSON.parse(JSON.stringify(cur0))) : inc;
      if (cur0) { m.total = Math.max(m.total, inc.total); m.coins = Math.max(m.coins, inc.coins); for (const [k, v] of Object.entries(inc.best)) m.best[k] = Math.max(m.best[k] || 0, v); for (const t2 of inc.trophies) if (!m.trophies.includes(t2)) m.trophies.push(t2); if (!m.edad && inc.edad) { m.edad = inc.edad; m.curso = inc.curso; } }
      writeData(id, m);
    }
  }
  if (o.house) { for (const [k, v] of Object.entries(o.house.wins || {})) HOUSE.wins[k] = Math.max(HOUSE.wins[k] || 0, v); for (const [k, v] of Object.entries(o.house.played || {})) HOUSE.played[k] = Math.max(HOUSE.played[k] || 0, v); saveHouse(); }
  try { localStorage.setItem('liga-mate:jugadores', JSON.stringify(pl)); } catch {} LigaPerfiles.reload(); Object.assign(LigaPerfiles.map, pl);
}
$('bkb').onclick = () => { $('bkcode').value = exportCode(); $('bkmsg').textContent = ''; $('backup').showModal(); };
$('bkcopy').onclick = async () => { $('bkcode').select(); try { await navigator.clipboard.writeText($('bkcode').value); $('bkmsg').textContent = '✔ Copiado'; } catch { document.execCommand && document.execCommand('copy'); $('bkmsg').textContent = 'Copia el texto de arriba'; } };
$('bkrestore').onclick = () => { try { importCode($('bkin').value); $('bkmsg').textContent = '✔ Progreso restaurado'; $('bkin').value = ''; renderPlayers(); } catch (e) { $('bkmsg').textContent = '✖ ' + e.message; } };
$('bkclose').onclick = () => $('backup').close();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// ---------- Sonido, ayuda, tamaño de pantalla ----------
function syncSnd() { $('snd').textContent = gameAudio.enabled ? '♪' : '🔇'; $('vol').value = Math.round(gameAudio.volume * 100); }
$('snd').onclick = () => { gameAudio.toggle(); syncSnd(); gameAudio.play('switch'); };
$('vol').oninput = () => gameAudio.setVolume($('vol').value / 100);
$('helpb').onclick = () => $('help').showModal(); $('helpok').onclick = () => $('help').close();
function layout() {                       // detecta móvil/tablet y vertical/horizontal
  const w = innerWidth, h = innerHeight, short = Math.min(w, h);
  document.documentElement.style.setProperty('--vh', h + 'px');
  document.body.dataset.dev = short >= 700 ? 'tablet' : 'phone'; document.body.dataset.orient = w > h ? 'land' : 'port'; fit();
}
addEventListener('resize', layout); addEventListener('orientationchange', () => setTimeout(layout, 250));
if (window.visualViewport) visualViewport.addEventListener('resize', layout);
addEventListener('pagehide', () => { if (host) writeData(host.pid, host.data); });
syncSnd(); layout(); renderPlayers();
