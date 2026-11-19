// Gravity flip: tap to swap between running on the floor and the ceiling.
(function () {
  'use strict';
  var C = A.C, FLOOR = 172, CEIL = 30, P = 1.5, PH = 21;
  var g = {
    id: 'flip', name: 'Gravity flip', startTap: false,
    help: 'Tap to flip gravity and run on the ceiling or the floor. Dodge the spikes!',
    reset: function () {
      this.y = FLOOR - PH; this.vy = 0; this.grav = 1; this.on = true; this.score = 0; this.dist = 0;
      this.speed = 230; this.obs = []; this.next = 300; this.anim = 0; this.off = 0; this.lastSide = 1;
    },
    down: function () {
      if (!this.on) return;
      this.grav = -this.grav; this.on = false; this.vy = this.grav * 120; A.beep(this.grav > 0 ? 400 : 700, 0.08, 'square', 0.04, this.grav > 0 ? 250 : 1000);
    },
    update: function (dt) {
      this.speed = Math.min(470, this.speed + 7 * dt);
      this.dist += this.speed * dt; this.score = Math.floor(this.dist / 10);
      this.off = (this.off + this.speed * dt) % 40;
      this.anim += dt * this.speed / 30;
      if (!this.on) {
        this.vy += this.grav * 1700 * dt; this.y += this.vy * dt;
        if (this.grav > 0 && this.y >= FLOOR - PH) { this.y = FLOOR - PH; this.vy = 0; this.on = true; }
        if (this.grav < 0 && this.y <= CEIL) { this.y = CEIL; this.vy = 0; this.on = true; }
      }
      this.next -= this.speed * dt;
      if (this.next <= 0) {
        var side = Math.random() < 0.5 ? 1 : -1, n = 1 + Math.floor(Math.random() * (this.speed > 330 ? 3 : 2));
        var tall = Math.random() < 0.3;
        this.obs.push({ x: A.W + 10, side: side, w: n * 10, h: tall ? 30 : 16 });
        // keep the gap long enough to flip, longer if the side changes
        this.next = this.speed * (side !== this.lastSide ? 0.55 : 0.4) + n * 10 + Math.random() * this.speed * 0.8;
        this.lastSide = side;
      }
      var box = { x: 42, y: this.y + 3, w: 14, h: PH - 6 };
      for (var i = this.obs.length - 1; i >= 0; i--) {
        var o = this.obs[i];
        o.x -= this.speed * dt;
        var oy = o.side > 0 ? FLOOR - o.h : CEIL;
        if (A.hit(box, { x: o.x + 2, y: oy + (o.side > 0 ? 4 : 0), w: o.w - 4, h: o.h - 4 })) { A.over(); return; }
        if (o.x < -40) this.obs.splice(i, 1);
      }
      if (this.score > 0 && this.score % 100 === 0 && this.score !== this.lastMile) { this.lastMile = this.score; A.sfx.point(); }
    },
    spikes: function (x, w, h, side) {
      var ctx = A.ctx; ctx.fillStyle = C.FG;
      if (h > 20) { // a block with spikes on it
        var by = side > 0 ? FLOOR - h + 6 : CEIL, bh = h - 6;
        A.R(x, by, w, bh);
        for (var k = 0; k < w; k += 10) {
          ctx.beginPath();
          if (side > 0) { ctx.moveTo(x + k, by); ctx.lineTo(x + k + 5, by - 6); ctx.lineTo(x + k + 10, by); }
          else { ctx.moveTo(x + k, by + bh); ctx.lineTo(x + k + 5, by + bh + 6); ctx.lineTo(x + k + 10, by + bh); }
          ctx.fill();
        }
        return;
      }
      for (var j = 0; j < w; j += 10) {
        ctx.beginPath();
        if (side > 0) { ctx.moveTo(x + j, FLOOR); ctx.lineTo(x + j + 5, FLOOR - h); ctx.lineTo(x + j + 10, FLOOR); }
        else { ctx.moveTo(x + j, CEIL); ctx.lineTo(x + j + 5, CEIL + h); ctx.lineTo(x + j + 10, CEIL); }
        ctx.fill();
      }
    },
    draw: function () {
      var W = A.W, i;
      A.R(0, FLOOR, W, 1.5); A.R(0, CEIL - 1.5, W, 1.5);
      for (i = -40; i < W + 40; i += 40) { A.R(i - this.off + 10, FLOOR + 6, 8, 1.2); A.R(i - this.off + 28, CEIL - 8, 6, 1.2); }
      for (i = 0; i < this.obs.length; i++) { var o = this.obs[i]; this.spikes(o.x, o.w, o.h, o.side); }
      var flipY = this.grav < 0;
      A.S(A.SPR.MINI, 38, this.y, P, { flipY: flipY });
    },
    preview: function () {
      A.R(0, 20, 240, 1); A.R(0, 118, 240, 1);
      A.S(A.SPR.MINI, 40, 21, 1.6, { flipY: true });
      var ctx = A.ctx; ctx.fillStyle = C.FG;
      [120, 130].forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, 118); ctx.lineTo(x + 5, 104); ctx.lineTo(x + 10, 118); ctx.fill(); });
      [190, 200, 210].forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, 21); ctx.lineTo(x + 5, 35); ctx.lineTo(x + 10, 21); ctx.fill(); });
      A.T('00317', 232, 124, 12, 'right');
    }
  };
  A.reg(g);
})();
