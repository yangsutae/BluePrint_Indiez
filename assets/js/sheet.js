/* 260928 리디자인 공통: 시트 테두리, 로우 폴리 캐비닛 3면도, 인출선·풍선·조립 화살표
   3면도 좌표 (로우 폴리 모델과 같은 치수)
   - 정면도: x 0~240 (옆판 0~10, 230~240), y 0~520
   - 우측면도: x 280 + 깊이, y = 높이 (윤곽 BPI.PROFILE)
   - 평면도: 정면도 위, y = -40 - 깊이 */
(function () {
  var BPI = window.BPI = window.BPI || {};

  BPI.sheet = function (sheet) {
    var xs = [250, 476, 702, 928, 1154], cx = [137, 363, 589, 815, 1041, 1285], ys = [246, 450, 654], cy = [148, 352, 556, 760];
    var s = '<div class="grid" aria-hidden="true"></div><svg class="frame" width="1440" height="900" viewBox="0 0 1440 900" aria-hidden="true" focusable="false">' +
      '<rect x="24" y="24" width="1392" height="852" fill="none" stroke="#EEF0E9" stroke-width="3"/>' +
      '<rect x="42" y="42" width="1356" height="816" fill="none" stroke="rgba(238,240,233,.55)" stroke-width="1"/><g stroke="rgba(238,240,233,.55)" stroke-width="1">';
    xs.forEach(function (x) { s += '<line x1="' + x + '" y1="24" x2="' + x + '" y2="42"/><line x1="' + x + '" y1="858" x2="' + x + '" y2="876"/>'; });
    ys.forEach(function (y) { s += '<line x1="24" y1="' + y + '" x2="42" y2="' + y + '"/><line x1="1398" y1="' + y + '" x2="1416" y2="' + y + '"/>'; });
    s += '</g><g class="zone" text-anchor="middle">';
    cx.forEach(function (x, i) { s += '<text x="' + x + '" y="37">' + (i + 1) + '</text><text x="' + x + '" y="871">' + (i + 1) + '</text>'; });
    'ABCD'.split('').forEach(function (c, i) { s += '<text x="33" y="' + cy[i] + '">' + c + '</text><text x="1407" y="' + cy[i] + '">' + c + '</text>'; });
    sheet.insertAdjacentHTML('afterbegin', s + '</g></svg>');
  };

  BPI.MARKER = '<defs><marker id="ar" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M0 1.5 L10 5 L0 8.5 Z" fill="rgba(238,240,233,.75)"/></marker>' +
    '<marker id="asm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 1 L10 5 L0 9 Z" fill="#A6E8EB"/></marker></defs>';

  /* 도면 좌표의 부품 기준점 */
  BPI.DWG = { marquee: [120, 52], screen: [120, 194], panel: [120, 272], joy1: [40, 256], joy2: [156, 256], btn1: [78, 272], btn2: [194, 272], start: [121, 267], door: [120, 398], coin1: [105, 371], coin2: [135, 371] };

  function L(x1, y1, x2, y2, c) { return '<line class="' + c + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>'; }
  function R(x, y, w, h, c, rx) { return '<rect class="' + c + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx ? ' rx="' + rx + '"' : '') + '/>'; }
  function Ci(x, y, r, c) { return '<circle class="' + c + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>'; }
  function dimH(x1, x2, y) { return L(x1, y - 18, x1, y + 8, 'dim') + L(x2, y - 18, x2, y + 8, 'dim') + '<line class="dim" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" marker-start="url(#ar)" marker-end="url(#ar)"/>'; }
  function dimV(y1, y2, x) { return L(x - 22, y1, x + 8, y1, 'dim') + L(x - 22, y2, x + 8, y2, 'dim') + '<line class="dim" x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" marker-start="url(#ar)" marker-end="url(#ar)"/>'; }

  /* 정면도 */
  BPI.FRONT = function () {
    var s = R(0, 0, 240, 520, 'ln') + L(10, 0, 10, 520, 'thin') + L(230, 0, 230, 520, 'thin');
    s += L(10, 104, 230, 104, 'ln') + L(10, 114, 230, 114, 'thin') + L(10, 128, 230, 128, 'ln') + L(10, 262, 230, 262, 'ln') +
      L(10, 282, 230, 282, 'ln') + L(10, 300, 230, 300, 'thin') + L(10, 320, 230, 320, 'ln');
    s += R(20, 12, 200, 80, 'thin') + R(24, 16, 192, 72, 'ln');                       /* 간판 */
    for (var i = 0; i < 6; i++) s += L(42 + i * 28, 121, 58 + i * 28, 121, 'thin');   /* 스피커 */
    s += R(28, 142, 184, 104, 'ln', 4);                                                /* 화면 */
    [40, 156].forEach(function (x, k) {                                                /* 조이스틱·버튼 */
      s += Ci(x, 256, 8, 'ln') + L(x, 264, x, 272, 'thin');
      var bx = x + 22;
      for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) s += Ci(bx + c * 14 + r * 4, r ? 275 : 269, 3.6, 'thin');
    });
    s += Ci(114, 267, 3, 'thin') + Ci(128, 267, 3, 'thin');
    s += Ci(90, 291, 4, 'thin') + Ci(150, 291, 4, 'thin');                             /* 조작부 앞 버튼 */
    s += R(82, 346, 76, 104, 'ln') + R(88, 352, 64, 92, 'thin') + R(98, 360, 14, 22, 'ln') + R(128, 360, 14, 22, 'ln') + R(105, 409, 30, 30, 'thin'); /* 동전 투입구 */
    s += R(10, 498, 220, 20, 'thin');                                                  /* 킥 플레이트 */
    return s;
  };
  /* 우측면도 */
  BPI.SIDE = function () {
    var pts = BPI.PROFILE.map(function (p) { return (280 + p[0]) + ',' + p[1]; }).join(' ');
    var s = '<polygon class="ln" points="' + pts + '"/>';
    s += L(292, 16, 292, 88, 'hid') + L(302, 346, 302, 450, 'thin') + L(310, 346, 310, 450, 'thin') + L(302, 346, 310, 346, 'thin') + L(302, 450, 310, 450, 'thin');
    s += L(306, 272, 295, 250, 'thin') + Ci(294, 246, 7, 'ln');                        /* 조이스틱 */
    s += L(288, 520 - 22, 490, 498, 'thin');                                            /* 킥 플레이트 윗선 */
    return s;
  };
  /* 평면도 */
  BPI.PLAN = function () {
    var s = R(0, -250, 240, 210, 'ln') + L(10, -250, 10, -40, 'thin') + L(230, -250, 230, -40, 'thin') + L(10, -52, 230, -52, 'ln');
    s += L(10, -90, 230, -90, 'hid') + '<circle class="hid" cx="40" cy="-66" r="8"/><circle class="hid" cx="156" cy="-66" r="8"/>';
    return s;
  };
  BPI.views = function (o) {
    o = o || {};
    var s = L(-30, 520, 530, 520, 'ground') + L(120, o.plan === false ? -14 : -262, 120, 540, 'ctr');
    if (o.side !== false) s += L(385, -14, 385, 540, 'ctr') + BPI.SIDE();
    if (o.plan !== false) s += BPI.PLAN();
    s += BPI.FRONT();
    if (o.dims !== false) {
      s += dimH(0, 240, 548);
      if (o.side !== false) s += dimH(280, 490, 548) + dimV(0, 520, 522);
      if (o.plan !== false) s += dimV(-250, -40, -26);
    }
    if (o.caps !== false) {
      if (o.plan !== false) s += '<text class="cap" x="0" y="-262">평면도</text>';
      s += '<text class="cap" x="0" y="-12">정면도</text>';
      if (o.side !== false) s += '<text class="cap" x="280" y="-12">우측면도</text>';
    }
    return s;
  };

  /* ── 화면 좌표 도구 ── */
  BPI.center = function (el) {
    var r = el.getBoundingClientRect(), o = document.querySelector('.sheet').getBoundingClientRect();
    return [r.left + r.width / 2 - o.left, r.top + r.height / 2 - o.top];
  };
  function A(name, root) { return BPI.center((root || document).querySelector('[data-a="' + name + '"]')); }
  BPI.anchorPos = A;
  /* 3D 부품 기준점 → 요소 변 (side: 'left'|'right') */
  BPI.leader = function (svg, from, to, side, bend) {
    var a = A(from), r = to.getBoundingClientRect(), o = document.querySelector('.sheet').getBoundingClientRect();
    var x = (side === 'right' ? r.right : r.left) - o.left;
    var y = Math.max(r.top - o.top + 18, Math.min(r.bottom - o.top - 18, a[1]));
    var k = side === 'right' ? 1 : -1, b = bend === undefined ? 26 : bend;
    svg.insertAdjacentHTML('beforeend', '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' H' + (x + k * b).toFixed(1) + ' L' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + '"/><circle class="dot" cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="3"/>');
  };
  /* 번호 풍선: 기준점 → (bx, by) 절대 위치 */
  BPI.balloonAt = function (svg, from, n, bx, by) {
    var a = A(from), dx = bx - a[0], dy = by - a[1], l = Math.hypot(dx, dy);
    var ex = bx - dx / l * 13, ey = by - dy / l * 13;
    svg.insertAdjacentHTML('beforeend', '<path d="M' + ex.toFixed(1) + ' ' + ey.toFixed(1) + ' L' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + '"/><circle class="dot" cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="3"/>' +
      '<circle class="bl" cx="' + bx + '" cy="' + by + '" r="13"/><text x="' + bx + '" y="' + (by + 4) + '">' + n + '</text>');
  };
  /* 조립 화살표: 떨어진 부품 기준점 → 붙었을 때 기준점 */
  BPI.assemblyArrow = function (svg, part, anchorName, root) {   /* root: 모델이 여러 개일 때 대상 모델 */
    var g = (root || document).querySelector('.m-' + part), now = A(anchorName, root), t = g.style.transform;
    g.style.transform = 'none'; var home = A(anchorName, root); g.style.transform = t;
    var dx = home[0] - now[0], dy = home[1] - now[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
    var ex = home[0] - ux * 14, ey = home[1] - uy * 14;
    svg.insertAdjacentHTML('beforeend', '<path class="arw" d="M' + (now[0] + ux * 18) + ' ' + (now[1] + uy * 18) + ' L' + ex + ' ' + ey + '"/>' +
      '<path class="arw-head" d="M' + (home[0] - ux * 2) + ' ' + (home[1] - uy * 2) + ' L' + (ex - uy * 6) + ' ' + (ey + ux * 6) + ' L' + (ex + uy * 6) + ' ' + (ey - ux * 6) + ' Z"/>');
  };

  /* ── 부품 전개도 (로우 폴리 모델 치수, 접는 선 = 숨은선) ──
     BPI.NETS[이름] = { w, h, svg, a: { 기준점: [x, y] }, name, faces }
     BPI.netSVG(이름, x, y, 상자폭, 상자높이, 최대배율) → { svg, a: 화면 좌표 기준점, s, box: [x, y, w, h] } */
  (function () {
    function Lx(x1, y1, x2, y2, c) { return '<line class="' + c + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>'; }
    function Rx(x, y, w, h, c, rx) { return '<rect class="' + c + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx ? ' rx="' + rx + '"' : '') + '/>'; }
    function Cx(x, y, r, c) { return '<circle class="' + c + '" cx="' + x + '" cy="' + y + '" r="' + r + '"/>'; }
    var N = {};
    /* 1 간판: 앞판 220×104, 깊이 36 → 십자 전개 */
    N.marquee = (function () {
      var d = 36, s = '<polygon class="ln" points="' + [[d,0],[d+220,0],[d+220,d],[d*2+220,d],[d*2+220,d+104],[d+220,d+104],[d+220,d*2+104],[d,d*2+104],[d,d+104],[0,d+104],[0,d],[d,d]].map(function (p) { return p.join(','); }).join(' ') + '"/>';
      s += Lx(d, d, d + 220, d, 'hid') + Lx(d, d + 104, d + 220, d + 104, 'hid') + Lx(d, d, d, d + 104, 'hid') + Lx(d + 220, d, d + 220, d + 104, 'hid');
      s += Rx(d + 10, d + 12, 200, 80, 'thin') + Rx(d + 14, d + 16, 192, 72, 'ln');
      return { w: d * 2 + 220, h: d * 2 + 104, svg: s, name: '간판', faces: '앞판 1 · 윗면 1 · 아랫면 1 · 옆면 2',
        a: { front: [d + 110, d + 52], top: [d + 50, d / 2], side: [d / 2, d + 84], bottom: [d + 110, d * 1.5 + 104] } };
    })();
    /* 2 화면: 베젤 220×136 + 위 턱 26 + 아래 턱 14 + 옆 사다리꼴 20 */
    N.screen = (function () {
      var s = '<polygon class="ln" points="20,0 240,0 240,26 260,36 260,152 240,162 240,176 20,176 20,162 0,152 0,36 20,26"/>';
      s += Lx(20, 26, 240, 26, 'hid') + Lx(20, 162, 240, 162, 'hid') + Lx(20, 26, 20, 162, 'hid') + Lx(240, 26, 240, 162, 'hid');
      for (var i = 0; i < 6; i++) s += Lx(50 + i * 28, 13, 66 + i * 28, 13, 'thin');
      s += Rx(38, 40, 184, 106, 'ln', 4);
      return { w: 260, h: 176, svg: s, name: '화면', faces: '베젤 1 · 스피커 턱 1 · 아래 턱 1 · 옆 날개 2',
        a: { screen: [130, 93], speaker: [130, 13], bezel: [30, 150], wing: [10, 94] } };
    })();
    /* 3 조작부: 윗판 54 + 앞판 18 + 아랫면 33 띠, 옆판 모양 따로 */
    N.panel = (function () {
      var s = Rx(0, 0, 220, 105, 'ln') + Lx(0, 54, 220, 54, 'hid') + Lx(0, 72, 220, 72, 'hid');
      [30, 146].forEach(function (jx) {
        s += Cx(jx, 26, 9, 'thin') + Cx(jx, 26, 5, 'ln');
        var bx = jx + 22;
        for (var r = 0; r < 2; r++) for (var c = 0; c < 3; c++) s += Cx(bx + c * 14 + r * 4, r ? 34 : 20, 5, 'ln');
      });
      s += Cx(104, 14, 4, 'thin') + Cx(118, 14, 4, 'thin') + Cx(80, 63, 4.5, 'ln') + Cx(140, 63, 4.5, 'ln');
      s += '<polygon class="ln" points="300,0 250,20 254,38 280,58 300,58"/>';
      return { w: 300, h: 105, svg: s, name: '조작부', faces: '윗판 1 · 앞판 1 · 아랫면 1 · 옆판 2',
        a: { joy1: [30, 26], btn1: [68, 27], joy2: [146, 26], btn2: [184, 27], front: [110, 63], side: [276, 30] } };
    })();
    /* 4 동전 투입구: 상자 76×104×8 */
    N.door = (function () {
      var s = '<polygon class="ln" points="8,0 84,0 84,8 92,8 92,112 84,112 84,120 8,120 8,112 0,112 0,8 8,8"/>';
      s += Lx(8, 8, 84, 8, 'hid') + Lx(8, 112, 84, 112, 'hid') + Lx(8, 8, 8, 112, 'hid') + Lx(84, 8, 84, 112, 'hid');
      s += Rx(14, 14, 64, 92, 'thin') + Rx(24, 22, 14, 22, 'ln', 2) + Rx(54, 22, 14, 22, 'ln', 2) + Rx(31, 71, 30, 30, 'thin');
      return { w: 92, h: 120, svg: s, name: '동전 투입구', faces: '문판 1 · 테두리 4',
        a: { coin1: [31, 33], coin2: [61, 33], ret: [46, 86], front: [46, 60] } };
    })();
    BPI.NETS = N;
    BPI.netSVG = function (name, x, y, bw, bh, maxS) {
      var n = N[name], k = Math.min(bw / n.w, bh / n.h, maxS || 3);
      var W = n.w * k, H = n.h * k, ox = x + (bw - W) / 2, oy = y + (bh - H) / 2, a = {};
      Object.keys(n.a).forEach(function (key) { a[key] = [ox + n.a[key][0] * k, oy + n.a[key][1] * k]; });
      /* 치수선 (값 없음): 아래 폭, 오른쪽 높이 */
      var dim =
        '<line class="dim" x1="' + ox + '" y1="' + (oy + H + 6) + '" x2="' + ox + '" y2="' + (oy + H + 24) + '"/><line class="dim" x1="' + (ox + W) + '" y1="' + (oy + H + 6) + '" x2="' + (ox + W) + '" y2="' + (oy + H + 24) + '"/>' +
        '<line class="dim" x1="' + ox + '" y1="' + (oy + H + 18) + '" x2="' + (ox + W) + '" y2="' + (oy + H + 18) + '" marker-start="url(#ar)" marker-end="url(#ar)"/>' +
        '<line class="dim" x1="' + (ox + W + 6) + '" y1="' + oy + '" x2="' + (ox + W + 24) + '" y2="' + oy + '"/><line class="dim" x1="' + (ox + W + 6) + '" y1="' + (oy + H) + '" x2="' + (ox + W + 24) + '" y2="' + (oy + H) + '"/>' +
        '<line class="dim" x1="' + (ox + W + 18) + '" y1="' + oy + '" x2="' + (ox + W + 18) + '" y2="' + (oy + H) + '" marker-start="url(#ar)" marker-end="url(#ar)"/>';
      return { s: k, a: a, box: [ox, oy, W, H], n: n,
        svg: '<g class="net" transform="translate(' + ox.toFixed(2) + ' ' + oy.toFixed(2) + ') scale(' + k.toFixed(4) + ')">' + n.svg + '</g>' + dim };
    };
  })();

  /* ── 로드 애니메이션: 도면 선이 그려짐 ──
     외형선·가는선·치수선은 선 그리기, 숨은선·중심선·글자는 늦게 나타남.
     html.static(주소 ?static) 또는 동작 줄이기면 바로 완성 상태 */
  BPI.animateDraw = function (container) {
    container.querySelectorAll('line, rect, polygon, circle, path, ellipse').forEach(function (el) {
      var c = el.getAttribute('class') || '';
      if (/\b(hid|ctr)\b/.test(c)) { el.classList.add('fadein', 'late'); return; }
      if (/\b(ln|thin|dim|ground)\b/.test(c)) {
        el.setAttribute('pathLength', '1'); el.classList.add('draw');
        el.classList.add(/\bln\b/.test(c) ? 'd1' : (/\bthin\b/.test(c) ? 'd2' : 'd3'));
      }
    });
    container.querySelectorAll('text, .num-b').forEach(function (el) { el.classList.add('fadein', 'later'); });
  };
  if (new URLSearchParams(location.search).has('static')) document.documentElement.classList.add('static');
  /* 글꼴 로드 뒤 다시 그리기 */
  BPI.redraw = function (fn) { fn(); window.addEventListener('load', fn); if (document.fonts) document.fonts.ready.then(fn); };
})();
