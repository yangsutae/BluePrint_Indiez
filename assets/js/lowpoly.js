/* 아케이드 캐비닛 로우 폴리 모델 — 2D 캔버스 판 (261002)
   _archive/260928-landing/js/lowpoly.js(CSS 3D, 면마다 div)와 같은 치수·색·명암·원근(1700px).
   면을 DOM으로 만들지 않고 좌표로만 들고, 원근 투영과 앞뒤 순서를 직접 계산해 2D 캔버스에 그림.
   CSS 3D 변환을 쓰지 않으므로 하드웨어 가속이 꺼진 브라우저에서도 깨지지 않음 (animejs.com처럼 2D 캔버스 방식).

   BPI.lowpoly(opt) → api
     opt.mode  : 'wire'(청사진 선) | 기본(면)
     opt.theme : 'blueprint'(청사진 색 + 흰 외곽선) | 기본(참고 사진 색)
     opt.rx, opt.ry, opt.s : 처음 각도(도)·크기
   api.setView(rx, ry, s, dz)   보는 각도·크기·깊이 비율 (원본과 같음)
   api.parts[이름] = { o: [x, y, z], s: 1, c: [x, y, z] }   부품 이동·배율(기준점 c). 원본에서 부품 묶음 CSS transform에 주던 값
   api.focus(이름 | null)       강조 부품 (나머지 흐림, 약 0.35초 전환)
   api.step(초)                 흐림 전환 진행. 아직 바뀌는 중이면 true
   api.draw(ctx, alpha)         지금 ctx 좌표(모델 상자 220×520 기준)에 그림
   api.anchor(이름)             기준점의 화면 좌표 [x, y] (모델 상자 기준)
   BPI.planeMatrix(rx, ry, s, dz)  모델 앞면(z 0) 평면을 화면에 놓는 2D matrix() — 3면도 그림 맞춤용
   부품 기준점: marquee|screen|panel|joy1|joy2|btn1|btn2|start|door|coin1|coin2
*/
(function () {
  var BPI = window.BPI = window.BPI || {};
  var W = 220, H = 520, T = 10;
  var PERSP = 1700, OX = 110, OY = 260, OZ = -105;   /* 원본 .stage3d perspective, .lp transform-origin */
  /* 옆판 윤곽 [깊이(앞→뒤), 높이(위→아래)] */
  var P = [[12,0],[12,104],[48,114],[70,128],[50,262],[0,282],[4,300],[30,320],[30,520],[210,520],[210,0]];
  BPI.PROFILE = P; BPI.W = W; BPI.H = H; BPI.T = T;

  /* 원본 색 (참고 사진) */
  var C_ORIG = {
    body: '#1a1a22', side: '#1d1d28', top: '#22222d', back: '#101016', bottom: '#09090c', socket: '#0c0c11',
    trim: '#5d62ff', trimGlow: 'rgba(110,100,255,.75)',
    marqueeBase: '#16102a', marqueeLit: '#ff4d6a', marqueeRim: '#4fc3ff', marqueeGlow: 'rgba(255,77,106,.55)', rimGlow: 'rgba(79,195,255,.6)',
    under: '#0e0e13', speaker: '#1f1f28', slot: '#0a0a0d',
    bezel: '#0f1016', screen: '#1d38d8', screenOff: '#0b0f24', screenGlow: 'rgba(60,110,255,.7)', screenBright: '#3a5cff', brightGlow: 'rgba(120,170,255,.95)',
    cpTop: '#5b606e', cpFront: '#1b1c25', cpUnder: '#0f0f14',
    door: '#2a2b34', doorFrame: '#34353f', coin: '#ff3434', coinGlow: 'rgba(255,52,52,.8)', kick: '#0c0c10', ret: '#1d1e25',
    shaft: '#c8ccd8', ball: '#e2262a', plate: '#101014',
    btn: ['#ff3b3b', '#ffd23b', '#3b8cff', '#3bdc6a', '#ff8a2b', '#ff4fb8'],
    startSide: '#9a9ca6', startTop: '#f1f2f6',
    p1Side: '#551515', p1: '#ff3b3b', p1Glow: 'rgba(255,59,59,.8)', p2Side: '#15335a', p2: '#35a2ff', p2Glow: 'rgba(53,162,255,.8)'
  };
  /* 청사진 색 (웹 배경 #23466A에 맞춤: 블루 명도 단계 + 미색·시안 강조) */
  var C_BP = {
    body: '#2e5f8c', side: '#2b5985', top: '#3c72a3', back: '#244d74', bottom: '#1b3a5a', socket: '#17314e',
    trim: '#a6e8eb', trimGlow: 'rgba(166,232,235,.35)',
    marqueeBase: '#1f4468', marqueeLit: '#2f6aa0', marqueeRim: '#a6e8eb', marqueeGlow: 'rgba(166,232,235,.25)', rimGlow: 'rgba(166,232,235,.4)',
    under: '#1f4468', speaker: '#2a5680', slot: '#17314c',
    bezel: '#1e4166', screen: '#16324f', screenOff: '#12283f', screenGlow: 'rgba(166,232,235,.3)', screenBright: '#1d4a73', brightGlow: 'rgba(166,232,235,.6)',
    cpTop: '#4a82b6', cpFront: '#244b72', cpUnder: '#1a3857',
    door: '#2f6292', doorFrame: '#3a70a2', coin: '#a6e8eb', coinGlow: 'rgba(166,232,235,.6)', kick: '#1b3a5a', ret: '#1f4468',
    shaft: '#eef0e9', ball: '#eef0e9', plate: '#1b3753',
    btn: ['#a6e8eb', '#eef0e9', '#7fc4d8', '#a6e8eb', '#eef0e9', '#7fc4d8'],
    startSide: '#7fa9cc', startTop: '#eef0e9',
    p1Side: '#3a6a90', p1: '#a6e8eb', p1Glow: 'rgba(166,232,235,.6)', p2Side: '#3a6a90', p2: '#eef0e9', p2Glow: 'rgba(238,240,233,.5)'
  };

  function hex(c) { c = c.replace('#', ''); return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)]; }
  function shade(c, k) { var v = hex(c); return 'rgb(' + v.map(function (x) { return Math.min(255, Math.round(x * k)); }).join(',') + ')'; }
  BPI.shade = shade;
  var LIGHT = (function () { var v = [-0.45, -0.75, 0.5], l = Math.hypot(v[0], v[1], v[2]); return v.map(function (x) { return x / l; }); })();

  /* ── 행렬: 만들 때만 DOMMatrix로 CSS transform 문자열을 읽고, 그릴 때는 숫자 배열로 계산 ── */
  function mat(s) { return !s || s === 'none' ? new DOMMatrix() : new DOMMatrix(s); }
  function arr(m) { return [m.m11, m.m12, m.m13, m.m21, m.m22, m.m23, m.m31, m.m32, m.m33, m.m41, m.m42, m.m43]; }
  function apply(a, x, y, z) { return [a[0] * x + a[3] * y + a[6] * z + a[9], a[1] * x + a[4] * y + a[7] * z + a[10], a[2] * x + a[5] * y + a[8] * z + a[11]]; }
  function unit(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  /* dz: 깊이 비율(0.01~1). 앞면(z 0)을 기준으로 뒤로 자라남 — 3면도에서 입체로 서는 전환용 */
  BPI.viewTransform = function (rx, ry, k, dz) { dz = dz === undefined ? 1 : Math.max(.01, dz); return 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale3d(' + k + ',' + k + ',' + k + ')' + (dz < 1 ? ' translateZ(105px) scaleZ(' + dz + ') translateZ(-105px)' : ''); };
  function viewMatrix(rx, ry, k, dz) {
    return arr(new DOMMatrix().translate(OX, OY, OZ).multiply(mat(BPI.viewTransform(rx, ry, k, dz))).translate(-OX, -OY, -OZ));
  }
  /* 원근 투영 (원본 perspective 1700px, 원점 = 모델 상자 가운데) → [x, y, 깊이] */
  function project(V, x, y, z) {
    var q = apply(V, x, y, z), f = PERSP / (PERSP - q[2]);
    return [OX + (q[0] - OX) * f, OY + (q[1] - OY) * f, q[2]];
  }
  /* 모델 앞면 평면(z 0)을 화면에 놓는 2D 행렬. 원근은 세 점으로 맞춘 근사 (회전 각도가 작은 구간에서만 씀) */
  BPI.planeMatrix = function (rx, ry, k, dz) {
    var V = viewMatrix(rx, ry, k, dz), A = project(V, 0, 0, 0), B = project(V, W, 0, 0), D = project(V, 0, H, 0);
    return 'matrix(' + [(B[0] - A[0]) / W, (B[1] - A[1]) / W, (D[0] - A[0]) / H, (D[1] - A[1]) / H, A[0], A[1]].map(function (v) { return v.toFixed(5); }).join(',') + ')';
  };

  BPI.lowpoly = function (opt) {
    opt = opt || {};
    var wire = opt.mode === 'wire', bp = opt.theme === 'blueprint';
    var C = bp ? C_BP : C_ORIG;
    var units = [], all = [], anchors = {};
    var root = { m: new DOMMatrix(), part: null, cl: null };

    /* 묶음. cluster: 한 판 위에 붙은 면들(간판 빛, 버튼 등) — 판에서 떨어진 높이 순으로 그려 앞뒤가 뒤집히지 않게 함.
       on: 그 판이 몸체의 면이면 그 면 바로 앞(또는 뒤)에 그림 */
    function group(parent, tf, o) {
      o = o || {};
      var g = { m: parent.m.multiply(mat(tf)), part: o.part || parent.part, cl: parent.cl };
      if (o.cluster) {
        var a = arr(g.m);
        g.cl = { faces: [], inv: arr(g.m.inverse()), n: unit([a[6], a[7], a[8]]) };
        if (o.on) (o.on.att = o.on.att || []).push(g.cl); else units.push({ cl: g.cl });
      }
      return g;
    }
    function face(g, w, h, tf, color, o) {
      o = o || {};
      var m = arr(g.m.multiply(mat(tf))), loc;
      if (o.svg) loc = o.svg;
      else if (o.radius === '50%') { loc = []; for (var i = 0; i < 16; i++) { var t = i / 16 * 2 * Math.PI; loc.push([w / 2 + w / 2 * Math.cos(t), h / 2 + h / 2 * Math.sin(t)]); } }
      else loc = [[0, 0], [w, 0], [w, h], [0, h]];
      var f = {
        pts: loc.map(function (p) { return apply(m, p[0], p[1], 0); }), n: unit([m[6], m[7], m[8]]),
        color: color, emit: !!o.emit && !wire, glow: o.glow, bg: o.bg, poly: !!o.svg, part: g.part
      };
      if (g.cl) {
        var lz = 0; f.pts.forEach(function (p) { lz += apply(g.cl.inv, p[0], p[1], p[2])[2]; });
        f.lz = Math.round(lz / f.pts.length * 10) / 10;
        g.cl.faces.push(f);
      } else units.push({ f: f });
      all.push(f);
      return f;
    }
    function anchor(g, name, x, y, z) { anchors[name] = { p: apply(arr(g.m), x, y, z || 0), part: g.part }; }
    function box(g, x, y, z, w, h, d, color) {
      var x0 = x - w / 2, y0 = y - h / 2, z0 = z - d / 2, z1 = z + d / 2;
      face(g, w, h, 'translate3d(' + x0 + 'px,' + y0 + 'px,' + z1 + 'px)', color);
      face(g, w, h, 'translate3d(' + (x0 + w) + 'px,' + y0 + 'px,' + z0 + 'px) rotateY(180deg)', color);
      face(g, d, h, 'translate3d(' + x0 + 'px,' + y0 + 'px,' + z0 + 'px) rotateY(-90deg)', color);
      face(g, d, h, 'translate3d(' + (x0 + w) + 'px,' + y0 + 'px,' + z1 + 'px) rotateY(90deg)', color);
      face(g, w, d, 'translate3d(' + x0 + 'px,' + y0 + 'px,' + z0 + 'px) rotateX(90deg)', color);
      face(g, w, d, 'translate3d(' + x0 + 'px,' + (y0 + h) + 'px,' + z1 + 'px) rotateX(-90deg)', color);
    }
    function prism(g, x, y, z0, r, hgt, n, color, capColor, capOpt) {
      var s = 2 * r * Math.sin(Math.PI / n), ap = r * Math.cos(Math.PI / n);
      for (var i = 0; i < n; i++) {
        var ang = i * 360 / n + 180 / n;
        face(g, s, hgt, 'translate3d(' + x + 'px,' + y + 'px,' + z0 + 'px) rotateZ(' + ang + 'deg) translate3d(' + (-s / 2) + 'px,' + ap + 'px,0) rotateX(90deg)', color);
      }
      var poly = [];
      for (var k = 0; k < n; k++) { var t = (k * 2 * Math.PI) / n; poly.push([r + r * Math.cos(t), r + r * Math.sin(t)]); }
      var tf = 'translate3d(' + (x - r) + 'px,' + (y - r) + 'px,' + (z0 + hgt) + 'px)';
      if (capOpt && capOpt.emit) face(g, 2 * r, 2 * r, tf, capColor, { emit: true, radius: '50%', bg: capColor, glow: capOpt.glow });
      else face(g, 2 * r, 2 * r, tf, capColor || color, { svg: poly });
    }
    function lit(g, x, y, w, h, color, glow, z) {
      return face(g, w, h, 'translate3d(' + x + 'px,' + y + 'px,' + (z || .5) + 'px)', color, { emit: true, bg: color, glow: glow });
    }

    /* ── 윤곽 구간 ── */
    var seg = [];
    for (var s = 0; s < P.length; s++) {
      var a = P[s], b = P[(s + 1) % P.length];
      var dd = b[0] - a[0], dy = b[1] - a[1];
      seg.push({ L: Math.hypot(dd, dy), tf: 'translate3d(0,' + a[1] + 'px,' + (-a[0]) + 'px) rotateX(' + (Math.atan2(-dd, dy) * 180 / Math.PI).toFixed(3) + 'deg)' });
    }

    /* ── 몸체 (부품 자리는 어두운 홈) ── */
    var body = root, segFace = [];
    var bodyColor = [C.socket, C.under, C.speaker, C.socket, C.socket, C.socket, C.cpUnder, C.body, C.bottom, C.back, C.top];
    seg.forEach(function (g, i) {
      segFace.push(face(body, W, g.L, g.tf, bodyColor[i]));
      var neon = i <= 7;
      [-T, W].forEach(function (x) {
        face(body, T, g.L, 'translateX(' + x + 'px) ' + g.tf, neon ? C.trim : C.side, neon ? { emit: true, glow: C.trimGlow } : null);
      });
    });
    [-T, 0, W, W + T].forEach(function (x) {
      face(body, 210, H, 'translateX(' + x + 'px) rotateY(90deg)', C.side, { svg: P });
    });
    var spk = group(body, seg[2].tf, { cluster: true, on: segFace[2] });
    for (var i = 0; i < 6; i++) box(spk, 40 + i * 28, seg[2].L / 2, 0, 16, 4, 1, C.slot);
    /* 하부 앞면: 킥 플레이트 (몸체에 고정) */
    var low = group(body, seg[7].tf, { cluster: true, on: segFace[7] });
    box(low, 110, 188, 1.5, W, 20, 3, C.kick);

    /* ── 부품 ── */
    var parts = {};
    function part(name) { parts[name] = { o: [0, 0, 0], s: 1, c: [0, 0, 0] }; return group(root, '', { part: name }); }
    var UP = ' translateZ(.6px)';

    /* 간판 */
    var mq = group(part('marquee'), seg[0].tf + UP, { cluster: true });
    face(mq, W, seg[0].L, 'none', C.marqueeBase);
    lit(mq, 10, 12, W - 20, seg[0].L - 24, C.marqueeRim, C.rimGlow, .5);
    lit(mq, 14, 16, W - 28, seg[0].L - 32, C.marqueeLit, C.marqueeGlow, 1);
    anchor(mq, 'marquee', W / 2, seg[0].L / 2, 2);

    /* 화면 */
    var sc = group(part('screen'), seg[3].tf + UP, { cluster: true });
    face(sc, W, seg[3].L, 'none', C.bezel);
    lit(sc, 18, 14, W - 36, seg[3].L - 30, C.screen, C.screenGlow, .5);
    anchor(sc, 'screen', W / 2, seg[3].L / 2, 2);

    /* 조작부: 윗판 + 앞판 + 아랫면 */
    var pn = part('panel');
    var cp = group(pn, seg[4].tf + UP, { cluster: true });
    face(cp, W, seg[4].L, 'none', C.cpTop);
    [[30, 0], [146, 1]].forEach(function (j) {
      var jx = j[0], jy = 26, idx = j[1];
      prism(cp, jx, jy, 0, 9, 1.5, 8, C.plate);
      prism(cp, jx, jy, 1.5, 2.2, 22, 6, C.shaft);
      prism(cp, jx, jy, 22, 8, 6, 8, C.ball);
      prism(cp, jx, jy, 28, 5.5, 4, 8, C.ball);
      anchor(cp, 'joy' + (idx + 1), jx, jy, 30);
      var bx = jx + 22;
      for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) {
        var col = C.btn[(r * 3 + c + idx * 3) % 6];
        prism(cp, bx + c * 14 + r * 4, r ? 34 : 20, 0, 5, 3, 8, shade(col, .55), col);
      }
      anchor(cp, 'btn' + (idx + 1), bx + 16, 27, 3);
    });
    prism(cp, 104, 14, 0, 4, 2.5, 8, C.startSide, C.startTop);
    prism(cp, 118, 14, 0, 4, 2.5, 8, C.startSide, C.startTop);
    anchor(cp, 'start', 111, 14, 3);
    anchor(cp, 'panel', W / 2, seg[4].L / 2, 4);
    var cf = group(pn, seg[5].tf + UP, { cluster: true });
    face(cf, W, seg[5].L, 'none', C.cpFront);
    prism(cf, 80, seg[5].L / 2, 0, 4.5, 2, 8, C.p1Side, C.p1, { emit: true, glow: C.p1Glow });
    prism(cf, 140, seg[5].L / 2, 0, 4.5, 2, 8, C.p2Side, C.p2, { emit: true, glow: C.p2Glow });
    var cu = group(pn, seg[6].tf + UP, { cluster: true });
    face(cu, W, seg[6].L, 'none', C.cpUnder);

    /* 동전 투입구 */
    var dr = group(part('door'), seg[7].tf, { cluster: true });
    box(dr, 110, 78, 4, 76, 104, 8, C.doorFrame);
    box(dr, 110, 78, 8.5, 64, 92, 1, C.door);
    lit(dr, 88, 40, 14, 22, C.coin, C.coinGlow, 9.5);
    lit(dr, 118, 40, 14, 22, C.coin, C.coinGlow, 9.5);
    box(dr, 110, 104, 9.5, 30, 30, 1, C.ret);
    anchor(dr, 'door', 110, 78, 10);
    anchor(dr, 'coin1', 95, 51, 10);
    anchor(dr, 'coin2', 125, 51, 10);

    /* ── 보기 + 명암 ── */
    var S0 = opt.s || 1, V = null, K0 = S0, rot = null;
    function turn(n) {   /* 법선을 보는 각도로 돌림 (명암·앞뒤 판단용, 원본과 같은 계산) */
      var x = n[0] * rot[0] + n[2] * rot[1], z = -n[0] * rot[1] + n[2] * rot[0], y = n[1];
      return [x, y * rot[2] - z * rot[3], y * rot[3] + z * rot[2]];
    }
    function local(p, ps) { return ps ? [ps.c[0] + ps.o[0] + ps.s * (p[0] - ps.c[0]), ps.c[1] + ps.o[1] + ps.s * (p[1] - ps.c[1]), ps.c[2] + ps.o[2] + ps.s * (p[2] - ps.c[2])] : p; }

    /* 흐림: 원본 CSS 값 (#solid .f .8 · 강조 중 나머지 .22 · 강조 부품 .9) */
    var focusKey = null, alpha = { _: .8 };
    Object.keys(parts).forEach(function (k) { alpha[k] = .8; });
    function target(k) { return focusKey ? (k === focusKey ? .9 : .22) : .8; }

    var api = {
      parts: parts,
      setView: function (rx, ry, s, dz) {
        K0 = s || S0; V = viewMatrix(rx, ry, K0, dz);
        var a1 = ry * Math.PI / 180, b1 = rx * Math.PI / 180;
        rot = [Math.cos(a1), Math.sin(a1), Math.cos(b1), Math.sin(b1)];
        all.forEach(function (f) {
          f.front = turn(f.n)[2] > 0;
          if (wire) return;
          if (f.emit) { f.fill = f.bg || f.color; return; }
          var v = turn(f.n); if (v[2] < 0) v = [-v[0], -v[1], -v[2]];
          var d = Math.max(0, v[0] * LIGHT[0] + v[1] * LIGHT[1] + v[2] * LIGHT[2]);
          f.fill = shade(f.color, bp ? .55 + .8 * d : .5 + .9 * d);
        });
        units.forEach(function (u) { if (u.cl) u.cl.front = turn(u.cl.n)[2] > 0; });
        all.forEach(function (f) { if (f.att) f.att.forEach(function (cl) { cl.front = turn(cl.n)[2] > 0; }); });
      },
      focus: function (k) { focusKey = k || null; },
      step: function (dt) {
        var moving = false, e = 1 - Math.exp(-(dt || 0) / .09);
        Object.keys(alpha).forEach(function (k) {
          var t = target(k === '_' ? null : k), d = t - alpha[k];
          if (Math.abs(d) < .003) alpha[k] = t; else { alpha[k] += d * e; moving = true; }
        });
        return moving;
      },
      anchor: function (name) { var a = anchors[name], p = local(a.p, parts[a.part]); return project(V, p[0], p[1], p[2]); },
      draw: function (ctx, op) {
        /* 1. 투영 */
        all.forEach(function (f) {
          var ps = parts[f.part], z = 0;
          f.pr = f.pts.map(function (p) { var q = local(p, ps); q = project(V, q[0], q[1], q[2]); z += q[2]; return q; });
          f.z = z / f.pr.length;
        });
        /* 2. 순서: 먼 것부터. 붙은 면 묶음은 판에서 떨어진 높이 순(판이 뒤를 보면 반대로) */
        function inCluster(cl) {
          return cl.faces.slice().sort(function (p, q) { return (cl.front ? p.lz - q.lz : q.lz - p.lz) || p.z - q.z; });
        }
        units.forEach(function (u) {
          if (u.f) u.key = u.f.z;
          else { var z = 0; u.cl.faces.forEach(function (f) { z += f.z; }); u.key = z / u.cl.faces.length; }
        });
        var list = [];
        units.slice().sort(function (p, q) { return p.key - q.key; }).forEach(function (u) {
          if (u.cl) { list.push.apply(list, inCluster(u.cl)); return; }
          var f = u.f;
          if (!f.att) { list.push(f); return; }
          var on = []; f.att.forEach(function (cl) { on.push.apply(on, inCluster(cl)); });
          if (f.front) { list.push(f); list.push.apply(list, on); } else { list.push.apply(list, on); list.push(f); }
        });
        /* 3. 칠하기 */
        var px = Math.abs(ctx.getTransform().a) || 1;
        ctx.lineJoin = 'round';
        list.forEach(function (f) {
          var a = op * (wire ? 1 : alpha[f.part || '_']);
          if (a < .005) return;
          ctx.globalAlpha = a;
          ctx.beginPath();
          f.pr.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
          ctx.closePath();
          if (wire) {
            ctx.fillStyle = 'rgba(35,70,106,.42)'; ctx.fill();
            ctx.strokeStyle = f.poly ? 'rgba(238,240,233,.85)' : 'rgba(238,240,233,.8)';
            ctx.lineWidth = (f.poly ? 1.2 : 1) * K0; ctx.stroke();
            return;
          }
          if (f.emit && f.glow) { ctx.shadowColor = f.glow; ctx.shadowBlur = 10 * K0 * px; }
          ctx.fillStyle = f.fill; ctx.fill();
          if (f.emit) ctx.shadowBlur = 0;
          if (bp) { ctx.strokeStyle = f.emit ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.92)'; ctx.lineWidth = 1.2 * K0; ctx.stroke(); }
        });
        ctx.globalAlpha = 1;
      }
    };
    api.setView(opt.rx === undefined ? -12 : opt.rx, opt.ry === undefined ? -32 : opt.ry);
    return api;
  };
})();
