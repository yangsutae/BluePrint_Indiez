/* 랜딩 K0 손그림 — 3면도(SVG)와 입체도(캔버스)를 손으로 그은 선으로 그림
   test/첫화면_스케치_시안.html에서 고른 값: 강 단계, 끝 흐려짐 50%, 흐려짐 범위 14%, 선 연장 1.55×, 곡선 강도 1×, 곡선 랜덤성 1.8×, 선 굵기 1.1×, 무작위 0
   BPI.sketch.defs()      3면도 SVG 맨 앞에 둘 <defs> (끝 흐려짐 기본 그라디언트)
   BPI.sketch.cons()      투상 보조선 묶음. 3면도를 만들 때 먼저 불러 무작위 순서를 시안과 같게 함
   BPI.sketch.svg(svg)    도면 선·사각형·다각형·인출선·원을 손그림 path로 바꿈 (점·화살촉·글자는 그대로)
   BPI.sketch.iso(ctx, m) lowpoly 선 모델 m을 손그림 선과 옆판 빗금으로 그림 */
(function () {
  var BPI = window.BPI = window.BPI || {};
  var NS = 'http://www.w3.org/2000/svg';
  /* LV 두 번째 획 기준 단계(강 3), K 원 겹침 배율(강), over 선 연장, bow 곡선 강도, rand 곡선 랜덤성, w 굵기, fade 끝 흐려짐, range 흐려짐 범위 */
  var S = { LV: 3, K: 1.7, over: 1.55, bow: 1, rand: 1.8, w: 1.1, fade: .5, range: .14, seed: 0 };
  /* 선 종류별: over 끝 넘침(px), j 떨림, bow 휨(100px당), w 굵기, op 진하기, twice 두 번째 획을 더하는 단계 */
  var HAND = {
    ln:     { over: 7, j: 1.1, bow: .8, w: [1.5, 2.3], op: [.8, 1], twice: 2 },
    thin:   { over: 4, j: .8, bow: .5, w: [.8, 1.3], op: [.6, .95], twice: 3 },
    ground: { over: 16, j: 1, bow: .6, w: [1, 1.4], op: [.7, .9], twice: 2 },
    dim:    { over: 0, j: .4, bow: .3, w: [.9, 1.1], op: [.8, 1] },
    hid:    { over: 0, j: .6, bow: .4, w: [.9, 1.1], op: [.8, 1] },
    ctr:    { over: 0, j: .6, bow: .3, w: [.9, 1.1], op: [.8, 1] },
    cons:   { over: 30, j: .8, bow: .5, w: [.6, .9], op: [.6, 1] }
  };
  var KEY = /\b(ln|thin|ground|dim|hid|ctr|cons)\b/;

  /* 고정 시드 무작위: 새로고침해도 같은 그림 */
  var rnd;
  function seed(s) { rnd = function () { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function J(a) { return (rnd() * 2 - 1) * a; }
  function pick(r) { return r[0] + rnd() * (r[1] - r[0]); }
  function f(v) { return v.toFixed(1); }

  /* 선 하나 → [시작, 조절점 2개, 끝]. t 배율 {over 끝 넘침, j 떨림, bow 휨}, 짧은 선일수록 덜 흔들림 */
  var ONE = { over: 1, j: 1, bow: 1 };
  function stroke(x1, y1, x2, y2, o, t) {
    t = t || ONE;
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var ov = Math.min(o.over * t.over, L * .2 * Math.max(1, t.over)), a = ov * (.2 + rnd() * .8), b = ov * (.2 + rnd() * .8);   /* 짧은 선은 길이의 20%까지만, 연장 배율만큼 늘어남 */
    var j = o.j * t.j * Math.min(1, L / 40), bow = J(o.bow * t.bow * Math.min(L, 240) / 100);
    var sx = x1 - ux * a + nx * J(j), sy = y1 - uy * a + ny * J(j), ex = x2 + ux * b + nx * J(j), ey = y2 + uy * b + ny * J(j);
    var k1 = bow + J(j * .6), k2 = bow + J(j * .6);
    return [sx, sy, sx + (ex - sx) / 3 + nx * k1, sy + (ey - sy) / 3 + ny * k1, sx + (ex - sx) * 2 / 3 + nx * k2, sy + (ey - sy) * 2 / 3 + ny * k2, ex, ey];
  }
  function curve(c) { return 'M' + f(c[0]) + ' ' + f(c[1]) + 'C' + c.slice(2).map(f).join(' '); }
  /* 원: 한 바퀴를 조금 넘겨 시작점과 겹침 */
  function ring(cx, cy, r) {
    var n = Math.max(12, Math.round(r * 2)), t0 = rnd() * 6.28, sweep = 6.28 + (.3 + rnd() * .5) * S.K, sx = 1 + J(.05 * S.K), sy = 1 + J(.05 * S.K), d = '';
    for (var i = 0; i <= n; i++) {
      var t = t0 + sweep * i / n, rr = r * (1 + .05 * S.K * i / n) + J(r * .015);
      d += (i ? 'L' : 'M') + f(cx + rr * sx * Math.cos(t)) + ' ' + f(cy + rr * sy * Math.sin(t));
    }
    return d;
  }

  /* 끝 흐려짐: 선의 시작 → 끝 방향 그라디언트. 색·투명도 단계는 선 색별 기본 그라디언트(#fade-*)에서 물려받음 */
  var fadeDefs, fadeN = 0;
  function tone(cls) { return /\bln\b/.test(cls) ? 'line' : /\bcons\b/.test(cls) ? 'cons' : 'line-soft'; }   /* base.css .dwg 선 색 */
  function fade(p, c, cls) {
    var g = document.createElementNS(NS, 'linearGradient'), id = 'fg' + (++fadeN);
    g.id = id; g.setAttribute('gradientUnits', 'userSpaceOnUse'); g.setAttribute('href', '#fade-' + tone(cls));
    g.setAttribute('x1', f(c[0])); g.setAttribute('y1', f(c[1])); g.setAttribute('x2', f(c[6])); g.setAttribute('y2', f(c[7]));
    fadeDefs.appendChild(g);
    p.style.stroke = 'url(#' + id + ')';
  }

  /* 선 묶음(segs)은 선마다, 원(c)은 하나로 손그림 path를 만듦. 두 번째 획은 가늘고 연하게 뒤에 */
  function hand(cls, o, segs, c) {
    var out = [], t = { over: S.over, j: S.rand, bow: S.bow };
    for (var n = o.twice && S.LV >= o.twice ? 1 : 0; n >= 0; n--) {
      var w = f(pick(o.w) * S.w * (n ? .55 : 1)), op = (pick(o.op) * (n ? .6 : 1)).toFixed(2);
      (c ? [ring(c[0], c[1], c[2])] : segs.map(function (s) { return stroke(s[0], s[1], s[2], s[3], o, t); })).forEach(function (d) {
        var p = document.createElementNS(NS, 'path');
        if (cls) p.setAttribute('class', cls);
        p.setAttribute('d', c ? d : curve(d));
        if (!c) fade(p, d, cls);
        p.style.strokeWidth = w; p.style.strokeOpacity = op;
        out.push(p);
      });
    }
    return out;
  }
  function segs(el) {
    var a = function (n) { return +el.getAttribute(n) || 0; }, p;
    if (el.tagName === 'line') return [[a('x1'), a('y1'), a('x2'), a('y2')]];
    if (el.tagName === 'path') {   /* 인출선: M·L·H·V만 씀 */
      var cur = [0, 0]; p = [];
      el.getAttribute('d').replace(/([MLHV])([^MLHV]*)/g, function (_, c, val) {
        var n = val.trim().split(/[\s,]+/).map(Number);
        cur = c === 'H' ? [n[0], cur[1]] : c === 'V' ? [cur[0], n[0]] : n;
        p.push(cur);
      });
      return p.slice(1).map(function (q, i) { return [p[i][0], p[i][1], q[0], q[1]]; });
    }
    if (el.tagName === 'rect') { var x = a('x'), y = a('y'), r = x + a('width'), d = y + a('height'); return [[x, y, r, y], [r, y, r, d], [r, d, x, d], [x, d, x, y]]; }
    p = el.getAttribute('points').trim().split(/\s+/).map(function (q) { return q.split(',').map(Number); });
    return p.map(function (q, i) { var r = p[(i + 1) % p.length]; return [q[0], q[1], r[0], r[1]]; });
  }

  /* ── 입체도: lowpoly가 면마다 긋는 외곽선을 손그림 선으로 바꿔 그림. 이웃 면이 같은 모서리를 따로 그어 자연히 겹친 선이 됨 ── */
  var ISO_LINE = 'rgba(238,240,233,.82)', ISO_HATCH = 'rgba(238,240,233,.3)', ISO_HAND = { over: 4, j: .7, bow: .5 }, HATCH = Math.PI / 3;   /* 빗금 60°: 로고 글자 안 빗금 방향 */
  function handCtx(ctx, sides) {
    var pts = [];
    var own = {
      beginPath: function () { pts = []; ctx.beginPath(); },
      moveTo: function (x, y) { pts.push([x, y]); ctx.moveTo(x, y); },
      lineTo: function (x, y) { pts.push([x, y]); ctx.lineTo(x, y); },
      fill: function () { if (pts.length === BPI.PROFILE.length) sides.push(pts.slice()); ctx.fill(); },
      stroke: function () {
        var w = ctx.lineWidth;
        ctx.strokeStyle = ISO_LINE;
        pts.forEach(function (p, i) { var q = pts[(i + 1) % pts.length]; ctx.lineWidth = w * (.8 + rnd() * .5); line(ctx, stroke(p[0], p[1], q[0], q[1], ISO_HAND)); });
      }
    };
    return new Proxy(ctx, {
      get: function (t, n) { return own[n] || (typeof t[n] === 'function' ? t[n].bind(t) : t[n]); },
      set: function (t, n, val) { t[n] = val; return true; }
    });
  }
  function line(ctx, c) { ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]); ctx.stroke(); }
  /* 보이는 옆판(옆판 윤곽 중 가장 오른쪽)에 빗금. 빗금 끝은 윤곽에서 조금씩 넘치거나 모자람 */
  function hatch(ctx, sides) {
    var mx = function (p) { return p.reduce(function (s, q) { return s + q[0]; }, 0) / p.length; };
    var poly = sides.reduce(function (a, b) { return mx(b) > mx(a) ? b : a; });
    var d = [Math.cos(HATCH), -Math.sin(HATCH)], n = [-d[1], d[0]];
    var pr = poly.map(function (p) { return p[0] * n[0] + p[1] * n[1]; });
    ctx.strokeStyle = ISO_HATCH; ctx.lineWidth = .8;
    for (var t = Math.min.apply(null, pr) + 3; t < Math.max.apply(null, pr); t += 6 + J(1)) {
      var hits = [];
      poly.forEach(function (a, i) {
        var j = (i + 1) % poly.length, b = poly[j];
        if ((pr[i] - t) * (pr[j] - t) < 0) { var u = (t - pr[i]) / (pr[j] - pr[i]), x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u; hits.push([x * d[0] + y * d[1], x, y]); }
      });
      hits.sort(function (a, b) { return a[0] - b[0]; });
      for (var i = 0; i + 1 < hits.length; i += 2) line(ctx, stroke(hits[i][1], hits[i][2], hits[i + 1][1], hits[i + 1][2], { over: 3, j: .8, bow: .4 }));
    }
  }

  BPI.sketch = {
    defs: function () {
      var a = (1 - S.fade).toFixed(2), r = S.range;
      return '<defs>' + ['line', 'line-soft', 'cons'].map(function (t) {
        return '<linearGradient id="fade-' + t + '">' + [[0, a], [r, 1], [1 - r, 1], [1, a]].map(function (s) {
          return '<stop offset="' + s[0] + '" style="stop-color:var(--' + t + ');stop-opacity:' + s[1] + '"/>';
        }).join('') + '</linearGradient>';
      }).join('') + '</defs>';
    },
    /* 투상 보조선: 정면도·우측면도의 같은 높이, 평면도·정면도의 같은 너비를 잇는 연한 선 */
    cons: function () {
      seed(11 + S.seed);
      var s = '';
      [0, 104, 128, 262, 282, 320, 520, 114, 300, 498].forEach(function (y) { s += '<line class="cons" x1="' + f(-24 - rnd() * 30) + '" y1="' + y + '" x2="' + f(500 + rnd() * 40) + '" y2="' + y + '"/>'; });
      [0, 10, 230, 240].forEach(function (x) { s += '<line class="cons" x1="' + x + '" y1="' + f(-270 - rnd() * 20) + '" x2="' + x + '" y2="' + f(530 + rnd() * 20) + '"/>'; });
      return '<g>' + s + '</g>';
    },
    svg: function (svg) {
      fadeDefs = svg.querySelector('defs');
      svg.querySelectorAll('line, rect, polygon, path, circle').forEach(function (el) {
        var key = ((el.getAttribute('class') || '').match(KEY) || [])[1];
        if (!key) return;
        var c = el.tagName === 'circle' ? [+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r')] : null;
        hand(el.getAttribute('class'), HAND[key], c ? null : segs(el), c).forEach(function (p) {
          ['marker-start', 'marker-end'].forEach(function (n) { if (el.hasAttribute(n)) p.setAttribute(n, el.getAttribute(n)); });
          el.before(p);
        });
        el.remove();
      });
    },
    iso: function (ctx, model) {
      var sides = [];
      seed(7);
      model.draw(handCtx(ctx, sides), 1);
      if (sides.length) hatch(ctx, sides);
    }
  };
})();
