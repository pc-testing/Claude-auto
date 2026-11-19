// Pixel copter: hold to rise, let go to fall. The tunnel slowly narrows.
(function () {
  'use strict';
  var C = A.C, SEG = 6, CX = 60;
  var g = {
    id: 'copter', name: 'Pixel copter', startTap: true,
    help: 'Hold anywhere to fly up, let go to drop. Stay inside the tunnel and avoid the blocks.',
    reset: function () {
      this.y = 95; this.vy = 0; this.hold = 0; this.dist = 0; this.score = 0; this.t = 0;
      this.speed = 150; this.segs = []; this.off = 0; this.blocks = []; this.nextBlock = 300; this.smoke = [];
      this.c = 100; this.cv = 0;
      var n = Math.ceil(A.W / SEG) + 3;
      for (var i = 0; i < n; i++) this.segs.push(this.makeSeg(true));
    },
    makeSeg: function (flat) {
      var gap = Math.max(78, 150 - this.t * 1.6);
      if (!flat) {
        this.cv += A.rand(-0.5, 0.5); this.cv = A.clamp(this.cv, -2.2, 2.2);
        this.c += this.cv;
        if (this.c - gap / 2 < 26) { this.c = 26 + gap / 2; this.cv = Math.abs(this.cv); }
        if (this.c + gap / 2 > 194) { this.c = 194 - gap / 2; this.cv = -Math.abs(this.cv); }
      }
      return { top: Math.round(this.c - gap / 2), bot: Math.round(this.c + gap / 2) };
    },
    down: function (x, y, id) { this.hold++; },
    up: function () { this.hold = Math.max(0, this.hold - 1); },
    start: function () { this.hold = 0; },
    update: function (dt) {
      this.t += dt;
      this.speed = Math.min(260, 150 + this.t * 2.5);
      var holding = this.hold > 0;
      this.vy += (holding ? -820 : 620) * dt; this.vy = A.clamp(this.vy, -230, 260);
      this.y += this.vy * dt;
      this.dist += this.speed * dt; this.score = Math.floor(this.dist / 10);
      this.off += this.speed * dt;
      while (this.off >= SEG) { this.off -= SEG; this.segs.shift(); this.segs.push(this.makeSeg(false)); }
      this.nextBlock -= this.speed * dt;
      if (this.nextBlock <= 0) {
        var s = this.segs[this.segs.length - 1];
        this.blocks.push({ x: A.W + 10, y: A.rand(s.top + 8, s.bot - 38), w: 9, h: 30 });
        this.nextBlock = A.rand(220, 360);
      }
      if (holding && Math.random() < 0.5) this.smoke.push({ x: CX - 4, y: this.y + 8, t: 0.5 });
      var i;
      for (i = this.smoke.length - 1; i >= 0; i--) { var sm = this.smoke[i]; sm.x -= this.speed * dt; sm.t -= dt; if (sm.t <= 0) this.smoke.splice(i, 1); }
      var box = { x: CX, y: this.y + 1, w: 22, h: 10 };
      for (i = this.blocks.length - 1; i >= 0; i--) {
        var b = this.blocks[i]; b.x -= this.speed * dt;
        if (A.hit(box, b)) { A.over(); return; }
        if (b.x < -20) this.blocks.splice(i, 1);
      }
      for (i = 0; i < this.segs.length; i++) {
        var sx = i * SEG - this.off;
        if (sx + SEG < box.x || sx > box.x + box.w) continue;
        var sg = this.segs[i];
        if (box.y < sg.top || box.y + box.h > sg.bot) { A.over(); return; }
      }
      if (this.score > 0 && this.score % 100 === 0 && this.score !== this.lastMile) { this.lastMile = this.score; A.sfx.point(); }
    },
    heli: function (x, y, t) {
      A.R(x + 4, y + 3, 14, 8); A.R(x + 14, y + 4, 6, 5, C.LT); A.R(x - 6, y + 5, 10, 3); A.R(x - 8, y + 2, 3, 6);
      A.R(x + 6, y + 12, 12, 1.5); A.R(x + 8, y + 11, 1.5, 2); A.R(x + 15, y + 11, 1.5, 2);
      A.R(x + 10, y, 2, 3);
      var w = Math.floor(t * 20) % 2 ? 22 : 12;
      A.R(x + 11 - w / 2, y - 1, w, 1.5);
    },
    draw: function () {
      var i;
      for (i = 0; i < this.segs.length; i++) {
        var s = this.segs[i], x = i * SEG - this.off;
        A.R(x, 0, SEG + 0.3, s.top); A.R(x, s.bot, SEG + 0.3, 200 - s.bot);
      }
      for (i = 0; i < this.blocks.length; i++) { var b = this.blocks[i]; A.R(b.x, b.y, b.w, b.h, C.GR); }
      for (i = 0; i < this.smoke.length; i++) { var sm = this.smoke[i]; A.ctx.globalAlpha = sm.t * 1.6; A.R(sm.x - 8, sm.y, 3, 3, C.LT); }
      A.ctx.globalAlpha = 1;
      this.heli(CX, this.y, performance.now() / 1000);
    },
    fg: function () { return '#ffffff'; },
    preview: function () {
      for (var i = 0; i < 240; i += 12) {
        var t = 18 + Math.round(Math.sin(i / 30) * 10), b = 112 + Math.round(Math.sin(i / 25 + 1) * 10);
        A.R(i, 0, 12, t); A.R(i, b, 12, 140 - b);
      }
      A.R(150, 50, 10, 28, C.GR); this.heli(50, 60, 0); A.T('00128', 232, 6, 12, 'right', '#ffffff');
    }
  };
  A.reg(g);
})();
