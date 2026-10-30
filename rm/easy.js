/* 렌탈몰라 복제판 — 쉬운 상담 신청.
 * 신청 경로는 하나(상담 창)로 모은다: 첫 화면 간편 바 · 목록 안내 바 · 상품 카드 [상담 신청] · 모바일 하단 바 · 원래 떠 있는 상담 버튼.
 * 전송: /config.js TG.relay → 텔레그램 "[렌탈몰라] 상담 신청" (shim.js 와 같은 형식 — 알림톡 접수처 = 렌탈몰라) */
(function () {
  var PHONE = "010-8175-7015"; // 렌탈 번호
  var KAKAO = "http://pf.kakao.com/_xowzxhX/chat";
  var PHOTO = "/rm/profile.jpg";
  var KINDS = ["정수기", "공기청정기", "비데", "안마의자", "냉장고", "세탁기·건조기", "에어컨", "TV", "노트북", "기타"];
  var FIT = "36개월 이상 장기렌탈 · 렌탈사 심사 통과 후 설치";  // 문의 전 거르기 한 줄 (10-28)

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
  // 번호 칸 — 치는 대로 010-1234-5678 꼴로
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (!t.classList || !t.classList.contains("rm-tel")) return;
    var d = digits(t.value).slice(0, 11);
    t.value = d.length < 4 ? d : d.length < 8 ? d.slice(0, 3) + "-" + d.slice(3) : d.slice(0, 3) + "-" + d.slice(3, d.length - 4) + "-" + d.slice(-4);
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
    if (f.item && f.item.Pick) {  // 칸마다 한 줄 — 텔레그램에서 칸별로 눌러 복사 (중계 copyHtml_ · 10-27 대표님)
      lines.push("상품명: " + f.item.ItemName);
      if (f.item.ModelName) lines.push("모델명: " + f.item.ModelName);
      lines.push("렌탈사: " + f.item.BrandName);
      lines.push("렌탈기간: " + f.item.DutyUsePeriod + "개월");
      lines.push("월 렌탈료: " + won(f.item.RentalFee) + "원");
      if (f.item.CardFee) lines.push("카드 할인 시: " + won(f.item.CardFee) + "원");
    } else if (f.item) {
      lines.push("상품: " + f.item.ItemName + (f.item.ModelName ? " (" + f.item.ModelName + ")" : "") +
        (f.item.RentalFee ? " · 월 " + won(f.item.RentalFee) + "원" : "") + (f.item.DutyUsePeriod ? " · " + f.item.DutyUsePeriod + "개월" : ""));
      if (f.item.ModelName) lines.push("모델명: " + f.item.ModelName);
    }
    if (f.addr) lines.push("주소: " + f.addr);
    if (f.kinds && f.kinds.length) lines.push("관심 품목: " + f.kinds.join(", "));
    lines.push("신청 위치: " + f.from);
    if (window.RM_SRC) lines.push("유입: " + window.RM_SRC());
    lines.push("페이지: " + location.href);
    var relay = (window.TG || {}).relay;
    if (!relay) return Promise.reject(new Error("relay"));
    return fetch(relay, { method: "POST", headers: { "Content-Type": "text/plain" },
                          body: JSON.stringify({ type: "lead", text: lines.join("\n") }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) throw new Error((d && d.why) || "fail");
        if (window.fbq) window.fbq("track", "Lead");
      });
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
      msg.textContent = "전송에 실패했습니다. 잠시 후 다시 시도하시거나 카톡으로 문의해 주세요.";
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
               "<span>확인 후 바로 연락드려요</span></div></div>";
    // 상세 '렌탈 신청'에서 기간까지 고르고 온 경우 — 빌리고 신청서처럼 렌탈사·기간·카드 할인 시 요금 (10-27 대표님)
    var what = it && it.Pick
      ? '<div class="rm-prod rm-pick">' + (it.Img ? '<img src="' + esc(it.Img) + '" alt="">' : "") + "<div><span>" + esc(it.ModelName || "") + "</span><b>" + esc(it.ItemName) + "</b>" +
        "<span>" + esc(it.BrandName) + " · 렌탈기간 " + esc(it.DutyUsePeriod) + "개월</span>" +
        "<em>월 렌탈료 " + won(it.RentalFee) + "원</em>" + (it.CardFee ? '<i>카드 할인 시 ' + won(it.CardFee) + "원</i>" : "") + "</div></div>"
      : it
      ? '<div class="rm-prod"><b>' + esc(it.ItemName) + "</b><span>" + esc(it.ModelName || "") +
        (it.RentalFee ? " · 월 " + won(it.RentalFee) + "원" : "") + (it.DutyUsePeriod ? " · " + esc(it.DutyUsePeriod) + "개월" : "") + "</span></div>"
      : "";  // 관심 품목 고르기 칸 뺌 — 번호만 (10-30 대표님 "이것도 빼"). 품목은 보던 페이지(ctx)로만 적는다
    sheet.classList.toggle("ap", !!(it && it.Pick));
    if (it && it.Pick) return openApply(it);
    // 번호 하나만 넣으면 끝 — 이름·통화 시간 칸 뺌 (10-30 대표님 "쉽게 접수할 수 있게")
    body.innerHTML = '<h4 id="rm-sheet-t">' + (it ? "이 상품 상담 신청" : "렌탈 상담 신청") + "</h4>" + head + (it ? what : "") +
      '<p class="rm-lbl">휴대폰 번호만 남겨 주세요</p><input class="rm-tel" type="tel" inputmode="numeric" autocomplete="tel" enterkeyhint="send" maxlength="13" placeholder="010-0000-0000">' +
      (it ? "" : what) + AGREE + '<p class="rm-msg" aria-live="polite"></p>' +
      '<button type="button" class="rm-btn">상담 신청하기</button>' +
      '<p class="rm-note">' + FIT + "<br>상담만 받으셔도 돼요. 가입은 원하실 때만.</p>";
    if (!it && ctx) {
      [].forEach.call(body.querySelectorAll(".rm-chip"), function (b) {
        if (ctx.indexOf(b.textContent.split("·")[0]) >= 0 || b.textContent.indexOf(ctx) >= 0) b.setAttribute("aria-pressed", "true");
      });
    }
    body.querySelector(".rm-btn").onclick = function () {
      submit(body, function () {
        var kinds = (!it && ctx) ? [ctx] : [];
        return { item: it, kinds: kinds, from: current.from || "상담 창" };
      }, function () { body.innerHTML = doneHTML(); });
    };
    body.querySelector(".rm-tel").onkeydown = function (e) { if (e.key === "Enter") body.querySelector(".rm-btn").click(); };
    sheet.classList.add("on");
    setTimeout(function () { var t = body.querySelector(".rm-tel"); if (t && window.innerWidth > 768) t.focus(); }, 50);
  }
  // 렌탈 신청서 — 상세 '렌탈 신청 → 기간 고르기' 다음 (10-27 대표님 "보람 신청서처럼 바꿔")
  function openApply(it) {
    body.innerHTML = '<h4 id="rm-sheet-t">렌탈신청을 위한 정보를 확인해 주세요</h4>' +
      '<p class="rm-ap-h">상품정보</p>' +
      '<div class="rm-ap-prod">' + (it.Img ? '<img src="' + esc(it.Img) + '" alt="">' : "") + "<div><small>" + esc(it.ModelName || "") + "</small>" +
      "<b>" + esc(it.ItemName) + "</b><span>" + esc(it.BrandName) + " · 렌탈기간 " + esc(it.DutyUsePeriod) + "개월</span>" +
      "<span>월 렌탈료 <em>" + won(it.RentalFee) + "원</em></span>" + (it.CardFee ? '<span class="c">카드할인시 <em>' + won(it.CardFee) + "원</em></span>" : "") + "</div></div>" +
      '<p class="rm-ap-h">고객정보 <small>연락처만 필수</small></p>' +
      '<div class="rm-ap-f"><input class="rm-tel" type="tel" inputmode="numeric" autocomplete="tel" maxlength="13" placeholder="연락처 (필수)">' +
      '<input class="rm-name" type="text" autocomplete="name" maxlength="20" placeholder="이름 (선택)">' +
      '<select class="rm-time w empty" onchange="this.classList.toggle(\'empty\',!this.value)"><option value="">상담 희망 시간 (선택)</option><option>바로 가능</option><option>오전</option><option>오후</option><option>저녁</option></select>' +
      '<input class="rm-addr w" type="text" autocomplete="street-address" maxlength="80" placeholder="설치 주소 (선택)"></div>' +
      AGREE + '<p class="rm-msg" aria-live="polite"></p>' +
      '<button type="button" class="rm-btn">신청하기</button>' +
      '<p class="rm-note">상담 신청만으로 가입되지 않습니다.</p>';
    body.querySelector(".rm-btn").onclick = function () {
      submit(body, function () {
        return { name: body.querySelector(".rm-name").value.trim(), time: body.querySelector(".rm-time").value,
                 addr: body.querySelector(".rm-addr").value.trim(), item: it, kinds: [], from: current.from || "렌탈 신청" };
      }, function () { body.innerHTML = doneHTML(); });
    };
    sheet.classList.add("on");
  }
  window.RM_OPEN = openSheet;

  function itemOf(no) { return (window.RM_ITEMS || {})[String(no)] || null; }

  // ---------------- 첫 화면 간편 바
  var mainBar = document.getElementById("main_bar");
  if (mainBar && location.pathname.replace(/index\.html$/, "") === "/") {
    var q = el('<section class="rm-quick" aria-label="간편 상담 신청"><div class="rm-quick-in">' +
      '<div><h3>어떤 가전 알아보세요? <b>번호만</b> 남겨 주세요</h3>' +
      '<p class="rm-lead">렌탈사·약정 기간별 월 요금을 담당자가 전화로 안내해 드려요.</p></div>' +
      '<div class="rm-who"><img src="' + PHOTO + '" alt="렌탈 상담 담당 김다혜"><div><b>담당 김다혜</b><span>확인 후 바로 연락드려요</span></div></div>' +
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
  // 첫 화면 품목 줄 제목 옆 'OO 전체보기' → 그 카테고리 목록 (2026-10-13 대표님)
  var MORE = { "정수기": "1000210010", "공기청정기": "1000110001", "냉난방기": "1000110009", "콤보&결합": "10010",
    "PC/노트북": "1000310002", "음식물 처리기": "1000210004", "전기자전거/스쿠터": "1000610008", "건강/미용기기": "10006",
    "생활가전": "10001", "냉장고": "1000210001", "TV": "1000310001", "가구": "10004" };
  function moreLinks() {
    [].forEach.call(document.querySelectorAll(".js-mainItemsLine .prd_tit_wrap"), function (w) {
      if (w.querySelector(".rm-more")) return;
      var h = w.querySelector("h2"), t = h && h.textContent.trim(), c = MORE[t];
      if (!c) return;
      w.appendChild(el('<a class="rm-more" href="/list.html?cate_code=' + c + '">' + esc(t) + ' 전체보기 <span aria-hidden="true">›</span></a>'));
    });
  }
  var pending = false;
  new MutationObserver(function () {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; cardButtons(); listBar(); moreLinks(); }, 120);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ---------------- 원래 떠 있는 상담 버튼 → 상담 창
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".js-consultSubmitOpen");
    if (!b || b.closest("#req_modal")) return; // 상품 모달의 렌탈 신청은 원래 흐름(상품·기간 포함)대로
    e.preventDefault(); e.stopImmediatePropagation();
    openSheet({ from: "떠 있는 상담 버튼" });
  }, true);

  // ---------------- 하단 바 — 전화 · 카톡 · 접수신청 (2026-10-16 대표님, PC·모바일 모두)
  var bottom = el('<nav class="rm-bottom" aria-label="빠른 상담"><a class="rm-b-tel" href="tel:' + digits(PHONE) + '">전화</a>' +
    '<a class="rm-b-kakao" href="' + KAKAO + '" target="_blank" rel="noopener">카톡</a>' +
    '<button type="button" class="rm-b-ask">접수신청</button></nav>');
  document.body.appendChild(bottom);
  bottom.querySelector(".rm-b-ask").onclick = function () { openSheet({ from: "모바일 하단 바" }); };

  // 이달의 추천 상품 — 탭 · 좌우 넘기기 · 견적 받기
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".rm-pop .rp-tabs button");
    if (t) {
      var pop = t.closest(".rm-pop");
      [].forEach.call(pop.querySelectorAll(".rp-tabs button"), function (b) { b.setAttribute("aria-selected", b === t ? "true" : "false"); });
      [].forEach.call(pop.querySelectorAll(".rp-list"), function (u) { u.hidden = u.getAttribute("data-i") !== t.getAttribute("data-i"); });
      return;
    }
    var a = e.target.closest && e.target.closest(".rm-pop .rp-arr");
    if (a) {
      var u = a.parentNode.querySelector(".rp-list:not([hidden])");
      u.scrollBy({ left: (a.classList.contains("next") ? 1 : -1) * u.clientWidth * 0.9, behavior: "smooth" });
      return;
    }
    var q = e.target.closest && e.target.closest(".rm-pop .rp-ask");
    if (q) {
      openSheet({ item: { ItemName: q.getAttribute("data-name"), ModelName: q.getAttribute("data-model"),
        RentalFee: q.getAttribute("data-fee"), DutyUsePeriod: q.getAttribute("data-term") }, from: "이달의 추천 상품" });
    }
  });

  // 첫 배너(24시간 자동 접수)를 누르면 바로 상담 창
  document.addEventListener("click", function (e) {
    var slide = e.target.closest && e.target.closest("#banner .swiper-slide");
    if (slide && slide.querySelector('img[src*="main_banner_rm24"]')) { e.preventDefault(); openSheet({ from: "첫 배너(24시간 접수)" }); }
  }, true);
})();
