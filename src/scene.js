// ===== Escena (canvas): línea numérica, collar de bolas, parallax, sprites animados =====
const sc = $('scene'), sx = sc.getContext('2d');
let W = 300, H = 200, DPR = 1, vlo = null, vhi = null, scroll = 0, lastMs = 0;
const SC = {lastX: 0, lineY: 0};
function fit() { const r = sc.getBoundingClientRect(); if (!r.width) return; DPR = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; sc.width = Math.round(W * DPR); sc.height = Math.round(H * DPR); }
new ResizeObserver(fit).observe(sc);
const JC = ['#ffd23f', '#7df9ff', '#ff8fab', '#9cff8f', '#ffb066', '#c3a6ff'];
const STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

function frame(ms) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (ms - lastMs) / 1000); lastMs = ms;
  if (view !== 'vGame' || !R || !cur) return;
  const t = ms / 1000; ctx = sx; sx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sk = cur.data.skin[themeKey()], pal = PAL[themeKey()], u = clampN(W / 390, .85, 1.6);
  // --- animación del salto ---
  let dispPos = R.pos, hop = 0, pose = 0, sqY = 0;
  if (anim) {
    const k = clampN((ms - anim.t0) / anim.dur, 0, 1), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    dispPos = anim.from + (anim.to - anim.from) * e; hop = Math.sin(Math.PI * k) * (anim.undo ? 14 : 30) * u; pose = Math.sin(Math.PI * k);
    sqY = k < .15 ? -.12 * (k / .15) : k > .88 ? -.14 * Math.sin(Math.PI * (k - .88) / .12) : .08 * Math.sin(Math.PI * k);   // agacharse, estirarse en el aire y aplastarse al caer
    if (k >= 1) {
      if (anim.undo) { R.pos = anim.to; anim = null; busy = false; updateStatus(); syncDir(); }
      else if (anim.falta) { R.pos = anim.to; anim = null; busy = false; gameAudio.play('land'); puff(); R.fallAnim.i++; setTimeout(replayFalta, 150); }
      else afterLand();
    }
  }
  // --- rango visible (zoom suave) ---
  const pts = [R.start, R.end, ...R.landings, dispPos]; let lo = Math.min(...pts), hi = Math.max(...pts);
  const span = Math.max(hi - lo, R.sc * 4); lo -= span * .15; hi += span * .17;
  if (!R.neg) lo = Math.max(lo, -span * .06);
  if (vlo === null) { vlo = lo; vhi = hi; } else { vlo += (lo - vlo) * .12; vhi += (hi - vhi) * .12; }
  const lineY = Math.round(H * .66), pad = Math.max(24, W * .07), X = p => pad + (p - vlo) / (vhi - vlo) * (W - 2 * pad), pxU = (W - 2 * pad) / (vhi - vlo);
  const sh = -(dispPos - R.start) * pxU * .5; SC.lineY = lineY;
  drawBG(sx, t, lineY, sh);
  // --- línea numérica según el apoyo del curso (Innovamat): collar -> decenas -> casi vacía -> vacía ---
  const range = vhi - vlo, sup = R.support, sc1 = R.sc;
  const showEnd = R.kind === 'dist' || R.kind === 'falta' || R.kind === 'faltaPlay' || R.state !== 'play' || R.kind === 'div';
  sx.font = '700 ' + Math.round(12 * u) + 'px system-ui'; sx.textAlign = 'center'; sx.fillStyle = pal.ink; sx.strokeStyle = pal.ink; sx.lineWidth = 1.5;
  const unit = sc1 === 1 ? 1 : sc1 / 10;
  let step = STEPS.find(s => range / (s * unit) <= (W - 2 * pad) / 30) || 10000; step *= unit;
  if (sup === 'beads') {
    const per = range / unit <= 40 ? unit : 10 * unit, rb = clampN(per * pxU * .38, 3, 9 * u);
    for (let p = Math.ceil(vlo / per) * per; p <= vhi; p += per) {
      const x = X(p), idx = Math.round(p / per), big = per === unit ? p % (10 * unit) === 0 : false;
      sx.fillStyle = big ? '#ffd23f' : ((Math.floor((idx - 1) / 5) % 2) ? '#ff5a5a' : '#fff'); if (per !== unit) sx.fillStyle = idx % 2 ? '#ff5a5a' : '#fff';
      sx.beginPath(); sx.arc(x, lineY, rb, 0, 7); sx.fill(); sx.strokeStyle = '#0006'; sx.lineWidth = 1; sx.stroke();
      if ((per === unit ? p % (5 * unit) === 0 : true) && pxU * per > 14 && p !== R.start && p !== R.pos && !(showEnd && p === R.end)) { sx.fillStyle = pal.ink; sx.fillText(fmtN(p, sc1), x, lineY + 14 * u + rb); }
    }
  } else {
    let lab = step; while (X(lab) - X(0) < 38 * u && lab < step * 100) lab *= (Math.round(lab / step) % 5 === 0 || Math.round(lab / step) === 2) ? 5 : 2;
    for (let p = Math.ceil(vlo / step) * step; p <= vhi; p += step) {
      const x = X(p), major = Math.round(p / step) % Math.round(lab / step) === 0;
      if (sup === 'empty') continue;
      if (sup === 'tens' && !(p % (10 * unit) === 0)) continue;
      sx.beginPath(); sx.moveTo(x, lineY - 5); sx.lineTo(x, lineY + (major ? 12 : 7)); sx.stroke();
      if (major && sup !== 'sparse') sx.fillText(fmtN(p, sc1), x, lineY + 27 * u);
    }
  }
  // --- meta (visible o escondida según la operación) ---
  if (showEnd) drawGoal(sx, X(R.end), lineY, clampN(H / 230, .6, 1.3), t);
  // --- arcos de salto ---
  function arc(a, b, i, label, dashed) {
    const x1 = X(a), x2 = X(b), h = ((i % 2 ? 54 : 34) + Math.min(24, Math.abs(x2 - x1) / 6)) * u, y = lineY - 8;
    sx.strokeStyle = JC[i % JC.length]; sx.lineWidth = 4; sx.setLineDash(dashed ? [6, 6] : []);
    sx.beginPath(); sx.moveTo(x1, y); sx.quadraticCurveTo((x1 + x2) / 2, y - h * 2, x2, y); sx.stroke(); sx.setLineDash([]);
    const mx = (x1 + x2) / 2, my = y - h; sx.font = '900 ' + Math.round(13 * u) + 'px system-ui'; const tw = sx.measureText(label).width + 12;
    sx.fillStyle = dashed ? '#fff' : '#000b'; sx.beginPath(); sx.roundRect ? sx.roundRect(mx - tw / 2, my - 11 * u, tw, 22 * u, 11 * u) : sx.rect(mx - tw / 2, my - 11 * u, tw, 22 * u); sx.fill();
    sx.fillStyle = dashed ? '#111' : JC[i % JC.length]; sx.textAlign = 'center'; sx.fillText(label, mx, my + 4.5 * u);
  }
  if (R.kind === 'falta') { let q = R.start; R.parts.forEach((v, i) => { const real = v * R.sign; arc(q, q + real, i, i === R.hidden && R.state !== 'done' ? '?' : fmtJ(real, R.sc), i === R.hidden && R.state !== 'done'); q += real; }); }
  else {
    let p0 = R.start; R.jumps.forEach((j, i) => { if (anim && !anim.undo && !anim.falta && i === R.jumps.length - 1) return; arc(p0, p0 + j, i, fmtJ(j, R.sc)); p0 += j; });
    if (anim && !anim.undo && !anim.falta) { const k = clampN((ms - anim.t0) / anim.dur, 0, 1); arc(anim.from, anim.from + (anim.to - anim.from) * k, R.jumps.length - 1, fmtJ(anim.to - anim.from, R.sc)); }
  }
  // --- números marcados (puntos visitados): clave en la línea vacía ---
  const lbl = (v, col) => { const x = X(v); sx.beginPath(); sx.arc(x, lineY, 5 * u, 0, 7); sx.fillStyle = pal.ink; sx.fill(); sx.font = '900 ' + Math.round(14 * u) + 'px system-ui'; sx.textAlign = 'center'; sx.fillStyle = col; sx.fillText(fmtN(v, sc1), x, lineY + (sup === 'beads' ? 34 : 46) * u); };
  lbl(R.start, pal.a);
  if (showEnd) lbl(R.end, pal.b);
  if (R.pos !== R.start && !anim) lbl(R.pos, pal.c);
  // --- sprite con respiración, estiramiento y aplastamiento ---
  const kk = clampN(H / 230, .55, 1.75), x = X(dispPos); SC.lastX = x;
  const breath = anim ? 0 : Math.sin(t * 2.2) * 1.2 * u, sy = 1 + sqY, sxs = 1 - sqY * .8;
  sx.save(); sx.translate(x, lineY); sx.scale(sxs, sy); sx.translate(-x, -lineY);
  drawSprite(sx, themeKey(), sk, x, lineY - hop - 2 + breath, kk * (themeKey() === 'futbol' ? 1 : 1.1), t, pose);
  sx.restore();
  // --- partículas y cartel ---
  for (const p of parts) { p.vy += (p.soft ? 120 : 700) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; sx.globalAlpha = p.soft ? Math.max(0, p.l / .6) : 1; sx.fillStyle = p.c; if (p.r) { sx.beginPath(); sx.arc(p.x, p.y, p.r, 0, 7); sx.fill(); } else sx.fillRect(p.x, p.y, 6, 9); }
  sx.globalAlpha = 1; parts = parts.filter(p => p.l > 0 && p.y < H + 20);
  if (banner) {
    const k = (ms - banner.t0) / 1600;
    if (k > 1) banner = null; else {
      const s = 1 + Math.sin(Math.min(1, k * 4) * Math.PI) * .25; sx.save(); sx.translate(W / 2, H * .3); sx.scale(s, s); sx.globalAlpha = k > .7 ? 1 - (k - .7) / .3 : 1;
      sx.font = '900 ' + Math.round(clampN(W / 9, 28, 64)) + 'px system-ui'; sx.textAlign = 'center'; sx.lineWidth = 8; sx.strokeStyle = '#000'; sx.strokeText(banner.text, 0, 0); sx.fillStyle = '#ffd23f'; sx.fillText(banner.text, 0, 0); sx.restore();
    }
  }
}
requestAnimationFrame(frame);
