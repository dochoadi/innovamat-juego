// ===== Motor de partidas: turnos, rondas, panel de saltos =====
let cur = null;          // jugador que está jugando ahora: {pid, name, data}
let SES = null;          // sesión actual (entrenamiento, aleatorio, reto, reloj, duelo, torneo)
let R = null, anim = null, busy = false, parts = [], banner = null, timerId = null;
const themeKey = () => (cur ? cur.data.theme : 'futbol');
const th = () => THEMES[themeKey()];
const opCat = P => ({suma: 'suma', resta: 'resta', dist: 'resta', comp: P.sign > 0 ? 'suma' : 'resta', falta: P.sign > 0 ? 'suma' : 'resta', mult: 'mult', div: 'div'})[P.mode];
const ALL_OPS = ['suma', 'resta', 'dist', 'comp', 'falta', 'mult', 'div'];
const MIX_OPS = ['suma', 'resta', 'dist', 'comp', 'falta'];

// ---------- Sesiones ----------
// opts: {type, mode, players:[{pid,name,data}], rounds, allCursos, seed, secs}
function startSession(o) {
  SES = Object.assign({rounds: 5, ti: 0, scores: {}, handoff: false, turns: [], started: performance.now()}, o);
  for (const p of SES.players) { SES.scores[p.pid] = {pts: 0, stars: 0, rounds: 0, secs: 0, perfect: 0}; p.startTotal = p.data.total; p.startCards = cardsOwned(p.data); }
  buildTurns();
  setView('vGame'); nextTurn();
}
function buildTurns() {
  const S2 = SES, rng = S2.seed ? mulberry(S2.seed) : null;
  const opFor = () => { const r = rng || Math.random; const pool = S2.type === 'azar' ? ['suma', 'resta', 'mult', 'div'] : S2.mode === 'mix' ? MIX_OPS : ALL_OPS; return pool[Math.floor(r() * pool.length)]; };
  const T = [];
  if (S2.type === 'duel') { for (let r = 0; r < S2.rounds; r++) { const op = opFor(); for (let pi = 0; pi < S2.players.length; pi++) T.push({pi, op}); } S2.handoff = true; }
  else if (S2.type === 'torneo') { for (let pi = 0; pi < S2.players.length; pi++) for (let r = 0; r < S2.rounds; r++) T.push({pi, op: opFor()}); S2.handoff = true; }
  else if (S2.type === 'timed') { for (let r = 0; r < 60; r++) T.push({pi: 0, op: pick(['suma', 'resta', 'comp', 'dist', 'mult', 'div'])}); }
  else for (let r = 0; r < S2.rounds; r++) T.push({pi: 0, op: S2.type === 'train' && S2.mode !== 'mix' ? S2.mode : opFor()});
  S2.turns = T;
}
function pickLevel(p) {                      // curso y subnivel del problema para este jugador
  const d = p.data;
  if (SES.type === 'azar') {
    if (SES.allCursos) return [ri(1, 6), ri(1, 3)];
    return [clampN(d.curso + ri(-1, 1), 1, 6), ri(1, 3)];
  }
  return [d.curso || 1, d.sub];
}
function nextTurn() {
  if (SES.ti >= SES.turns.length) return endSession();
  const T = SES.turns[SES.ti], p = SES.players[T.pi];
  const first = SES.ti === 0 || SES.turns[SES.ti - 1].pi !== T.pi;
  if (SES.handoff && first && SES.players.length > 1) return showHandoff(p, () => beginTurn(T, p));
  beginTurn(T, p);
}
function beginTurn(T, p) {
  cur = p; setView('vGame');
  const [c, s] = pickLevel(p);
  if (SES.seed) setRng(mulberry(SES.seed + SES.ti * 977 + hashStr(p.data.curso + ''))); else setRng(null);
  R = makeProblem(T.op, c, s); setRng(null);
  R.jumps = []; R.pos = R.start; R.hint = 0; R.wrongQ = 0; R.state = 'play'; R.dir = R.sign < 0 ? -1 : 1; R.stars = 0; R.landings = [R.start]; R.t0 = performance.now();
  const fd = fixedDir(R); if (fd) R.dir = fd;
  anim = null; busy = false; parts = []; banner = null; vlo = null; scroll = 0;
  document.body.dataset.theme = p.data.theme;
  renderRound();
  if (SES.type === 'timed' && !timerId) startTimer();
}
function fixedDir(P) { return P.kind === 'mult' ? 1 : P.kind === 'div' ? -1 : (P.kind === 'net' && P.labels) ? 1 : 0; }
const net = () => R.jumps.reduce((s, j) => s + j, 0);

