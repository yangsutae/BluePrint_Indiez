# BluePrint Indiez

[홈페이지](https://indiez.org/) · [BPI 소개](https://indiez.org/main/) · [제1회 포럼 기록](https://indiez.org/events/01/)

BluePrint Indiez의 랜딩, 단체 소개와 오프라인 행사 기록을 담은 정적 홈페이지입니다. HTML·CSS·JavaScript로 구성하며 별도의 빌드나 패키지 설치가 필요하지 않습니다.

```text
.
├─ index.html             랜딩
├─ main/index.html        BPI 소개
├─ events/01/index.html   제1회 포럼 기록
├─ assets/
│  ├─ css/               공통·랜딩·행사 기록 스타일
│  ├─ js/                랜딩 캔버스·스크롤·손그림, 사진 확대 보기
│  └─ img/               로고·파비콘·선 입체 그림·QR·링크 썸네일
│     └─ events/01/      제1회 사진 17장
├─ 404.html              없는 주소 안내 화면
├─ robots.txt            검색 로봇 안내·사이트맵 위치
├─ sitemap.xml           검색엔진용 페이지 목록
├─ CNAME                 indiez.org
└─ .nojekyll             정적 파일 그대로 게시
```

페이지 폴더에는 `index.html`만 두고 스타일·스크립트·이미지는 `assets/` 아래에 종류별로 둡니다. 랜딩 첫 화면의 3면도와 입체도는 `assets/js/sketch.js`가 손으로 그린 선으로 바꿔 그립니다. 실제 페이지와 자산은 이 저장소에서 수정합니다. 랜딩의 자세히 보기 링크는 소개로, 소개의 지난 행사 링크는 제1회 기록으로 연결됩니다. 사진 확대 화면에서는 방향키로 이동하고 Escape로 닫습니다.

GitHub Pages가 `main` 브랜치의 루트를 게시합니다. 도메인은 `CNAME`의 `indiez.org`를 사용합니다.
