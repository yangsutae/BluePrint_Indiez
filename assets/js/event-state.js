/* 행사 일정에 따라 보이는 요소를 바꾼다.
   data-until="시각": 그 시각부터 숨긴다. data-from="시각": 그 시각부터 보인다(HTML에는 hidden으로 둔다).
   스크립트가 돌지 않으면 HTML에 적힌 상태(신청 받는 중) 그대로 보인다. */
(function () {
  var now = Date.now();
  document.querySelectorAll('[data-until], [data-from]').forEach(function (el) {
    var until = el.dataset.until, from = el.dataset.from;
    el.hidden = Boolean((until && now >= Date.parse(until)) || (from && now < Date.parse(from)));
  });
})();
