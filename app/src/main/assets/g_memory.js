// Memory match: flip two cards at a time and find all 12 pairs.
(function () {
  'use strict';
  var C = A.C, ROWS = 4, COLS = 6, CW = 34, CH = 38, GAP = 5, P = 2.5;
  var ICONS = [
    ['...g....', '..ggg...', 'g.ggg...', 'g.ggg.g.', 'ggggg.g.', '..ggggg.', '..ggg...', '..ggg...'],
    ['........', '.#......', '##......', '########', '.######.', '...###..', '........', '........'],
    ['..#..#..', '.######.', '.#o#####', '.#######', '.####...', '.######.', '.####...', '..#..#..'],
    ['a..a..a.', '.aaaaa..', 'aaaaaaa.', '.aaaaaa.', 'aaaaaaa.', '.aaaaa..', 'a..a..a.', '........'],
    ['..kkk...', '.kk.....', 'kk......', 'kk......', 'kk......', '.kk.....', '..kkk...', '........'],
    ['..aaaa..', '.aaaaaa.', 'aaa..aaa', 'aa.aa.aa', 'aa.aa.aa', 'aaa..aaa', '.aaaaaa.', '..aaaa..'],
    ['...ee...', '..eeee..', '.eegeee.', '.eeeeee.', 'eeeeegee', 'eegeeeee', '.eeeeee.', '..eeee..'],
    ['.rr..rr.', 'rrrrrrrr', 'rrrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...', '........'],
    ['...aa...', '...aa...', 'aaaaaaaa', '.aaaaaa.', '..aaaa..', '.aa..aa.', 'aa....aa', '........'],
    ['..rrrr..', '.rrllrr.', 'rrrrrrrr', 'rlrrrrlr', '..llll..', '..llll..', '..llll..', '........'],
    ['.aaa....', 'a...a...', 'a...a...', '.aaa....', '..a.....', '..aaa...', '..a.....', '..aa....'],
    ['.g....g.', '..g..g..', '.gggggg.', 'gg.gg.gg', 'gggggggg', 'g.gggg.g', 'g.g..g.g', '...gg...']
  ];
  var g = {
    id: 'memory', name: 'Memory match', startTap: false, lowerBetter: true,
    help: 'Tap two cards to flip them. Find all 12 matching pairs in as few moves as you can.',
    reset: function () {
      var deck = [];
      for (var i = 0; i < 12; i++) deck.push(i, i);
      for (var j = deck.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)), t = deck[j]; deck[j] = deck[k]; deck[k] = t; }
      this.cards = deck.map(function (v) { return { v: v, up: false, done: false, f: 0 }; });
      this.sel = []; this.wait = 0; this.score = 0; this.found = 0;
      this.x0 = A.W / 2 - (COLS * CW + (COLS - 1) * GAP) / 2; this.y0 = 200 - (ROWS * CH + (ROWS - 1) * GAP) - 6;
    },
    down: function (x, y) {
      if (this.wait > 0) return;
      var c = Math.floor((x - this.x0) / (CW + GAP)), r = Math.floor((y - this.y0) / (CH + GAP));
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
      if (x - this.x0 - c * (CW + GAP) > CW || y - this.y0 - r * (CH + GAP) > CH) return;
      var i = r * COLS + c, card = this.cards[i];
      if (card.up || card.done) return;
      card.up = true; this.sel.push(i); A.sfx.tick();
      if (this.sel.length === 2) {
        this.score++;
        var a = this.cards[this.sel[0]], b = this.cards[this.sel[1]];
        if (a.v === b.v) {
          a.done = b.done = true; this.sel = []; this.found++; A.sfx.coin();
          if (this.found === 12) A.over('ALL MATCHED!', true);
        } else this.wait = 0.8;
      }
    },
    update: function (dt) {
      this.cards.forEach(function (c) { var t = c.up || c.done ? 1 : 0; c.f += (t - c.f) * Math.min(1, dt * 14); });
      if (this.wait > 0) {
        this.wait -= dt;
        if (this.wait <= 0) { this.sel.forEach(function (i) { this.cards[i].up = false; }, this); this.sel = []; A.beep(250, 0.08, 'square', 0.03); }
      }
    },
    card: function (x, y, w, h, f, v, done) {
      var sx = Math.abs(Math.cos(f * Math.PI)), showFace = f > 0.5, ww = Math.max(1, w * sx), xx = x + (w - ww) / 2;
      if (!showFace) {
        A.R(xx, y, ww, h, C.FG);
        if (ww > 10) { A.R(x + w / 2 - 3, y + h / 2 - 3, 6, 6, C.BG); A.R(x + w / 2 - 1.5, y + h / 2 - 1.5, 3, 3, C.FG); }
      } else {
        A.R(xx, y, ww, h, done ? '#dff0e6' : '#ffffff');
        A.ctx.strokeStyle = done ? C.GR : C.FG; A.ctx.lineWidth = 1.2; A.ctx.strokeRect(xx + 0.6, y + 0.6, ww - 1.2, h - 1.2);
        if (ww > w * 0.8) A.S(ICONS[v], x + w / 2 - 4 * P, y + h / 2 - 4 * P, P);
      }
    },
    draw: function () {
      for (var i = 0; i < this.cards.length; i++) {
        var c = this.cards[i], x = this.x0 + (i % COLS) * (CW + GAP), y = this.y0 + Math.floor(i / COLS) * (CH + GAP);
        this.card(x, y, CW, CH, c.f, c.v, c.done);
      }
    },
    hudText: function () { return 'PAIRS ' + this.found + '/12  MOVES ' + this.score; },
    overText: function () { return 'DONE IN ' + this.score + ' MOVES'; },
    preview: function () {
      for (var i = 0; i < 3; i++) for (var j = 0; j < 5; j++) {
        var k = i * 5 + j, open = k === 1 || k === 7 || k === 12;
        this.card(24 + j * 40, 14 + i * 40, 34, 36, open ? 1 : 0, k === 7 ? 1 : 0, false);
      }
    }
  };
  A.reg(g);
})();
