(() => {
  // PWA mínima en un solo HTML: icono táctil, manifest en Blob, service worker opcional, volumen.
  const cfg = window.PWA_CFG;
  const icon = size => {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'), s = size / 100;
    const bg = x.createLinearGradient(0, 0, 0, size); bg.addColorStop(0, cfg.bg1); bg.addColorStop(1, cfg.bg2);
    x.fillStyle = bg; x.fillRect(0, 0, size, size);
    x.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 6; i += 2) x.fillRect(0, (i + 2) * size / 8, size, size / 8);
    x.save(); x.translate(50 * s, 52 * s);
    x.beginPath(); x.arc(0, 0, 33 * s, 0, 7); x.fillStyle = cfg.ball; x.fill(); x.lineWidth = 3 * s; x.strokeStyle = cfg.line; x.stroke();
    x.fillStyle = cfg.line; x.beginPath();
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; x.lineTo(Math.cos(a) * 14 * s, Math.sin(a) * 14 * s); }
    x.fill();
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; x.beginPath(); x.arc(Math.cos(a) * 29 * s, Math.sin(a) * 29 * s, 6 * s, 0, 7); x.fill(); x.beginPath(); x.moveTo(Math.cos(a) * 14 * s, Math.sin(a) * 14 * s); x.lineTo(Math.cos(a) * 24 * s, Math.sin(a) * 24 * s); x.stroke(); }
    x.restore();
    x.fillStyle = cfg.badge; x.font = '900 ' + 17 * s + 'px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(cfg.label, 50 * s, 95 * s);
    return c.toDataURL('image/png');
  };
  try {
    const i180 = icon(180), i512 = icon(512);
    const link = (rel, href, extra = {}) => { const l = document.createElement('link'); l.rel = rel; l.href = href; Object.assign(l, extra); document.head.append(l); };
    document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"]').forEach(l => l.remove());
    link('apple-touch-icon', i180); link('icon', i180);
    const manifest = {name: cfg.name, short_name: cfg.short, start_url: location.href.split('#')[0], display: 'standalone',
      orientation: 'any', background_color: cfg.bg2, theme_color: cfg.bg2, lang: 'es',
      icons: [{src: i180, sizes: '180x180', type: 'image/png'}, {src: i512, sizes: '512x512', type: 'image/png', purpose: 'any'}]};
    link('manifest', URL.createObjectURL(new Blob([JSON.stringify(manifest)], {type: 'application/manifest+json'})));
  } catch {}
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  // Volumen
  const vol = document.getElementById('vol');
  if (vol) { vol.value = Math.round(gameAudio.volume * 100); vol.addEventListener('input', () => gameAudio.setVolume(vol.value / 100)); }
  // Iconos de pantalla completa: en la app instalada ya ocupa toda la pantalla
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const fs = document.getElementById('fullscreen'); if (fs && standalone) fs.hidden = true;
  // Sin zoom por pellizco / doble toque en iOS
  for (const ev of ['gesturestart', 'gesturechange']) document.addEventListener(ev, e => e.preventDefault());
})();
