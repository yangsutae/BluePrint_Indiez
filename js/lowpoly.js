/* 아케이드 캐비닛 로우 폴리 모델 (CSS 3D)
   원본: model/arcade-lowpoly.html. 시안에서 쓰도록 부품을 나누고 선(도면) 모드를 더함.

   BPI.lowpoly(root, opt)
     root  : 빈 div (220×520 좌표계, 옆판은 x -10~0, 220~230)
     opt.rx, opt.ry, opt.s : 보는 각도(도), 크기
     opt.mode   : 'solid'(기본) | 'wire'(청사진 선)
     opt.off    : 부품 이동 { marquee|screen|panel|door: [x, y, z] } (z+ = 앞)
     opt.hide   : 숨길 부품 이름 배열
     opt.focus  : 강조할 부품 이름 (나머지 흐림)
     opt.screen : 'on'(기본) | 'off' | 'bright'
     opt.theme  : 기본(참고 사진 색) | 'blueprint'(청사진 색 + 면 테두리)
   반환값: { root, setView(rx, ry, s, dz) }  (dz = 깊이 비율, 기본 1)
   부품 기준점: [data-a="marquee|screen|panel|joy1|joy2|btn1|btn2|start|door|coin1|coin2"]
*/
(function () {
  var BPI = window.BPI = window.BPI || {};
  var W = 220, H = 520, T = 10;
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

  BPI.lowpoly = function (root, opt) {
    opt = opt || {};
    var wire = opt.mode === 'wire';
    var C = opt.theme === 'blueprint' ? C_BP : C_ORIG;
    if (opt.theme === 'blueprint') root.classList.add('lp-bp');
    var faces = [];
    root.classList.add('lp');
    if (wire) root.classList.add('lp-wire');
    if (opt.focus) root.setAttribute('data-focus', opt.focus);

    function face(parent, w, h, transform, color, o) {
      o = o || {};
      var d = document.createElement('div');
      d.className = 'f' + (o.emit && !wire ? ' emit' : '') + (o.svg ? ' fs' : '');
      d.style.width = w + 'px'; d.style.height = h + 'px';
      d.style.transform = transform;
      if (o.radius) d.style.borderRadius = o.radius;
      if (o.html) d.innerHTML = o.html;
      parent.appendChild(d);
      if (wire) return d;
      if (o.emit) { d.style.background = o.bg || color; if (o.glow) d.style.setProperty('--glow', o.glow); }
      else faces.push({ el: d, color: color, svg: o.svg ? d.querySelector(o.svg) : null });
      return d;
    }
    function group(parent, cls, tf) {
      var g = document.createElement('div');
      g.className = 'g' + (cls ? ' ' + cls : '');
      if (tf) g.style.transform = tf;
      parent.appendChild(g);
      return g;
    }
    function anchor(parent, name, x, y, z) {
      var a = document.createElement('span');
      a.className = 'anchor'; a.setAttribute('data-a', name);
      a.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + (z || 0) + 'px)';
      parent.appendChild(a);
    }
    function box(parent, x, y, z, w, h, d, color) {
      var x0 = x - w / 2, y0 = y - h / 2, z0 = z - d / 2, z1 = z + d / 2;
      face(parent, w, h, 'translate3d(' + x0 + 'px,' + y0 + 'px,' + z1 + 'px)', color);
      face(parent, w, h, 'translate3d(' + (x0 + w) + 'px,' + y0 + 'px,' + z0 + 'px) rotateY(180deg)', color);
      face(parent, d, h, 'translate3d(' + x0 + 'px,' + y0 + 'px,' + z0 + 'px) rotateY(-90deg)', color);
      face(parent, d, h, 'translate3d(' + (x0 + w) + 'px,' + y0 + 'px,' + z1 + 'px) rotateY(90deg)', color);
      face(parent, w, d, 'translate3d(' + x0 + 'px,' + y0 + 'px,' + z0 + 'px) rotateX(90deg)', color);
      face(parent, w, d, 'translate3d(' + x0 + 'px,' + (y0 + h) + 'px,' + z1 + 'px) rotateX(-90deg)', color);
    }
    function prism(parent, x, y, z0, r, hgt, n, color, capColor, capOpt) {
      var s = 2 * r * Math.sin(Math.PI / n), ap = r * Math.cos(Math.PI / n);
      for (var i = 0; i < n; i++) {
        var ang = i * 360 / n + 180 / n;
        face(parent, s, hgt, 'translate3d(' + x + 'px,' + y + 'px,' + z0 + 'px) rotateZ(' + ang + 'deg) translate3d(' + (-s / 2) + 'px,' + ap + 'px,0) rotateX(90deg)', color);
      }
      var poly = [];
      for (var k = 0; k < n; k++) { var t = (k * 2 * Math.PI) / n; poly.push((r + r * Math.cos(t)).toFixed(2) + ',' + (r + r * Math.sin(t)).toFixed(2)); }
      var tf = 'translate3d(' + (x - r) + 'px,' + (y - r) + 'px,' + (z0 + hgt) + 'px)';
      if (capOpt && capOpt.emit) face(parent, 2 * r, 2 * r, tf, capColor, { emit: true, radius: '50%', bg: capColor, glow: capOpt.glow });
      else face(parent, 2 * r, 2 * r, tf, capColor || color, { html: '<svg viewBox="0 0 ' + 2 * r + ' ' + 2 * r + '" width="' + 2 * r + '" height="' + 2 * r + '"><polygon points="' + poly.join(' ') + '"/></svg>', svg: 'polygon' });
    }
    function lit(parent, x, y, w, h, color, glow, z, radius) {
      return face(parent, w, h, 'translate3d(' + x + 'px,' + y + 'px,' + (z || .5) + 'px)', color, { emit: true, bg: color, glow: glow, radius: radius });
    }

    /* ── 윤곽 구간 ── */
    var seg = [];
    for (var s = 0; s < P.length; s++) {
      var a = P[s], b = P[(s + 1) % P.length];
      var dd = b[0] - a[0], dy = b[1] - a[1];
      seg.push({ L: Math.hypot(dd, dy), tf: 'translate3d(0,' + a[1] + 'px,' + (-a[0]) + 'px) rotateX(' + (Math.atan2(-dd, dy) * 180 / Math.PI).toFixed(3) + 'deg)' });
    }

    /* ── 몸체 (부품 자리는 어두운 홈) ── */
    var body = group(root, 'm-body');
    var bodyColor = [C.socket, C.under, C.speaker, C.socket, C.socket, C.socket, C.cpUnder, C.body, C.bottom, C.back, C.top];
    seg.forEach(function (g, i) {
      face(body, W, g.L, g.tf, bodyColor[i]);
      var neon = i <= 7;
      [-T, W].forEach(function (x) {
        face(body, T, g.L, 'translateX(' + x + 'px) ' + g.tf, neon ? C.trim : C.side, neon ? { emit: true, glow: C.trimGlow } : null);
      });
    });
    var pts = P.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    [-T, 0, W, W + T].forEach(function (x) {
      face(body, 210, H, 'translateX(' + x + 'px) rotateY(90deg)', C.side,
        { html: '<svg viewBox="0 0 210 520" width="210" height="520"><polygon points="' + pts + '"/></svg>', svg: 'polygon' });
    });
    var spk = group(body, '', seg[2].tf);
    for (var i = 0; i < 6; i++) box(spk, 40 + i * 28, seg[2].L / 2, 0, 16, 4, 1, C.slot);
    /* 하부 앞면: 킥 플레이트 (몸체에 고정) */
    var low = group(body, '', seg[7].tf);
    box(low, 110, 188, 1.5, W, 20, 3, C.kick);

    /* ── 부품 ── */
    var off = opt.off || {};
    function part(name) {
      var g = group(root, 'part m-' + name);
      var o = off[name];
      if (o) g.style.transform = 'translate3d(' + o[0] + 'px,' + o[1] + 'px,' + o[2] + 'px)';
      if (opt.hide && opt.hide.indexOf(name) >= 0) g.classList.add('hidden');
      return g;
    }
    var UP = ' translateZ(.6px)';

    /* 간판 */
    var mq = group(part('marquee'), '', seg[0].tf + UP);
    face(mq, W, seg[0].L, 'none', C.marqueeBase);
    lit(mq, 10, 12, W - 20, seg[0].L - 24, C.marqueeRim, C.rimGlow, .5);
    lit(mq, 14, 16, W - 28, seg[0].L - 32, C.marqueeLit, C.marqueeGlow, 1);
    anchor(mq, 'marquee', W / 2, seg[0].L / 2, 2);

    /* 화면 */
    var sc = group(part('screen'), '', seg[3].tf + UP);
    face(sc, W, seg[3].L, 'none', C.bezel);
    var scr = opt.screen || 'on';
    lit(sc, 18, 14, W - 36, seg[3].L - 30, scr === 'off' ? C.screenOff : (scr === 'bright' ? C.screenBright : C.screen),
      scr === 'off' ? 'transparent' : (scr === 'bright' ? C.brightGlow : C.screenGlow), .5, '4px');
    if (scr === 'bright' && !wire) {   /* 켜진 화면 속 단순한 도형 (그림 대신 블록) */
      lit(sc, 60, 90, 22, 8, '#a6e8eb', 'rgba(166,232,235,.8)', 1);
      lit(sc, 120, 60, 30, 8, '#a6e8eb', 'rgba(166,232,235,.8)', 1);
      lit(sc, 36, 104, 148, 3, '#a6e8eb', 'rgba(166,232,235,.8)', 1);
      lit(sc, 66, 78, 8, 12, '#ffd23b', 'rgba(255,210,59,.8)', 1);
    }
    anchor(sc, 'screen', W / 2, seg[3].L / 2, 2);

    /* 조작부: 윗판 + 앞판 + 아랫면 */
    var pn = part('panel');
    var cp = group(pn, '', seg[4].tf + UP);
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
    var cf = group(pn, '', seg[5].tf + UP);
    face(cf, W, seg[5].L, 'none', C.cpFront);
    prism(cf, 80, seg[5].L / 2, 0, 4.5, 2, 8, C.p1Side, C.p1, { emit: true, glow: C.p1Glow });
    prism(cf, 140, seg[5].L / 2, 0, 4.5, 2, 8, C.p2Side, C.p2, { emit: true, glow: C.p2Glow });
    var cu = group(pn, '', seg[6].tf + UP);
    face(cu, W, seg[6].L, 'none', C.cpUnder);

    /* 동전 투입구 */
    var dr = group(part('door'), '', seg[7].tf);
    box(dr, 110, 78, 4, 76, 104, 8, C.doorFrame);
    box(dr, 110, 78, 8.5, 64, 92, 1, C.door);
    lit(dr, 88, 40, 14, 22, C.coin, C.coinGlow, 9.5, '2px');
    lit(dr, 118, 40, 14, 22, C.coin, C.coinGlow, 9.5, '2px');
    box(dr, 110, 104, 9.5, 30, 30, 1, C.ret);
    anchor(dr, 'door', 110, 78, 10);
    anchor(dr, 'coin1', 95, 51, 10);
    anchor(dr, 'coin2', 125, 51, 10);

    /* ── 보기 + 명암 ──
       반환: { root, setView(rx, ry, s) } — 회전할 때마다 명암을 다시 칠함 */
    var S0 = opt.s || 1;
    /* dz: 깊이 비율(0.01~1). 앞면(z 0)을 기준으로 뒤로 자라남 — 3면도에서 입체로 서는 전환용 */
    BPI.viewTransform = function (rx, ry, k, dz) { dz = dz === undefined ? 1 : Math.max(.01, dz); return 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale3d(' + k + ',' + k + ',' + k + ')' + (dz < 1 ? ' translateZ(105px) scaleZ(' + dz + ') translateZ(-105px)' : ''); };
    var api = { root: root, setView: function (rx, ry, s, dz) { root.style.transform = BPI.viewTransform(rx, ry, s || S0, dz); } };
    if (!wire) {
      var modelMatrix = function (el) {
        var m = new DOMMatrix();
        for (var e = el; e && e !== root; e = e.parentElement) {
          var t = getComputedStyle(e).transform;
          m = new DOMMatrix(t === 'none' ? undefined : t).multiply(m);
        }
        return m;
      };
      var LIGHT = (function () { var v = [-0.45, -0.75, 0.5], l = Math.hypot(v[0], v[1], v[2]); return v.map(function (x) { return x / l; }); })();
      faces.forEach(function (f) {   /* 모델 좌표 법선은 한 번만 계산 (부품 이동은 평행 이동이라 법선 불변) */
        var m = modelMatrix(f.el), n = [m.m31, m.m32, m.m33], l = Math.hypot(n[0], n[1], n[2]) || 1;
        f.n = [n[0] / l, n[1] / l, n[2] / l];
      });
      var place = api.setView;
      api.setView = function (rx, ry, s, dz) {
        place(rx, ry, s, dz);
        var a1 = ry * Math.PI / 180, b1 = rx * Math.PI / 180, ca = Math.cos(a1), sa = Math.sin(a1), cb = Math.cos(b1), sb = Math.sin(b1);
        faces.forEach(function (f) {
          var n = f.n, x = n[0] * ca + n[2] * sa, z = -n[0] * sa + n[2] * ca, y = n[1];
          var v = [x, y * cb - z * sb, y * sb + z * cb];
          if (v[2] < 0) v = [-v[0], -v[1], -v[2]];
          var d = Math.max(0, v[0] * LIGHT[0] + v[1] * LIGHT[1] + v[2] * LIGHT[2]);
          var col = shade(f.color, opt.theme === 'blueprint' ? .55 + .8 * d : .5 + .9 * d);
          if (f.svg) f.svg.style.fill = col; else f.el.style.background = col;
        });
      };
    }
    api.setView(opt.rx === undefined ? -12 : opt.rx, opt.ry === undefined ? -32 : opt.ry);
    return api;
  };
})();
