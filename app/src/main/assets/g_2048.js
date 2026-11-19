// 2048: swipe to slide tiles, merge equal numbers, hatch the dragon egg at 2048.
(function () {
  'use strict';
  var C = A.C, N = 4, CS = 40, GAP = 4;
  var COL = { 2: '#e8e8e8', 4: '#d8d8d8', 8: '#c2c2c2', 16: '#ababab', 32: '#949494', 64: '#7d7d7d', 128: '#686868', 256: '#575757', 512: '#474747', 1024: '#383838' };
  var EGG = ['..eeee..', '.eeggee.', 'eeeeeeee', 'egeeeege', 'eeeeeeee', 'eeegeeee', '.eeeeee.', '..eeee..'];
  var g = {
    id: '2048', name: '2048 dragon egg', startTap: false,
    help: 'Swipe to slide all tiles. Two equal tiles merge into one. Reach 2048 to hatch the dragon egg!',
    reset: function () {
      this.grid = []; for (var i = 0; i < N * N; i++) this.grid.push(0);
      this.pops = {}; this.score = 0; this.won = false; this.msgT = 0;
      this.add(); this.add();
    },
    add: function () {
      var free = [];
      for (var i = 0; i < N * N; i++) if (!this.grid[i]) free.push(i);
      if (!free.length) return;
      var k = free[Math.floor(Math.random() * free.length)];
      this.grid[k] = Math.random() < 0.9 ? 2 : 4; this.pops[k] = 0.15;
    },
    line: function (idx) {
      var vals = idx.map(function (i) { return this.grid[i]; }, this).filter(function (v) { return v; });
      var out = [], merged = [];
      for (var i = 0; i < vals.length; i++) {
        if (i + 1 < vals.length && vals[i] === vals[i + 1]) { out.push(vals[i] * 2); merged.push(out.length - 1); this.score += vals[i] * 2; i++; }
        else out.push(vals[i]);
      }
      while (out.length < N) out.push(0);
      var moved = false;
      for (var j = 0; j < N; j++) { if (this.grid[idx[j]] !== out[j]) moved = true; this.grid[idx[j]] = out[j]; }
      merged.forEach(function (m) { this.pops[idx[m]] = 0.12; if (out[m] === 2048 && !this.won) { this.won = true; this.msgT = 2.5; A.sfx.win(); } }, this);
      return moved;
    },
    swipe: function (dir) {
      var moved = false, r, c, idx;
      for (var k = 0; k < N; k++) {
        idx = [];
        for (var m = 0; m < N; m++) {
          if (dir === 'left') { r = k; c = m; } else if (dir === 'right') { r = k; c = N - 1 - m; }
          else if (dir === 'up') { r = m; c = k; } else { r = N - 1 - m; c = k; }
          idx.push(r * N + c);
        }
        if (this.line(idx)) moved = true;
      }
      if (moved) { this.add(); A.sfx.tick(); if (!this.canMove()) A.over('NO MOVES LEFT'); }
    },
    canMove: function () {
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var v = this.grid[r * N + c];
        if (!v) return true;
        if (c < N - 1 && this.grid[r * N + c + 1] === v) return true;
        if (r < N - 1 && this.grid[(r + 1) * N + c] === v) return true;
      }
      return false;
    },
    update: function (dt) {
      for (var k in this.pops) { this.pops[k] -= dt; if (this.pops[k] <= 0) delete this.pops[k]; }
      if (this.msgT > 0) this.msgT -= dt;
    },
    tile: function (x, y, s, v) {
      if (!v) { A.R(x, y, s, s, '#e4e4e4'); return; }
      if (v >= 2048) {
        A.R(x, y, s, s, C.GR);
        if (v === 2048) A.S(EGG, x + s / 2 - 12, y + s / 2 - 12, 3);
        else A.T(String(v), x + s / 2, y + s / 2, s * 0.26, 'center', '#ffffff', 'middle');
        return;
      }
      A.R(x, y, s, s, COL[v]);
      A.T(String(v), x + s / 2, y + s / 2 + 1, v >= 1000 ? s * 0.28 : v >= 100 ? s * 0.34 : s * 0.42, 'center', v >= 32 ? '#ffffff' : C.FG, 'middle');
    },
    draw: function () {
      var size = N * CS + (N + 1) * GAP, x0 = A.W / 2 - size / 2, y0 = 200 - size - 4;
      A.R(x0, y0, size, size, C.FG);
      for (var i = 0; i < N * N; i++) {
        var r = Math.floor(i / N), c = i % N, p = this.pops[i] ? 2 : 0;
        this.tile(x0 + GAP + c * (CS + GAP) - p, y0 + GAP + r * (CS + GAP) - p, CS + 2 * p, this.grid[i]);
      }
      if (this.msgT > 0) { A.R(A.W / 2 - 80, 92, 160, 20, C.BG); A.T('THE EGG HATCHED!', A.W / 2, 97, 11, 'center', C.GR); }
    },
    hudText: function () { return A.pad(this.score); },
    preview: function () {
      var v = [[2, 4, 8, 0], [0, 16, 0, 2], [32, 64, 128, 4], [256, 512, 1024, 2048]];
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) this.tile(62 + j * 30, 12 + i * 30, 27, v[i][j]);
    }
  };
  A.reg(g);
})();
