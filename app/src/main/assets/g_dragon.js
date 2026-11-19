// Dragon Run, Dragon Run 2 (coins + fireballs) and Two-player race.
(function () {
  'use strict';
  var C = A.C, PX = 2, GROUND = 168;

  var BODY = [
    '................#..#....',
    '...............######...',
    '..............##o######.',
    '..............#########.',
    '..............########..',
    '..............####......',
    '..............#######...',
    '.....ww......#####......',
    '....wwww....######......',
    '...wwwwww..########.....',
    '..wwwwwww##########.....',
    '#..wwww############.....',
    '##..ww############.#....',
    '.##..############..#....',
    '..##############........',
    '...###########..........'
  ];
  var LEGS_STAND = ['....###..###............', '....##....##............', '....#.....#.............', '....##....##............'];
  var LEGS_A = ['....###..###............', '....##....##............', '....##....#.............', '..........##............'];
  var LEGS_B = ['....###..###............', '....##....##............', '....#.....##............', '....##..................'];
  var DUCK_BODY = [
    '.........................#..#.',
    '......ww................######',
    '.....wwww..............##o#####',
    '#...wwwwww#####################',
    '##.wwwwwww###################..',
    '.##.wwww#####################..',
    '..###########################..',
    '...##################....####..'
  ];
  var DUCK_A = ['....###..###..', '....##....#...', '..........##..'];
  var DUCK_B = ['....###..###..', '....#.....##..', '....##........'];
  var RUN_A = BODY.concat(LEGS_A), RUN_B = BODY.concat(LEGS_B), STAND = BODY.concat(LEGS_STAND);
  var DK_A = DUCK_BODY.concat(DUCK_A), DK_B = DUCK_BODY.concat(DUCK_B);
  var BIRD_UP = ['......#...........', '......##..........', '......###.........', '...#..####........', '..##..#####.......', '.###############..', '#################.', '......##########..'];
  var BIRD_DOWN = ['..................', '..................', '..................', '...#..............', '..##..............', '.###############..', '#################.', '......##########..', '......#####.......', '......###.........', '......##..........', '......#...........'];
  // Small dragon used by other games and previews
  var MINI = ['........#..#', '.......######', '......##o####', '......#######', '......####...', '......######.', '..ww.#####...', '.wwww######..', '#.ww#######..', '.##########..', '..########...', '...##..##....', '...#....#....', '...##...##...'];
  var MINI_FLY = ['........#..#', '.......######', '......##o####', '......#######', 'ww....####...', 'www...######.', '.wwww#####...', '..wwww#####..', '#..ww######..', '.##########..', '..########...', '...##..##....'];
  A.SPR = { MINI: MINI, MINI_FLY: MINI_FLY, BIRD: BIRD_UP, STAND: STAND };

  function mix(a, b, t) {
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }
  var DAY_BG = [247, 247, 247], NIGHT_BG = [24, 26, 38], DAY_FG = [83, 83, 83], NIGHT_FG = [222, 222, 222];
  var DAY_W = [63, 168, 110], NIGHT_W = [120, 220, 160];

  // ---------- one running lane ----------
  function Lane(opt) { this.opt = opt || {}; this.w = 400; }
  Lane.prototype.reset = function (seed) {
    this.rnd = A.rng(seed === undefined ? (Math.random() * 1e9) | 0 : seed);
    this.d = { x: 30, y: GROUND - 40, vy: 0, on: true, duck: false, anim: 0 };
    this.obs = []; this.coins = []; this.balls = []; this.parts = [];
    this.speed = 380; this.dist = 0; this.bonus = 0; this.next = 500; this.t = 0;
    this.flash = 0; this.mile = 100; this.night = false; this.nightT = 0; this.nightAt = 700;
    this.dead = false; this.cool = 0; this.gOff = 0;
    var r = this.rnd;
    this.clouds = []; for (var i = 0; i < 4; i++) this.clouds.push({ x: r() * 800, y: 25 + r() * 60 });
    this.bumps = []; for (var b = 0; b < 50; b++) this.bumps.push({ x: r() * 1600, y: GROUND + 4 + r() * 22, w: 2 + r() * 6 });
    this.stars = []; for (var s = 0; s < 16; s++) this.stars.push({ x: r() * 1600, y: 10 + r() * 90, tw: r() * 6 });
  };
  Object.defineProperty(Lane.prototype, 'score', { get: function () { return this.dist + this.bonus; } });
  Lane.prototype.jump = function () {
    var d = this.d;
    if (this.dead || !d.on) return;
    d.vy = -770; d.on = false; d.duck = false; A.sfx.jump();
  };
  Lane.prototype.release = function () { var d = this.d; if (!d.on && d.vy < -420) d.vy = -420; };
  Lane.prototype.setDuck = function (on) { var d = this.d; d.duck = on; if (on && !d.on && d.vy < 600) d.vy = 600; };
  Lane.prototype.fire = function () {
    if (this.dead || this.cool > 0) return;
    this.cool = 0.9;
    var d = this.d, ducking = d.duck && d.on;
    this.balls.push({ x: d.x + (ducking ? 60 : 46), y: ducking ? GROUND - 18 : d.y + 10, t: 0 });
    A.beep(300, 0.18, 'sawtooth', 0.05, 120);
  };
  Lane.prototype.boxes = function () {
    var d = this.d, x = d.x, y = d.y;
    if (d.duck && d.on) return [{ x: x + 6, y: GROUND - 16, w: 50, h: 12 }, { x: x + 46, y: GROUND - 21, w: 14, h: 8 }];
    return [{ x: x + 28, y: y + 2, w: 18, h: 12 }, { x: x + 10, y: y + 14, w: 28, h: 16 }, { x: x + 8, y: y + 30, w: 18, h: 9 }];
  };
  function obBoxes(o) {
    if (o.type === 'bird') return [{ x: o.x + 2, y: o.y + 10, w: o.w - 4, h: 6 }, { x: o.x + 12, y: o.y + 2, w: 10, h: 14 }];
    var b = [];
    for (var i = 0; i < o.parts.length; i++) {
      var p = o.parts[i];
      b.push({ x: o.x + p.dx + 3, y: GROUND - p.h + 2, w: o.cw - 6, h: p.h - 2 });
      b.push({ x: o.x + p.dx, y: GROUND - p.h * 0.7, w: o.cw, h: p.h * 0.35 });
    }
    return b;
  }
  Lane.prototype.spawn = function () {
    var r = this.rnd, o;
    if (this.score > 300 && r() < 0.25) {
      var hs = [GROUND - 30, GROUND - 52, GROUND - 76];
      o = { type: 'bird', x: this.w + 20, y: hs[Math.floor(r() * 3)], w: 36, h: 18, flap: 0, extra: 60 };
    } else {
      var big = r() < 0.45, maxN = this.speed > 600 ? 3 : this.speed > 460 ? 2 : 1;
      var n = 1 + Math.floor(r() * maxN), cw = big ? 18 : 12, ch = big ? 46 : 32, parts = [];
      for (var i = 0; i < n; i++) parts.push({ dx: i * (cw + 3), h: ch - (i % 2) * (big ? 6 : 4) });
      o = { type: 'cactus', x: this.w + 20, y: GROUND - ch, w: n * (cw + 3) - 3, h: ch, cw: cw, parts: parts, extra: 0 };
    }
    this.obs.push(o);
    var gap = this.speed * 0.62 + o.w + o.extra + r() * this.speed * 0.9;
    if (this.opt.coins && r() < 0.55) {
      var cy = GROUND - 24 - r() * 70, cx = o.x + o.w + gap * 0.45;
      for (var k = 0; k < 3; k++) this.coins.push({ x: cx + k * 16, y: cy - (k === 1 ? 8 : 0) });
    }
    this.next = gap;
  };
  Lane.prototype.burst = function (x, y, col) {
    for (var i = 0; i < 10; i++) this.parts.push({ x: x, y: y, vx: A.rand(-120, 120), vy: A.rand(-200, 20), t: 0.5, c: col });
  };
  Lane.prototype.update = function (dt) {
    if (this.dead) return;
    var d = this.d;
    this.t += dt;
    this.speed = Math.min(860, this.speed + 9 * dt);
    this.dist += this.speed * dt / 40;
    if (this.cool > 0) this.cool -= dt;
    if (this.score >= this.mile) { this.mile += 100; this.flash = this.t + 0.9; A.sfx.point(); }
    if (this.opt.night && this.score >= this.nightAt) { this.night = !this.night; this.nightAt += 700; }
    if (!d.on) {
      d.vy += 2600 * dt; d.y += d.vy * dt;
      if (d.y >= GROUND - 40) { d.y = GROUND - 40; d.vy = 0; d.on = true; }
    }
    d.anim += dt * this.speed / 40;
    this.next -= this.speed * dt;
    if (this.next <= 0) this.spawn();
    var i, o;
    for (i = this.obs.length - 1; i >= 0; i--) {
      o = this.obs[i];
      o.x -= (this.speed + (o.type === 'bird' ? 40 : 0)) * dt;
      if (o.type === 'bird') o.flap += dt;
      if (o.x + o.w < -20) this.obs.splice(i, 1);
    }
    var db = this.boxes();
    for (i = this.coins.length - 1; i >= 0; i--) {
      var c = this.coins[i];
      c.x -= this.speed * dt;
      var cb = { x: c.x, y: c.y, w: 9, h: 9 };
      var got = false;
      for (var a = 0; a < db.length; a++) if (A.hit(db[a], cb)) got = true;
      if (got) { this.bonus += 10; A.sfx.coin(); this.burst(c.x + 4, c.y + 4, C.AM); this.coins.splice(i, 1); }
      else if (c.x < -20) this.coins.splice(i, 1);
    }
    for (i = this.balls.length - 1; i >= 0; i--) {
      var bl = this.balls[i];
      bl.x += (this.speed + 320) * dt; bl.t += dt;
      var bb = { x: bl.x, y: bl.y - 4, w: 12, h: 8 }, burned = false;
      for (var j = this.obs.length - 1; j >= 0 && !burned; j--) {
        var obx = obBoxes(this.obs[j]);
        for (var q = 0; q < obx.length; q++) if (A.hit(bb, obx[q])) { burned = true; break; }
        if (burned) {
          var ob = this.obs[j];
          this.burst(ob.x + ob.w / 2, ob.y + ob.h / 2, C.RD); this.burst(ob.x + ob.w / 2, ob.y + ob.h / 2, C.AM);
          this.obs.splice(j, 1); this.bonus += 20; A.sfx.hit();
        }
      }
      if (burned || bl.x > this.w + 20) this.balls.splice(i, 1);
    }
    for (i = this.parts.length - 1; i >= 0; i--) {
      var p = this.parts[i]; p.t -= dt; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t <= 0) this.parts.splice(i, 1);
    }
    outer:
    for (i = 0; i < this.obs.length; i++) {
      var ob2 = obBoxes(this.obs[i]);
      for (var m = 0; m < db.length; m++) for (var n = 0; n < ob2.length; n++) if (A.hit(db[m], ob2[n])) { this.dead = true; break outer; }
    }
    for (i = 0; i < this.clouds.length; i++) {
      var cl = this.clouds[i]; cl.x -= this.speed * 0.12 * dt;
      if (cl.x < -60) { cl.x = this.w + this.rnd() * 200; cl.y = 25 + this.rnd() * 60; }
    }
    this.gOff = (this.gOff + this.speed * dt) % 1600;
  };
  Lane.prototype.tickNight = function (dt) { this.nightT += ((this.night ? 1 : 0) - this.nightT) * Math.min(1, dt * 2.5); };
  Lane.prototype.colors = function () {
    var t = this.nightT;
    return { bg: mix(DAY_BG, NIGHT_BG, t), fg: mix(DAY_FG, NIGHT_FG, t), wing: mix(DAY_W, NIGHT_W, t), cloud: mix([212, 212, 212], [70, 74, 92], t) };
  };
  Lane.prototype.draw = function (label) {
    var ctx = A.ctx, W = this.w, k = this.colors(), i;
    if (this.nightT > 0.02) {
      A.R(0, 0, W, 200, k.bg);
      ctx.globalAlpha = this.nightT;
      ctx.fillStyle = '#f5f3ce'; ctx.beginPath(); ctx.arc(W * 0.72, 38, 12, 0, 6.283); ctx.fill();
      ctx.fillStyle = k.bg; ctx.beginPath(); ctx.arc(W * 0.72 + 6, 34, 11, 0, 6.283); ctx.fill();
      for (i = 0; i < this.stars.length; i++) {
        var st = this.stars[i], sx = ((st.x - this.gOff * 0.03) % W + W) % W;
        ctx.globalAlpha = this.nightT * (0.5 + 0.5 * Math.sin(performance.now() / 400 + st.tw));
        A.R(sx, st.y, 2, 2, '#ffffff');
      }
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < this.clouds.length; i++) {
      var c = this.clouds[i];
      A.R(c.x + 8, c.y, 24, 4, k.cloud); A.R(c.x + 4, c.y + 4, 34, 4, k.cloud); A.R(c.x, c.y + 8, 46, 4, k.cloud);
    }
    A.R(0, GROUND, W, 1.5, k.fg);
    for (i = 0; i < this.bumps.length; i++) {
      var bp = this.bumps[i], bx = ((bp.x - this.gOff) % 1600 + 1600) % 1600;
      if (bx < W) A.R(bx, bp.y, bp.w, 1.2, k.fg);
    }
    for (i = 0; i < this.coins.length; i++) drawCoin(this.coins[i].x, this.coins[i].y);
    for (i = 0; i < this.obs.length; i++) {
      var o = this.obs[i];
      if (o.type === 'bird') A.S(Math.floor(o.flap * 6) % 2 ? BIRD_DOWN : BIRD_UP, o.x, o.y - 4, PX, { mono: k.fg, eye: k.bg });
      else for (var p = 0; p < o.parts.length; p++) cactus(o.x + o.parts[p].dx, o.cw, o.parts[p].h, k.fg);
    }
    for (i = 0; i < this.balls.length; i++) {
      var b = this.balls[i], fl = Math.floor(b.t * 20) % 2;
      A.R(b.x, b.y - 3, 10, 6, C.AM); A.R(b.x + 6, b.y - 2, 6, 4, C.RD); A.R(b.x - 4 - fl * 2, b.y - 1, 4, 2, C.AM);
    }
    for (i = 0; i < this.parts.length; i++) { var pt = this.parts[i]; ctx.globalAlpha = Math.max(0, pt.t * 2); A.R(pt.x, pt.y, 3, 3, pt.c); }
    ctx.globalAlpha = 1;
    var d = this.d, spr, dy = d.y;
    if (this.dead || !d.on || !A.isPlaying()) spr = STAND;
    else if (d.duck) { spr = Math.floor(d.anim) % 2 ? DK_A : DK_B; dy = GROUND - 22; }
    else spr = Math.floor(d.anim) % 2 ? RUN_A : RUN_B;
    A.S(spr, d.x, dy, PX, { pal: { '#': k.fg, 'w': k.wing, 'o': this.dead ? C.RD : k.bg } });
    if (label) {
      var fl2 = this.t < this.flash && Math.floor(this.t * 8) % 2 === 0;
      ctx.globalAlpha = fl2 ? 0.3 : 1;
      A.T(label + ' ' + A.pad(this.score), W - 12, 8, 13, 'right', this.dead ? C.RD : k.fg);
      ctx.globalAlpha = 1;
    }
  };
  function drawCoin(x, y) { A.R(x + 2, y, 5, 9, C.AM); A.R(x, y + 2, 9, 5, C.AM); A.R(x + 3, y + 3, 3, 3, '#f5d27a'); }
  function cactus(x, w, h, col) {
    var top = GROUND - h, stem = Math.round(w * 0.42), sx = x + (w - stem) / 2, arm = Math.max(2, Math.round(w * 0.2));
    A.R(sx, top + 2, stem, h - 2, col); A.R(sx + 1, top, stem - 2, 2, col);
    A.R(x, top + h * 0.28, arm, h * 0.3, col); A.R(x, top + h * 0.52, sx - x, arm, col);
    A.R(x + w - arm, top + h * 0.2, arm, h * 0.28, col); A.R(sx + stem, top + h * 0.42, x + w - arm - (sx + stem) + arm, arm, col);
  }
  A.cactus = function (x, ground, w, h, col) { var g = GROUND; GROUND = ground; cactus(x, w, h, col || C.FG); GROUND = g; };
  A.coin = drawCoin;

  // ---------- solo game factory ----------
  function solo(id, name, help, opt) {
    var lane = new Lane(opt), duckId = null;
    var g = {
      id: id, name: name, help: help, startTap: true,
      reset: function () { lane.w = A.W; lane.reset(); lane.night = false; lane.nightT = 0; duckId = null; },
      start: function () {},
      get score() { return lane.score; },
      bg: function () { return lane.colors().bg; },
      fg: function () { return lane.colors().fg; },
      update: function (dt) {
        lane.w = A.W; lane.update(dt); lane.tickNight(dt);
        if (lane.dead) A.over();
      },
      idle: function (dt) { lane.tickNight(dt); },
      draw: function () { lane.w = A.W; lane.draw(); },
      down: function (x, y, id2) {
        if (opt.fire && x > A.W * 0.5 && id2 !== 'start' && id2 !== 'k') lane.fire();
        else lane.jump();
      },
      up: function (x, y, id2) { lane.release(); if (duckId === id2) { lane.setDuck(false); duckId = null; } },
      swipe: function (dir, id2) {
        if (dir === 'down') { lane.release(); lane.setDuck(true); duckId = id2; }
        if (dir === 'right' && opt.fire) lane.fire();
      },
      key: function (code, down) {
        if (code === 'ArrowDown') lane.setDuck(down);
        if (code === 'KeyF' && down && opt.fire) lane.fire();
        if (code === 'ArrowUp' && down) lane.jump();
        if (code === 'ArrowUp' && !down) lane.release();
      },
      preview: opt.preview
    };
    return g;
  }

  A.reg(solo('dragon', 'Dragon Run', 'Tap to jump (hold for higher). Swipe down & hold to duck under birds.', {
    night: true,
    preview: function () {
      A.S(MINI, 24, 108, 1.8); A.R(0, 134, 240, 1);
      A.cactus(120, 134, 12, 26); A.cactus(180, 134, 14, 34);
      A.S(BIRD_UP, 150, 60, 1.4); A.T('00420', 232, 6, 12, 'right');
    }
  }));
  A.reg(solo('dragon2', 'Dragon Run 2', 'Tap LEFT side to jump, RIGHT side to breathe fire. Burn cacti & birds, grab coins. Swipe down to duck.', {
    night: true, coins: true, fire: true,
    preview: function () {
      A.S(MINI, 24, 108, 1.8); A.R(54, 112, 12, 6, C.AM); A.R(64, 113, 5, 4, C.RD);
      [110, 130, 150].forEach(function (a, i) { drawCoin(a, 66 - i * 6); });
      A.cactus(190, 134, 14, 30); A.R(186, 98, 14, 6, C.AM); A.R(190, 94, 6, 4, C.RD);
      A.R(0, 134, 240, 1); A.T('00980', 232, 6, 12, 'right');
    }
  }));

  // ---------- two-player race ----------
  var p1 = new Lane({}), p2 = new Lane({}), duo = {
    id: 'duo', name: 'Two-player race', noHud: true, noHi: true, startTap: false,
    help: 'Player 1 taps the TOP half, player 2 the BOTTOM half. Same obstacles for both. Last dragon running wins!',
    reset: function () { var s = (Math.random() * 1e9) | 0; p1.reset(s); p2.reset(s); p1.w = p2.w = A.W * 2; },
    get score() { return Math.max(p1.score, p2.score); },
    update: function (dt) {
      p1.w = p2.w = A.W * 2;
      p1.update(dt); p2.update(dt);
      if (p1.dead && p2.dead) A.over(p1.score > p2.score ? 'P1 WINS!' : p2.score > p1.score ? 'P2 WINS!' : 'DRAW!', true);
    },
    overText: function () { return 'P1 ' + A.pad(p1.score) + '   P2 ' + A.pad(p2.score); },
    draw: function () {
      var ctx = A.ctx;
      ctx.save(); ctx.scale(0.5, 0.5); p1.draw('P1'); ctx.restore();
      ctx.save(); ctx.translate(0, 100); ctx.scale(0.5, 0.5); p2.draw('P2'); ctx.restore();
      A.R(0, 99.5, A.W, 1, C.LT);
    },
    lane: function (y) { return y < 100 ? p1 : p2; },
    down: function (x, y) { this.lane(y).jump(); },
    up: function (x, y, id, sw, tc) { var l = this.lane(tc ? tc.sy : y); l.release(); l.setDuck(false); },
    swipe: function (dir, id) {
      var t = A.touches[id]; if (!t) return;
      if (dir === 'down') { var l = this.lane(t.sy); l.release(); l.setDuck(true); }
    },
    key: function (code, down) {
      if (code === 'KeyW' && down) p1.jump(); if (code === 'KeyW' && !down) p1.release();
      if (code === 'ArrowUp' && down) p2.jump(); if (code === 'ArrowUp' && !down) p2.release();
    },
    preview: function () {
      A.R(0, 69, 240, 1, C.LT);
      A.S(MINI, 24, 62 - 14 * 1.4, 1.4); A.R(0, 62, 240, 1); A.cactus(130, 62, 8, 16);
      A.S(MINI, 60, 134 - 14 * 1.4, 1.4); A.R(0, 134, 240, 1); A.cactus(170, 134, 8, 20); A.cactus(180, 134, 8, 16);
      A.T('P1 00210', 232, 4, 10, 'right'); A.T('P2 00195', 232, 74, 10, 'right');
    }
  };
  A.reg(duo);
})();
