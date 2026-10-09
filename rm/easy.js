/* 렌탈몰라 복제판 — 쉬운 상담 신청.
 * 신청 경로는 하나(상담 창)로 모은다: 첫 화면 간편 바 · 목록 안내 바 · 상품 카드 [상담 신청] · 모바일 하단 바 · 원래 떠 있는 상담 버튼.
 * 전송: /config.js TG.relay → 텔레그램 "[렌탈몰라] 상담 신청" (shim.js 와 같은 형식 — 알림톡 접수처 = 렌탈몰라) */
(function () {
  var PHONE = "010-8175-7015"; // 렌탈 번호
  var KAKAO = "http://pf.kakao.com/_xowzxhX/chat";
  var PHOTO = "/rm/profile.jpg";
  var KINDS = ["정수기", "공기청정기", "비데", "안마의자", "냉장고", "세탁기·건조기", "에어컨", "TV", "노트북", "기타"];
  var TIMES = ["바로 가능", "오전", "오후", "저녁"];

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function won(n) { return Number(n || 0).toLocaleString("ko-KR"); }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function validTel(s) { return /^01[016789]\d{7,8}$/.test(digits(s)); }
  function fmtTel(s) { var d = digits(s); return d.length === 11 ? d.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3") : d.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"); }
  function chips(list, multi) {
    return '<div class="rm-chips" data-multi="' + (multi ? 1 : 0) + '">' + list.map(function (k) {
      return '<button type="button" class="rm-chip" aria-pressed="false">' + esc(k) + "</button>";
    }).join("") + "</div>";
  }
  function picked(root) {
    return [].slice.call(root.querySelectorAll('.rm-chip[aria-pressed="true"]')).map(function (b) { return b.textContent; });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".rm-chip");
    if (!b) return;
    var box = b.parentNode;
    if (box.getAttribute("data-multi") !== "1") {
      [].forEach.call(box.querySelectorAll(".rm-chip"), function (x) { if (x !== b) x.setAttribute("aria-pressed", "false"); });
    }
    b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
  });
  var AGREE = '<label class="rm-agree"><input type="checkbox" class="rm-ok"> 개인정보 수집·이용에 동의합니다(필수) ' +
              '<a href="/privacy.html" target="_blank" rel="noopener">보기</a></label>';

  function pageContext() {
    var q = {};
    location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function (_, k, v) { q[k] = decodeURIComponent(v.replace(/\+/g, " ")); });
    if (q.search) return q.search;
    var t = document.querySelector(".js-listCateTitle");
    if (q.cate_code && t) return t.textContent.split(">").pop().trim();
    return "";
  }

  function send(f) {
    var lines = ["[렌탈몰라] 상담 신청", "이름: " + (f.name || "(미입력)"), "연락처: " + fmtTel(f.tel)];
    if (f.time) lines.push("통화 가능: " + f.time);
    if (f.item) {
      lines.push("상품: " + f.item.ItemName + (f.item.ModelName ? " (" + f.item.ModelName + ")" : "") +
        (f.item.RentalFee ? " · 월 " + won(f.item.RentalFee) + "원" : "") + (f.item.DutyUsePeriod ? " · " + f.item.DutyUsePeriod + "개월" : ""));
    }
    if (f.kinds && f.kinds.length) lines.push("관심 품목: " + f.kinds.join(", "));
    lines.push("신청 위치: " + f.from, "페이지: " + location.href);
    var relay = (window.TG || {}).relay;
    if (!relay) return Promise.reject(new Error("relay"));
    return fetch(relay, { method: "POST", headers: { "Content-Type": "text/plain" },
                          body: JSON.stringify({ type: "lead", text: lines.join("\n") }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d || !d.ok) throw new Error((d && d.why) || "fail"); });
  }

  function doneHTML() {
    return '<div class="rm-done"><div class="rm-ck">✓</div><b>상담 신청이 접수되었습니다</b>' +
           "<p>확인 후 남겨 주신 번호로 전화드리겠습니다.<br>급하시면 카톡으로 먼저 물어보셔도 돼요.</p>" +
           '<a class="rm-kakao" href="' + KAKAO + '" target="_blank" rel="noopener">카카오톡으로 문의하기</a></div>';
  }

  // 공통 제출: root 안의 .rm-tel · .rm-ok · .rm-msg · .rm-btn 을 읽는다
  function submit(root, extra, onDone) {
    var tel = root.querySelector(".rm-tel").value, msg = root.querySelector(".rm-msg"), btn = root.querySelector(".rm-btn");
    var ok = root.querySelector(".rm-ok");
    if (!validTel(tel)) { msg.textContent = "휴대폰 번호를 확인해 주세요."; root.querySelector(".rm-tel").focus(); return; }
    if (!ok.checked) { msg.textContent = "개인정보 수집·이용 동의가 필요합니다."; return; }
    msg.textContent = "";
    btn.disabled = true; btn.textContent = "보내는 중…";
    send($.extend({ tel: tel }, extra())).then(onDone, function () {
      btn.disabled = false; btn.textContent = "상담 신청하기";
      msg.textContent = "전송에 실패했습니다. 잠시 후 다시 시도하시거나 " + PHONE + "로 전화 주세요.";
    });
  }

  // ---------------- 상담 창 (하나)
  var sheet = el('<div class="rm-sheet" role="dialog" aria-modal="true" aria-labelledby="rm-sheet-t"><div class="rm-dim"></div>' +
    '<div class="rm-box"><button type="button" class="rm-x" aria-label="닫기">×</button><div class="rm-body"></div></div></div>');
  document.body.appendChild(sheet);
  var body = sheet.querySelector(".rm-body"), current = null;
  function closeSheet() { sheet.classList.remove("on"); }
  sheet.querySelector(".rm-dim").onclick = closeSheet;
  sheet.querySelector(".rm-x").onclick = closeSheet;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  function openSheet(opt) {
    current = opt || {};
    var it = current.item, ctx = current.kind || pageContext();
    var head = '<div class="rm-who"><img src="' + PHOTO + '" alt="렌탈 상담 담당 김다혜"><div><b>렌탈 상담 담당 김다혜</b>' +
               "<span>확인 후 바로 전화드려요 · " + PHONE + "</span></div></div>";
    var what = it
      ? '<div class="rm-prod"><b>' + esc(it.ItemName) + "</b><span>" + esc(it.ModelName || "") +
        (it.RentalFee ? " · 월 " + won(it.RentalFee) + "원" : "") + (it.DutyUsePeriod ? " · " + esc(it.DutyUsePeriod) + "개월" : "") + "</span></div>"
      : '<p class="rm-lbl">관심 품목 (여러 개 가능)</p>' + chips(KINDS, true);
    body.innerHTML = '<h4 id="rm-sheet-t">' + (it ? "이 상품 상담 신청" : "렌탈 상담 신청") + "</h4>" + head + what +
      '<p class="rm-lbl">휴대폰 번호 (필수)</p><input class="rm-tel" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000">' +
      '<p class="rm-lbl">이름 (선택)</p><input class="rm-name" type="text" autocomplete="name" maxlength="20" placeholder="성함">' +
      '<p class="rm-lbl">통화 편한 시간 (선택)</p>' + chips(TIMES, false) + AGREE + '<p class="rm-msg" aria-live="polite"></p>' +
      '<button type="button" class="rm-btn">상담 신청하기</button>' +
      '<p class="rm-note">상담받으신다고 꼭 가입하셔야 하는 건 아니에요.</p>';
    if (!it && ctx) {
      [].forEach.call(body.querySelectorAll(".rm-chip"), function (b) {
        if (ctx.indexOf(b.textContent.split("·")[0]) >= 0 || b.textContent.indexOf(ctx) >= 0) b.setAttribute("aria-pressed", "true");
      });
    }
    body.querySelector(".rm-btn").onclick = function () {
      submit(body, function () {
        var kinds = it ? [] : picked(body.querySelector(".rm-chips"));
        if (!it && ctx && !kinds.length) kinds = [ctx];
        return { name: body.querySelector(".rm-name").value.trim(), time: picked(body.querySelectorAll(".rm-chips")[it ? 0 : 1])[0] || "",
                 item: it, kinds: kinds, from: current.from || "상담 창" };
      }, function () { body.innerHTML = doneHTML(); });
    };
    sheet.classList.add("on");
    setTimeout(function () { var t = body.querySelector(".rm-tel"); if (t && window.innerWidth > 768) t.focus(); }, 50);
  }
  window.RM_OPEN = openSheet;

  function itemOf(no) { return (window.RM_ITEMS || {})[String(no)] || null; }

  // ---------------- 첫 화면 간편 바
  var mainBar = document.getElementById("main_bar");
  if (mainBar && location.pathname.replace(/index\.html$/, "") === "/") {
    var q = el('<section class="rm-quick" aria-label="간편 상담 신청"><div class="rm-quick-in">' +
      '<div><h3>어떤 가전 알아보세요? <b>번호만</b> 남겨 주세요</h3>' +
      '<p class="rm-lead">렌탈사·약정 기간별 월 요금을 담당자가 전화로 안내해 드려요.</p></div>' +
      '<div class="rm-who"><img src="' + PHOTO + '" alt="렌탈 상담 담당 김다혜"><div><b>담당 김다혜</b><span>' + PHONE + "</span></div></div>" +
      chips(KINDS, true) +
      '<form novalidate><input class="rm-tel" type="tel" inputmode="numeric" autocomplete="tel" placeholder="휴대폰 번호 (010-0000-0000)" aria-label="휴대폰 번호">' +
      '<button type="submit" class="rm-btn">상담 신청하기</button>' + AGREE + '<p class="rm-msg" aria-live="polite"></p></form></div></section>');
    mainBar.parentNode.insertBefore(q, mainBar.nextSibling);
    q.querySelector("form").onsubmit = function (e) {
      e.preventDefault();
      submit(q, function () { return { kinds: picked(q), from: "첫 화면 간편 신청" }; },
             function () { q.querySelector(".rm-quick-in").innerHTML = doneHTML(); });
    };
  }

  // ---------------- 목록 안내 바
  function listBar() {
    var title = document.querySelector("#list .js-listCateTitle");
    if (!title || document.querySelector(".rm-list-bar")) return;
    var ctx = pageContext();
    var bar = el('<div class="rm-list-bar"><div><p><b>' + esc(ctx || "렌탈") + "</b> 고르기 어려우시면 번호만 남겨 주세요.<br>" +
      "렌탈사·기간별 월 요금을 전화로 안내해 드려요.</p>" +
      '<button type="button" class="rm-btn">상담 신청</button></div></div>');
    title.parentNode.insertBefore(bar, title.nextSibling);
    bar.querySelector(".rm-btn").onclick = function () { openSheet({ kind: ctx, from: "목록 안내 바" }); };
  }

  // ---------------- 상품 카드 버튼
  function cardButtons() {
    [].forEach.call(document.querySelectorAll(".store_to_under"), function (card) {
      if (card.querySelector(".rm-ask")) return;
      var k = card.querySelector("[data-key]");
      if (!k) return;
      var no = k.getAttribute("data-key");
      var btn = el('<button type="button" class="rm-ask">상담 신청</button>');
      btn.onclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        openSheet({ item: itemOf(no) || { ItemName: (card.querySelector("h4") || {}).textContent || "상품 " + no }, from: "상품 카드" });
      };
      var spot = card.querySelector(".list_decs") || card;
      spot.appendChild(btn);
    });
  }
  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; cardButtons(); listBar(); }, 120);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ---------------- 원래 떠 있는 상담 버튼 → 상담 창
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".js-consultSubmitOpen");
    if (!b || b.closest("#req_modal")) return; // 상품 모달의 렌탈 신청은 원래 흐름(상품·기간 포함)대로
    e.preventDefault(); e.stopImmediatePropagation();
    openSheet({ from: "떠 있는 상담 버튼" });
  }, true);

  // ---------------- 모바일 하단 바
  var bottom = el('<nav class="rm-bottom" aria-label="빠른 상담"><a class="rm-b-tel" href="tel:' + PHONE + '">전화</a>' +
    '<a class="rm-b-kakao" href="' + KAKAO + '" target="_blank" rel="noopener">카톡</a>' +
    '<button type="button" class="rm-b-ask">상담 신청</button></nav>');
  document.body.appendChild(bottom);
  bottom.querySelector(".rm-b-ask").onclick = function () { openSheet({ from: "모바일 하단 바" }); };
})();
