// ---------- Arte de fútbol (canvas, sin imágenes externas) ----------
// Colores genéricos de equipaciones; sin escudos ni caras reales.
const FB_LOOKS = {
  hero:   {skin:'#e0ac82', hair:'#3b2a1d', style:'short'},
};
const FB_HERO_KIT = {shirt:'#18a957', alt:'#ffffff', pat:'sash', shorts:'#ffffff', socks:'#18a957', num:'#ffffff', boot:'#ffd23f'};
const FB_PLAYERS = {
  // Equipos reales por colores de camiseta (sin escudos). kit.pat: solid | stripes | half | sash
  yamal:  {kit:{shirt:'#a50044', alt:'#004d98', pat:'stripes', shorts:'#0c2a66', socks:'#a50044', num:'#ffe27a'}, look:{skin:'#b88660', hair:'#1a110b', style:'short'}, n:10},
  pedri:  {kit:{shirt:'#a50044', alt:'#004d98', pat:'stripes', shorts:'#0c2a66', socks:'#a50044', num:'#ffe27a'}, look:{skin:'#e1b48e', hair:'#3b2616', style:'short'}, n:8},
  raphinha:{kit:{shirt:'#a50044', alt:'#004d98', pat:'stripes', shorts:'#0c2a66', socks:'#a50044', num:'#ffe27a'}, look:{skin:'#b0805c', hair:'#1b1209', style:'short'}, n:11},
  lewan:  {kit:{shirt:'#a50044', alt:'#004d98', pat:'stripes', shorts:'#0c2a66', socks:'#a50044', num:'#ffe27a'}, look:{skin:'#e8c6a4', hair:'#5a4128', style:'short', beard:'#6b5238'}, n:9},
  xavi:   {kit:{shirt:'#a50044', alt:'#004d98', pat:'stripes', shorts:'#0c2a66', socks:'#a50044', num:'#ffe27a'}, look:{skin:'#e0b08a', hair:'#3a2918', style:'short'}, n:6},
  iniesta:{kit:{shirt:'#a50044', alt:'#004d98', pat:'stripes', shorts:'#0c2a66', socks:'#a50044', num:'#ffe27a'}, look:{skin:'#e6c09c', hair:'#4a3626', style:'bald'}, n:8},
  puyol:  {kit:{shirt:'#a50044', alt:'#004d98', pat:'stripes', shorts:'#0c2a66', socks:'#a50044', num:'#ffe27a'}, look:{skin:'#dba97f', hair:'#2a1a10', style:'long'}, n:5},
  messi:  {kit:{shirt:'#a50044', alt:'#004d98', pat:'stripes', shorts:'#0c2a66', socks:'#a50044', num:'#ffe27a'}, look:{skin:'#e2b08c', hair:'#4a3022', style:'short', beard:'#5a4030'}, n:10},
  inaki:  {kit:{shirt:'#e2001a', alt:'#ffffff', pat:'stripes', shorts:'#111111', socks:'#e2001a', num:'#111111'}, look:{skin:'#6b4630', hair:'#0e0e0e', style:'curly'}, n:9},
  griez:  {kit:{shirt:'#d81e2b', alt:'#ffffff', pat:'stripes', shorts:'#1a2a6b', socks:'#d81e2b', num:'#1a2a6b'}, look:{skin:'#e8c4a0', hair:'#c9a45a', style:'short'}, n:7},
  oblak:  {kit:{shirt:'#f08a00', alt:'#f08a00', pat:'solid', shorts:'#222222', socks:'#222222', num:'#ffffff', keeper:true}, look:{skin:'#e3b896', hair:'#3a281c', style:'short'}, n:13},
  vini:   {kit:{shirt:'#fafafa', alt:'#fafafa', pat:'solid', shorts:'#fafafa', socks:'#fafafa', num:'#c9a640', trim:'#c9a640'}, look:{skin:'#6f4a33', hair:'#0e0e0e', style:'curly'}, n:7},
  bell:   {kit:{shirt:'#fafafa', alt:'#fafafa', pat:'solid', shorts:'#fafafa', socks:'#fafafa', num:'#c9a640', trim:'#c9a640'}, look:{skin:'#c38a62', hair:'#16110d', style:'short'}, n:5},
  mbappe: {kit:{shirt:'#fafafa', alt:'#fafafa', pat:'solid', shorts:'#fafafa', socks:'#fafafa', num:'#c9a640', trim:'#c9a640'}, look:{skin:'#5e3b28', hair:'#0e0e0e', style:'short'}, n:9},
  raul:   {kit:{shirt:'#fafafa', alt:'#fafafa', pat:'solid', shorts:'#fafafa', socks:'#fafafa', num:'#6b4fa3', trim:'#6b4fa3'}, look:{skin:'#e1b08a', hair:'#2e2016', style:'short'}, n:7},
  casillas:{kit:{shirt:'#e8c800', alt:'#e8c800', pat:'solid', shorts:'#222222', socks:'#222222', num:'#222222', keeper:true}, look:{skin:'#e2b48e', hair:'#2a1c12', style:'short'}, n:1},
  courtois:{kit:{shirt:'#19a8d8', alt:'#19a8d8', pat:'solid', shorts:'#111111', socks:'#111111', num:'#ffffff', keeper:true}, look:{skin:'#e1b58e', hair:'#2a1c12', style:'short'}, n:1},
  isco:   {kit:{shirt:'#0bb363', alt:'#ffffff', pat:'stripes', shorts:'#ffffff', socks:'#0bb363', num:'#0a5d36'}, look:{skin:'#e4b18a', hair:'#2a1a10', style:'short', beard:'#3a281c'}, n:10},
  oyar:   {kit:{shirt:'#0067b1', alt:'#ffffff', pat:'stripes', shorts:'#ffffff', socks:'#0067b1', num:'#0a2f57'}, look:{skin:'#e1b690', hair:'#4a3626', style:'short'}, n:10},
  villa:  {kit:{shirt:'#ffffff', alt:'#111111', pat:'half', shorts:'#111111', socks:'#ffffff', num:'#e07b00'}, look:{skin:'#dfae88', hair:'#241810', style:'short'}, n:7},
};
const fbHeroLook = () => FB_LOOKS.hero;

