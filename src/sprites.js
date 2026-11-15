// ===== Mundos, cromos y sprites (canvas) =====
const THEMES = {
  futbol: {name: 'Fútbol', icon: '⚽', goal: '¡GOL!', round: '⚽', title: '⚽ Liga de Saltos', idx: 0},
  coches: {name: 'Coches', icon: '🏎️', goal: '¡META!', round: '🏁', title: '🏎️ Liga de Saltos', idx: 1},
  esqui: {name: 'Esquí', icon: '⛷️', goal: '¡A LA META!', round: '🎿', title: '⛷️ Liga de Saltos', idx: 2},
  dragones: {name: 'Dragones', icon: '🐉', goal: '¡TESORO!', round: '🔥', title: '🐉 Liga de Saltos', idx: 1}
};
const PAL = {
  futbol: {ink: '#fff', a: '#ffd23f', b: '#7df9ff', c: '#9cff8f'}, coches: {ink: '#fff', a: '#ffd23f', b: '#7df9ff', c: '#9cff8f'},
  esqui: {ink: '#0d3b66', a: '#d84315', b: '#1565c0', c: '#2e7d32'}, dragones: {ink: '#fff', a: '#ffd23f', b: '#7df9ff', c: '#9cff8f'}
};
const CARDS = {
  futbol: [['Crack', 'hero'], ['Lamine Yamal', 'yamal'], ['Pedri', 'pedri'], ['Raphinha', 'raphinha'], ['Iñaki Williams', 'inaki'], ['Griezmann', 'griez'], ['Vinícius Jr.', 'vini'], ['Bellingham', 'bell'], ['Isco', 'isco'], ['Oyarzabal', 'oyar'], ['Iniesta', 'iniesta'], ['Messi', 'messi']],
  coches: [['Rayo Rojo', '#e53935'], ['Turbo Azul', '#1e88e5'], ['Limón Veloz', '#cddc39'], ['Tiburón', '#00acc1'], ['Fantasma', '#b0bec5'], ['Dragón Verde', '#43a047'], ['Naranja Loca', '#fb8c00'], ['Púrpura GT', '#8e24aa'], ['Dorado', '#ffb300'], ['Rosa Turbo', '#ec407a'], ['Negro Noche', '#455a64'], ['Arcoíris', 'rainbow']],
  esqui: [['Copo', '#e53935'], ['Ventisca', '#1e88e5'], ['Alpino', '#43a047'], ['Cometa', '#fb8c00'], ['Aurora', '#ab47bc'], ['Pingüino', '#455a64'], ['Glaciar', '#00acc1'], ['Abeto', '#2e7d32'], ['Sol Naranja', '#ffb300'], ['Fresa', '#ec407a'], ['Rayo Azul', '#3949ab'], ['Campeón', 'rainbow']],
  dragones: [['Fuegorojo', '#e53935'], ['Hielito', '#4fc3f7'], ['Esmeralda', '#43a047'], ['Trueno', '#fdd835'], ['Sombra', '#5e35b1'], ['Mandarina', '#fb8c00'], ['Coral', '#ec407a'], ['Océano', '#1e88e5'], ['Bosque', '#2e7d32'], ['Carbón', '#546e7a'], ['Oro', '#ffb300'], ['Arcoíris', 'rainbow']]
};


