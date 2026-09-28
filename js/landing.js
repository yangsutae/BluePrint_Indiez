/* BluePrint Indiez 랜딩페이지 — 스크롤 연출
   스크롤 진행률 p(0~1)에 따라 한 벌의 3D 캐비닛과 레이어를 바꿈.
     0.00~0.06  K0 도면 (로드 시 선 그리기)
     0.06~0.18  3면도째 회전하며 정면도에서 깊이가 자라나 입체로 섬 (D6 방식), 가운데로 이동
     0.13~0.24  선 입체 위로 면이 채워지고, 정면도 선·보조 도면이 사라짐
     0.30~0.70  K2~K5 부품 하나씩 분해 + 전개도 + 설명
     0.70~0.80  부품이 모두 붙은 캐비닛이 K7 자리로
     0.76~1.00  K7 각도 링 위 천천히 회전 + 마무리 (왼쪽 아래 와이어프레임 켜기·끄기)
   주소 값: ?p=0.5 → 그 진행률로 고정(확인용). 동작 줄이기면 자동 회전 없음. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), vp = $('vp'), hero = $('hero');
  var q = new URLSearchParams(location.search);
  var FIXED = q.has('p') ? Math.max(0, Math.min(1, +q.get('p'))) : null;
  if (FIXED !== null) document.documentElement.classList.add('static');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var ramp = function (p, a, b) { return ease(clamp((p - a) / (b - a))); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ── 시트·도면 ── */
  BPI.sheet(stage);
  $('defs').innerHTML = BPI.MARKER;
  var tags = [['marquee', 1], ['screen', 2], ['panel', 3], ['door', 4]].map(function (t) {
    var p = BPI.DWG[t[0]];
    return '<path class="thin" d="M' + p[0] + ' ' + p[1] + ' L-38 ' + p[1] + '"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#EEF0E9"/>' +
      '<g class="num-b"><circle class="bl" cx="-52" cy="' + p[1] + '" r="14"/><text x="-52" y="' + (p[1] + 4) + '">' + t[1] + '</text></g>';
  }).join('');
  /* 3면도를 모델 좌표에 둠: 도면 x 0 = 모델 x -10 (옆판 바깥), 도면 y = 모델 y. 보조 도면(평면·측면·치수·번호)과 정면도를 나눠 따로 흐리게 */
  $('dwg3d').innerHTML = '<svg width="640" height="880" viewBox="-80 -290 640 880" aria-hidden="true" focusable="false">' +
    '<g id="dwgAux">' + BPI.views().replace(BPI.FRONT(), '') + tags + '</g><g id="dwgFront">' + BPI.FRONT() + '</g></svg>';
  BPI.animateDraw($('dwg3d'));

  /* 표제란 아래 끝을 3면도 바닥선(y 790)에 맞춤 */
  function placeTB() { var tb = $('tb'); tb.style.top = (790 - tb.offsetHeight) + 'px'; }
  placeTB(); if (document.fonts) document.fonts.ready.then(placeTB);

  /* ── K2~K5 부품 패널 ── */
  var panels = $('panels');
  BPI.PART_ORDER.forEach(function (key) {
    var P = BPI.PARTS[key], N = BPI.NETS[key];
    var g = BPI.netSVG(key, 60, 34, 520, 160, 2.2), top = g.box[1] - 20, used = [];
    var bal = BPI.netBalloons(g.a, P.items, function (i, p) {
      var x = p[0]; used.forEach(function (u) { if (Math.abs(u - x) < 30) x = u + 30; }); used.push(x); return x - p[0];
    }, function (i, p) { return top - p[1]; });
    panels.insertAdjacentHTML('beforeend',
      '<div class="layer part-panel" data-part="' + key + '" style="opacity:0; visibility:hidden">' +
        '<figure class="mini"><figcaption class="mini-h"><span>전개도 · 부품 ' + P.n + ' ' + P.name + '</span><span>펼친 그림</span></figcaption>' +
          '<svg class="dwg" width="662" height="226" viewBox="0 0 662 226" role="img" aria-label="' + P.name + ' 전개도">' + g.svg + bal + '</svg>' +
          '<p class="mini-f">면 구성 · ' + N.faces + ' · 점선 = 접는 선</p></figure>' +
        '<article class="card desc"><span class="big-no" aria-hidden="true">0' + P.n + '</span>' +
          '<p class="kicker"><b>' + P.n + '</b>부품 ' + P.n + ' / 4 · ' + P.name + '</p>' +
          '<h2 class="page-title">' + P.title + '</h2><p class="page-lead">' + P.lead + '</p>' +
          '<ol class="list nums">' + P.items.map(BPI.itemHTML).join('') + '</ol></article>' +
      '</div>');
  });
  var panelEls = Array.prototype.slice.call(document.querySelectorAll('.part-panel'));

  /* ── K7 각도 링 ── */
  var CX = 360, CY = 690, RX = 250, RY = 52, t = '';
  for (var d = 0; d < 360; d += 10) {
    var a = d * Math.PI / 180, c = Math.sin(a), s = Math.cos(a), major = d % 30 === 0, L = major ? 14 : 7;
    t += '<line class="tick' + (major ? ' major' : '') + '" x1="' + (CX + RX * c).toFixed(1) + '" y1="' + (CY + RY * s).toFixed(1) + '" x2="' + (CX + (RX + L) * c).toFixed(1) + '" y2="' + (CY + (RY + L * .2) * s).toFixed(1) + '"/>';
    if (major) t += '<text x="' + (CX + (RX + 30) * c).toFixed(1) + '" y="' + (CY + (RY + 12) * s + 4).toFixed(1) + '">' + d + '°</text>';
  }
  $('ticks').innerHTML = t;

  /* ── 3D 모델 ── */
  var iso = BPI.lowpoly($('iso'), { mode: 'wire', rx: -12, ry: -32, s: .8 });          /* K0 오른쪽 입체도 칸 */
  var wire = BPI.lowpoly($('wire'), { mode: 'wire', rx: 0, ry: 0, s: .82, dz: .01 });  /* 전환 중 선 입체 · K7 와이어프레임 */
  var solid = BPI.lowpoly($('solid'), { theme: 'blueprint', rx: 0, ry: 0, s: .82 });
  var partGroups = {};
  BPI.PART_ORDER.forEach(function (k) { partGroups[k] = $('solid').querySelector('.m-' + k); });

  /* 캐비닛 자리: [p, x, y, s, rx, ry] */
  var TRACK = [
    [0.06, 582.4, 284.6, .82, 0, 0],     /* K0 정면도 자리 (3면도 정면도와 모델 앞면이 겹침) */
    [0.18,  610, 150, .95, -10, -30],   /* K1 가운데, 입체 완성 */
    [0.26,  610, 150, .95, -10, -30],
    [0.30,  250, 210, .84, -10, -30],   /* K2~K5 왼쪽 */
    [0.70,  250, 210, .84, -10, -30],
    [0.80,  250, 170, .90, -10, -30]    /* K7 링 위 */
  ];
  function trackAt(p) {
    if (p <= TRACK[0][0]) return TRACK[0].slice(1);
    for (var i = 1; i < TRACK.length; i++) {
      if (p <= TRACK[i][0]) {
        var A = TRACK[i - 1], B = TRACK[i], k = ease((p - A[0]) / (B[0] - A[0]));
        return A.slice(1).map(function (v, j) { return lerp(v, B[j + 1], k); });
      }
    }
    return TRACK[TRACK.length - 1].slice(1);
  }
  var PART_SEG = [0.30, 0.40, 0.50, 0.60];   /* 부품마다 0.10 */

  /* ── 오른쪽 장면 이동 점 ── */
  var SCENES = [['도면', .0], ['청사진 → 3D', .2], ['간판', .35], ['화면', .45], ['조작부', .55], ['동전 투입구', .65], ['완성', .9]];
  var prog = $('progress');
  prog.innerHTML = SCENES.map(function (s, i) { return '<li><a href="#hero" data-p="' + s[1] + '" aria-label="' + s[0] + '"></a></li>'; }).join('');
  prog.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return; e.preventDefault();
    var range = hero.offsetHeight - window.innerHeight;
    window.scrollTo({ top: hero.offsetTop + range * +a.dataset.p, behavior: reduce ? 'auto' : 'smooth' });
  });
  var dots = Array.prototype.slice.call(prog.querySelectorAll('a'));

  /* ── 크기 맞춤 ── */
  var K = 1;
  function fit() {
    K = Math.min(vp.clientWidth / 1440, vp.clientHeight / 900);
    stage.style.transform = 'translate(-50%, -50%) scale(' + K + ')';
  }
  fit(); window.addEventListener('resize', function () { fit(); dirty = true; });

  /* ── 그리기 ── */
  var L0 = $('L0'), L7a = $('L7a'), L7b = $('L7b'), L7c = $('L7c');
  var rig = $('rig'), wireBox = $('wireBox'), solidBox = $('solidBox'), floor = $('floor'), isoBox = $('isoBox');
  var dwgBox = $('dwgBox'), dwg3d = $('dwg3d'), dwgAux = $('dwgAux'), dwgFront = $('dwgFront');
  var ld = $('ld'), needle = $('needle'), dot = $('needleDot');
  var lastView = '', spin = 0, dirty = true, lastP = -1;

  function show(el, op) {
    el.style.opacity = op.toFixed(3);
    el.style.visibility = op > .02 ? 'visible' : 'hidden';
  }
  function progress() {
    if (FIXED !== null) return FIXED;
    var range = hero.offsetHeight - window.innerHeight;
    return range > 0 ? clamp(-hero.getBoundingClientRect().top / range) : 0;
  }

  /* 로드 시 선 입체는 도면 선이 그려진 뒤(1.2초~1.7초) 나타남 */
  var t0 = performance.now(), intro = (FIXED !== null || reduce) ? 1 : 0;
  function render(p) {
    if (intro < 1) { intro = clamp((performance.now() - t0 - 1200) / 500); dirty = true; }
    /* 레이어 */
    L0.style.opacity = (1 - ramp(p, .06, .11)).toFixed(3);
    L0.style.visibility = p < .11 ? 'visible' : 'hidden';
    var k7 = ramp(p, .72, .80);
    L7a.style.opacity = k7.toFixed(3); show(L7b, k7); show(L7c, k7);

    /* 캐비닛 위치·각도 */
    var T = trackAt(p), spinW = ramp(p, .78, .82);
    var ry = T[4] - spin * spinW;
    rig.style.transform = 'translate(' + T[0].toFixed(1) + 'px,' + T[1].toFixed(1) + 'px)';
    var dz = .01 + .99 * ramp(p, .07, .16);
    var key = T[2].toFixed(3) + '|' + T[3].toFixed(2) + '|' + ry.toFixed(2) + '|' + dz.toFixed(3);
    if (key !== lastView) { wire.setView(T[3], ry, T[2], dz); solid.setView(T[3], ry, T[2], dz); dwg3d.style.transform = BPI.viewTransform(T[3], ry, T[2], dz); lastView = key; }

    /* K1 청사진 → 3D */
    /* K0 → K1: 3면도째 회전하며 정면도에서 깊이가 자라남 (D6 방식)
       선 입체가 먼저 서고, 면이 채워지면 정면도 선·보조 도면이 사라짐 */
    var wfOn = wireframe * k7;   /* K7 와이어프레임 보기 */
    var up = ramp(p, .07, .12), fill = ramp(p, .13, .20);
    var wireOp = up * (1 - ramp(p, .19, .24));
    wireBox.style.opacity = Math.max(wireOp, wfOn).toFixed(3);
    wireBox.style.visibility = Math.max(wireOp, wfOn) > .01 ? 'visible' : 'hidden';
    show(solidBox, wfOn > .5 ? 0 : fill);
    floor.style.opacity = fill.toFixed(3);
    dwgAux.style.opacity = ((1 - ramp(p, .07, .12) * .85) * (1 - ramp(p, .13, .18))).toFixed(3);
    dwgFront.style.opacity = (1 - ramp(p, .12, .19)).toFixed(3);
    dwgBox.style.visibility = p < .23 ? 'visible' : 'hidden';
    isoBox.style.opacity = intro.toFixed(3);

    /* K2~K5 부품 */
    var active = null, activeOp = 0;
    BPI.PART_ORDER.forEach(function (k, i) {
      var a = PART_SEG[i], tt = clamp((p - a) / .10);
      var out = ramp(tt, 0, .3) * (1 - ramp(tt, .8, 1));
      var op = ramp(tt, .18, .34) * (1 - ramp(tt, .8, .94));
      var o = BPI.PARTS[k].off;
      partGroups[k].style.transform = out > 0 ? 'translate3d(' + (o[0] * out).toFixed(1) + 'px,' + (o[1] * out).toFixed(1) + 'px,' + (o[2] * out).toFixed(1) + 'px)' : '';
      show(panelEls[i], op);
      if (op > activeOp) { activeOp = op; active = k; }
    });

    /* 인출선: 빠져나온 부품 → 전개도 칸 */
    if (active && activeOp > .05) {
      var an = $('solid').querySelector('[data-a="' + active + '"]').getBoundingClientRect(), sr = stage.getBoundingClientRect();
      var ax = (an.left + an.width / 2 - sr.left) / K, ay = (an.top + an.height / 2 - sr.top) / K;
      var y = Math.max(158, Math.min(422, ay));
      ld.innerHTML = '<path d="M730 ' + y.toFixed(1) + ' H700 L' + ax.toFixed(1) + ' ' + ay.toFixed(1) + '"/><circle class="dot" cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="3"/>';
      ld.style.opacity = activeOp.toFixed(3);
    } else { ld.innerHTML = ''; }

    /* K7 바늘·읽음값 */
    var dd = ((-ry) % 360 + 360) % 360, ang = dd * Math.PI / 180;
    var nx = CX + RX * Math.sin(ang), ny = CY + RY * Math.cos(ang);
    needle.setAttribute('x2', nx.toFixed(1)); needle.setAttribute('y2', ny.toFixed(1));
    dot.setAttribute('cx', nx.toFixed(1)); dot.setAttribute('cy', ny.toFixed(1));

    /* 장면 점 */
    var cur = 0; SCENES.forEach(function (s, i) { if (p >= s[1] - .04) cur = i; });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); if (i === cur) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
  }

  /* ── K7 와이어프레임 켜기·끄기 (?wf=1 로 켠 채 시작) ── */
  var wireframe = q.has('wf') ? 1 : 0, wfBtn = $('wfBtn');
  function syncWf() { wfBtn.setAttribute('aria-pressed', wireframe ? 'true' : 'false'); $('wfState').textContent = wireframe ? 'ON' : 'OFF'; }
  syncWf();
  wfBtn.addEventListener('click', function () { wireframe = wireframe ? 0 : 1; syncWf(); dirty = true; });

  /* ── 루프: 스크롤이 바뀌거나 K7에서 회전 중일 때만 다시 그림 ── */
  var last = null;
  window.addEventListener('scroll', function () { dirty = true; }, { passive: true });
  function frame(ts) {
    var p = progress();
    var spinning = p >= .78 && !reduce && FIXED === null;
    if (spinning && last !== null) { spin += (ts - last) / 1000 * 12; dirty = true; }
    if (p < .78 && spin !== 0) { spin = 0; dirty = true; }
    last = ts;
    if (dirty || p !== lastP) { dirty = false; lastP = p; render(p); }
    requestAnimationFrame(frame);
  }
  render(progress());
  requestAnimationFrame(frame);
})();
