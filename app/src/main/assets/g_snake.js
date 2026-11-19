// Snake: swipe to turn, eat apples, don't hit the walls or yourself.
(function () {
  'use strict';
  var C = A.C, CELL = 10, TOP = 26, ROWS = 17;
  var OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  var D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var g = {
    id: 'snake', name: 'Snake', startTap: false, multiSwipe: true,
    help: 'Swipe up, down, left or right to steer. Eat the apples to grow. Don\'t bite yourself or hit the walls!',
    reset: function () {
      this.cols = Math.floor((A.W - 12) / CELL); this.ox = (A.W - this.cols * CELL) / 2;
      var cy = Math.floor(ROWS / 2), cx = Math.floor(this.cols / 3);
      this.body = [[cx - 2, cy], [cx - 1, cy], [cx, cy]];
      this.dir = 'right'; this.queue = []; this.t = 0; this.step = 0.13; this.score = 0; this.grow = 0; this.pop = 0;
      this.placeFood();
    },
    resize: function () { },
    placeFood: function () {
      var free = [], occ = {};
      this.body.forEach(function (b) { occ[b[0] + ',' + b[1]] = 1; });
      for (var x = 0; x < this.cols; x++) for (var y = 0; y < ROWS; y++) if (!occ[x + ',' + y]) free.push([x, y]);
      this.food = free[Math.floor(Math.random() * free.length)];
      this.gold = Math.random() < 0.15;
    },
    swipe: function (dir) {
      var last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
      if (dir === last || dir === OPP[last] || this.queue.length > 2) return;
      this.queue.push(dir);
    },
    update: function (dt) {
      this.t += dt; if (this.pop > 0) this.pop -= dt;
      while (this.t >= this.step) {
        this.t -= this.step;
        if (this.queue.length) this.dir = this.queue.shift();
        var h = this.body[this.body.length - 1], n = [h[0] + D[this.dir][0], h[1] + D[this.dir][1]];
        if (n[0] < 0 || n[1] < 0 || n[0] >= this.cols || n[1] >= ROWS) { A.over(); return; }
        for (var i = this.grow > 0 ? 0 : 1; i < this.body.length; i++) if (this.body[i][0] === n[0] && this.body[i][1] === n[1]) { A.over(); return; }
        this.body.push(n);
        if (n[0] === this.food[0] && n[1] === this.food[1]) {
          this.score += this.gold ? 50 : 10; this.grow += this.gold ? 3 : 1; this.pop = 0.2;
          if (this.gold) A.sfx.coin(); else A.sfx.blip();
          this.step = Math.max(0.06, this.step - 0.003);
          this.placeFood();
        }
        if (this.grow > 0) this.grow--; else this.body.shift();
      }
    },
    draw: function () {
      var ox = this.ox, i;
      A.ctx.strokeStyle = C.FG; A.ctx.lineWidth = 1.5;
      A.ctx.strokeRect(ox - 1.5, TOP - 1.5, this.cols * CELL + 3, ROWS * CELL + 3);
      for (var x = 0; x < this.cols; x++) for (var y = 0; y < ROWS; y++) A.R(ox + x * CELL + 4.5, TOP + y * CELL + 4.5, 1, 1, C.LT);
      var f = this.food, fx = ox + f[0] * CELL, fy = TOP + f[1] * CELL, s = this.pop > 0 ? 1 : 0;
      if (this.gold) { A.coin(fx, fy); }
      else { A.R(fx + 1 - s, fy + 2 - s, 8 + 2 * s, 7 + 2 * s, C.RD); A.R(fx + 2, fy + 1, 6, 1, C.RD); A.R(fx + 4, fy - 1, 2, 3, C.GR); }
      for (i = 0; i < this.body.length; i++) {
        var b = this.body[i], head = i === this.body.length - 1;
        A.R(ox + b[0] * CELL + 0.5, TOP + b[1] * CELL + 0.5, CELL - 1, CELL - 1, head ? C.GR : (i % 2 ? C.FG : '#666666'));
        if (head) {
          var d = D[this.dir], cx = ox + b[0] * CELL + 4, cy = TOP + b[1] * CELL + 4;
          A.R(cx + d[0] * 2 - d[1] * 2, cy + d[1] * 2 + d[0] * 2, 2, 2, C.BG);
          A.R(cx + d[0] * 2 + d[1] * 2, cy + d[1] * 2 - d[0] * 2, 2, 2, C.BG);
        }
      }
    },
    preview: function () {
      for (var i = 0; i < 240; i += 10) for (var j = 20; j < 140; j += 10) A.R(i + 4, j + 4, 1, 1, C.LT);
      var s = [[6, 8], [7, 8], [8, 8], [9, 8], [9, 7], [9, 6], [10, 6], [11, 6], [12, 6]];
      s.forEach(function (p, k) { A.R(p[0] * 10 + 1, p[1] * 10 + 1, 9, 9, k === s.length - 1 ? C.GR : C.FG); });
      A.R(171, 91, 8, 8, C.RD); A.R(174, 88, 2, 4, C.GR); A.T('00090', 232, 6, 12, 'right');
    }
  };
  A.reg(g);
})();
