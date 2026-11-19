// Cave flyer: tap to flap through gaps between stalactites and stalagmites.
(function () {
  'use strict';
  var C = A.C, P = 1.6, GAP = 64, PW = 22, SPACING = 118;
  var g = {
    id: 'cave', name: 'Cave flyer', startTap: true,
    help: 'Tap to flap your wings. Fly through the gaps in the cave. Don\'t touch the rocks!',
    reset: function () {
      this.y = 90; this.vy = 0; this.score = 0; this.pipes = []; this.speed = 125; this.off = 0; this.t = 0;
      this.nextX = A.W * 0.75; this.flapT = 0;
      this.drips = []; for (var i = 0; i < 20; i++) this.drips.push({ x: Math.random() * 600, h: 2 + Math.random() * 7, bot: Math.random() < 0.5 });
    },
    down: function () { this.vy = -265; this.flapT = 0.15; A.beep(440, 0.07, 'square', 0.035, 700); },
    update: function (dt) {
      this.t += dt;
      this.speed = Math.min(190, 125 + this.t * 1.2);
      this.vy = Math.min(420, this.vy + 900 * dt);
      this.y += this.vy * dt;
      this.off += this.speed * dt;
      if (this.flapT > 0) this.flapT -= dt;
      this.nextX -= this.speed * dt;
      if (this.nextX < A.W + 30) {
        var gap = Math.max(50, GAP - this.score * 0.4);
        this.pipes.push({ x: this.nextX, gy: A.rand(30, 170 - gap), gap: gap, passed: false, seed: Math.random() * 100 });
        this.nextX += SPACING;
      }
      var box = { x: 62, y: this.y + 4, w: 16, h: 14 };
      for (var i = this.pipes.length - 1; i >= 0; i--) {
        var p = this.pipes[i];
        p.x -= this.speed * dt;
        if (!p.passed && p.x + PW < 62) { p.passed = true; this.score++; A.sfx.point(); }
        if (A.hit(box, { x: p.x + 2, y: 0, w: PW - 4, h: p.gy }) || A.hit(box, { x: p.x + 2, y: p.gy + p.gap, w: PW - 4, h: 200 })) { A.over(); return; }
        if (p.x < -40) this.pipes.splice(i, 1);
      }
      if (this.y < 6) { this.y = 6; this.vy = 0; }
      if (this.y > 176) A.over();
    },
    rock: function (x, top, bot, seed) {
      // a column of rock with a jagged tip pointing into the gap
      A.R(x, top, PW, bot - top);
    },
    draw: function () {
      var W = A.W, i;
      A.R(0, 0, W, 4); A.R(0, 194, W, 6);
      for (i = 0; i < this.drips.length; i++) {
        var d = this.drips[i], x = ((d.x - this.off * 0.6) % 600 + 600) % 600;
        if (x < W) { if (d.bot) A.R(x, 194 - d.h, 3, d.h, C.LT); else A.R(x, 4, 3, d.h, C.LT); }
      }
      for (i = 0; i < this.pipes.length; i++) {
        var p = this.pipes[i];
        A.R(p.x, 0, PW, p.gy - 6); A.R(p.x + 3, p.gy - 6, PW - 6, 4); A.R(p.x + 7, p.gy - 2, PW - 14, 2);
        var by = p.gy + p.gap;
        A.R(p.x + 7, by, PW - 14, 2); A.R(p.x + 3, by + 2, PW - 6, 4); A.R(p.x, by + 6, PW, 200);
        A.R(p.x + 4, 8, 2, p.gy - 20, C.LT); A.R(p.x + 4, by + 12, 2, 180 - by, C.LT);
      }
      var tilt = A.clamp(this.vy / 900, -0.4, 0.6), ctx = A.ctx;
      ctx.save(); ctx.translate(70, this.y + 11); ctx.rotate(tilt); ctx.translate(-10, -11);
      A.S(this.flapT > 0 || this.vy < 0 ? A.SPR.MINI_FLY : A.SPR.MINI, 0, 0, P);
      ctx.restore();
    },
    hudText: function () { return String(this.score); },
    preview: function () {
      [[40, 30, 70], [110, 55, 95], [180, 20, 62]].forEach(function (o) {
        A.R(o[0], 0, 18, o[1]); A.R(o[0] + 3, o[1], 12, 4); A.R(o[0], o[2] + 40, 18, 140); A.R(o[0] + 3, o[2] + 36, 12, 4);
      });
      A.S(A.SPR.MINI_FLY, 72, 62, 1.6); A.T('7', 232, 6, 12, 'right');
    }
  };
  A.reg(g);
})();
