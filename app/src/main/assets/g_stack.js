// Stack tower: a block slides back and forth; tap to drop it on the tower.
(function () {
  'use strict';
  var C = A.C, BH = 12, BASE_Y = 186;
  var SHADES = ['#535353', '#606060', '#6d6d6d', '#7a7a7a', '#6d6d6d', '#606060'];
  var g = {
    id: 'stack', name: 'Stack tower', startTap: false,
    help: 'Tap to drop the sliding block. Only the part that lands on the tower stays. Perfect drops keep it wide!',
    reset: function () {
      this.blocks = [{ x: A.W / 2 - 60, w: 120 }];
      this.score = 0; this.cam = 0; this.camT = 0; this.falls = []; this.combo = 0; this.flash = 0;
      this.newMover();
    },
    newMover: function () {
      var top = this.blocks[this.blocks.length - 1];
      var fromLeft = this.blocks.length % 2 === 0;
      this.mx = fromLeft ? A.W / 2 - 170 : A.W / 2 + 170 - top.w;
      this.mw = top.w; this.dir = fromLeft ? 1 : -1;
      this.mspeed = Math.min(300, 110 + this.score * 7);
    },
    yOf: function (level) { return BASE_Y - (level + 1) * BH + this.cam; },
    down: function () {
      var top = this.blocks[this.blocks.length - 1], x = this.mx, w = this.mw;
      var lvl = this.blocks.length;
      if (Math.abs(x - top.x) < 3) {
        x = top.x; this.combo++; this.flash = 0.3;
        A.beep(600 + Math.min(this.combo, 10) * 80, 0.1, 'square', 0.045);
        if (this.combo >= 3 && w < 120) w = Math.min(120, w + 4);
      } else {
        this.combo = 0;
        var l = Math.max(x, top.x), r = Math.min(x + w, top.x + top.w);
        if (r - l <= 0) { this.falls.push({ x: x, w: w, y: this.yOf(lvl), vy: 0, vx: this.dir * 40 }); A.over(); return; }
        if (x < l) this.falls.push({ x: x, w: l - x, y: this.yOf(lvl), vy: 0, vx: -40 });
        if (x + w > r) this.falls.push({ x: r, w: x + w - r, y: this.yOf(lvl), vy: 0, vx: 40 });
        x = l; w = r - l; A.sfx.tick();
      }
      this.blocks.push({ x: x, w: w });
      this.score = this.blocks.length - 1;
      if (this.score % 10 === 0) A.sfx.point();
      this.camT = Math.max(0, (this.blocks.length - 9) * BH);
      this.newMover();
    },
    update: function (dt) {
      this.mx += this.dir * this.mspeed * dt;
      var lo = A.W / 2 - 170, hi = A.W / 2 + 170 - this.mw;
      if (this.mx < lo) { this.mx = lo; this.dir = 1; }
      if (this.mx > hi) { this.mx = hi; this.dir = -1; }
      this.cam += (this.camT - this.cam) * Math.min(1, dt * 6);
      if (this.flash > 0) this.flash -= dt;
      for (var i = this.falls.length - 1; i >= 0; i--) {
        var f = this.falls[i]; f.vy += 700 * dt; f.y += f.vy * dt; f.x += f.vx * dt;
        if (f.y > 260) this.falls.splice(i, 1);
      }
    },
    idle: function (dt) { this.update(dt); },
    draw: function () {
      var i;
      A.R(0, BASE_Y + this.cam, A.W, 200, C.LT);
      for (i = 0; i < this.blocks.length; i++) {
        var b = this.blocks[i], y = this.yOf(i - 1) - BH;
        if (y > 210 || y < -20) continue;
        A.R(b.x, y, b.w, BH - 1, SHADES[i % SHADES.length]);
        A.R(b.x, y, b.w, 1.5, '#8a8a8a');
      }
      var my = this.yOf(this.blocks.length - 1) - BH;
      if (A._dbg.st !== 'over') { A.R(this.mx, my, this.mw, BH - 1, C.GR); A.R(this.mx, my, this.mw, 1.5, '#6fd19a'); }
      if (this.flash > 0) {
        var t = this.blocks[this.blocks.length - 1], ty = this.yOf(this.blocks.length - 2) - BH;
        A.ctx.strokeStyle = C.AM; A.ctx.lineWidth = 1.5; A.ctx.strokeRect(t.x - 2, ty - 2, t.w + 4, BH + 3);
      }
      for (i = 0; i < this.falls.length; i++) { var f = this.falls[i]; A.R(f.x, f.y, f.w, BH - 1, '#9a9a9a'); }
      if (this.combo >= 2) A.T('PERFECT x' + this.combo, A.W / 2, 30, 9, 'center', C.AM);
    },
    preview: function () {
      var w = 110, xs = 65;
      A.R(0, 136, 240, 10, C.LT);
      for (var i = 0; i < 8; i++) { A.R(xs, 136 - 12 - i * 12, w, 10, SHADES[i % 6]); xs += i % 2 ? 3 : -1; w -= 5; }
      A.R(140, 136 - 12 - 8 * 12, w - 6, 10, C.GR); A.T('8', 232, 6, 12, 'right');
    }
  };
  A.reg(g);
})();
