// Cactus sweeper: Minesweeper with cacti. Tap to dig, long-press to flag.
(function () {
  'use strict';
  var C = A.C, ROWS = 8, CS = 20, TOP = 26;
  var NUMC = ['', '#3b6fd8', C.GR, C.RD, '#7a3bd8', C.AM, '#2a9a9a', C.DK, C.FG];
  var g = {
    id: 'sweeper', name: 'Cactus sweeper', startTap: false, lowerBetter: true,
    help: 'Tap a square to dig. Numbers show how many cacti touch it. Long-press to plant a flag. Clear every safe square!',
    reset: function () {
      this.cols = Math.min(16, Math.floor((A.W - 16) / CS)); this.ox = (A.W - this.cols * CS) / 2;
      this.n = Math.round(this.cols * ROWS * 0.15);
      this.cells = []; for (var i = 0; i < this.cols * ROWS; i++) this.cells.push({ m: false, open: false, flag: false, n: 0 });
      this.planted = false; this.t = 0; this.score = 0; this.press = null; this.boom = -1; this.done = false;
    },
    at: function (x, y) {
      var c = Math.floor((x - this.ox) / CS), r = Math.floor((y - TOP) / CS);
      if (c < 0 || r < 0 || c >= this.cols || r >= ROWS) return -1;
      return r * this.cols + c;
    },
    nb: function (i) {
      var r = Math.floor(i / this.cols), c = i % this.cols, out = [];
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < ROWS && cc < this.cols) out.push(rr * this.cols + cc);
      }
      return out;
    },
    plant: function (safe) {
      var ban = {}; ban[safe] = 1; this.nb(safe).forEach(function (k) { ban[k] = 1; });
      var placed = 0;
      while (placed < this.n) {
        var k = Math.floor(Math.random() * this.cells.length);
        if (ban[k] || this.cells[k].m) continue;
        this.cells[k].m = true; placed++;
      }
      for (var i = 0; i < this.cells.length; i++) {
        var cnt = 0; this.nb(i).forEach(function (j) { if (this.cells[j].m) cnt++; }, this); this.cells[i].n = cnt;
      }
      this.planted = true;
    },
    reveal: function (i) {
      var c = this.cells[i];
      if (c.open || c.flag) return;
      if (!this.planted) this.plant(i);
      if (c.m) { c.open = true; this.boom = i; this.cells.forEach(function (x) { if (x.m) x.open = true; }); A.over('KABOOM!'); return; }
      var stack = [i], opened = 0;
      while (stack.length) {
        var k = stack.pop(), cell = this.cells[k];
        if (cell.open || cell.flag) continue;
        cell.open = true; opened++;
        if (cell.n === 0) this.nb(k).forEach(function (j) { if (!this.cells[j].open) stack.push(j); }, this);
      }
      A.beep(500 + Math.min(opened, 20) * 30, 0.05, 'square', 0.035);
      var left = 0; this.cells.forEach(function (x) { if (!x.m && !x.open) left++; });
      if (!left) { this.done = true; this.score = Math.max(1, Math.ceil(this.t)); this.cells.forEach(function (x) { if (x.m) x.flag = true; }); A.over('CLEARED!', true); }
    },
    chord: function (i) {
      // tapping an opened number with enough flags around digs the rest
      var c = this.cells[i], f = 0, list = this.nb(i);
      list.forEach(function (j) { if (this.cells[j].flag) f++; }, this);
      if (c.n > 0 && f === c.n) list.forEach(function (j) { if (A.isPlaying()) this.reveal(j); }, this);
    },
    down: function (x, y, id) { var i = this.at(x, y); if (i >= 0) this.press = { i: i, t: 0, id: id, done: false }; },
    move: function (x, y, id) { if (this.press && this.press.id === id && this.at(x, y) !== this.press.i) this.press = null; },
    up: function (x, y, id) {
      var p = this.press; this.press = null;
      if (!p || p.id !== id || p.done) return;
      var c = this.cells[p.i];
      if (c.open) this.chord(p.i); else this.reveal(p.i);
    },
    update: function (dt) {
      if (this.planted) this.t += dt;
      this.score = Math.ceil(this.t);
      if (this.press && !this.press.done) {
        this.press.t += dt;
        if (this.press.t > 0.35) {
          var c = this.cells[this.press.i];
          if (!c.open) { c.flag = !c.flag; A.vibe(25); A.beep(c.flag ? 900 : 400, 0.06, 'square', 0.04); }
          this.press.done = true;
        }
      }
    },
    cactusIcon: function (x, y, col) { A.R(x + 8, y + 3, 4, 14, col); A.R(x + 4, y + 7, 3, 6, col); A.R(x + 4, y + 11, 4, 2, col); A.R(x + 13, y + 5, 3, 6, col); A.R(x + 12, y + 9, 4, 2, col); },
    flagIcon: function (x, y) { A.R(x + 7, y + 4, 2, 12, C.FG); A.R(x + 9, y + 4, 6, 5, C.RD); A.R(x + 5, y + 15, 8, 2, C.FG); },
    draw: function () {
      for (var i = 0; i < this.cells.length; i++) {
        var c = this.cells[i], x = this.ox + (i % this.cols) * CS, y = TOP + Math.floor(i / this.cols) * CS;
        if (c.open) {
          A.R(x, y, CS - 1, CS - 1, i === this.boom ? '#f3b9a8' : '#e9e9e9');
          if (c.m) this.cactusIcon(x, y, i === this.boom ? C.RD : C.GR);
          else if (c.n) A.T(String(c.n), x + CS / 2 - 0.5, y + CS / 2, 12, 'center', NUMC[c.n], 'middle');
        } else {
          var pressed = this.press && this.press.i === i && !this.press.done;
          A.R(x, y, CS - 1, CS - 1, pressed ? '#6a6a6a' : C.FG);
          A.R(x, y, CS - 1, 1.5, '#737373');
          if (c.flag) { A.R(x + 2, y + 2, CS - 5, CS - 5, '#e9e9e9'); this.flagIcon(x, y); }
        }
      }
    },
    hudText: function () {
      var f = 0; this.cells.forEach(function (c) { if (c.flag) f++; });
      return 'FLAGS ' + Math.max(0, this.n - f) + '  TIME ' + A.pad(this.t, 3);
    },
    overText: function () { return this.done ? 'TIME ' + this.score + 's' : 'TRY AGAIN!'; },
    preview: function () {
      var n = [[1, 1, 2, 0, 0], [0, 'f', 2, 0, 0], [1, 1, 1, 0, 0], [0, 0, 1, 2, 'f'], [0, 0, 0, 0, 0]];
      for (var i = 0; i < 5; i++) for (var j = 0; j < 8; j++) {
        var a = 44 + j * 19, b = 14 + i * 23, cell = j < 5 ? n[i][j] : 0, shut = (j >= 4 && i < 3) || cell === 'f';
        A.R(a, b, 17, 20, shut ? C.FG : '#e9e9e9');
        if (cell === 'f') { A.R(a + 2, b + 2, 13, 16, '#e9e9e9'); this.flagIcon(a - 1, b + 1); }
        else if (cell && !shut) A.T(String(cell), a + 8.5, b + 5, 12, 'center', NUMC[cell]);
      }
    }
  };
  A.reg(g);
})();
