// rentalmass 첫 화면 — 배너 넘기기 · 떠 있는 상담 바 (10-27 대표님 "메인화면 빌리고 따라해") · build_main.py
(function () {
  // ---- 배너: 5초마다 넘김, 화살표·점, 손가락으로 밀기
  var track = document.getElementById("heroTrack"), dots = track ? [].slice.call(document.querySelectorAll("#heroDots button")) : [];
  var n = dots.length, cur = 0, timer = null;
  function go(i) {
    if (!n) return;
    cur = (i + n) % n;
    track.style.transform = "translateX(" + (-100 * cur) + "%)";
    dots.forEach(function (d, k) { d.classList.toggle("on", k === cur); });
  }
  function auto() { clearInterval(timer); timer = setInterval(function () { if (!document.hidden) go(cur + 1); }, 5000); }
  if (n) {
    go(0); auto();
    document.getElementById("heroPrev").onclick = function () { go(cur - 1); auto(); };
    document.getElementById("heroNext").onclick = function () { go(cur + 1); auto(); };
    dots.forEach(function (d) { d.onclick = function () { go(+d.dataset.go); auto(); }; });
    var x0 = null;
    track.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); auto(); }
    });
  }
  // 첫 배너(24시간 자동 접수)는 카톡 링크(build_main.py BANNERS) — 10-30 대표님
  var hero = document.querySelector(".hero");

  // ---- 하단 고정 상담 바(PC, 항상 보임 — 피오렌탈식) 신청 → 중계(텔레그램·상담신청 시트). 번호+동의만 필수
  var f = document.getElementById("abForm"), msg = document.getElementById("abMsg");
  if (f) f.addEventListener("submit", function (e) {
    e.preventDefault();
    var tel = f.tel.value.trim(), d = tel.replace(/\D/g, ""), name = f.name.value.trim();
    if (d.length < 10 || d.length > 11 || !/^01/.test(d)) { msg.textContent = "휴대폰 번호를 확인해 주세요."; f.tel.focus(); return; }
    if (!f.ok.checked) { msg.textContent = "개인정보 수집·이용 동의가 필요합니다."; return; }
    var relay = (window.TG || {}).relay;
    if (!relay) { msg.textContent = "접수 설정 오류입니다. 카톡으로 문의해 주세요."; return; }
    var lines = ["[렌탈몰라] 상담 신청", "이름: " + (name || "(미입력)"), "연락처: " + d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3"),
                 "신청 위치: 첫 화면 하단 상담 바"];
    if (window.RM_SRC) lines.push("유입: " + window.RM_SRC());
    lines.push("페이지: " + location.href);
    var btn = f.querySelector("button"); btn.disabled = true; msg.textContent = "";
    fetch(relay, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ type: "lead", text: lines.join("\n") }) })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r || !r.ok) throw 0;
        if (window.fbq) window.fbq("track", "Lead");
        f.outerHTML = '<div class="ab-done"><b>상담 신청이 접수되었습니다.</b> 확인 후 남겨 주신 번호로 연락드릴게요.' +
          '<a href="http://pf.kakao.com/_xowzxhX/chat" target="_blank" rel="noopener">카톡으로 바로 묻기</a></div>';
      })
      .catch(function () { btn.disabled = false; msg.textContent = "전송에 실패했습니다. 잠시 뒤 다시 시도하시거나 카톡으로 문의해 주세요."; });
  });

  // ---- 품목 칸 가로 넘기기: 넘칠 때만 화살표(PC) — 11-18 빌리고 짜임 개편. 왼쪽 빠른 메뉴·오른쪽 위젯은 11-18 대표님 "정신 없다"로 뺐다
  [].forEach.call(document.querySelectorAll(".ms-rail"), function (rail) {
    var g = rail.querySelector(".ms-grid"), pv = rail.querySelector(".ms-arr.prev"), nx = rail.querySelector(".ms-arr.next");
    if (!g) return;
    function upd() {
      var over = g.scrollWidth > g.clientWidth + 4;
      rail.classList.toggle("can", over);
      if (pv) pv.disabled = g.scrollLeft < 4;
      if (nx) nx.disabled = g.scrollLeft + g.clientWidth >= g.scrollWidth - 4;
    }
    function step(d) { g.scrollBy({ left: d * g.clientWidth * 0.75, behavior: "smooth" }); }
    if (pv) pv.onclick = function () { step(-1); };
    if (nx) nx.onclick = function () { step(1); };
    g.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  });
})();
