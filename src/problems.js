// ===== Problemas por curso (1º–6º de primaria), método de saltos Innovamat =====
// Todos los valores son enteros "escalados": sc=1 (enteros) o sc=100 (decimales, en centésimas).
// Nada aquí toca el DOM, para poder probarlo con Node (tools/test-problems.js).
let RNG = Math.random;
const setRng = f => { RNG = f || Math.random; };
const ri = (a, b) => Math.floor(a + RNG() * (b - a + 1));
const pick = a => a[Math.floor(RNG() * a.length)];
const shuffle = a => a.map(v => [RNG(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
const clampN = (n, a, b) => Math.min(b, Math.max(a, n));
const qr = (lo, hi, q) => { const a = Math.ceil(lo / q), b = Math.floor(hi / q); return (b < a ? a : ri(a, b)) * q; };
const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

function fmtN(v, sc) {
  if (sc === 1) return String(v).replace('-', '−');
  const neg = v < 0; v = Math.abs(v);
  let s = (v / sc).toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
  return (neg ? '−' : '') + s;
}
const fmtJ = (j, sc) => (j > 0 ? '+' : '−') + fmtN(Math.abs(j), sc);
const paren = (v, sc) => v < 0 ? '(' + fmtN(v, sc) + ')' : fmtN(v, sc);

// ---------- Tabla de niveles: curso -> 3 subniveles ----------
const U = n => Array.from({length: n}, (_, i) => i + 1);
const X = (arr, k) => arr.map(x => x * k);
const V_INT = [...U(9), ...X(U(9), 10)];                      // 1..9, 10..90
const V_HUN = [...V_INT, ...X(U(9), 100)];                    // + 100..900
const V_DEC = [...X(U(9), 10), ...X(U(9), 100), ...X(U(9), 1000)];        // 0,1..0,9  1..9  10
const V_CEN = [...U(9), ...X(U(9), 10), ...X(U(9), 100), ...X(U(9), 1000)];     // 0,01 .. 9
const TIERS = {
  1: [{max: 10, vals: U(5), mult: {k: 'rep', tabs: [2], n: [2, 5]}, div: {k: 'rep', tabs: [2], n: [2, 5]}},
      {max: 20, vals: U(10), mult: {k: 'rep', tabs: [2, 5, 10], n: [2, 5]}, div: {k: 'rep', tabs: [2, 5, 10], n: [2, 5]}},
      {max: 50, vals: [...U(9), 10, 20, 30, 40], mult: {k: 'rep', tabs: [2, 5, 10], n: [2, 10]}, div: {k: 'rep', tabs: [2, 5, 10], n: [2, 10]}}],
  2: [{max: 50, vals: [...U(9), 10, 20, 30, 40, 50], mult: {k: 'rep', tabs: [2, 3, 5, 10], n: [2, 6]}, div: {k: 'rep', tabs: [2, 3, 5, 10], n: [2, 6]}},
      {max: 100, vals: V_INT, mult: {k: 'rep', tabs: [2, 3, 4, 5, 10], n: [2, 8]}, div: {k: 'rep', tabs: [2, 3, 4, 5, 10], n: [2, 8]}},
      {max: 100, vals: V_INT, hard: 1, mult: {k: 'rep', tabs: [2, 3, 4, 5, 6, 10], n: [2, 10]}, div: {k: 'rep', tabs: [2, 3, 4, 5, 6, 10], n: [2, 10]}}],
  3: [{max: 200, vals: [...V_INT, 100], mult: {k: 'rep', tabs: [3, 4, 6], n: [3, 10]}, div: {k: 'rep', tabs: [3, 4, 6], n: [3, 10]}},
      {max: 500, vals: [...V_INT, 100, 200, 300, 400, 500], mult: {k: 'rep', tabs: [6, 7, 8, 9], n: [3, 10]}, div: {k: 'rep', tabs: [6, 7, 8, 9], n: [3, 10]}},
      {max: 1000, vals: V_HUN, mult: {k: 'rep', tabs: [2, 3, 4, 5, 6, 7, 8, 9, 10], n: [3, 10]}, div: {k: 'rep', tabs: [2, 3, 4, 5, 6, 7, 8, 9, 10], n: [3, 10]}}],
  4: [{max: 2000, vals: [...V_HUN, 1000], mult: {k: 'rect', a: [12, 99], b: [2, 9]}, div: {k: 'rect', q: [12, 99], t: [2, 9]}},
      {max: 5000, vals: [...V_HUN, 1000], mult: {k: 'rect', a: [101, 499], b: [2, 9]}, div: {k: 'rect', q: [101, 499], t: [2, 9]}},
      {max: 10000, vals: [...V_HUN, 1000, 2000, 3000, 4000, 5000], mult: {k: 'rect', a: [121, 999], b: [3, 9]}, div: {k: 'rect', q: [121, 999], t: [3, 9]}}],
  5: [{max: 2000, sc: 100, q: 10, vals: V_DEC, mult: {k: 'rect', a: [101, 499], b: [2, 9]}, div: {k: 'rect', q: [21, 99], t: [2, 9], rem: 1}},
      {max: 10000, sc: 100, q: 10, vals: V_DEC, mult: {k: 'rect', a: [12, 99], b: [11, 29]}, div: {k: 'rect', q: [101, 399], t: [2, 9], rem: 1}},
      {max: 1000, sc: 100, q: 1, vals: V_CEN, mult: {k: 'rect', a: [101, 499], b: [11, 29]}, div: {k: 'rect', q: [121, 599], t: [3, 9], rem: 1}}],
  6: [{max: 10000, sc: 100, q: 1, vals: [...V_CEN, 25, 50], mult: {k: 'rect', a: [12, 99], b: [2, 9], adec: 1}, div: {k: 'rect', q: [12, 99], t: [2, 9], qdec: 1}},
      {max: 20, neg: 1, vals: U(10), mult: {k: 'rect', a: [12, 99], b: [2, 9], adec: 1}, div: {k: 'rect', q: [12, 99], t: [2, 9], qdec: 1}},
      {max: 100, neg: 1, vals: V_INT, mult: {k: 'rect', a: [112, 299], b: [3, 9], adec: 1}, div: {k: 'rect', q: [112, 299], t: [3, 9], qdec: 1}}]
};
const CURSO_NAMES = ['', '1º', '2º', '3º', '4º', '5º', '6º'];
const SUB_NAMES = ['', 'Aprendo', 'Practico', 'Reto'];
const cursoDeEdad = e => e <= 6 ? 1 : e >= 11 ? 6 : e - 5;
const tierOf = (curso, sub) => TIERS[clampN(curso, 1, 6)][clampN(sub, 1, 3) - 1];
// Apoyo visual por curso (Innovamat): collar de bolas -> marcas de decenas -> línea casi vacía -> línea vacía
const supportOf = (curso, max) => curso <= 1 ? 'beads' : curso === 2 ? (max <= 100 ? 'beads' : 'tens') : curso === 3 ? 'sparse' : 'empty';

// ---------- Búsqueda del camino más corto (par) ----------
function bfs(start, target, vals, lo, hi) {
  if (start < lo || start > hi || target < lo || target > hi) return null;
  const n = hi - lo + 1, dist = new Int32Array(n).fill(-1), prev = new Int32Array(n).fill(-1), q = [start - lo];
  dist[start - lo] = 0; const t = target - lo;
  for (let i = 0; i < q.length && dist[t] < 0; i++) {
    const p = q[i];
    for (const v of vals) for (const s of [1, -1]) { const m = p + s * v; if (m < 0 || m >= n || dist[m] >= 0) continue; dist[m] = dist[p] + 1; prev[m] = p; q.push(m); }
  }
  if (dist[t] < 0) return null;
  const path = []; for (let p = t; p !== start - lo; p = prev[p]) path.unshift(p - prev[p]);
  return path;
}
// meta alcanzable "por debajo del divisor": camino a cualquier punto < t
function bfsBelow(start, t, vals, lo, hi) {
  for (let g = start % t; g >= 0; g -= t) { const p = bfs(start, g, vals, lo, hi); if (p) return p; }
  return null;
}

// ---------- Generadores ----------
function placeParts(b, q) {              // 327 -> [300,20,7] ; 235 (cent.) -> [200,30,5]
  const parts = []; let p = 1; while (p * 10 <= b) p *= 10;
  for (; p >= 1; p = Math.floor(p / 10)) { const d = Math.floor(b / p) % 10; if (d) parts.push(d * p); if (p === 1) break; }
  return parts.filter(x => x > 0);
}
function rectChips(maxK, scK, b) {       // chips "k × b" (k en unidades escaladas)
  const ks = []; for (const e of scK) for (let d = 1; d <= 9; d++) { const k = d * e; if (k <= maxK) ks.push(k); }
  return [...new Set(ks)].sort((x, y) => x - y).map(k => ({k, v: k * b}));
}

function makeProblem(mode, curso, sub) {
  const T = tierOf(curso, sub), sc = T.sc || 1, q = T.q || 1, max = T.max, neg = !!T.neg;
  const lo = neg ? -max : 0, P = {mode, curso, sub, sc, lo, hi: max, vals: T.vals.slice(), labels: null, support: supportOf(curso, max), neg};
  const bmin = Math.max(q * 2, Math.round(max * .08 / q) * q), bmax = Math.max(bmin + q, Math.round(max * .4 / q) * q);
  const comp = () => {
    const R = sc > 1 ? sc : (max >= 1000 ? 100 : 10), dlt = pick([1, 2]) * (sc > 1 ? q : 1), k = ri(1, Math.max(1, Math.floor(bmax / R)));
    return Math.max(R - dlt, k * R - dlt);
  };
  const net = (sign, b, a) => { P.kind = 'net'; P.sign = sign; P.b = b; P.a = a; P.start = a; P.end = a + sign * b; };
  if (mode === 'suma') { const b = qr(bmin, bmax, q); net(1, b, qr(Math.max(q, Math.round(max * .08)), max - b, q) * (neg && RNG() < .4 ? -1 : 1) || q); if (P.end > max) P.start = P.a = max - b; }
  else if (mode === 'resta') {
    const a = qr(Math.round(max * .4), max, q); let b = qr(bmin, Math.min(bmax, neg ? max : a - q), q);
    if (neg && RNG() < .75 && a + q < max) b = qr(a + q, Math.min(max, a + Math.round(max * .6)), q);   // cruzar el cero (termómetro)
    net(-1, b, a);
  }
  else if (mode === 'comp') {
    const b = comp();
    if (RNG() < .5) { const a = qr(Math.max(q, Math.round(max * .08)), Math.max(q * 2, max - b - q), q); net(1, b, a); if (P.end > max) { P.a = P.start = Math.max(q, max - b - q); P.end = P.a + b; } }
    else { const a = qr(Math.min(max - q, b + 5 * q), max - q, q); net(-1, b, Math.max(a, b + q)); }
  } else if (mode === 'dist') {
    const b = qr(Math.round(max * .1), Math.round(max * .55), q), d = qr(bmin, bmax, q), a = Math.min(max, b + d);
    P.kind = 'dist'; P.a = a; P.b = b; P.start = b; P.end = a; P.sign = 1; P.ans = a - b; P.lo = 0;
  } else if (mode === 'falta') {
    const add = RNG() < .5, b0 = qr(bmin, bmax, q); let b = b0, tries = 0;
    const step = sc > 1 ? sc : (max >= 1000 ? 100 : 10);
    while (b % step === 0 && tries++ < 40) b = qr(bmin, bmax, q);
    const a = add ? qr(Math.max(q, Math.round(max * .08)), Math.max(q * 2, max - b - q), q) : qr(Math.min(max - q, b + 5 * q), max - q, q);
    P.kind = 'falta'; P.sign = add ? 1 : -1; P.a = a; P.b = b; P.start = a; P.end = a + P.sign * b; P.lo = Math.min(lo, 0);
    const big = Math.floor(b / step) * step, u = b - big, parts = [];
    if (max < 1000 && sc === 1 && b < 100) { const need = add ? (step - (a % step)) % step : a % step; if (big) parts.push(big); if (need > 0 && need < u) parts.push(need, u - need); else if (u) parts.push(u); }
    else parts.push(...placeParts(b, q));
    if (parts.length === 1 && parts[0] >= 2 * q) { const h = Math.floor(parts[0] / 2 / q) * q || q; parts.splice(0, 1, parts[0] - h, h); }
    P.parts = parts; P.par = parts.length; P.hidden = ri(0, parts.length - 1);
    const real = parts[P.hidden], o = new Set([real]);
    for (let g = 0; o.size < 3 && g < 60; g++) { const v = Math.abs(real + pick([-1, 1]) * pick([1, 2, 3, 5, 10].map(x => x * q))); if (v > 0 && v !== real) o.add(v); }
    P.options = shuffle([...o]);
  } else if (mode === 'mult' || mode === 'div') {
    const M = T[mode];
    if (M.k === 'rep') {
      const t = pick(M.tabs), n = ri(M.n[0], M.n[1]); P.t = t; P.n = n; P.sc = 1; P.vals = [t]; P.hi = n * t; P.lo = 0;
      if (mode === 'mult') { P.kind = 'mult'; P.start = 0; P.end = n * t; P.sign = 1; P.text = n + ' × ' + t; P.ansV = n * t; }
      else { P.kind = 'div'; P.start = n * t; P.end = 0; P.sign = -1; P.text = n * t + ' ÷ ' + t; P.ansV = n; }
      P.par = n; P.minV = t; P.ansLabel = String(P.ansV); P.hint = mode === 'mult' ? 'Da ' + n + ' saltos de ' + t + '.' : '¿Cuántos saltos de ' + t + ' hacia atrás caben hasta llegar a 0?';
      return P;
    }
    // modelo rectangular: chips "k × b" (cada salto es una parte del número × el factor)
    if (mode === 'mult') {
      const b = ri(M.b[0], M.b[1]), a = ri(M.a[0], M.a[1]);
      P.sc = M.adec ? 100 : 1; const A = M.adec ? a * 10 : a, total = A * b;
      const ks = P.sc === 100 ? [100, 10] : [1, 10, 100, 1000].slice(0, String(a).length), chips = rectChips(A, ks, b);
      P.kind = 'net'; P.sign = 1; P.b = total; P.a = 0; P.start = 0; P.end = total; P.vals = chips.map(c => c.v); P.labels = {};
      chips.forEach(c => { P.labels[c.v] = fmtN(c.k, P.sc) + ' × ' + b; });
      P.lo = 0; P.hi = Math.round(total * 1.35) + b * P.sc; P.text = fmtN(A, P.sc) + ' × ' + b; P.ansLabel = fmtN(total, P.sc); P.ansV = total;
      P.hint = 'Descompón ' + fmtN(A, P.sc) + ' y salta por partes: cada salto es (parte × ' + b + ').';
    } else {
      const t = ri(M.t[0], M.t[1]), qq = ri(M.q[0], M.q[1]);
      P.sc = M.qdec ? 100 : 1; const Q = M.qdec ? qq * 10 : qq, rem = M.rem && !M.qdec ? ri(1, t - 1) : 0, dividend = Q * t + rem;
      const ks = P.sc === 100 ? [100, 10] : [1, 10, 100, 1000].slice(0, String(qq).length), chips = rectChips(Q, ks, t);
      P.kind = 'div'; P.t = t; P.start = dividend; P.end = rem; P.sign = -1; P.vals = chips.map(c => c.v); P.labels = {};
      chips.forEach(c => { P.labels[c.v] = fmtN(c.k, P.sc) + ' × ' + t; });
      P.minV = Math.min(...P.vals); P.lo = 0; P.hi = dividend; P.rem = rem; P.rect = 1;
      P.text = fmtN(dividend, P.sc) + ' ÷ ' + t; P.ansV = Q; P.ansLabel = fmtN(Q, P.sc) + (rem ? ' (sobran ' + fmtN(rem, P.sc) + ')' : '');
      P.hint = '¿Cuántos saltos de ' + t + ' caben? Resta por partes (parte × ' + t + ').';
    }
    P.par = (bfsBelowOrNet(P) || [0]).length; return P;
  } else return makeProblem('suma', curso, sub);
  // textos y par
  const sgn = P.sign > 0 ? ' + ' : ' − ';
  P.text = ({suma: fmtN(P.a, P.sc) + ' + ' + fmtN(P.b, P.sc), resta: fmtN(P.a, P.sc) + ' − ' + fmtN(P.b, P.sc), comp: fmtN(P.a, P.sc) + sgn + fmtN(P.b, P.sc), dist: fmtN(P.a, P.sc) + ' − ' + fmtN(P.b, P.sc), falta: fmtN(P.a, P.sc) + sgn + fmtN(P.b, P.sc)})[mode];
  if (P.a < 0) P.text = P.text.replace(fmtN(P.a, P.sc), '(' + fmtN(P.a, P.sc) + ')');
  P.hi = Math.max(max, P.end, P.start); P.lo = Math.min(P.lo, P.start, P.end, neg ? -max : 0);
  P.ansV = P.kind === 'dist' ? P.ans : P.end; P.ansLabel = fmtN(P.ansV, P.sc);
  if (P.kind === 'net' || P.kind === 'dist') P.par = (bfs(P.start, P.end, P.vals, P.lo, P.hi) || [0]).length;
  return P;
}
function bfsBelowOrNet(P) {
  if (P.kind === 'net') return bfs(P.start, P.end, P.vals, P.lo, P.hi);
  return bfsBelow(P.start, P.minV, P.vals, P.lo, P.hi);
}

// Opciones de respuesta final (etiquetas)
function makeOptions(P) {
  const o = new Set([P.ansLabel]), unit = P.sc === 100 ? 10 : 1;
  for (let g = 0; o.size < 3 && g < 100; g++) {
    const v = P.ansV + pick([-1, 1]) * pick([1, 2, 10, P.t || 2]) * unit;
    if (v < (P.neg ? -P.hi : 0) || (!P.rem && v === P.ansV)) continue;
    o.add(P.rem ? fmtN(v, P.sc) + ' (sobran ' + fmtN(pick([P.rem, P.rem + (P.sc === 100 ? 10 : 1)]), P.sc) + ')' : fmtN(v, P.sc));
  }
  return shuffle([...o]);
}