// ---------- Contrarreloj ----------
function startTimer() {
  SES.endAt = performance.now() + SES.secs * 1000;
  timerId = setInterval(() => {
    const left = Math.max(0, Math.ceil((SES.endAt - performance.now()) / 1000));
    $('timer').textContent = '⏱ ' + left + ' s'; $('timer').hidden = false;
    if (left <= 0) { clearInterval(timerId); timerId = null; if (SES && SES.type === 'timed') endSession(); }
  }, 250);
}
function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; $('timer').hidden = true; }

// ---------- Render de la ronda ----------
function renderRound() {
  renderProg();
  $('prob').textContent = R.text + ' = ?';
  const h = {
    suma: 'Salta hacia adelante ' + fmtN(R.b, R.sc) + ' en total. Descompón: decenas y unidades.', resta: 'Salta hacia atrás ' + fmtN(R.b, R.sc) + ' en total. Quita por partes.',
    comp: 'Truco: salta de más y vuelve atrás.', dist: '¿Cuánto falta para ir de ' + fmtN(R.b, R.sc) + ' hasta ' + fmtN(R.a, R.sc) + '? Salta hacia adelante hasta la meta.',
    falta: 'Fíjate en los saltos y elige el que falta (?).'
  };
  $('hint').textContent = R.hint && typeof R.hint === 'string' ? R.hint : (h[R.mode] || '');
  $('hint').dataset.base = $('hint').textContent;
  renderPanel(); updateStatus();
}
function renderProg() {
  const pr = $('prog'); pr.replaceChildren();
  if (SES.type === 'duel' || SES.type === 'torneo') {
    for (const p of SES.players) { const e = document.createElement('span'); e.className = 'pt' + (p === cur ? ' on' : ''); e.textContent = p.name + ' ' + SES.scores[p.pid].pts; pr.append(e); }
    return;
  }
  if (SES.type === 'timed') { const e = document.createElement('span'); e.className = 'pt on'; e.textContent = '✔ ' + SES.scores[cur.pid].rounds + ' rondas · ' + SES.scores[cur.pid].pts + ' pts'; pr.append(e); return; }
  const mine = SES.turns.filter(t => SES.players[t.pi] === cur), idx = SES.turns.slice(0, SES.ti).filter(t => SES.players[t.pi] === cur).length;
  mine.forEach((_, i) => { const e = document.createElement('i'); e.textContent = th().round; e.className = i < idx ? 'on' : i === idx ? 'on cur' : ''; pr.append(e); });
}
function updateStatus() {
  let s = '';
  if (R.state === 'play') {
    if (R.kind === 'net' && R.labels) s = 'Llevas ' + (net() ? fmtJ(net(), R.sc) : '0');
    else if (R.kind === 'net') s = 'Llevas ' + (net() ? fmtJ(net(), R.sc) : '0') + ' de ' + fmtJ(R.sign * R.b, R.sc);
    else if (R.kind === 'dist') s = 'Estás en ' + fmtN(R.pos, R.sc) + ' · meta ' + fmtN(R.end, R.sc);
    else if (R.kind === 'mult') s = 'Saltos: ' + R.jumps.length + ' de ' + R.n;
    else if (R.kind === 'div') s = 'Estás en ' + fmtN(R.pos, R.sc) + ' · saltos: ' + R.jumps.length;
  }
  $('status').textContent = s;
}
function renderPanel() {
  const p = $('panel'); p.replaceChildren();
  if (R.state === 'ask') return renderAsk(p);
  if (R.state === 'done') return renderDone(p);
  if (R.kind === 'faltaPlay') return;
  if (R.kind === 'falta') {
    const q = document.createElement('div'); q.className = 'q'; q.textContent = '¿Qué salto falta?'; p.append(q);
    const o = document.createElement('div'); o.className = 'opts';
    R.options.forEach(v => { const b = document.createElement('button'); b.textContent = (R.sign > 0 ? '+' : '−') + fmtN(v, R.sc); b.onclick = () => answerFalta(v, b); o.append(b); });
    p.append(o); return;
  }
  const fd = fixedDir(R);
  if (!fd) {
    const d = document.createElement('div'); d.className = 'dir'; d.innerHTML = '<button id="dF">Adelante ➡</button><button id="dB">⬅ Atrás</button>'; p.append(d);
    d.children[0].onclick = () => { R.dir = 1; syncDir(); }; d.children[1].onclick = () => { R.dir = -1; syncDir(); };
  }
  const ch = document.createElement('div'); ch.className = 'chips'; ch.id = 'chips';
  const rep = (R.kind === 'mult' || R.kind === 'div') && !R.labels;
  const groups = R.labels || rep ? [R.vals] : [0, 1, 2, 3].map(g => R.vals.filter(v => { const m = v / R.sc; return g === 0 ? m < 1 : g === 1 ? m >= 1 && m < 10 : g === 2 ? m >= 10 && m < 100 : m >= 100; }));
  for (const g of groups) {
    if (!g.length) continue;
    const row = document.createElement('div'); row.className = 'chiprow';
    const cols = rep ? 1 : R.labels ? 'auto-fill,minmax(92px' : (g.length > 9 ? 5 : Math.max(g.length, 5));
    row.style.gridTemplateColumns = rep ? '1fr' : R.labels ? 'repeat(auto-fill,minmax(92px,1fr))' : 'repeat(' + cols + ',minmax(0,1fr))';
    for (const v of g) { const b = document.createElement('button'); b.className = 'chip' + (rep ? ' big' : R.labels ? ' lab' : ''); b.dataset.v = v; b.onclick = () => tap(v); row.append(b); }
    ch.append(row);
  }
  p.append(ch);
  const c = document.createElement('div'); c.className = 'ctl'; c.innerHTML = '<button id="cU">↩ Deshacer</button><button id="cR">⟲ Reiniciar</button><button id="cH">💡 Pista</button>'; p.append(c);
  $('cU').onclick = undo; $('cR').onclick = restart; $('cH').onclick = hint;
  syncDir();
}
function syncDir() {
  const dF = $('dF'); if (dF) { dF.classList.toggle('on', R.dir > 0); $('dB').classList.toggle('on', R.dir < 0); }
  const sg = fixedDir(R) || R.dir;
  document.querySelectorAll('.chip').forEach(b => {
    const v = +b.dataset.v, np = R.pos + sg * v;
    if (R.labels) b.innerHTML = '<b>' + R.labels[v] + '</b><small>' + fmtJ(sg * v, R.sc) + '</small>'; else b.textContent = fmtJ(sg * v, R.sc);
    b.disabled = np < R.lo || np > R.hi + (R.kind === 'net' ? 0 : 0); b.classList.remove('hint');
  });
}
function renderAsk(p) {
  const q = document.createElement('div'); q.className = 'q';
  q.textContent = {mult: '¿Dónde has caído? ' + R.text + ' = ?', div: '¿Cuánto es ' + R.text + '? Cuenta tus saltos.', dist: '¿Cuánto falta? ' + R.text + ' = ?'}[R.mode] || '¿A qué número has llegado? ' + R.text + ' = ?';
  p.append(q);
  const o = document.createElement('div'); o.className = 'opts';
  R.options.forEach(v => { const b = document.createElement('button'); b.textContent = v; b.onclick = () => answerAsk(v, b); o.append(b); });
  p.append(o);
}
function renderDone(p) {
  const sc = SES.scores[cur.pid], last = SES.ti + 1 >= SES.turns.length;
  const d = document.createElement('div'); d.className = 'done';
  d.innerHTML = '<div class="stars">' + '⭐'.repeat(R.stars) + '<span style="opacity:.25">' + '⭐'.repeat(3 - R.stars) + '</span></div>';
  const m = document.createElement('div'); m.className = 'q';
  m.textContent = (R.kind === 'net' || R.kind === 'dist' || R.rect) ? R.jumps.length + ' saltos (lo mejor: ' + R.par + ')' : 'Resultado: ' + R.ansLabel;
  if (R.bonus) m.textContent += ' · ⚡ rapidez +1';
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = last || SES.type === 'timed' ? (SES.type === 'timed' ? 'Siguiente ➜' : 'Ver resultado ➜') : 'Siguiente ➜';
  b.onclick = () => { SES.ti++; nextTurn(); };
  d.append(m, b); p.append(d);
  if (SES.type === 'timed') setTimeout(() => { if (R && R.state === 'done' && SES && SES.type === 'timed' && b.isConnected) b.click(); }, 900);
}

