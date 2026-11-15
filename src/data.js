// ===== Datos del jugador (v2) =====
// IMPORTANTE: el progreso (estrellas, victorias, cromos) NO se puede perder entre versiones.
// Claves que NO se cambian: liga-saltos:<id>, liga-saltos-bak:<id>, liga-mate:jugadores.
// Si cambia el formato: añade un paso en migrate() y sube DATA_VERSION. Nunca reinicies totales.
const KEYP = 'liga-saltos:', KEYB = 'liga-saltos-bak:', KEYH = 'liga-saltos-casa', DATA_VERSION = 2;
const mem = {};
let HOUSE = {wins: {}, played: {}};

const defaults = () => ({v: DATA_VERSION, theme: 'futbol', edad: 0, curso: 0, sub: 2, total: 0, best: {}, skin: {futbol: 0, coches: 0, esqui: 0, dragones: 0}, extra: {},
  coins: 0, streak: {last: '', n: 0}, trophies: [], stats: {}, chal: {}, daily: '', up: 0, down: 0});
const OLD_LEVEL_TO_CURSO = {0: 2, 1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4};
function migrate(d) {
  // v1 -> v2: se conservan estrellas (total), mejores marcas (best), mundo (theme) y cromo elegido (skin).
  if (!d.v || d.v < 2) {
    if (!d.curso && d.level >= 0) { d.curso = OLD_LEVEL_TO_CURSO[d.level] || 1; d.sub = 2; d.migrated = true; }   // sin edad: se le preguntará una vez
    delete d.level;
  }
  const base = defaults();
  d = Object.assign(base, d, {skin: Object.assign(base.skin, d.skin || {}), streak: Object.assign(base.streak, d.streak || {})});
  d.total = Math.max(0, +d.total || 0); d.coins = Math.max(0, +d.coins || 0);
  if (!d.best || typeof d.best !== 'object') d.best = {};
  if (!d.stats || typeof d.stats !== 'object') d.stats = {};
  if (!d.extra || typeof d.extra !== 'object') d.extra = {};
  if (!Array.isArray(d.trophies)) d.trophies = [];
  if (!THEMES[d.theme]) d.theme = 'futbol';
  d.curso = clampN(+d.curso || 0, 0, 6); d.sub = clampN(+d.sub || 2, 1, 3);
  d.v = DATA_VERSION; return d;
}
function readKey(k) { try { const v = JSON.parse(localStorage.getItem(k)); return v && typeof v === 'object' ? v : null; } catch { return null; } }
function loadData(pid) {
  const a = readKey(KEYP + pid), b = readKey(KEYB + pid), m = mem[pid] || null;
  const d = [a, b, m].filter(Boolean).sort((x, y) => (+y.total || 0) - (+x.total || 0))[0] || defaults();   // nos quedamos con la copia con más estrellas
  return migrate(JSON.parse(JSON.stringify(d)));
}
function writeData(pid, d) {
  mem[pid] = d; const j = JSON.stringify(d);
  try { localStorage.setItem(KEYP + pid, j); localStorage.setItem(KEYB + pid, j); } catch {}
}
function loadHouse() { const h = readKey(KEYH); HOUSE = Object.assign({wins: {}, played: {}}, h || {}); }
function saveHouse() { try { localStorage.setItem(KEYH, JSON.stringify(HOUSE)); } catch {} }
loadHouse();