// ---------- Sprites ----------
function drawSprite(c, theme, idx, x, y, s, time, pose) {
  ctx = c; const def = CARDS[theme][idx] || CARDS[theme][0];
  if (theme === 'futbol') {
    const key = def[1];
    if (key === 'hero') drawFootballer(x, y, time, {kit: FB_HERO_KIT, look: fbHeroLook(), scale: s, pose, num: '', ball: pose > 0});
    else { const p = FB_PLAYERS[key]; drawFootballer(x, y, time, {kit: p.kit, look: p.look, scale: s, pose, num: p.n, ball: pose > 0}); }
  } else if (theme === 'coches') drawCar(c, x, y, s, def[1], time, pose);
  else if (theme === 'esqui') drawSkier(c, x, y, s, def[1], time, pose);
  else drawDragon(c, x, y, s, def[1], time, pose);
}
function bodyColor(col, time) { return col === 'rainbow' ? 'hsl(' + ((time * 120) % 360) + ' 90% 55%)' : col; }
function drawCar(c, x, y, s, col, time, pose) {
  c.save(); c.translate(x, y); c.scale(s * .85, s * .85);
  c.fillStyle = '#0a122266'; c.beginPath(); c.ellipse(0, 0, 42, 6, 0, 0, 7); c.fill();
  if (pose > 0) { c.fillStyle = '#ff9800'; c.beginPath(); c.moveTo(-36, -16); c.lineTo(-62 - pose * 10, -12); c.lineTo(-36, -8); c.fill(); c.fillStyle = '#ffeb3b'; c.beginPath(); c.moveTo(-36, -14); c.lineTo(-50, -12); c.lineTo(-36, -10); c.fill(); }
  c.fillStyle = bodyColor(col, time); c.beginPath(); c.moveTo(-38, -10); c.lineTo(-38, -22); c.quadraticCurveTo(-34, -28, -18, -29); c.lineTo(-9, -41); c.lineTo(14, -41); c.lineTo(25, -29); c.quadraticCurveTo(38, -26, 41, -17); c.lineTo(41, -10); c.closePath(); c.fill();
  c.fillStyle = '#c9ecff'; c.beginPath(); c.moveTo(-7, -37); c.lineTo(-14, -29); c.lineTo(21, -29); c.lineTo(12, -37); c.closePath(); c.fill();
  c.fillStyle = '#ffffffb0'; c.fillRect(-38, -19, 79, 3);
  c.fillStyle = '#fff7a0'; c.fillRect(37, -20, 5, 5); c.fillStyle = '#ff5252'; c.fillRect(-40, -20, 3, 5);
  for (const wx of [-23, 25]) {
    c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(wx, -8, 9.5, 0, 7); c.fill();
    c.fillStyle = '#cfd8dc'; c.beginPath(); c.arc(wx, -8, 4.5, 0, 7); c.fill();
    c.strokeStyle = '#455a64'; c.lineWidth = 1.5; c.beginPath(); const a = time * 14 * (pose > 0 ? 1 : 0); c.moveTo(wx + Math.cos(a) * 4, -8 + Math.sin(a) * 4); c.lineTo(wx - Math.cos(a) * 4, -8 - Math.sin(a) * 4); c.stroke();
  }
  c.restore();
}
function drawSkier(c, x, y, s, col, time, pose) {
  c.save(); c.translate(x, y); c.scale(s * .95, s * .95);
  c.fillStyle = '#0a122244'; c.beginPath(); c.ellipse(0, 0, 34, 4, 0, 0, 7); c.fill();
  const b = bodyColor(col, time), lean = pose * .22; c.rotate(lean * .4);
  c.fillStyle = '#d32f2f'; c.fillRect(-32, -5, 62, 5); c.beginPath(); c.moveTo(30, -5); c.quadraticCurveTo(42, -5, 45, -12); c.lineTo(43, -13); c.quadraticCurveTo(38, -8, 30, -10); c.fill();
  c.fillStyle = '#263238'; c.fillRect(-13, -20, 10, 15); c.fillRect(4, -20, 10, 15);
  c.fillStyle = '#37474f'; c.fillRect(-13, -38, 10, 19); c.fillRect(4, -38, 10, 19);
  c.fillStyle = b; c.beginPath(); c.moveTo(-15, -36); c.lineTo(-13, -64); c.quadraticCurveTo(0, -70, 14, -64); c.lineTo(16, -36); c.closePath(); c.fill();
  c.fillStyle = '#ffffffcc'; c.fillRect(-15, -50, 31, 5);
  const sw = pose > 0 ? Math.sin(time * 10) * 3 : 0;
  c.lineCap = 'round'; c.strokeStyle = b; c.lineWidth = 7; c.beginPath(); c.moveTo(11, -60); c.lineTo(25, -46 + sw); c.stroke(); c.beginPath(); c.moveTo(-11, -60); c.lineTo(-25, -46 - sw); c.stroke();
  c.strokeStyle = '#90a4ae'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(25, -46 + sw); c.lineTo(39, -2); c.stroke(); c.beginPath(); c.moveTo(-25, -46 - sw); c.lineTo(-39, -2); c.stroke();
  c.fillStyle = '#ffcc9c'; c.beginPath(); c.arc(0, -78, 10, 0, 7); c.fill();
  c.fillStyle = b; c.beginPath(); c.arc(0, -80, 11.5, Math.PI, 0); c.fill(); c.fillRect(-11.5, -81, 23, 4);
  c.fillStyle = '#263238'; c.fillRect(1, -82, 12, 7); c.fillStyle = '#80deea'; c.fillRect(3, -81, 9, 4.5);
  c.restore();
}
function drawDragon(c, x, y, s, col, time, pose) {
  c.save(); c.translate(x, y); c.scale(s * .9, s * .9);
  c.fillStyle = '#0a122255'; c.beginPath(); c.ellipse(0, 0, 32, 5, 0, 0, 7); c.fill();
  const b = bodyColor(col, time), flap = Math.sin(time * (pose > 0 ? 14 : 5)) * (pose > 0 ? .7 : .25);
  c.fillStyle = b; c.beginPath(); c.moveTo(-18, -22); c.quadraticCurveTo(-52, -14, -58, -40); c.quadraticCurveTo(-44, -26, -30, -10); c.closePath(); c.fill();
  c.fillStyle = '#ffd54f'; c.beginPath(); c.moveTo(-58, -40); c.lineTo(-64, -34); c.lineTo(-52, -34); c.fill();
  c.save(); c.translate(-6, -42); c.rotate(-.7 - flap); c.fillStyle = b; c.beginPath(); c.moveTo(0, 0); c.lineTo(-12, -36); c.lineTo(6, -28); c.lineTo(20, -38); c.lineTo(24, -4); c.closePath(); c.fill(); c.fillStyle = '#00000038'; c.fill(); c.restore();
  c.fillStyle = b; c.beginPath(); c.ellipse(0, -26, 27, 21, 0, 0, 7); c.fill();
  c.fillStyle = '#fff3c4'; c.beginPath(); c.ellipse(8, -22, 15, 14, 0, 0, 7); c.fill();
  c.fillStyle = b; for (const lx of [-12, 14]) { c.beginPath(); c.ellipse(lx, -6, 8, 7, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(lx + 3, -3, 2, 3); c.fillRect(lx - 1, -3, 2, 3); c.fillStyle = b; }
  c.beginPath(); c.moveTo(14, -36); c.quadraticCurveTo(30, -44, 24, -58); c.lineTo(38, -56); c.quadraticCurveTo(36, -42, 28, -30); c.fill();
  c.beginPath(); c.arc(28, -56, 14, 0, 7); c.fill(); c.beginPath(); c.ellipse(41, -52, 11, 8, 0, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(31, -60, 5, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(33, -60, 2.6, 0, 7); c.fill();
  c.fillStyle = '#00000055'; c.beginPath(); c.arc(46, -54, 1.6, 0, 7); c.fill();
  c.fillStyle = '#ffe082'; c.beginPath(); c.moveTo(20, -66); c.lineTo(15, -80); c.lineTo(28, -69); c.fill(); c.beginPath(); c.moveTo(30, -70); c.lineTo(32, -84); c.lineTo(38, -68); c.fill();
  c.fillStyle = '#ffe082'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-14 + i * 9, -46 + (i % 2) * 2); c.lineTo(-10 + i * 9, -55); c.lineTo(-6 + i * 9, -46); c.fill(); }
  if (pose > 0) { c.fillStyle = '#ff9800'; c.beginPath(); c.moveTo(50, -54); c.lineTo(78 + pose * 14, -62); c.lineTo(72, -50); c.lineTo(80 + pose * 12, -40); c.lineTo(50, -48); c.fill(); c.fillStyle = '#ffeb3b'; c.beginPath(); c.moveTo(50, -52); c.lineTo(66, -54); c.lineTo(50, -48); c.fill(); }
  c.restore();
}


const nz = (i, j) => { const v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); };
function drawBG(c, t, lineY, sh = 0) {
  const k = themeKey(), ink = PAL[k].ink;   // sh = desplazamiento (parallax) en píxeles
  if (k === 'futbol') {
    const g = c.createLinearGradient(0, 0, 0, lineY); g.addColorStop(0, '#0b1030'); g.addColorStop(1, '#2c2a66'); c.fillStyle = g; c.fillRect(0, 0, W, lineY);
    for (let i = 0; i < 3; i++) { const fx = W * (.15 + i * .35); c.fillStyle = '#2b3347'; c.fillRect(fx - 3, lineY * .18, 6, lineY * .55); c.fillStyle = '#fff6cf'; for (let l = 0; l < 3; l++) { c.beginPath(); c.arc(fx - 10 + l * 10, lineY * .16, 4, 0, 7); c.fill(); } c.fillStyle = '#fff6cf18'; c.beginPath(); c.moveTo(fx - 12, lineY * .2); c.lineTo(fx + 12, lineY * .2); c.lineTo(fx + 70, lineY); c.lineTo(fx - 70, lineY); c.fill(); }
    const cols = ['#d7263d', '#f4f4f4', '#ffd166', '#6c63ff']; c.fillStyle = '#1b2236'; c.fillRect(0, lineY * .45, W, lineY * .55);
    for (let k2 = 0; k2 < 4; k2++) { c.fillStyle = cols[k2]; c.beginPath(); const o8 = sh * .25, cl8 = Math.floor(-o8 / 8), fo8 = o8 + cl8 * 8; for (let r = 0; r < 5; r++) for (let x = fo8 - 8, i = cl8 - 1; x < W; x += 8, i++) if (Math.floor(nz(i, r) * 4) === k2) c.rect(x + (r % 2) * 3, lineY * .5 + r * 8 + Math.sin(t * 4 + i) * .5, 5, 5); c.fill(); }
    c.fillStyle = '#1f8a56'; c.fillRect(0, lineY, W, H - lineY); c.fillStyle = '#1a7a4c'; for (let x = (sh * .9) % 70 - 70; x < W; x += 70) c.fillRect(x, lineY, 35, H - lineY);
  } else if (k === 'coches') {
    const g = c.createLinearGradient(0, 0, 0, lineY); g.addColorStop(0, '#2b1055'); g.addColorStop(.7, '#c2417a'); g.addColorStop(1, '#ff9a1f'); c.fillStyle = g; c.fillRect(0, 0, W, lineY);
    c.fillStyle = '#ffe14a'; c.beginPath(); c.arc(W * .8, lineY * .72, 34, 0, 7); c.fill();
    c.fillStyle = '#1b0f33'; { const sp = 46, o = sh * .25, cl = Math.floor(-o / sp), fo = o + cl * sp; for (let x = fo - sp, i = cl - 1; x < W; x += sp, i++) { const bh = 30 + nz(i, 2) * lineY * .5; c.fillRect(x, lineY - bh, sp - 6, bh); } }
    c.fillStyle = '#ffd54f88'; for (let i = 0; i < 40; i++) c.fillRect(nz(i, 5) * W, lineY - nz(i, 6) * lineY * .5, 3, 3);
    c.fillStyle = '#37323f'; c.fillRect(0, lineY, W, H - lineY);
    c.fillStyle = '#ffe14a'; for (let x = (sh * .9) % 60 - 60; x < W; x += 60) c.fillRect(x, lineY + (H - lineY) * .62, 34, 4);
  } else if (k === 'esqui') {
    const g = c.createLinearGradient(0, 0, 0, lineY); g.addColorStop(0, '#4aa8f0'); g.addColorStop(1, '#e6f7ff'); c.fillStyle = g; c.fillRect(0, 0, W, lineY);
    c.fillStyle = '#fff7c2'; c.beginPath(); c.arc(W * .16, lineY * .28, 24, 0, 7); c.fill();
    for (const [col, hh, sp, off] of [['#bcdcf2', .62, 150, 0], ['#8fb8d8', .45, 110, 40]]) {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, lineY);
      { const o = sh * (off ? .18 : .1), h2 = sp / 2, cl = Math.floor(-o / h2), fo = o + cl * h2; for (let x = fo - sp, i = cl - 2; x <= W + sp; x += h2, i++) c.lineTo(x, lineY - (i % 2 ? .35 : 1) * hh * lineY * (.7 + nz(i + off, 4) * .5)); }
      c.lineTo(W + sp, lineY); c.fill();
    }
    { const o = sh * .5, cl = Math.floor(-o / 44), fo = o + cl * 44; for (let x = fo - 44, i = cl - 1; x < W; x += 44, i++) { if (nz(i, 7) < .3) continue; const h2 = 26 + nz(i, 8) * 22; c.fillStyle = '#1b5e3a'; c.beginPath(); c.moveTo(x, lineY - h2); c.lineTo(x + 13, lineY - 4); c.lineTo(x - 13, lineY - 4); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, lineY - h2); c.lineTo(x + 5, lineY - h2 + 9); c.lineTo(x - 5, lineY - h2 + 9); c.fill(); } }
    c.fillStyle = '#f4fbff'; c.fillRect(0, lineY, W, H - lineY); c.fillStyle = '#d9eefa'; for (let x = (sh * .9) % 70 - 110; x < W; x += 70) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + 30, lineY); c.lineTo(x + 52, lineY); c.lineTo(x + 22, H); c.fill(); }
    c.fillStyle = '#fff'; for (let i = 0; i < 45; i++) c.fillRect((nz(i, 1) * W + t * 12 * (1 + nz(i, 3))) % W, (nz(i, 2) * lineY + t * 34 * (.4 + nz(i, 4))) % lineY, 2.4, 2.4);
  } else {
    const g = c.createLinearGradient(0, 0, 0, lineY); g.addColorStop(0, '#1a0b2e'); g.addColorStop(.6, '#7a1f3d'); g.addColorStop(1, '#ff7a1a'); c.fillStyle = g; c.fillRect(0, 0, W, lineY);
    c.fillStyle = '#ffffffaa'; for (let i = 0; i < 40; i++) c.fillRect(nz(i, 1) * W, nz(i, 2) * lineY * .6, 2, 2);
    c.fillStyle = '#ffe9b0'; c.beginPath(); c.arc(W * .2, lineY * .3, 20, 0, 7); c.fill();
    c.save(); c.translate(clampN(sh * .12, -40, 40), 0);
    c.fillStyle = '#2a1230'; c.beginPath(); c.moveTo(W * .5, lineY); c.lineTo(W * .62, lineY * .38); c.lineTo(W * .68, lineY * .38); c.lineTo(W * .82, lineY); c.fill();
    c.fillStyle = '#ff5722'; c.beginPath(); c.ellipse(W * .65, lineY * .38, W * .03, 5, 0, 0, 7); c.fill();
    c.fillStyle = '#ffb30055'; c.beginPath(); c.arc(W * .65, lineY * .3, 26 + Math.sin(t * 3) * 4, 0, 7); c.fill();
    c.fillStyle = '#1c0d24'; for (const [bx, bh] of [[.04, .5], [.1, .38], [.16, .55]]) { c.fillRect(W * bx, lineY * (1 - bh), W * .045, lineY * bh); c.beginPath(); c.moveTo(W * bx - 3, lineY * (1 - bh)); c.lineTo(W * bx + W * .0225, lineY * (1 - bh) - 18); c.lineTo(W * bx + W * .048, lineY * (1 - bh)); c.fill(); }
    c.restore();
    c.fillStyle = '#2a1520'; c.fillRect(0, lineY, W, H - lineY); c.fillStyle = '#ff6a1a55'; c.fillRect(0, lineY, W, 5);
    c.fillStyle = '#ffb300'; for (let i = 0; i < 18; i++) c.fillRect((nz(i, 1) * W + Math.sin(t + i) * 8) % W, lineY - ((t * 30 + nz(i, 2) * 90) % 90), 2.4, 2.4);
  }
  c.fillStyle = ink; c.fillRect(0, lineY - 1, W, 2);
}
function drawGoal(c, x, lineY, s, t) {
  const k = themeKey();
  if (k === 'futbol') { c.strokeStyle = '#fff'; c.lineWidth = 4; c.strokeRect(x - 24 * s, lineY - 46 * s, 48 * s, 46 * s); c.lineWidth = 1; c.strokeStyle = '#ffffff88'; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(x - 24 * s + i * 8 * s, lineY - 46 * s); c.lineTo(x - 24 * s + i * 8 * s, lineY); c.stroke(); } for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x - 24 * s, lineY - i * 11.5 * s); c.lineTo(x + 24 * s, lineY - i * 11.5 * s); c.stroke(); } }
  else if (k === 'coches') { c.fillStyle = '#eee'; c.fillRect(x - 2, lineY - 62 * s, 4, 62 * s); for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) { c.fillStyle = (r + q) % 2 ? '#111' : '#fff'; c.fillRect(x + 2 + q * 8 * s, lineY - 62 * s + r * 8 * s + Math.sin(t * 6 + q) * 1.5, 8 * s, 8 * s); } }
  else if (k === 'esqui') { c.fillStyle = '#6d4c41'; c.fillRect(x - 26 * s, lineY - 56 * s, 4 * s, 56 * s); c.fillRect(x + 22 * s, lineY - 56 * s, 4 * s, 56 * s); for (let q = 0; q < 8; q++) { c.fillStyle = q % 2 ? '#d32f2f' : '#fff'; c.fillRect(x - 24 * s + q * 6 * s, lineY - 56 * s + Math.sin(t * 5 + q) * 1.2, 6 * s, 14 * s); } c.strokeStyle = '#0d3b66'; c.lineWidth = 1; c.strokeRect(x - 24 * s, lineY - 56 * s, 48 * s, 14 * s); }
  else { c.fillStyle = '#ffd54f33'; c.beginPath(); c.arc(x, lineY - 24 * s, 40 * s + Math.sin(t * 3) * 3, 0, 7); c.fill(); c.fillStyle = '#8d5524'; c.fillRect(x - 22 * s, lineY - 26 * s, 44 * s, 26 * s); c.fillStyle = '#a8692f'; c.beginPath(); c.moveTo(x - 22 * s, lineY - 26 * s); c.quadraticCurveTo(x, lineY - 56 * s, x + 22 * s, lineY - 26 * s); c.fill(); c.fillStyle = '#ffd54f'; c.fillRect(x - 3 * s, lineY - 42 * s, 6 * s, 28 * s); c.fillRect(x - 22 * s, lineY - 28 * s, 44 * s, 4 * s); c.beginPath(); c.arc(x, lineY - 26 * s, 4 * s, 0, 7); c.fill(); }
}