// ---------- Acciones ----------
function tap(v) {
  if (busy || R.state !== 'play') return;
  const sg = fixedDir(R) || R.dir, delta = sg * v, np = R.pos + delta;
  if (np < R.lo || np > R.hi) return;
  if (R.jumps.length >= 16) { $('status').textContent = 'Demasiados saltos. Usa Reiniciar.'; return; }
  R.jumps.push(delta); hopTo(np); $('hint').textContent = '';
}
function hopTo(np) { anim = {from: R.pos, to: np, t0: performance.now(), dur: 560}; busy = true; gameAudio.play('jump'); haptic(8); }
function haptic(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch {} }
function goalReached() {
  if (R.kind === 'net') return net() === R.sign * R.b;
  if (R.kind === 'dist') return R.pos === R.end;
  if (R.kind === 'mult') return R.jumps.length === R.n;
  if (R.kind === 'div') return R.pos >= 0 && R.pos < R.minV;
  return false;
}
function afterLand() {
  R.pos = anim.to; R.landings.push(R.pos); anim = null; busy = false; gameAudio.play('land'); puff(); updateStatus(); syncDir();
  if (goalReached()) { R.options = makeOptions(R); R.state = 'ask'; renderPanel(); }
}
function undo() {
  if (busy || !R.jumps.length) return;
  const last = R.jumps.pop(); R.landings.pop(); anim = {from: R.pos, to: R.pos - last, t0: performance.now(), dur: 320, undo: true}; busy = true;
}
function restart() { if (busy) return; R.jumps = []; R.pos = R.start; R.landings = [R.start]; updateStatus(); syncDir(); }
function hint() {
  if (busy || R.state !== 'play') return;
  let path;
  if (R.kind === 'div') path = bfsBelow(R.pos, R.minV, R.vals, R.lo, R.hi);
  else path = bfs(R.pos, R.kind === 'net' ? R.start + R.sign * R.b : R.end, R.vals, R.lo, R.hi);
  if (!path || !path.length) return;
  const d = path[0]; R.hint++; const fd = fixedDir(R); if (!fd) R.dir = Math.sign(d); syncDir();
  document.querySelectorAll('.chip').forEach(b => { if (+b.dataset.v === Math.abs(d)) b.classList.add('hint'); });
  $('hint').textContent = '💡 Prueba con ' + (R.labels ? R.labels[Math.abs(d)] : fmtJ(d, R.sc));
}
function answerAsk(v, btn) {
  if (v === R.ansLabel) finishRound(); else { R.wrongQ++; btn.classList.add('bad'); btn.disabled = true; gameAudio.play('miss'); haptic(30); }
}
function answerFalta(v, btn) {
  if (v === R.parts[R.hidden]) {
    R.jumps = R.parts.map(x => x * R.sign); R.landings = [R.start]; let p = R.start; for (const j of R.jumps) { p += j; R.landings.push(p); }
    R.pos = R.start; R.fallAnim = {i: 0}; R.kind = 'faltaPlay'; renderPanel(); replayFalta();
  } else { R.wrongQ++; btn.classList.add('bad'); btn.disabled = true; gameAudio.play('miss'); haptic(30); }
}
function replayFalta() {
  if (!R || R.kind !== 'faltaPlay') return;
  if (R.fallAnim.i >= R.jumps.length) { R.kind = 'falta'; return finishRound(); }
  anim = {from: R.pos, to: R.pos + R.jumps[R.fallAnim.i], t0: performance.now(), dur: 500, falta: true}; busy = true; gameAudio.play('jump');
}

