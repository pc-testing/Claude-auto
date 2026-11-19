// Asteroids-lite: the ship sits in the middle. Touch & hold to aim and fire.
(function () {
  'use strict';
  var C = A.C, R = [0, 6, 11, 18], PTS = [0, 100, 50, 20];
  var g = {
    id: 'asteroids', name: 'Asteroids-lite', startTap: false,
    help: 'Touch and hold where you want to shoot: the ship turns and fires. Big rocks split into smaller ones!',
    reset: function () {
      this.a = -Math.PI / 2; this.score = 0; this.lives = 3; this.wave = 0; this.rocks = []; this.shots = []; this.parts = [];
      this.aim = null; this.cool = 0; this.inv = 1.5; this.nextWave();
    },
    nextWave: function () {
      this.wave++;
      for (var i = 0; i < 2 + this.wave; i++) this.spawnRock(3);
    },
    spawnRock: function (size, x, y) {
      var W = A.W, cx = W / 2, cy = 105;
      if (x === undefined) {
        var side = Math.floor(Math.random() * 4);
        x = side === 0 ? -20 : side === 1 ? W + 20 : Math.random() * W;
        y = side === 2 ? -20 : side === 3 ? 220 : Math.random() * 200;
      }
      var ang = Math.atan2(cy - y, cx - x) + A.rand(-0.7, 0.7), sp = A.rand(18, 34) + this.wave * 3 + (3 - size) * 10;
      var pts = [], n = 7 + Math.floor(Math.random() * 4);
      for (var k = 0; k < n; k++) pts.push(A.rand(0.72, 1.05));
      this.rocks.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, s: size, pts: pts, rot: Math.random() * 6, vr: A.rand(-1, 1) });
    },
    down: function (x, y) { this.aim = { x: x, y: y }; },
    move: function (x, y) { this.aim = { x: x, y: y }; },
    up: function () { this.aim = null; },
    key: function (code, d) {
      if (code === 'ArrowLeft') this.kl = d; if (code === 'ArrowRight') this.kr = d; if (code === 'ArrowUp') this.kf = d;
    },
    boom: function (x, y, n, col) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, s = A.rand(20, 90); this.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: A.rand(0.3, 0.7), c: col }); } },
    update: function (dt) {
      var W = A.W, cx = W / 2, cy = 105, i, j;
      var firing = false;
      if (this.aim) {
        var ta = Math.atan2(this.aim.y - cy, this.aim.x - cx), d = ta - this.a;
        while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        this.a += A.clamp(d, -9 * dt, 9 * dt); firing = Math.abs(d) < 0.35;
      } else this.a += 0.6 * dt;
      if (this.kl) this.a -= 4 * dt; if (this.kr) this.a += 4 * dt; if (this.kf) firing = true;
      this.cool -= dt; if (this.inv > 0) this.inv -= dt;
      if (firing && this.cool <= 0) {
        this.cool = 0.2;
        this.shots.push({ x: cx + Math.cos(this.a) * 10, y: cy + Math.sin(this.a) * 10, vx: Math.cos(this.a) * 330, vy: Math.sin(this.a) * 330, t: 0.9 });
        A.sfx.shoot();
      }
      for (i = this.shots.length - 1; i >= 0; i--) { var s = this.shots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.t -= dt; if (s.t <= 0) this.shots.splice(i, 1); }
      for (i = this.parts.length - 1; i >= 0; i--) { var p = this.parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; if (p.t <= 0) this.parts.splice(i, 1); }
      for (i = this.rocks.length - 1; i >= 0; i--) {
        var r = this.rocks[i], rad = R[r.s];
        r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt;
        if (r.x < -30) r.x += W + 60; if (r.x > W + 30) r.x -= W + 60;
        if (r.y < -30) r.y += 260; if (r.y > 230) r.y -= 260;
        var hit = false;
        for (j = this.shots.length - 1; j >= 0; j--) {
          var sh = this.shots[j], dx = sh.x - r.x, dy = sh.y - r.y;
          if (dx * dx + dy * dy < rad * rad) { this.shots.splice(j, 1); hit = true; break; }
        }
        if (hit) {
          this.score += PTS[r.s]; this.boom(r.x, r.y, 6 + r.s * 3, C.FG); this.rocks.splice(i, 1);
          A.beep(200 - r.s * 30, 0.15, 'sawtooth', 0.05, 60);
          if (r.s > 1) { this.spawnRock(r.s - 1, r.x, r.y); this.spawnRock(r.s - 1, r.x, r.y); }
          continue;
        }
        var ex = r.x - cx, ey = r.y - cy;
        if (this.inv <= 0 && ex * ex + ey * ey < (rad + 6) * (rad + 6)) {
          this.lives--; this.boom(cx, cy, 20, C.GR); A.sfx.hit(); A.vibe(100); this.inv = 2;
          this.rocks.splice(i, 1);
          if (this.lives <= 0) { A.over(); return; }
        }
      }
      if (!this.rocks.length) { A.sfx.point(); this.nextWave(); }
    },
    ship: function (x, y, a, col) {
      var ctx = A.ctx;
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11);
      ctx.lineTo(x + Math.cos(a + 2.5) * 9, y + Math.sin(a + 2.5) * 9);
      ctx.lineTo(x + Math.cos(a + Math.PI) * 4, y + Math.sin(a + Math.PI) * 4);
      ctx.lineTo(x + Math.cos(a - 2.5) * 9, y + Math.sin(a - 2.5) * 9);
      ctx.closePath(); ctx.fill();
    },
    rock: function (r) {
      var ctx = A.ctx, n = r.pts.length, rad = R[r.s];
      ctx.strokeStyle = C.FG; ctx.lineWidth = 2; ctx.beginPath();
      for (var k = 0; k < n; k++) { var a = r.rot + k / n * 6.283; ctx.lineTo(r.x + Math.cos(a) * rad * r.pts[k], r.y + Math.sin(a) * rad * r.pts[k]); }
      ctx.closePath(); ctx.stroke();
    },
    draw: function () {
      var cx = A.W / 2, cy = 105, i, ctx = A.ctx;
      for (i = 0; i < 30; i++) A.R((i * 97.3) % A.W, (i * 53.7) % 200, 1.5, 1.5, C.LT);
      for (i = 0; i < this.rocks.length; i++) this.rock(this.rocks[i]);
      for (i = 0; i < this.shots.length; i++) A.R(this.shots[i].x - 1.5, this.shots[i].y - 1.5, 3, 3);
      for (i = 0; i < this.parts.length; i++) { var p = this.parts[i]; ctx.globalAlpha = Math.min(1, p.t * 2); A.R(p.x, p.y, 2, 2, p.c); }
      ctx.globalAlpha = 1;
      if (this.inv <= 0 || Math.floor(this.inv * 10) % 2 === 0) this.ship(cx, cy, this.a, C.GR);
      if (this.aim) { ctx.strokeStyle = C.LT; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(this.aim.x, this.aim.y, 6, 0, 6.283); ctx.stroke(); }
      for (i = 0; i < this.lives; i++) this.ship(60 + i * 12, 14, -Math.PI / 2, C.FG);
      A.T('WAVE ' + this.wave, 100, 9, 9, 'left');
    },
    preview: function () {
      var self = this;
      [[50, 45, 3], [185, 40, 2], [170, 105, 3], [60, 110, 1]].forEach(function (o, i) { self.rock({ x: o[0], y: o[1], s: o[2], rot: i, pts: [1, 0.8, 1, 0.85, 0.95, 0.75, 1, 0.9] }); });
      this.ship(120, 70, -0.4, C.GR); A.R(140, 60, 3, 3); A.R(155, 54, 3, 3); A.T('01250', 232, 6, 12, 'right');
    }
  };
  A.reg(g);
})();
