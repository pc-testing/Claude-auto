// Breakout: drag the paddle, bounce the ball, smash every brick.
(function () {
  'use strict';
  var C = A.C, PY = 184, BW = 26, BHT = 8, TOP = 30;
  var g = {
    id: 'breakout', name: 'Breakout', startTap: false,
    help: 'Drag your finger to move the paddle. Tap to launch the ball. Catch the gold capsules for a wider paddle!',
    reset: function () { this.level = 1; this.lives = 3; this.score = 0; this.px = A.W / 2; this.wideT = 0; this.caps = []; this.build(); this.serve(); },
    build: function () {
      this.cols = Math.floor((A.W - 20) / (BW + 2)); this.bx0 = (A.W - this.cols * (BW + 2) + 2) / 2;
      this.bricks = [];
      var rows = Math.min(7, 4 + this.level);
      for (var r = 0; r < rows; r++) for (var c = 0; c < this.cols; c++) {
        if (this.level > 1 && (r * 3 + c * 7 + this.level) % 11 === 0) continue;
        this.bricks.push({ x: this.bx0 + c * (BW + 2), y: TOP + r * (BHT + 3), hp: (this.level >= 3 && r === 0) ? 2 : 1, cap: Math.random() < 0.09, row: r });
      }
    },
    serve: function () { this.stuck = true; this.ball = { x: this.px, y: PY - 5, vx: 0, vy: 0 }; },
    pw: function () { return this.wideT > 0 ? 70 : 44; },
    launch: function () {
      if (!this.stuck) return;
      this.stuck = false;
      var sp = 165 + this.level * 15, a = A.rand(-0.5, 0.5);
      this.ball.vx = Math.sin(a) * sp; this.ball.vy = -Math.cos(a) * sp; A.sfx.blip();
    },
    down: function (x) { this.tx = x; this.downAt = performance.now(); },
    move: function (x) { this.tx = x; },
    up: function (x, y, id, sw) { if (performance.now() - this.downAt < 250 || this.stuck) this.launch(); },
    key: function (code, d) { if (code === 'ArrowLeft') this.kl = d; if (code === 'ArrowRight') this.kr = d; if (code === 'ArrowUp' && d) this.launch(); },
    update: function (dt) {
      var W = A.W, pw = this.pw(), b = this.ball, i;
      if (this.kl) this.tx = this.px - 20; if (this.kr) this.tx = this.px + 20;
      if (this.tx !== undefined) this.px += (this.tx - this.px) * Math.min(1, dt * 18);
      this.px = A.clamp(this.px, pw / 2, W - pw / 2);
      if (this.wideT > 0) this.wideT -= dt;
      if (this.stuck) { b.x = this.px; b.y = PY - 5; }
      else {
        var steps = 3;
        for (var s = 0; s < steps; s++) {
          b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
          if (b.x < 3) { b.x = 3; b.vx = Math.abs(b.vx); A.sfx.tick(); }
          if (b.x > W - 3) { b.x = W - 3; b.vx = -Math.abs(b.vx); A.sfx.tick(); }
          if (b.y < 24) { b.y = 24; b.vy = Math.abs(b.vy); A.sfx.tick(); }
          if (b.vy > 0 && b.y + 3 >= PY && b.y < PY + 4 && Math.abs(b.x - this.px) < pw / 2 + 3) {
            var off = (b.x - this.px) / (pw / 2), sp = Math.min(340, Math.sqrt(b.vx * b.vx + b.vy * b.vy) * 1.015);
            var ang = off * 1.05;
            b.vx = Math.sin(ang) * sp; b.vy = -Math.cos(ang) * sp; b.y = PY - 3; A.beep(520, 0.05, 'square', 0.04);
          }
          for (i = this.bricks.length - 1; i >= 0; i--) {
            var k = this.bricks[i];
            if (b.x + 3 > k.x && b.x - 3 < k.x + BW && b.y + 3 > k.y && b.y - 3 < k.y + BHT) {
              var ox = Math.min(b.x + 3 - k.x, k.x + BW - (b.x - 3)), oy = Math.min(b.y + 3 - k.y, k.y + BHT - (b.y - 3));
              if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
              k.hp--;
              if (k.hp <= 0) {
                this.bricks.splice(i, 1); this.score += 10 + (6 - Math.min(6, k.row)) * 2;
                if (k.cap) this.caps.push({ x: k.x + BW / 2, y: k.y });
                A.beep(700 + k.row * 60, 0.06, 'square', 0.04);
              } else A.sfx.tick();
              break;
            }
          }
        }
        if (b.y > 205) {
          this.lives--; A.sfx.hit(); A.vibe(60);
          if (this.lives <= 0) { A.over(); return; }
          this.serve();
        }
      }
      for (i = this.caps.length - 1; i >= 0; i--) {
        var c = this.caps[i]; c.y += 70 * dt;
        if (c.y > PY - 6 && c.y < PY + 6 && Math.abs(c.x - this.px) < this.pw() / 2 + 5) { this.wideT = 12; this.caps.splice(i, 1); A.sfx.coin(); continue; }
        if (c.y > 210) this.caps.splice(i, 1);
      }
      if (!this.bricks.length) { this.level++; this.score += 100; A.sfx.win(); this.build(); this.serve(); this.caps = []; }
    },
    draw: function () {
      var i, pw = this.pw();
      for (i = 0; i < this.bricks.length; i++) {
        var k = this.bricks[i];
        A.R(k.x, k.y, BW, BHT, k.hp > 1 ? C.DK : k.row === 0 ? C.GR : C.FG);
        if (k.cap) A.R(k.x + BW / 2 - 2, k.y + 3, 4, 2, C.AM);
      }
      for (i = 0; i < this.caps.length; i++) { var c = this.caps[i]; A.R(c.x - 6, c.y - 3, 12, 6, C.AM); A.R(c.x - 4, c.y - 2, 8, 1, '#f5d27a'); }
      A.R(this.px - pw / 2, PY, pw, 4, this.wideT > 0 ? C.AM : C.FG);
      A.R(this.ball.x - 2.5, this.ball.y - 2.5, 5, 5);
      for (i = 0; i < this.lives; i++) A.R(56 + i * 9, 10, 6, 6, C.RD);
      A.T('LV ' + this.level, 90, 9, 9, 'left');
      if (this.stuck && A.isPlaying()) A.T('TAP TO LAUNCH', A.W / 2, 150, 8, 'center');
    },
    preview: function () {
      for (var r = 0; r < 4; r++) for (var k = 0; k < 9; k++) { if ((r * 9 + k) % 7 === 3) continue; A.R(8 + k * 25, 22 + r * 9, 22, 6, r === 0 ? C.GR : C.FG); }
      A.R(130, 96, 5, 5); A.R(100, 126, 40, 4); A.T('00360', 232, 6, 12, 'right');
    }
  };
  A.reg(g);
})();
