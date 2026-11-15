// Prueba: todos los cursos/subniveles/operaciones generan problemas resolubles con saltos.
const fs = require('fs'), path = require('path');
eval(fs.readFileSync(path.join(__dirname, '../src/problems.js'), 'utf8') + `
let bad = 0, n = 0, maxMs = 0; const seen = {};
for (let c = 1; c <= 6; c++) for (let s = 1; s <= 3; s++) for (const m of ['suma','resta','dist','comp','falta','mult','div']) for (let i = 0; i < 40; i++) {
  const t0 = Date.now(); let P;
  try { P = makeProblem(m, c, s); } catch (e) { console.log('ERROR', c, s, m, e.message); bad++; continue; }
  maxMs = Math.max(maxMs, Date.now() - t0); n++;
  const fail = msg => { if (bad++ < 25) console.log('FAIL', c + 'º-' + s, m, P.text, msg); };
  if (!(P.par >= 1)) fail('par=' + P.par);
  if (P.kind === 'falta') { const sum = P.parts.reduce((x, y) => x + y, 0); if (sum !== P.b) fail('parts ' + P.parts + ' != ' + P.b); if (!P.options.includes(P.parts[P.hidden])) fail('opt'); if (P.parts.length < 2) seen.shortFalta = (seen.shortFalta || 0) + 1; }
  if (P.kind === 'net') { if (P.end < P.lo || P.end > P.hi) fail('fuera de rango ' + P.end); if (!bfs(P.start, P.end, P.vals, P.lo, P.hi)) fail('sin camino'); }
  if (P.kind === 'dist' && !(P.end > P.start)) fail('dist');
  if (P.kind === 'div') { const path = bfsBelowOrNet(P); if (!path) fail('div sin camino'); if (P.start < P.minV) fail('div trivial'); }
  const o = (P.kind === 'falta') ? [] : makeOptions(P); if (P.kind !== 'falta' && (o.length < 3 || !o.includes(P.ansLabel))) fail('opciones ' + o);
  if (/NaN|undefined/.test(P.text + P.ansLabel)) fail('texto ' + P.text + ' ' + P.ansLabel);
  if (c <= 2 && P.vals.length === 0) fail('sin chips');
}
console.log('problemas', n, 'fallos', bad, 'max ms', maxMs, JSON.stringify(seen));
const ej = ['suma','resta','dist','comp','falta','mult','div'].map(m => { const P = makeProblem(m, 5, 2); return m + ': ' + P.text + ' = ' + P.ansLabel + ' (par ' + P.par + ')'; }); console.log(ej.join('\\n'));
console.log(makeProblem('mult', 4, 2).text, '|', makeProblem('div', 6, 1).text, '|', makeProblem('suma', 6, 2).text, '|', fmtN(-250,100), fmtN(1005,100), fmtJ(50,100));
process.exit(bad ? 1 : 0);`);
