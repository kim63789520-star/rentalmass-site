/* 렌탈몰라 복제판 — 원본 서버(/server/*.html) 요청을 정적 JSON으로 대신 답한다.
 * jquery.min.js 바로 다음에 로드. 상품 상세는 원본(rentalmalla.shop)으로 보낸다.
 * 상담 신청은 /config.js 의 TG.relay(구글 앱스스크립트 → 텔레그램)로 보낸다. */
(function () {
  var ORIGIN = "https://rentalmalla.shop";
  var D = "/rm/data/";
  var PER = 40;
  var cache = {};
  var ITEMS = {}; // 지금까지 받은 상품 카드 (ItemNo → 객체)

  function load(path) {
    if (!cache[path]) {
      cache[path] = fetch(D + path).then(function (r) {
        if (!r.ok) throw new Error(path + " " + r.status);
        return r.json();
      });
    }
    return cache[path];
  }
  function remember(list) {
    (list || []).forEach(function (it) { ITEMS[it.ItemNo] = it; });
  }
  function ok(payload) { return { state: "okay", message: "정상적으로 데이터를 가져왔습니다.", payload: payload }; }
  function hash(s) { // 파이썬 build_site.py 의 search_key 와 같은 규칙
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }
  function norm(s) { return String(s || "").toLowerCase().replace(/\s+/g, ""); }

  // chk = '362"|"359"#"1000042"^"1000046"|"13'  (속성끼리는 AND, 값끼리는 OR)
  function applyChk(nos, chk, fsets) {
    if (!chk || chk.indexOf('"#"') < 0) return nos;
    var parts = chk.split('"#"');
    var props = parts[0].split('"|"');
    var groups = parts[1].split('"|"');
    var keep = null;
    props.forEach(function (p, i) {
      var set = {};
      (groups[i] || "").split('"^"').forEach(function (c) {
        (fsets[p + ":" + c] || []).forEach(function (n) { set[n] = 1; });
      });
      keep = keep === null ? set : (function () {
        var x = {};
        for (var k in keep) if (set[k]) x[k] = 1;
        return x;
      })();
    });
    return keep === null ? nos : nos.filter(function (n) { return keep[n]; });
  }

  function sortNos(nos, orderby, newOrder) {
    if (orderby === "LOW" || orderby === "HIGH") {
      var dir = orderby === "LOW" ? 1 : -1;
      var idx = {};
      nos.forEach(function (n, i) { idx[n] = i; });
      return nos.slice().sort(function (a, b) {
        var fa = Number((ITEMS[a] || {}).RentalFee || 0), fb = Number((ITEMS[b] || {}).RentalFee || 0);
        return fa === fb ? idx[a] - idx[b] : (fa - fb) * dir;
      });
    }
    if (orderby === "NEW") {
      if (newOrder) {
        var pos = {};
        newOrder.forEach(function (n, i) { pos[n] = i; });
        return nos.slice().sort(function (a, b) { return (pos[a] || 0) - (pos[b] || 0); });
      }
      return nos.slice().sort(function (a, b) { return Number(b) - Number(a); });
    }
    return nos;
  }

  function page(nos, data, filter) {
    var p = Math.max(1, Number(data.page) || 1);
    var list = nos.slice((p - 1) * PER, p * PER).map(function (n, i) {
      var it = $.extend({}, ITEMS[n]);
      it.SeqNo = String((p - 1) * PER + i + 1);
      return it;
    });
    return ok({ Test: [null, null, false, filter], Total: { TotalCount: String(nos.length) }, ItemList: list, Post: data });
  }

  // 사전 수집 안 된 검색어 — 이름·모델·브랜드·제조사·카테고리에 낱말이 모두 들어가면 결과
  function searchLocal(q) {
    return load("search_index.json").then(function (idx) {
      var words = String(q).toLowerCase().split(/\s+/).filter(Boolean);
      return idx.filter(function (row) {
        var hay = norm(row[1]);
        return words.every(function (w) { return hay.indexOf(norm(w)) >= 0; });
      }).map(function (row) { return row[0]; });
    });
  }
  function searchData(q) {
    var key = "search/" + hash(norm(q)) + ".json";
    return load(key).then(function (d) {
      if (norm(d.q) !== norm(q)) throw new Error("hash");
      remember(d.items);
      return d;
    }).catch(function () {
      return Promise.all([searchLocal(q), load("items.json"), load("search_meta.json")]).then(function (r) {
        var nos = r[0], meta = r[2];
        for (var k in r[1]) ITEMS[k] = r[1][k];
        // 결과에 걸리는 필터 값만 남긴다
        var filt = meta.props.map(function (p) {
          var codes = [], vals = [];
          p.codes.forEach(function (c, i) {
            var set = meta.fsets[p.PropertyNo + ":" + c] || [];
            if (nos.some(function (n) { return set.indexOf(n) >= 0; })) { codes.push(c); vals.push(p.values[i]); }
          });
          return { PropertyNo: p.PropertyNo, PropertyName: p.PropertyName, FilterCodeList: codes.join('"^"'),
                   FilterValueList: vals.join('"^"'), CommonYN: "Y", Ranking: p.Ranking };
        }).filter(function (p) { return p.FilterCodeList; });
        return { q: q, Filter: filt, POPULAR: nos, fsets: meta.fsets };
      });
    });
  }
  function fsetsFor(d) {
    return d.fsets ? Promise.resolve(d.fsets) : load("search_meta.json").then(function (m) { return m.fsets; });
  }

  function catData(code) {
    return load("cat/" + code + ".json").then(function (d) { remember(d.items); return d; })
      .catch(function () { return { Filter: [], POPULAR: [], NEW: [], fsets: {}, items: [] }; });
  }

  function itemsByNos(nos) {
    var miss = nos.filter(function (n) { return !ITEMS[n]; });
    var ready = miss.length ? load("items.json").then(function (all) { for (var k in all) ITEMS[k] = all[k]; }) : Promise.resolve();
    return ready.then(function () { return nos.filter(function (n) { return ITEMS[n]; }).map(function (n) { return ITEMS[n]; }); });
  }

  function products(it) {
    // ItemAllianceCardDetail = 'ProductNo"^"렌탈사"^"월요금"^"개월"^"상태"|"…'
    return String(it.ItemAllianceCardDetail || "").split('"|"').filter(Boolean).map(function (row) {
      var c = row.split('"^"');
      return { ProductNo: c[0], BrandName: c[1], MaxDiscountAmount: it.MaxDiscountAmount || "0", RentalFee: c[2], RentalPeriod: c[3],
               ProductStatus: c[4] || "09", BrandType: "01", DirectURL: "" };
    });
  }

  // 렌탈 신청 직전: ProductNo(렌탈사·기간별 상품) → 상품 카드 + 그 요금
  function productRows(pnos) {
    var want = {};
    pnos.forEach(function (n) { want[String(n)] = 1; });
    var out = [];
    for (var k in ITEMS) {
      products(ITEMS[k]).forEach(function (p) {
        if (want[p.ProductNo]) {
          out.push($.extend({}, ITEMS[k], { Ranking: String(out.length + 1), ProductNo: p.ProductNo, BrandName: p.BrandName,
                                            RentalFee: p.RentalFee, RentalPeriod: p.RentalPeriod, ProductStatus: p.ProductStatus }));
        }
      });
    }
    return out;
  }

  function consult(data) {
    var rows = data.data || [];
    if (!$.isArray(rows)) rows = [rows];
    var first = rows[0] || {};
    var lines = ["[렌탈몰라] 상담 신청", "이름: " + (first.name || "(미입력)"), "연락처: " + (first.tel || data.number || "")];
    if (first.time) lines.push("통화 가능: " + first.time);
    rows.forEach(function (r) {
      if (r.ItemName) {
        lines.push("상품: " + r.ItemName + (r.ModelName ? " (" + r.ModelName + ")" : "") +
          (r.RentalPeriod ? " · " + r.RentalPeriod + "개월" : "") + (r.RentalFee ? " · 월 " + r.RentalFee + "원" : ""));
      }
    });
    if (data.companyName) lines.push("회사: " + data.companyName, "담당: " + (data.managerName || ""), "문의: " + (data.inquiry || ""));
    lines.push("페이지: " + location.href);
    var relay = (window.TG || {}).relay;
    if (!relay) return Promise.resolve({ state: "error" });
    return fetch(relay, { method: "POST", headers: { "Content-Type": "text/plain" },
                          body: JSON.stringify({ type: "lead", text: lines.join("\n") }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { return { state: d && d.ok ? "okay" : "error" }; });
  }

  function handle(name, data) {
    switch (name) {
      case "header": return load("header.json");
      case "getDomainSNSLinkListJson": return load("sns.json");
      case "getPartnerDefaultHeaderEtcJson": return load("partner.json");
      case "cart/cart_cookie_get": return Promise.resolve({ payload: [] });
      case "cart/index": return Promise.resolve(ok({ Cart: [], Result: [] }));
      case "list/list_Filter":
        if (data.cate_code) return catData(data.cate_code).then(function (d) { return ok(d.Filter); });
        if (data.search) return searchData(data.search).then(function (d) { return ok(d.Filter); });
        return Promise.resolve(ok([]));
      case "list/list_index":
        if (data.cate_code) {
          return catData(data.cate_code).then(function (d) {
            var nos = applyChk(d.POPULAR, data.chk, d.fsets);
            return page(sortNos(nos, data.orderby, d.NEW), data, d.Filter);
          });
        }
        if (data.search) {
          return searchData(data.search).then(function (d) {
            return fsetsFor(d).then(function (fs) {
              return page(sortNos(applyChk(d.POPULAR, data.chk, fs), data.orderby), data, d.Filter);
            });
          });
        }
        return Promise.resolve(page([], data, []));
      case "item/get-item-with-item-num":
        return load("home.json").then(function (h) {
          remember(h);
          return itemsByNos(String(data.itemList || "").split('"^"')).then(function (list) {
            return ok(list.map(function (it, i) { return $.extend({ Ranking: String(i + 1) }, it); }));
          });
        });
      case "modal/product_modal":
        return itemsByNos([String(data.ItemNo)]).then(function (list) {
          return ok({ itemInfo: list, products: list[0] ? products(list[0]) : [] });
        });
      case "detail/product":
        var pnos = data.payload || data["payload[]"] || [];
        if (!$.isArray(pnos)) pnos = [pnos];
        return Promise.resolve(ok(productRows(pnos)));
      case "modal/check_commission": return Promise.resolve(ok({ PartnerProductCommission: 0 }));
      case "consult/consult":
      case "consult/landingCounselt":
        return consult(data);
      case "dictionary":
        return load("dict/" + String(data.dictionary_id).replace(/\D/g, "") + ".json")
          .catch(function () { return ok([{ WordDictionary: "" }]); });
      default: return Promise.resolve(ok([]));
    }
  }

  function parseQS(s) {
    var o = {};
    String(s).split("&").forEach(function (kv) {
      var i = kv.indexOf("=");
      if (i > 0) o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " "));
    });
    return o;
  }

  var origAjax = $.ajax;
  $.ajax = function (url, opts) {
    if (typeof url === "object") { opts = url; url = opts.url; }
    opts = opts || {};
    var u = String(url || opts.url || "");
    var m = u.match(/\/server\/(.+?)\.html/);
    if (!m) return origAjax.apply(this, arguments);
    var data = opts.data || {};
    if (typeof data === "string") data = parseQS(data);
    var d = $.Deferred();
    if (opts.beforeSend) { try { opts.beforeSend({ setRequestHeader: function () {} }); } catch (e) {} }
    handle(m[1], data).then(function (res) {
      if (opts.dataType === "text" && typeof res !== "string") res = JSON.stringify(res);
      if (opts.success) opts.success(res, "success", {});
      if (opts.complete) opts.complete({}, "success");
      d.resolve(res);
    }, function (err) {
      if (window.console) console.warn("[rm-shim]", m[1], err);
      if (opts.error) opts.error({ status: 500, responseText: "" }, "error", err);
      if (opts.complete) opts.complete({}, "error");
      d.reject(err);
    });
    return d.promise();
  };

  // 로그인 상태 조회(GraphQL) — 원본도 비회원엔 Token Error + data:null 을 준다
  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var u = typeof input === "string" ? input : (input && input.url) || "";
    if (/\/server\/graphql/.test(u)) {
      return Promise.resolve(new Response(JSON.stringify({ errors: [{ message: "Token Error", path: ["userState"] }], data: null }),
                                          { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return origFetch.apply(this, arguments);
  };

  // 상품 상세 → 원본 사이트
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (/^\/?(vrpage\/)?detail\.html/.test(href)) a.setAttribute("href", ORIGIN + "/" + href.replace(/^\//, ""));
  }, true);

  // 사진이 복제판에 없으면 원본 서버 사진으로
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (!t || t.tagName !== "IMG" || t.getAttribute("data-rm-fb")) return;
    var src = t.getAttribute("src") || "";
    if (/^\/imageserver\//.test(src)) {
      t.setAttribute("data-rm-fb", "1");
      e.stopImmediatePropagation();
      t.src = ORIGIN + src;
    }
  }, true);
})();