// ---------- Fin de ronda: estrellas, estadísticas, retos ----------
function finishRound() {
  const d = cur.data, secs = (performance.now() - R.t0) / 1000;
  let st = 3;
  if (R.kind === 'net' || R.kind === 'dist' || R.rect) { const j = R.jumps.length; st = j <= R.par ? 3 : j <= R.par + 1 ? 2 : 1; if (R.hint) st = Math.min(st, 2); }
  if (R.kind === 'falta') st = R.wrongQ === 0 ? 3 : R.wrongQ === 1 ? 2 : 1;
  else if (R.wrongQ === 1) st = Math.min(st, 2); else if (R.wrongQ > 1) st = 1;
  R.stars = st; R.state = 'done'; R.secs = secs;
  const vs = SES.type === 'duel' || SES.type === 'torneo';
  R.bonus = vs && secs <= 20 ? 1 : 0;
  const sc = SES.scores[cur.pid]; sc.stars += st; sc.rounds++; sc.pts += st + R.bonus; sc.secs += secs; if (st === 3 && !R.hint && !R.wrongQ) sc.perfect++;
  // progreso permanente (nunca se pierde): estrellas y monedas al instante
  d.total += st; d.coins += vs ? 0 : st;
  const cat = opCat(R); d.stats['op_' + cat] = st_(d, 'op_' + cat) + 1;
  const perfect = st === 3 && R.kind !== 'falta' ? R.jumps.length <= R.par : st === 3;
  if (perfect) { d.stats.perfect = st_(d, 'perfect') + 1; bumpChal(d, 'perfect'); }
  if (st === 3 && !R.hint) { d.stats.noHint = st_(d, 'noHint') + 1; d.stats.noHintMax = Math.max(st_(d, 'noHintMax'), d.stats.noHint); } else d.stats.noHint = 0;
  bumpChal(d, 'stars', st); if (R.mode === 'comp') bumpChal(d, 'comp'); if (cat === 'mult') bumpChal(d, 'mult'); if (cat === 'div') bumpChal(d, 'div');
  writeData(cur.pid, d);
  gameAudio.play('hit'); haptic(25); banner = {text: th().goal, t0: performance.now()};
  confetti(); renderPanel(); renderProg(); $('stars').textContent = '⭐ ' + d.total;
}
const st_ = (d, k) => d.stats[k] || 0;
function confetti() { for (let i = 0; i < 70; i++) parts.push({x: W / 2, y: H * .4, vx: (Math.random() - .5) * 420, vy: -Math.random() * 380 - 60, c: pick(['#ffd23f', '#ff6b6b', '#7df9ff', '#9cff8f', '#fff']), l: 1.6}); }
function puff() {
  const col = {futbol: '#7fd08a', coches: '#b8b8c8', esqui: '#ffffff', dragones: '#ff9a3c'}[themeKey()];
  for (let i = 0; i < 9; i++) parts.push({x: SC.lastX, y: SC.lineY, vx: (Math.random() - .5) * 110, vy: -Math.random() * 70, c: col, l: .6, r: 2 + Math.random() * 3, soft: 1});
}