function fbBall(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#1b1b1b'; ctx.stroke();
  ctx.fillStyle = '#1b1b1b'; ctx.beginPath();
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * r * .42, Math.sin(a) * r * .42); }
  ctx.fill();
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2 + .6; ctx.beginPath(); ctx.arc(Math.cos(a) * r * .86, Math.sin(a) * r * .86, r * .2, 0, 7); ctx.fill(); }
  ctx.restore();
}

function drawFootballer(x, y, time, o) {
  const {kit, look, face = 1, scale = 1, pose = 0, stagger = 0, run = false, air = false, num = '', ball = false} = o;
  const c = ctx, keeper = !!kit.keeper;
  const L = (x1, y1, x2, y2, col, w) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.stroke(); };
  const E = (px, py, rx, ry, col) => { c.beginPath(); c.ellipse(px, py, rx, ry, 0, 0, 7); c.fillStyle = col; c.fill(); };
  c.save(); c.translate(x, y); c.scale(scale * face, scale); c.rotate(stagger * .22 - pose * .06);
  E(0, 0, 19, 4.5, '#0a122266');
  const sw = run ? Math.sin(time * 18) * 11 : air ? 7 : 0;
  c.translate(0, run ? -Math.abs(Math.sin(time * 18)) * 2.2 : Math.sin(time * 3) * 1.1);
  const kick = pose > .05;
  // Piernas
  for (const i of [0, 1]) {
    const front = i === 1;
    const fx = front ? (kick ? 6 + pose * 22 : sw + 3) : -sw - 3, fy = front && kick ? -pose * 11 : 0;
    const kx = fx * .45 + 2, ky = -16 + (front && kick ? -pose * 4 : 0);
    L(0 + (front ? 4 : -4), -31, kx, ky, look.skin, 8);
    L(kx, ky, fx, fy - 4, kit.socks, 7.5);
    E(fx + 3, fy - 1, 7.5, 3.2, '#141414'); E(fx + 5, fy - 1.5, 3, 1.4, kit.boot || '#e6e6e6');
    L(front ? 4 : -4, -31, kx * .5, -24, kit.shorts, 11.5);
  }
  // Pantalón y camiseta
  c.beginPath(); c.moveTo(-10, -34); c.lineTo(10, -34); c.lineTo(11, -26); c.lineTo(-11, -26); c.closePath(); c.fillStyle = kit.shorts; c.fill();
  c.save(); c.beginPath(); c.moveTo(-11, -58); c.quadraticCurveTo(0, -62, 11, -58); c.lineTo(12, -31); c.lineTo(-12, -31); c.closePath();
  c.fillStyle = kit.shirt; c.fill(); c.clip();
  c.fillStyle = kit.alt;
  if (kit.pat === 'stripes') for (let sx = -12; sx < 12; sx += 8) c.fillRect(sx + 4, -63, 4, 34);
  else if (kit.pat === 'half') c.fillRect(0, -63, 13, 34);
  else if (kit.pat === 'sash') { c.beginPath(); c.moveTo(-12, -58); c.lineTo(-4, -58); c.lineTo(12, -38); c.lineTo(12, -30); c.closePath(); c.fill(); }
  if (kit.trim) { c.fillStyle = kit.trim; c.fillRect(-12, -33, 24, 2); }
  c.restore();
  c.save(); c.scale(Math.sign(face) || 1, 1);
  c.font = '800 12px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = kit.num; c.fillText(String(num), 0, -44);
  c.restore();
  // Brazos
  const arm = (side, up) => {
    const sx = side * 11, ay = up ? -78 + (kick ? -pose * 6 : 0) : -37, ax = side * (up ? 17 : 15) + (!up ? (side > 0 ? sw : -sw) * .5 : 0);
    L(sx, -55, (sx + ax) / 2, (-55 + ay) / 2 - 1, keeper ? kit.shirt : kit.shirt, 7);
    L((sx + ax) / 2, (-55 + ay) / 2 - 1, ax, ay, keeper ? kit.shirt : look.skin, 6);
    c.beginPath(); c.arc(ax, ay, keeper ? 5.6 : 3.3, 0, 7); c.fillStyle = keeper ? '#f3f3f3' : look.skin; c.fill();
  };
  arm(-1, false); arm(1, kick && pose > .5);
  // Cabeza
  L(0, -58, 0, -63, look.skin, 6);
  c.beginPath(); c.arc(0, -70, 10, 0, 7); c.fillStyle = look.skin; c.fill();
  c.fillStyle = look.hair;
  const hs = look.style;
  if (hs !== 'bald') {
    c.beginPath(); c.arc(0, -71, 10.6, Math.PI * 1.03, Math.PI * 1.97); c.lineTo(8, -74); c.lineTo(-8, -74); c.closePath(); c.fill();
    if (hs === 'curly') for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(k * 4.2, -80 + Math.abs(k) * 1.6, 3.6, 0, 7); c.fill(); }
    if (hs === 'long') { c.fillRect(-11, -76, 4.5, 20); c.fillRect(6.5, -76, 4.5, 20); }
  }
  if (look.beard) { c.beginPath(); c.arc(0, -68, 10, .15, Math.PI - .15); c.lineTo(0, -66); c.closePath(); c.fillStyle = look.beard; c.fill(); }
  c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(3.2, -70, 1.3, 0, 7); c.arc(-3, -70, 1.3, 0, 7); c.fill();
  L(2, -65.6, 5, -65.6, look.beard ? '#fff' : '#8a4a3a', 1.2);
  c.restore();
  if (ball || kick) {
    const bx = x + face * scale * (kick ? 24 + pose * 20 : 18), by = y - (kick ? 5 + pose * 11 : 4) * scale;
    fbBall(bx, by, 6.5 * scale, time * 8 * face);
  }
}

