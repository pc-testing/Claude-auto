// Pixel invaders: slide to move the cannon, it fires by itself.
(function () {
  'use strict';
  var C = A.C, P = 1.5, PY = 182;
  var AL = [
    [['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'],
     ['..#.....#..', '#..#...#..#', '#.#######.#', '###.###.###', '###########', '.#########.', '..#.....#..', '.#.......#.']],
    [['....##....', '...####...', '..######..', '.##.##.##.', '##########', '..#.##.#..', '.#......#.', '..#....#..'],
     ['....##....', '...####...', '..######..', '.##.##.##.', '##########', '.#.#..#.#.', '#........#', '.#......#.']],
    [['...####...', '.########.', '##########', '###..##..#', '##########', '..##..##..', '.##.##.##.', '##......##'],
     ['...####...', '.########.', '##########', '###..##..#', '##########', '...#..#...', '..#.##.#..', '...#..#...']]
  ];
  var UFO = ['....####....', '..########..', '.##.##.##.##', '############', '..###..###..', '...#....#...'];
  var g = {
    id: 'invaders', name: 'Pixel invaders', startTap: false,
    help: 'Slide your finger left and right to move. Your cannon fires on its own. Don\'t let the invaders land!',
    reset: function () { this.score = 0; this.lives = 3; this.wave = 0; this.px = A.W / 2; this.tx = undefined; this.nextWave(); },
    nextWave: function () {
      this.wave++;
      var cols = Math.min(10, Math.floor((A.W - 120) / 22)), rows = 4;
      this.al = [];
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) this.al.push({ c: c, r: r, alive: true, kind: r === 0 ? 2 : r < 2 ? 1 : 0 });
      this.cols = cols; this.fx = 20; this.fy = 32 + Math.min(4, this.wave - 1) * 6; this.fdir = 1;
      this.step = 0; this.frame = 0; this.shots = []; this.bombs = []; this.parts = []; this.cool = 0.5; this.ufo = null; this.ufoT = 12;
      this.bombT = 1.2; this.inv = 1;
      this.bunkers = [];
      var nb = 4, bw = 24;
      for (var b = 0; b < nb; b++) {
        var bx = (A.W / (nb + 1)) * (b + 1) - bw / 2;
        for (var i = 0; i < bw / 3; i++) for (var j = 0; j < 4; j++) {
          if (j === 3 && i > 2 && i < 5) continue;
          if (j === 0 && (i === 0 || i === bw / 3 - 1)) continue;
          this.bunkers.push({ x: bx + i * 3, y: 156 + j * 3 });
        }
      }
    },
    down: function (x) { this.tx = x; },
    move: function (x) { this.tx = x; },
    key: function (code, d) { if (code === 'ArrowLeft') this.kl = d; if (code === 'ArrowRight') this.kr = d; },
    pos: function (a) { return { x: this.fx + a.c * 22, y: this.fy + a.r * 17 }; },
    burst: function (x, y, col) { for (var i = 0; i < 8; i++) this.parts.push({ x: x, y: y, vx: A.rand(-60, 60), vy: A.rand(-60, 60), t: 0.4, c: col }); },
    update: function (dt) {
      var W = A.W, i, j, alive = [];
      if (this.kl) this.tx = this.px - 30; if (this.kr) this.tx = this.px + 30;
      if (this.tx !== undefined) this.px += A.clamp(this.tx - this.px, -220 * dt, 220 * dt);
      this.px = A.clamp(this.px, 10, W - 10);
      if (this.inv > 0) this.inv -= dt;
      for (i = 0; i < this.al.length; i++) if (this.al[i].alive) alive.push(this.al[i]);
      if (!alive.length) { this.score += 100; A.sfx.win(); this.nextWave(); return; }
      var speed = 14 + (40 - alive.length) * 1.6 + this.wave * 4;
      this.fx += this.fdir * speed * dt;
      this.step += dt * (1 + speed / 30); if (this.step > 1) { this.step = 0; this.frame ^= 1; A.beep(this.frame ? 110 : 90, 0.06, 'square', 0.03); }
      var minX = 1e9, maxX = -1e9, maxY = 0;
      alive.forEach(function (a) { var p = this.pos(a); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x + 17); maxY = Math.max(maxY, p.y + 12); }, this);
      if ((this.fdir > 0 && maxX > W - 6) || (this.fdir < 0 && minX < 6)) { this.fdir = -this.fdir; this.fy += 6; }
      if (maxY > PY - 4) { this.lives = 0; A.over(); return; }
      this.cool -= dt;
      if (this.cool <= 0 && this.shots.length < 2) { this.cool = 0.42; this.shots.push({ x: this.px, y: PY - 6 }); A.sfx.shoot(); }
      this.bombT -= dt;
      if (this.bombT <= 0) {
        this.bombT = Math.max(0.35, 1.3 - this.wave * 0.12) * A.rand(0.6, 1.3);
        var shooter = alive[Math.floor(Math.random() * alive.length)], low = shooter;
        alive.forEach(function (a) { if (a.c === shooter.c && a.r > low.r) low = a; });
        var lp = this.pos(low); this.bombs.push({ x: lp.x + 8, y: lp.y + 12 });
      }
      this.ufoT -= dt;
      if (!this.ufo && this.ufoT <= 0) { this.ufo = { x: -20, dir: 1 }; this.ufoT = A.rand(15, 25); }
      if (this.ufo) { this.ufo.x += 60 * dt; if (this.ufo.x > W + 20) this.ufo = null; }
      for (i = this.shots.length - 1; i >= 0; i--) {
        var s = this.shots[i]; s.y -= 300 * dt; var gone = s.y < 20;
        for (j = 0; j < alive.length && !gone; j++) {
          var p = this.pos(alive[j]);
          if (s.x > p.x && s.x < p.x + 17 && s.y > p.y && s.y < p.y + 12) {
            alive[j].alive = false; gone = true; this.score += [10, 20, 30][alive[j].kind];
            this.burst(p.x + 8, p.y + 6, C.FG); A.beep(160, 0.1, 'sawtooth', 0.04, 60);
          }
        }
        if (!gone && this.ufo && s.y < 32 && Math.abs(s.x - this.ufo.x - 9) < 10) { this.score += 150; this.burst(this.ufo.x + 9, 26, C.AM); this.ufo = null; gone = true; A.sfx.coin(); }
        for (j = this.bunkers.length - 1; j >= 0 && !gone; j--) { var bk = this.bunkers[j]; if (s.x > bk.x - 1 && s.x < bk.x + 4 && s.y > bk.y && s.y < bk.y + 3) { this.bunkers.splice(j, 1); gone = true; } }
        if (gone) this.shots.splice(i, 1);
      }
      for (i = this.bombs.length - 1; i >= 0; i--) {
        var bm = this.bombs[i]; bm.y += (110 + this.wave * 8) * dt; var dead = bm.y > 200;
        for (j = this.bunkers.length - 1; j >= 0 && !dead; j--) { var bk2 = this.bunkers[j]; if (bm.x > bk2.x - 1 && bm.x < bk2.x + 4 && bm.y > bk2.y && bm.y < bk2.y + 3) { this.bunkers.splice(j, 1); dead = true; } }
        if (!dead && this.inv <= 0 && bm.y > PY - 6 && bm.y < PY + 6 && Math.abs(bm.x - this.px) < 9) {
          dead = true; this.lives--; this.burst(this.px, PY, C.GR); A.sfx.hit(); A.vibe(100); this.inv = 1.5;
          if (this.lives <= 0) { A.over(); return; }
        }
        if (dead) this.bombs.splice(i, 1);
      }
      for (i = this.parts.length - 1; i >= 0; i--) { var pt = this.parts[i]; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.t -= dt; if (pt.t <= 0) this.parts.splice(i, 1); }
      // invaders eat bunkers they touch
      for (j = this.bunkers.length - 1; j >= 0; j--) {
        var bb = this.bunkers[j];
        for (i = 0; i < alive.length; i++) { var ap = this.pos(alive[i]); if (bb.x > ap.x - 2 && bb.x < ap.x + 17 && bb.y > ap.y && bb.y < ap.y + 12) { this.bunkers.splice(j, 1); break; } }
      }
    },
    cannon: function (x, col) { A.R(x - 8, PY, 16, 5, col); A.R(x - 6, PY - 2, 12, 2, col); A.R(x - 1.5, PY - 6, 3, 4, col); },
    draw: function () {
      var i, ctx = A.ctx;
      for (i = 0; i < this.al.length; i++) {
        var a = this.al[i]; if (!a.alive) continue;
        var p = this.pos(a); A.S(AL[a.kind][this.frame], p.x + (a.kind === 0 ? 0 : 1), p.y, P);
      }
      for (i = 0; i < this.bunkers.length; i++) A.R(this.bunkers[i].x, this.bunkers[i].y, 3, 3, C.GR);
      if (this.ufo) A.S(UFO, this.ufo.x, 22, P, { mono: C.AM });
      for (i = 0; i < this.shots.length; i++) A.R(this.shots[i].x - 1, this.shots[i].y, 2, 6, C.GR);
      for (i = 0; i < this.bombs.length; i++) { var b = this.bombs[i], z = Math.floor(b.y / 4) % 2; A.R(b.x - 1 + z, b.y, 2, 3, C.RD); A.R(b.x - z, b.y + 3, 2, 3, C.RD); }
      for (i = 0; i < this.parts.length; i++) { var pt = this.parts[i]; ctx.globalAlpha = pt.t * 2.5; A.R(pt.x, pt.y, 2, 2, pt.c); }
      ctx.globalAlpha = 1;
      if (this.inv <= 0 || Math.floor(this.inv * 10) % 2 === 0) this.cannon(this.px, C.FG);
      A.R(0, PY + 7, A.W, 1);
      for (i = 0; i < this.lives; i++) { A.R(56 + i * 12, 14, 9, 3, C.GR); A.R(59 + i * 12, 11, 3, 3, C.GR); }
      A.T('WAVE ' + this.wave, 98, 9, 9, 'left');
    },
    preview: function () {
      for (var r = 0; r < 3; r++) for (var k = 0; k < 5; k++) A.S(AL[r === 0 ? 2 : r === 1 ? 1 : 0][0], 30 + k * 38, 20 + r * 18, 1.6);
      [50, 120, 190].forEach(function (b) { A.R(b - 12, 104, 24, 8, C.GR); A.R(b - 8, 100, 16, 4, C.GR); });
      A.R(112, 124, 16, 6); A.R(118, 119, 4, 5); A.R(119, 88, 2, 6, C.GR); A.T('00570', 232, 4, 12, 'right');
    }
  };
  A.reg(g);
})();