// ---------- Fin de sesión ----------
function endSession() {
  stopTimer(); const S2 = SES; if (!S2) return;
  const res = {type: S2.type, players: [], notes: []};
  const ranking = S2.players.map(p => ({p, sc: S2.scores[p.pid]})).sort((a, b) => b.sc.pts - a.sc.pts || a.sc.secs - b.sc.secs);
  for (const {p, sc} of ranking) {
    const d = p.data, extra = [];
    d.stats.matches = st_(d, 'matches') + 1;
    if (touchStreak(d)) extra.push('🔥 Racha: ' + d.streak.n + (d.streak.n === 1 ? ' día' : ' días'));
    if (S2.type === 'train' || S2.type === 'azar' || S2.type === 'daily') {
      if (sc.stars >= 15) d.stats.perfectMatches = st_(d, 'perfectMatches') + 1;
      const key = S2.type === 'daily' ? 'daily' : S2.type === 'azar' ? 'azar' : S2.mode + '-' + d.curso + d.sub; d.best[key] = Math.max(d.best[key] || 0, sc.stars);
      if (S2.type === 'daily') { if (d.daily !== todayStr()) { d.daily = todayStr(); d.coins += 5; extra.push('📅 Reto del día completado: +5 🪙'); for (const c of bumpChal(d, 'daily')) extra.push('🎁 Reto semanal: ' + c[2] + ' (+5 🪙)'); } else extra.push('Ya hiciste el reto de hoy: ¡mañana hay otro!'); }
      else if (S2.type === 'train' && !S2.freeSub) { const m = adapt(d, sc.stars); if (m) extra.push('🚀 ' + m); }
    }
    if (S2.type === 'timed') { d.stats.timedBest = Math.max(st_(d, 'timedBest'), sc.rounds); d.best.timed = Math.max(d.best.timed || 0, sc.pts); }
    if (S2.type === 'duel' || S2.type === 'torneo') { d.stats.duels = st_(d, 'duels') + 1; for (const c of bumpChal(d, 'duel')) extra.push('🎁 Reto semanal: ' + c[2] + ' (+5 🪙)'); HOUSE.played[p.pid] = (HOUSE.played[p.pid] || 0) + 1; }
    const win = (S2.type === 'duel' || S2.type === 'torneo') && p === ranking[0].p && (ranking.length < 2 || ranking[0].sc.pts > ranking[1].sc.pts);   // empate = sin ganador
    if (win) { if (S2.type === 'duel') d.stats.duelWins = st_(d, 'duelWins') + 1; else d.stats.torneoWins = st_(d, 'torneoWins') + 1; d.coins += 3; HOUSE.wins[p.pid] = (HOUSE.wins[p.pid] || 0) + 1; extra.push('🏆 ¡Victoria! +3 🪙'); }
    const nuevos = checkTrophies(d); for (const t of nuevos) extra.push('🏅 Trofeo: ' + t[2]);
    const gotCards = cardsOwned(d) - p.startCards; if (gotCards > 0) extra.push('🎴 ¡Cromo nuevo! Mira tu álbum.');
    writeData(p.pid, d);
    res.players.push({name: p.name, pid: p.pid, pts: sc.pts, stars: sc.stars, rounds: sc.rounds, secs: Math.round(sc.secs), win, extra, data: d});
  }
  saveHouse(); res.mode = S2.mode; res.label = S2.label; res.max = S2.rounds * 3;
  LAST = res; SES = null; R = null; showResult(res);
}
let LAST = null;
