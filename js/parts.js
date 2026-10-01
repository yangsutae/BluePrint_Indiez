/* v5 부품 전개도 — 부품별 내용 (세 안이 같이 씀)
   off   : 3D에서 부품이 빠져나오는 이동 [x, y, z]
   items : 설명 항목. at = 전개도 기준점(BPI.NETS[부품].a), label = 작은 글, text = 본문
   문구 출처: 이전 공통조건 3.2~3.4 (새로 지어낸 수치·실적 없음) */
(function () {
  var BPI = window.BPI = window.BPI || {};
  BPI.PARTS = {
    marquee: {
      n: 1, sheet: '03', name: '간판', topic: '이름', off: [0, -40, 220],
      title: '만들어 가는 과정의 배경',
      lead: '블루프린트, 즉 설계도는 무언가를 만들 때 배경이 됩니다. 개발자들이 만들어 가는 과정을 나누는 배경 중 하나가 되고 싶습니다.',
      items: [
        { at: 'front', label: '이름', text: 'BluePrint Indiez' },
        { at: 'top', label: '지역', text: '부산·울산·경남 거점 게임 커뮤니티' },
        { at: 'side', label: '모임', text: '각자의 작업을 공유하고, 시연과 대화로 교류합니다.' }
      ]
    },
    screen: {
      n: 2, sheet: '04', name: '화면', topic: '주제', off: [0, -30, 250],
      title: '어떤 주제든 환영합니다',
      lead: '완성된 게임이 아니어도 됩니다. 기획서 한 장, 버그가 나는 프로토타입, 작업하다 생긴 고민까지 화면에 띄워 함께 봅니다.',
      items: [
        { at: 'screen', label: '화면', text: '만들고 있는 게임과 프로토타입' },
        { at: 'speaker', label: '스피커 턱', text: '기획·아트·프로그래밍·사운드 등 개발 경험' },
        { at: 'bezel', label: '베젤', text: '작업 중의 고민, 선택의 이유, 발견' }
      ]
    },
    panel: {
      n: 3, sheet: '05', name: '조작부', topic: '참여', off: [0, 10, 250],
      title: '발표자도 얻어 가는 자리',
      lead: '평가하고 평가받는 자리가 아닙니다. 발표자는 의견을 얻어 가고, 모두가 같은 주제를 두고 생각을 나누는 참여자입니다. 발표·시연·교류 중에서 골라 참여하세요.',
      items: [
        { at: 'joy1', label: 'P1 조이스틱', text: '작업 보여주기' },
        { at: 'btn1', label: 'P1 버튼', text: '서로의 게임을 플레이하고 의견 나누기' },
        { at: 'joy2', label: 'P2 조이스틱', text: '발표·시연 없이 듣고 교류해도 괜찮아요' },
        { at: 'btn2', label: 'P2 버튼', text: '직군·소속·완성도와 무관하게 누구나' }
      ]
    },
    door: {
      n: 4, sheet: '06', name: '동전 투입구', topic: '함께하기', off: [0, 20, 200],
      title: '동전은 필요 없어요',
      lead: '회비와 참가비가 없습니다. 어떤 직군이든, 학생이든 현업이든 누구나. 매월 부산 센텀시티에서 만나는 것을 목표로 합니다.',
      items: [
        { at: 'coin1', label: '투입구', text: '카카오톡 공지 채팅방', href: 'https://invite.kakao.com/tc/2BYLO0beM5', btn: '카카오톡 공지 채팅방 참여하기', primary: true }
      ]
    }
  };
  BPI.PART_ORDER = ['marquee', 'screen', 'panel', 'door'];

  /* 공통 조각 */
  BPI.stepsHTML = function (cur) {
    return '<ol class="steps" aria-label="부품 설명 순서"><li class="done">완성품</li>' + BPI.PART_ORDER.map(function (k) {
      var p = BPI.PARTS[k], c = p.n < BPI.PARTS[cur].n ? ' class="done"' : (k === cur ? ' class="now" aria-current="step"' : '');
      return '<li' + c + '><span class="num">' + p.n + '</span>' + p.name + '</li>';
    }).join('') + '</ol>';
  };
  BPI.markHTML = '<div class="mark"><p class="brand"><img src="../assets/BPI_무배경.svg" alt="BluePrint Indiez"></p></div>';
  BPI.itemHTML = function (it, i) {
    var link = it.href ? '<a class="btn ' + (it.primary ? 'primary' : 'ghost') + '" href="' + it.href + '"' + (it.href.indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '') + '>' + it.btn + '</a>' : '';
    return '<li><span class="num">' + (i + 1) + '</span><span><small>' + it.label + '</small>' + (it.href ? link : it.text) + '</span></li>';
  };
  /* 전개도 위 번호 풍선 (기준점에서 dx, dy 떨어진 곳) */
  BPI.netBalloons = function (a, items, dx, dy) {
    return '<g class="num-b">' + items.map(function (it, i) {
      var p = a[it.at], bx = p[0] + (typeof dx === 'function' ? dx(i, p) : dx), by = p[1] + (typeof dy === 'function' ? dy(i, p) : dy);
      var l = Math.hypot(bx - p[0], by - p[1]) || 1, ex = bx - (bx - p[0]) / l * 12, ey = by - (by - p[1]) / l * 12;
      return '<line class="thin" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + ex + '" y2="' + ey + '"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.5" fill="#EEF0E9"/>' +
        '<circle class="bl" cx="' + bx + '" cy="' + by + '" r="12"/><text x="' + bx + '" y="' + (by + 4) + '">' + (i + 1) + '</text>';
    }).join('') + '</g>';
  };
})();
