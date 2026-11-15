const gameAudio = (() => {
  // Música procedural de estadio. Misma API que antes: unlock, setScene, toggle, play, enabled.
  const KEY = 'liga-mate:audio';
  let enabled = true, volume = .8;
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); if (s.on === false) enabled = false; if (typeof s.vol === 'number') volume = Math.min(1, Math.max(0, s.vol)); } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({on: enabled, vol: volume})); } catch {} };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const SCALES = {major: [0,2,4,5,7,9,11], minor: [0,2,3,5,7,8,10]};
  const PROGS = {
    major: [[0,4,5,3],[0,5,3,4],[3,4,2,5],[1,4,0,0]],
    minor: [[0,5,2,6],[0,3,5,4],[0,6,5,4],[0,2,5,6]]
  };
  const KEYS = [48, 50, 53];            // Do, Re, Fa (raíz grave)
  const SCENES = {                       // bpm por mundo, modo, densidad
    run:      {bpm: [116,110,122], mode: 'major', drums: 1},
    duel:     {bpm: [148,144,154], mode: 'minor', drums: 2},
    plan:     {bpm: [84,80,88],    mode: 'major', drums: 0},
    prologue: {bpm: [72,72,72],    mode: 'minor', drums: 0}
  };
  const RHYTHMS = ['x.xxx.x.', 'x-xxx-x.', 'xx.xx.xx', 'x.x-x.xx', 'xxx.xx-.', 'x--xx.x-'];

  let ctx, master, comp, musicBus, verb, pulse, noiseBuf, roarBuf, scene = null, world = 0, track = null, timer = null, keepAlive;

  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const degree = (key, mode, d) => key + SCALES[mode][((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = enabled ? volume : 0;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .2;
    master.connect(comp).connect(ctx.destination);
    // Reverb con impulso generado.
    verb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.7), imp = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = imp;
    const verbGain = ctx.createGain(); verbGain.gain.value = .5;
    verb.connect(verbGain).connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 1; musicBus.connect(master);
    const send = ctx.createGain(); send.gain.value = .22; musicBus.connect(send).connect(verb);
    // Pulso 25 %
    const re = new Float32Array(17), im = new Float32Array(17);
    for (let h = 1; h < 17; h++) { const p = 2 * Math.PI * h * .25; re[h] = 2 * Math.sin(p) / (Math.PI * h); im[h] = 2 * (1 - Math.cos(p)) / (Math.PI * h); }
    pulse = ctx.createPeriodicWave(re, im);
    noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .3), ctx.sampleRate);
    const n = noiseBuf.getChannelData(0); for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
    roarBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const r = roarBuf.getChannelData(0); for (let i = 0; i < r.length; i++) r[i] = Math.random() * 2 - 1;
    ctx.addEventListener('statechange', sync);
    return true;
  }

  // iOS: el interruptor de silencio apaga Web Audio; un <audio> en bucle fuerza el canal de reproducción.
  function iosKeepAlive() {
    if (keepAlive) return;
    try {
      const n = 8000, b = new DataView(new ArrayBuffer(44 + n)), w = (o, t) => [...t].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
      w(0, 'RIFF'); b.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
      b.setUint32(24, 8000, true); b.setUint32(28, 8000, true); b.setUint16(32, 1, true); b.setUint16(34, 8, true); w(36, 'data'); b.setUint32(40, n, true);
      for (let i = 0; i < n; i++) b.setUint8(44 + i, 128);
      keepAlive = new Audio(URL.createObjectURL(new Blob([b], {type: 'audio/wav'})));
      keepAlive.loop = true; keepAlive.volume = .01; keepAlive.setAttribute('playsinline', '');
      keepAlive.play().catch(() => { keepAlive = null; });
    } catch { keepAlive = null; }
  }

  function unlock() {
    try {
      if (!enabled) return;
      if (!ctx && !build()) return;
      iosKeepAlive();
      if (ctx.state !== 'running') ctx.resume().then(sync).catch(() => {});
      sync();
    } catch {}
  }

  function env(src, dest, t0, len, vol, att, rel, cleanup) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + att);
    g.gain.setValueAtTime(vol, Math.max(t0 + att, t0 + len));
    g.gain.exponentialRampToValueAtTime(.0001, t0 + len + rel);
    src.connect(g).connect(dest);
    src.onended = () => { try { src.disconnect(); g.disconnect(); cleanup && cleanup(); } catch {} };
    src.start(t0); src.stop(t0 + len + rel + .02);
  }
  function tone(dest, t0, len, vol, type, f, o = {}) {
    const osc = ctx.createOscillator();
    if (type === 'pulse') osc.setPeriodicWave(pulse); else osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + len);
    let out = dest, nodes = [];
    if (o.lp) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; lp.connect(dest); out = lp; nodes.push(lp); }
    if (o.vib) {
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = 5.6; depth.gain.setValueAtTime(0, t0); depth.gain.linearRampToValueAtTime(o.vib, t0 + Math.min(len, .25));
      lfo.connect(depth).connect(osc.detune); lfo.start(t0); lfo.stop(t0 + len + (o.rel ?? .06) + .02);
    }
    env(osc, out, t0, len, vol, o.att ?? .008, o.rel ?? .06, () => nodes.forEach(n => n.disconnect()));
  }
  function noise(dest, t0, len, vol, freq, type = 'highpass', q = 1) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = Math.min(freq, ctx.sampleRate * .4); f.Q.value = q; f.connect(dest);
    env(s, f, t0, len, vol, .003, .02, () => f.disconnect());
  }
  const kick = (d, t, v = .55) => { tone(d, t, .12, v, 'sine', 150, {to: 42, rel: .05}); noise(d, t, .015, v * .12, 2500); };
  const clap = (d, t, v = .3) => { for (let i = 0; i < 3; i++) noise(d, t + i * .011, .02, v * .6, 1500, 'bandpass', .8); noise(d, t + .033, .09, v * .5, 1300, 'bandpass', .7); };
  const hat = (d, t, v = .08) => noise(d, t, .03, v, 7500);

  // ---------- Música ----------
  function makeTrack() {
    const cfg = SCENES[scene], w = world % 3, mode = cfg.mode;
    const progs = PROGS[mode], seed = (w + 1) * 101 + scene.length * 17;
    return {scene, world, cfg, mode, key: KEYS[w], bpm: cfg.bpm[w % cfg.bpm.length], seed,
      progA: progs[(w * 2) % 4], progB: progs[(w * 2 + 1) % 4], step: 0, next: 0, mel: null, motif: []};
  }
  function motifFor(t, sec) {
    const r = rng(t.seed + sec * 31 + 7), rhythm = RHYTHMS[Math.floor(r() * RHYTHMS.length)];
    const contour = Array.from({length: 8}, () => [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)]);
    return {rhythm, contour};
  }
  function melodyBar(t, bar, loop) {
    const sec = bar < 4 ? 0 : 1, m = t.motif[sec] || (t.motif[sec] = motifFor(t, sec));
    const prog = sec ? t.progB : t.progA, root = prog[bar % 4], chord = [root % 7, (root + 2) % 7, (root + 4) % 7];
    let d = root + 7; while (d > 11) d -= 7;
    if (sec && loop % 2) d += 2;                        // 2.ª vuelta del estribillo, más arriba
    const out = []; let k = 0;
    for (let i = 0; i < 8; i++) {
      const c = m.rhythm[i];
      if (c === 'x') {
        d += m.contour[k++ % 8] * (bar % 4 === 3 && k > 3 ? 0 : 1);
        if (i % 4 === 0 || (bar % 4 === 3 && i === 6)) { // tiempos fuertes: nota del acorde
          let best = d, dist = 9;
          for (let c2 = -7; c2 <= 7; c2++) { const cand = d + c2; if (chord.includes(((cand % 7) + 7) % 7) && Math.abs(c2) < dist) { dist = Math.abs(c2); best = cand; } }
          d = best;
        }
        d = Math.min(15, Math.max(6, d));
        out.push(degree(t.key + 12, t.mode, d));
      } else out.push(c === '-' ? '-' : null);
    }
    return out;
  }
  function noteStep(t) {
    const cfg = t.cfg, sl = 30 / t.bpm, at = t.next, tick = t.step % 8, bar = Math.floor(t.step / 8) % 8, loop = Math.floor(t.step / 64), sec = bar < 4 ? 0 : 1;
    const prog = sec ? t.progB : t.progA, root = prog[bar % 4], bus = t.bus, k = t.key, mode = t.mode;
    const rootM = degree(k, mode, root), third = degree(k, mode, root + 2), fifth = degree(k, mode, root + 4);
    const dense = cfg.drums, calm = !dense;
    if (tick === 0) {
      t.mel = melodyBar(t, bar, loop);
      // Pad
      for (const m of [rootM + 12, third + 12, fifth + 12]) for (const dt of [-6, 6]) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = calm ? 1300 : 900;
        const g = ctx.createGain(), v = calm ? .018 : .012;
        g.gain.setValueAtTime(.0001, at); g.gain.linearRampToValueAtTime(v, at + sl * 3);
        g.gain.setValueAtTime(v, at + sl * 6); g.gain.exponentialRampToValueAtTime(.0001, at + sl * 8);
        o.connect(lp).connect(g).connect(bus);
        o.onended = () => { try { o.disconnect(); lp.disconnect(); g.disconnect(); } catch {} };
        o.start(at); o.stop(at + sl * 8 + .05);
      }
    }
    // Bajo con sub-octava
    const bassTick = {0: rootM, 3: rootM + 7, 4: rootM + 12, 6: rootM + 7}[tick];
    if (bassTick !== undefined && !(calm && tick % 4)) {
      tone(bus, at, sl * 1.4, .2, 'triangle', hz(bassTick - 12));
      tone(bus, at, sl * 1.4, .13, 'sine', hz(bassTick - 24));
    }
    // Percusión
    if (dense) {
      if (tick === 0 || tick === 4 || (dense === 2 && (tick === 3 || tick === 7) && bar % 2)) kick(bus, at, dense === 2 ? .6 : .5);
      if (tick === 2 || tick === 6) clap(bus, at, dense === 2 ? .3 : .24);
      if (sec && dense === 1 && (tick === 0 || tick === 1 || tick === 4 || tick === 5)) clap(bus, at, .13);   // palmas de grada
      hat(bus, at + sl * .5, .05); if (tick % 2) hat(bus, at, dense === 2 ? .09 : .06);
    } else if (tick === 0 || tick === 4) kick(bus, at, .22);
    // Arpegio (calma y contramelodía del duelo)
    if (calm || (dense === 2 && tick % 2)) {
      const ch = [rootM, third, fifth, third + 12][(tick >> 1) % 4];
      tone(bus, at, sl * .9, calm ? .07 : .045, 'triangle', hz(ch + 12), {rel: .12});
    }
    // Metales de estadio en el estribillo
    if (sec && dense === 1 && (tick === 3 || tick === 7)) for (const m of [rootM + 12, third + 12, fifth + 12]) tone(bus, at, sl * .7, .028, 'sawtooth', hz(m), {lp: 1800, att: .01});
    // Melodía con vibrato
    const n = t.mel[tick];
    if (typeof n === 'number') {
      let beats = 1; while (t.mel[tick + beats] === '-') beats++;
      const wave = dense === 2 ? 'sawtooth' : 'pulse', len = sl * (beats - .1);
      tone(bus, at, len, calm ? .09 : .075, wave, hz(n), {lp: dense === 2 ? 2600 : 4200, vib: beats > 1 ? 14 : 5, att: .012, rel: .09});
      if (sec) tone(bus, at, len, .035, 'triangle', hz(n + 12), {vib: 8});   // doble octava en estribillo
    }
    t.step++; t.next += sl;
  }
  function schedule() {
    if (!track || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (track.next < now) track.next = now + .03;
    while (track.next < now + .25) noteStep(track);
  }
  function stopMusic() {
    if (timer) { clearInterval(timer); timer = null; }
    if (!track) return;
    const b = track.bus, now = ctx.currentTime;
    b.gain.cancelScheduledValues(now); b.gain.setTargetAtTime(.0001, now, .05);
    setTimeout(() => { try { b.disconnect(); } catch {} }, 400);
    track = null;
  }
  function sync() {
    if (!enabled || !scene || !SCENES[scene] || document.hidden || !ctx || ctx.state !== 'running') { stopMusic(); return; }
    if (track && track.scene === scene && track.world === world) return;
    stopMusic();
    const t = makeTrack(), now = ctx.currentTime;
    t.bus = ctx.createGain(); t.bus.gain.value = .0001;
    t.bus.gain.setTargetAtTime(scene === 'duel' ? .55 : .5, now, .08);
    t.bus.connect(musicBus);
    t.next = now + .06; track = t;
    schedule(); timer = setInterval(schedule, 40);
  }
  function setScene(next, w = 0) { scene = next; world = w; sync(); }
  function toggle() {
    enabled = !enabled; save();
    if (enabled) unlock();
    if (master) { const n = ctx.currentTime; master.gain.cancelScheduledValues(n); master.gain.setTargetAtTime(enabled ? volume : 0, n, .02); }
    sync();
  }
  function setVolume(v) {
    volume = Math.min(1, Math.max(0, v)); save();
    if (master && enabled) master.gain.setTargetAtTime(volume, ctx.currentTime, .02);
  }

  // ---------- Efectos ----------
  function play(effect, impactDelay = .28) {
    if (!enabled || document.hidden || !ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + .006, d = master;
    const brass = (notes, sp, len, vol = .12) => notes.forEach((m, i) => tone(d, t + i * sp, len, vol, 'sawtooth', hz(m), {lp: 2400, att: .015, rel: .1, vib: 6}));
    const roar = (start, len, vol) => {       // ovación de la grada
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = roarBuf; s.loop = true; f.type = 'bandpass'; f.Q.value = .6;
      f.frequency.setValueAtTime(600, t + start); f.frequency.linearRampToValueAtTime(1500, t + start + len * .5); f.frequency.linearRampToValueAtTime(900, t + start + len);
      g.gain.setValueAtTime(.0001, t + start); g.gain.linearRampToValueAtTime(vol, t + start + len * .25); g.gain.exponentialRampToValueAtTime(.0001, t + start + len);
      s.connect(f).connect(g).connect(d); s.onended = () => { try { s.disconnect(); g.disconnect(); } catch {} };
      s.start(t + start); s.stop(t + start + len + .05);
    };
    const whistle = (start, len, vol = .16) => {
      const o = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain();
      o.frequency.value = 2900; l.frequency.value = 32; lg.gain.value = 150; l.connect(lg).connect(o.frequency);
      env(o, d, t + start, len, vol, .01, .03); l.start(t + start); l.stop(t + start + len + .1);
      noise(d, t + start, len, vol * .35, 3200, 'bandpass', 2);
    };
    switch (effect) {
      case 'switch': tone(d, t, .07, .1, 'pulse', hz(76)); tone(d, t + .06, .09, .1, 'pulse', hz(83)); break;
      case 'ready': brass([62, 66, 69, 74], .07, .12, .1); break;
      case 'roundIntro': whistle(0, .22); break;
      case 'challenge': brass([57, 62, 66, 69], .09, .14, .1); break;
      case 'portal': tone(d, t, .9, .12, 'sawtooth', 130, {to: 1300, lp: 2200, rel: .2}); noise(d, t, .9, .06, 2000, 'bandpass'); break;
      case 'jump': tone(d, t, .14, .12, 'pulse', 260, {to: 640}); break;
      case 'land': noise(d, t, .06, .12, 500, 'lowpass'); break;
      case 'hook': kick(d, t, .45); noise(d, t + .02, .12, .08, 1800); tone(d, t + .1, .1, .1, 'triangle', 700, {to: 1100}); break;
      case 'release': tone(d, t, .1, .09, 'triangle', 380, {to: 760}); break;
      case 'fall': whistle(0, .4, .1); tone(d, t, .4, .12, 'triangle', 500, {to: 100}); break;
      case 'hit':            // ¡Gol!
        noise(d, t + Math.max(0, impactDelay - .17), .16, .08, 2600);
        kick(d, t + impactDelay, .7); noise(d, t + impactDelay, .1, .2, 1200, 'bandpass');
        roar(impactDelay + .02, 1.5, .3);
        brass([67, 71, 74, 79], .1, .22, .12 /* acorde de fanfarria */); break;
      case 'miss':           // silbato corto
        noise(d, t + Math.max(0, impactDelay - .1), .12, .06, 900, 'bandpass');
        whistle(impactDelay, .28, .17); tone(d, t + impactDelay, .22, .12, 'sawtooth', 220, {to: 80, lp: 700}); break;
      case 'roundWin': brass([67, 71, 74], .09, .16, .12); roar(.05, .9, .2); break;
      case 'roundLoss': [57, 55, 53, 50].forEach((m, i) => tone(d, t + i * .16, .22, .1, 'sawtooth', hz(m), {lp: 800, vib: 14, rel: .12})); break;
      case 'finish':
        kick(d, t + .15, .7); noise(d, t + .15, .2, .14, 2700);
        for (let i = 0; i < 4; i++) { kick(d, t + .8 + i * .2, .5); noise(d, t + .8 + i * .2, .1, .14, 1300 + i * 300, 'bandpass'); }
        roar(1.4, 2.4, .36); brass([67, 71, 74, 79, 83], .12, .3, .13); break;
      case 'victory':
        brass([62, 66, 69, 74, 69, 74, 78, 81], .13, .24, .14); roar(.2, 2.6, .32);
        [0, .26, .52].forEach(x => { kick(d, t + x, .4); clap(d, t + x + .13, .18); }); break;
    }
  }

  const go = () => unlock();
  document.addEventListener('pointerdown', () => { if (enabled && (!ctx || ctx.state !== 'running')) go(); }, true);
  document.addEventListener('touchend', () => { if (enabled && (!ctx || ctx.state !== 'running')) go(); }, true);
  document.addEventListener('click', () => { if (enabled && (!ctx || ctx.state !== 'running')) go(); }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); if (keepAlive) keepAlive.pause(); stopMusic(); }
    else if (enabled) { if (keepAlive) keepAlive.play().catch(() => {}); unlock(); }
  });
  window.addEventListener('pageshow', () => { if (enabled && ctx) unlock(); });
  return {get enabled() { return enabled; }, get volume() { return volume; }, unlock, setScene, toggle, setVolume, play};
})();