// ---------- Fechas ----------
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dayNum = s => { const [y, m, d] = s.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const weekStr = () => { const d = new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + Math.ceil(((t - y0) / 864e5 + 1) / 7); };
const hashStr = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---------- Cromos ----------
const STARS_PER_CARD = 5;
const unlockedCount = d => Math.min(12, 1 + Math.floor(d.total / STARS_PER_CARD));
const isUnlocked = (d, theme, i) => i < unlockedCount(d) || (d.extra[theme] || []).includes(i);
const cardsOwned = d => Object.keys(THEMES).reduce((n, t) => n + CARDS[t].filter((_, i) => isUnlocked(d, t, i)).length, 0);

// ---------- Racha ----------
function touchStreak(d) {
  const t = todayStr(); if (d.streak.last === t) return false;
  d.streak.n = d.streak.last && dayNum(t) - dayNum(d.streak.last) === 1 ? d.streak.n + 1 : 1; d.streak.last = t; return true;
}

// ---------- Trofeos ----------
const st = (d, k) => d.stats[k] || 0;
const TROPHIES = [
  ['primer', '🥇', 'Primer partido', 'Juega tu primer partido', d => st(d, 'matches') >= 1],
  ['perfecto', '🌟', 'Partido perfecto', '15 de 15 estrellas en un partido', d => st(d, 'perfectMatches') >= 1],
  ['racha3', '🔥', 'Racha de 3 días', 'Juega 3 días seguidos', d => d.streak.n >= 3],
  ['racha7', '☄️', 'Racha de 7 días', 'Juega 7 días seguidos', d => d.streak.n >= 7],
  ['minimo', '🎯', 'Mínimo de saltos', '10 rondas con el mínimo de saltos', d => st(d, 'perfect') >= 10],
  ['sinpista', '🧠', 'Sin pistas', '5 rondas perfectas seguidas sin pista', d => st(d, 'noHintMax') >= 5],
  ['cuatro', '➕', 'Las 4 operaciones', 'Suma, resta, multiplica y divide', d => ['suma', 'resta', 'mult', 'div'].every(o => st(d, 'op_' + o) >= 3)],
  ['cromos', '🎴', 'Coleccionista', 'Consigue 24 cromos', d => cardsOwned(d) >= 24],
  ['duelista', '⚔️', 'Duelista', 'Gana un duelo', d => st(d, 'duelWins') >= 1],
  ['campeon', '🏆', 'Campeón del torneo', 'Gana un torneo', d => st(d, 'torneoWins') >= 1],
  ['reloj', '⏱️', 'Velocista', '10 rondas en una contrarreloj', d => st(d, 'timedBest') >= 10],
  ['ascenso', '🚀', 'Ascenso', 'Sube de nivel o de curso', d => st(d, 'ascensos') >= 1]
];
function checkTrophies(d) {
  const nuevos = []; for (const t of TROPHIES) if (!d.trophies.includes(t[0]) && t[4](d)) { d.trophies.push(t[0]); nuevos.push(t); } return nuevos;
}

// ---------- Retos semanales ----------
const CHALS = [
  ['stars25', '⭐', 'Gana 25 estrellas', 25, 'stars'], ['perf8', '🎯', '8 rondas perfectas', 8, 'perfect'], ['comp5', '🔁', '5 rondas de «Pasa y vuelve»', 5, 'comp'],
  ['mult6', '✖️', '6 rondas de multiplicar', 6, 'mult'], ['div6', '➗', '6 rondas de dividir', 6, 'div'], ['daily3', '📅', '3 retos del día', 3, 'daily'], ['duel1', '⚔️', 'Juega un duelo', 1, 'duel']
];
function weekChals(d) {
  const w = weekStr(); if (d.chal.w !== w) d.chal = {w, prog: {}, done: []};
  const r = mulberry(hashStr(w)), pool = CHALS.slice(), out = [];
  while (out.length < 3) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}
function bumpChal(d, kind, n = 1) {
  const got = [];
  for (const c of weekChals(d)) if (c[4] === kind && !d.chal.done.includes(c[0])) { d.chal.prog[c[0]] = (d.chal.prog[c[0]] || 0) + n; if (d.chal.prog[c[0]] >= c[3]) { d.chal.done.push(c[0]); d.coins += 5; got.push(c); } }
  return got;
}

// ---------- Adaptación ----------
// 3 partidos seguidos con 13+ ⭐ suben de nivel; 2 con 6 o menos bajan. Devuelve mensaje o ''.
function adapt(d, gained) {
  if (gained >= 13) { d.up++; d.down = 0; } else if (gained <= 6) { d.down++; d.up = 0; } else { d.up = 0; d.down = 0; }
  let msg = '';
  if (d.up >= 3) { d.up = 0; if (d.sub < 3) { d.sub++; msg = '¡Subes a «' + SUB_NAMES[d.sub] + '» en ' + CURSO_NAMES[d.curso] + '!'; } else if (d.curso < 6) { d.curso++; d.sub = 1; msg = '¡Ascenso a ' + CURSO_NAMES[d.curso] + ' de primaria!'; } if (msg) d.stats.ascensos = st(d, 'ascensos') + 1; }
  else if (d.down >= 2) { d.down = 0; if (d.sub > 1) { d.sub--; msg = 'Vamos a practicar con «' + SUB_NAMES[d.sub] + '».'; } }
  return msg;
}
