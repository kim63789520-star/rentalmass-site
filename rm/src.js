/* 렌탈몰라 복제판 — 유입 경로 기억 (2026-10-17 대표님, 렌탈앤캐시 참고).
 * 바깥에서 들어온 순간의 검색어·광고 표시(네이버 n_keyword·utm)와 들어온 곳을 기억했다가
 * 상담 알림에 "유입: …" 한 줄로 붙인다. 사이트 안에서 페이지를 옮겨 다녀도 유지된다.
 * easy.js · shim.js 가 window.RM_SRC() 로 읽는다. 저장이 막힌 브라우저면 지금 주소만 본다. */
(function () {
  var KEY = "rm_src";
  var q = {};
  location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function (_, k, v) {
    try { q[k] = decodeURIComponent(v.replace(/\+/g, " ")); } catch (e) { q[k] = v; }
  });
  var ref = "";
  try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
  if (ref === location.hostname) ref = "";

  function where(host) {
    if (/(^|\.)search\.naver\.com$/.test(host)) return "네이버 검색";
    if (/blog\.naver\.com$/.test(host)) return "네이버 블로그";
    if (/naver\.com$/.test(host)) return "네이버";
    if (/google\./.test(host)) return "구글";
    if (/daum\.net$|kakao\.com$/.test(host)) return "다음·카카오";
    if (/facebook\.com$|instagram\.com$/.test(host)) return "메타(페북·인스타)";
    return host;
  }

  var now = null;
  if (q.n_media || q.n_keyword || q.n_query) {
    now = { how: "네이버 광고", kw: q.n_keyword || q.n_query || "", rank: q.n_rank || "" };
  } else if (q.utm_source) {
    now = { how: q.utm_source + (q.utm_medium ? "/" + q.utm_medium : ""), kw: q.utm_term || "", camp: q.utm_campaign || "" };
  } else if (ref) {
    now = { how: where(ref), kw: "" };
  }

  var saved = null;
  try {
    if (now) { now.at = new Date().toISOString().slice(0, 16).replace("T", " "); localStorage.setItem(KEY, JSON.stringify(now)); }
    saved = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (e) { saved = now; }

  window.RM_SRC = function () {
    var s = saved || now;
    if (!s) return "직접 방문(주소 입력·즐겨찾기)";
    return s.how + (s.kw ? " · 검색어 " + s.kw : "") + (s.rank ? " · " + s.rank + "위" : "") +
           (s.camp ? " · " + s.camp : "") + (s.at ? " (" + s.at + " 들어옴)" : "");
  };
})();
