// Pixel Arcade core: canvas, drawing helpers, input, audio, storage, menu and
// the ready / game-over screens shared by every game.
var A = window.A = {};
(function () {
  'use strict';
  var H = 200;
  A.H = H; A.W = 356;
  var C = A.C = { BG: '#f7f7f7', FG: '#535353', GR: '#3fa86e', AM: '#e0a030', RD: '#e05a3c', LT: '#d4d4d4', DK: '#383838' };
  var PAL = { '#': C.FG, 'w': C.GR, 'g': C.GR, 'o': C.BG, 'a': C.AM, 'r': C.RD, 'l': C.LT, 'e': '#e6dcc0', 'k': C.DK };

  var canvas = document.getElementById('c');
  var ctx = A.ctx = canvas.getContext('2d');
  var scale = 1, dpr = 1, offY = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    scale = canvas.height / H;
    A.W = canvas.width / scale;
    if (A.W < 356) { scale = canvas.width / 356; A.W = 356; }
    offY = (canvas.height / scale - H) / 2;
    if (cur && cur.resize) cur.resize();
  }
  window.addEventListener('resize', resize);

  // ---------- drawing helpers ----------
  A.R = function (x, y, w, h, col) { ctx.fillStyle = col || C.FG; ctx.fillRect(x, y, w, h); };
  A.S = function (rows, x, y, p, opt) {
    opt = opt || {};
    var pal = opt.pal || PAL, n = rows.length;
    for (var i = 0; i < n; i++) {
      var row = rows[i];
      for (var j = 0; j < row.length; j++) {
        var ch = row.charAt(j);
        if (ch === '.') continue;
        var col = (opt.mono && ch !== 'o') ? opt.mono : (pal[ch] || C.FG);
        if (ch === 'o' && opt.eye) col = opt.eye;
        var yy = opt.flipY ? y + (n - 1 - i) * p : y + i * p;
        var xx = opt.flipX ? x + (row.length - 1 - j) * p : x + j * p;
        ctx.fillStyle = col;
        ctx.fillRect(xx, yy, p + 0.06, p + 0.06);
      }
    }
  };
  A.T = function (s, x, y, size, align, col, base) {
    ctx.fillStyle = col || C.FG;
    ctx.font = 'bold ' + (size || 10) + 'px "Courier New", monospace';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = base || 'top';
    ctx.fillText(s, x, y);
  };
  A.pad = function (n, len) { var s = String(Math.max(0, Math.floor(n))); while (s.length < (len || 5)) s = '0' + s; return s; };
  A.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  A.rand = function (a, b) { return a + Math.random() * (b - a); };
  A.hit = function (a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; };
  A.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  // ---------- storage ----------
  A.load = function (k, d) { try { var v = localStorage.getItem('pa_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  A.save = function (k, v) { try { localStorage.setItem('pa_' + k, JSON.stringify(v)); } catch (e) {} };

  // ---------- audio ----------
  var audio = null, muted = A.load('muted', false);
  function ensureAudio() {
    if (audio) { if (audio.state === 'suspended') audio.resume(); return; }
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
  }
  A.beep = function (freq, dur, type, vol, slideTo, delay) {
    if (!audio || muted) return;
    var t = audio.currentTime + (delay || 0);
    var o = audio.createOscillator(), g = audio.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(audio.destination);
    o.start(t); o.stop(t + dur + 0.02);
  };
  A.sfx = {
    jump: function () { A.beep(520, 0.12, 'square', 0.05, 900); },
    point: function () { A.beep(880, 0.08, 'square', 0.04); A.beep(1320, 0.12, 'square', 0.04, null, 0.09); },
    blip: function () { A.beep(660, 0.05, 'square', 0.035); },
    tick: function () { A.beep(1200, 0.03, 'square', 0.03); },
    hit: function () { A.beep(180, 0.12, 'sawtooth', 0.06, 90); },
    shoot: function () { A.beep(1400, 0.07, 'square', 0.025, 500); },
    coin: function () { A.beep(990, 0.06, 'square', 0.04); A.beep(1480, 0.1, 'square', 0.04, null, 0.06); },
    die: function () { A.beep(300, 0.35, 'sawtooth', 0.07, 60); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { A.beep(f, 0.14, 'square', 0.045, null, i * 0.11); }); }
  };
  A.vibe = function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  // ---------- games & state ----------
  var games = A.games = [];
  A.reg = function (g) { games.push(g); };
  var cur = null;            // current game, null = menu
  var st = 'menu';           // menu | ready | play | over
  var paused = false, overAt = 0, overMsg = '', overWon = false, newBest = false;
  A.isPlaying = function () { return st === 'play' && !paused; };

  function hiKey(g) { return 'hi_' + g.id; }
  function getHi(g) { return A.load(hiKey(g), 0); }
  A.over = function (msg, won) {
    if (st !== 'play') return;
    st = 'over'; overAt = performance.now(); overMsg = msg || 'GAME OVER'; overWon = !!won;
    var s = Math.floor(cur.score || 0), hi = getHi(cur);
    newBest = false;
    if (cur.lowerBetter) {
      if (won && (hi === 0 || s < hi)) { A.save(hiKey(cur), s); newBest = true; }
    } else if (s > hi && !cur.noHi) { A.save(hiKey(cur), s); newBest = hi > 0; }
    if (won) A.sfx.win(); else { A.sfx.die(); A.vibe(120); }
  };

  function openGame(g) {
    cur = g;
    if (g.init && !g._inited) { g.init(); g._inited = true; }
    g.reset();
    st = 'ready'; paused = false;
  }
  function startPlay() { st = 'play'; if (cur.start) cur.start(); }
  A.back = function () {
    if (!cur) return false;
    if (cur.leave) cur.leave();
    cur = null; st = 'menu';
    return true;
  };
  A.pause = function () { if (st === 'play') paused = true; };

  // ---------- menu layout ----------
  var tiles = [];
  function layoutMenu() {
    tiles = [];
    var W = A.W, cols = 5, rows = Math.ceil(games.length / cols), gap = 6, top = 30;
    var wFromW = (W - 20 - (cols - 1) * gap) / cols;
    var wFromH = ((H - top - 6 - (rows - 1) * gap) / rows - 12) / (140 / 240);
    var tw = Math.min(wFromW, wFromH), th = tw * 140 / 240 + 12;
    var gx = (W - (cols * tw + (cols - 1) * gap)) / 2;
    for (var i = 0; i < games.length; i++) {
      var c = i % cols, r = Math.floor(i / cols);
      tiles.push({ g: games[i], x: gx + c * (tw + gap), y: top + r * (th + gap), w: tw, h: th, ph: tw * 140 / 240 });
    }
  }

  function drawMenu() {
    var W = A.W;
    layoutMenu();
    A.T('PIXEL ARCADE', W / 2, 8, 14, 'center');
    drawSpeaker(W - 26, 8);
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      ctx.save();
      ctx.beginPath(); ctx.rect(t.x, t.y, t.w, t.ph); ctx.clip();
      ctx.translate(t.x, t.y); ctx.scale(t.w / 240, t.ph / 140);
      A.R(0, 0, 240, 140, '#ffffff');
      try { t.g.preview(); } catch (e) {}
      ctx.restore();
      ctx.strokeStyle = C.FG; ctx.lineWidth = 0.8;
      ctx.strokeRect(t.x + 0.4, t.y + 0.4, t.w - 0.8, t.h - 0.8);
      A.R(t.x, t.y + t.ph, t.w, 0.8);
      A.T(t.g.name, t.x + 3, t.y + t.ph + 2.5, 6.2, 'left');
      var hi = getHi(t.g);
      if (hi) A.T((t.g.lowerBetter ? 'BEST ' : 'HI ') + hi, t.x + t.w - 3, t.y + t.ph + 2.5, 5.5, 'right', C.GR);
    }
  }

  // ---------- HUD and overlays ----------
  function drawBack(x, y, col) {
    ctx.strokeStyle = col || C.FG; ctx.lineWidth = 2.4; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(x + 10, y + 1); ctx.lineTo(x + 3, y + 8); ctx.lineTo(x + 10, y + 15); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function drawSpeaker(x, y, col) {
    col = col || C.FG;
    ctx.globalAlpha = 0.6;
    A.R(x, y + 4, 4, 6, col);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + 10, y); ctx.lineTo(x + 10, y + 14); ctx.lineTo(x + 4, y + 10); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (muted) { ctx.moveTo(x + 13, y + 3); ctx.lineTo(x + 20, y + 11); ctx.moveTo(x + 20, y + 3); ctx.lineTo(x + 13, y + 11); }
    else { ctx.arc(x + 11, y + 7, 5, -0.9, 0.9); ctx.moveTo(x + 11 + 9 * Math.cos(-0.9), y + 7 + 9 * Math.sin(-0.9)); ctx.arc(x + 11, y + 7, 9, -0.9, 0.9); }
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  function panel(y, h) {
    ctx.globalAlpha = 0.88; A.R(A.W / 2 - 120, y, 240, h, C.BG); ctx.globalAlpha = 1;
    ctx.strokeStyle = C.FG; ctx.lineWidth = 1; ctx.strokeRect(A.W / 2 - 120 + 0.5, y + 0.5, 239, h - 1);
  }
  function wrapLines(text, max) {
    var out = [];
    text.split('\n').forEach(function (para) {
      var words = para.split(' '), line = '';
      words.forEach(function (w) {
        if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w; } else line += ' ' + w;
      });
      out.push(line.trim());
    });
    return out;
  }
  function drawHud() {
    var W = A.W;
    var col = cur.fg ? cur.fg() : C.FG;
    drawBack(6, 6, col);
    drawSpeaker(26, 7, col);
    if (cur.noHud) return;
    var hi = getHi(cur);
    var txt = cur.hudText ? cur.hudText() : A.pad(cur.score || 0);
    A.T(txt, W - 10, 8, 12, 'right', col);
    if (hi && !cur.hudText) {
      ctx.globalAlpha = 0.55;
      A.T((cur.lowerBetter ? 'BEST ' : 'HI ') + A.pad(hi), W - 10 - ctx.measureText(txt).width - 10, 8, 12, 'right', col);
      ctx.globalAlpha = 1;
    }
  }
  function drawRestart(cx, cy) {
    ctx.strokeStyle = C.FG; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 10, -Math.PI * 0.35, Math.PI * 1.45); ctx.stroke();
    var ax = cx + 10 * Math.cos(-Math.PI * 0.35), ay = cy + 10 * Math.sin(-Math.PI * 0.35);
    ctx.fillStyle = C.FG; ctx.beginPath(); ctx.moveTo(ax + 5, ay - 6); ctx.lineTo(ax + 5, ay + 4); ctx.lineTo(ax - 5, ay - 2); ctx.closePath(); ctx.fill();
  }
  function drawOverlay() {
    var W = A.W, now = performance.now();
    if (st === 'ready') {
      var lines = wrapLines(cur.help || '', 40);
      var h = 56 + lines.length * 11;
      var y0 = 100 - h / 2;
      panel(y0, h);
      A.T(cur.name.toUpperCase(), W / 2, y0 + 10, 15, 'center');
      for (var i = 0; i < lines.length; i++) A.T(lines[i], W / 2, y0 + 30 + i * 11, 8, 'center', C.FG);
      if (Math.floor(now / 500) % 2 === 0) A.T('TAP TO START', W / 2, y0 + h - 16, 10, 'center', C.GR);
    } else if (st === 'over') {
      panel(48, 104);
      A.T(overMsg, W / 2, 58, 15, 'center', overWon ? C.GR : C.FG);
      var label = cur.overText ? cur.overText() : 'SCORE ' + Math.floor(cur.score || 0);
      A.T(label, W / 2, 80, 10, 'center');
      if (newBest) A.T('NEW BEST!', W / 2, 93, 9, 'center', C.AM);
      drawRestart(W / 2, 118);
      if (now - overAt > 600) A.T('TAP TO PLAY AGAIN', W / 2, 136, 8, 'center');
    } else if (paused) {
      panel(76, 48);
      A.T('PAUSED', W / 2, 86, 14, 'center');
      A.T('TAP TO RESUME', W / 2, 106, 8, 'center');
    }
  }

  // ---------- input ----------
  function toWorld(cx, cy) { return { x: cx * dpr / scale, y: cy * dpr / scale - offY }; }
  function toggleMute() { muted = !muted; A.save('muted', muted); }

  // returns true if the press was consumed by the engine
  function enginePress(x, y) {
    ensureAudio();
    if (st === 'menu') {
      if (x > A.W - 34 && y < 28) { toggleMute(); return true; }
      for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i];
        if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) { A.sfx.blip(); openGame(t.g); return true; }
      }
      return true;
    }
    if (y < 26 && x < 24) { A.back(); return true; }
    if (y < 26 && x >= 24 && x < 50) { toggleMute(); return true; }
    if (st === 'ready') { startPlay(); if (cur.startTap) { cur.down(x, y, 'start'); return 'start'; } return true; }
    if (st === 'over') {
      if (performance.now() - overAt > 600) { cur.reset(); st = 'play'; if (cur.start) cur.start(); }
      return true;
    }
    if (paused) { paused = false; return true; }
    return false;
  }

  var touches = {};
  function pDown(id, cx, cy) {
    var p = toWorld(cx, cy);
    var consumed = enginePress(p.x, p.y);
    touches[id] = { sx: p.x, sy: p.y, bx: p.x, by: p.y, x: p.x, y: p.y, swiped: false, game: !consumed || consumed === 'start', t: performance.now() };
    if (!consumed && cur && cur.down) cur.down(p.x, p.y, id);
  }
  function pMove(id, cx, cy) {
    var tc = touches[id]; if (!tc) return;
    var p = toWorld(cx, cy); tc.x = p.x; tc.y = p.y;
    if (!tc.game || !cur || st !== 'play' || paused) return;
    if (cur.move) cur.move(p.x, p.y, id);
    var dx = p.x - tc.bx, dy = p.y - tc.by;
    if ((!tc.swiped || cur.multiSwipe) && Math.sqrt(dx * dx + dy * dy) > 14) {
      tc.swiped = true; tc.bx = p.x; tc.by = p.y;
      var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (cur.swipe) cur.swipe(dir, id);
    }
  }
  function pUp(id, cx, cy) {
    var tc = touches[id]; delete touches[id];
    if (!tc || !tc.game || !cur) return;
    var p = cx === undefined ? { x: tc.x, y: tc.y } : toWorld(cx, cy);
    if (cur.up) cur.up(p.x, p.y, id, tc.swiped, tc);
  }
  A.touches = touches;

  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; pDown(t.identifier, t.clientX, t.clientY); }
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; pMove(t.identifier, t.clientX, t.clientY); }
  }, { passive: false });
  function tEnd(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; pUp(t.identifier, t.clientX, t.clientY); }
  }
  canvas.addEventListener('touchend', tEnd, { passive: false });
  canvas.addEventListener('touchcancel', tEnd, { passive: false });

  var mouseDown = false;
  canvas.addEventListener('mousedown', function (e) {
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    mouseDown = true; pDown('m', e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', function (e) { if (mouseDown) pMove('m', e.clientX, e.clientY); });
  window.addEventListener('mouseup', function (e) { if (mouseDown) { mouseDown = false; pUp('m', e.clientX, e.clientY); } });

  var KEYDIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'Backspace') { A.back(); return; }
    if (!cur) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      var r = enginePress(A.W * 0.3, 120);
      if (!r || r === 'start') touches.k = { sx: A.W * 0.3, sy: 120, x: A.W * 0.3, y: 120, game: true };
      if (!r && cur.down) cur.down(A.W * 0.3, 120, 'k');
      return;
    }
    if (st === 'play' && !paused) {
      if (cur.key) cur.key(e.code, true);
      if (KEYDIR[e.code] && cur.swipe) { e.preventDefault(); cur.swipe(KEYDIR[e.code], 'key'); }
    }
  });
  window.addEventListener('keyup', function (e) {
    if (!cur) return;
    if (e.code === 'Space' || e.code === 'Enter') { if (touches.k) { var tk = touches.k; delete touches.k; if (cur.up) cur.up(A.W * 0.3, 120, 'k', false, tk); } return; }
    if (cur.key) cur.key(e.code, false);
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden) A.pause(); });

  // ---------- loop ----------
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    try {
      if (cur && st === 'play' && !paused) cur.update(dt);
      if (cur && cur.idle && st !== 'play') cur.idle(dt);
    } catch (e) { console.error(e); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var bg = (cur && cur.bg) ? cur.bg() : C.BG;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.body.style.background = bg;
    ctx.setTransform(scale, 0, 0, scale, 0, offY * scale);
    try {
      if (!cur) drawMenu();
      else { cur.draw(); drawHud(); drawOverlay(); }
    } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }
  A.boot = function () { resize(); requestAnimationFrame(frame); };

  // test hooks
  A._dbg = { open: openGame, get st() { return st; }, get cur() { return cur; } };
})();
