// 보험사 공식 청구 경로 — 각 보험사 공식 사이트에서 확인 (2026-11-24 조사). 팩스는 금액 조건이 회사·페이지마다 달라 넣지 않는다.
// call = 보험금 접수에 쓰는 번호(전용 번호가 있으면 그것). web = 공식 청구 안내 페이지(확인 못 한 곳은 null).
window.INSURERS = [
  // 손해보험
  { name: "삼성화재", kind: "손해", web: "https://m.samsungfire.com/m2/customer/paper/paper00_t2_02.html", app: "삼성화재 앱", call: "1588-5114" },
  { name: "현대해상", kind: "손해", web: "https://direct.hi.co.kr/service.do?m=fdfa7f3cc0", app: "현대해상 앱", call: "1588-5656" },
  { name: "DB손해보험", kind: "손해", web: "https://www.idbins.com/FWCLAV1076.do", app: "DB손해보험 앱", call: "1588-0100" },
  { name: "KB손해보험", kind: "손해", web: "https://www.kbinsure.co.kr/CG205010001.ec", app: "KB손해보험 앱", call: "1544-0114" },
  { name: "메리츠화재", kind: "손해", web: "https://www.meritzfire.com/compensation/longterm-insurance/request.do", app: "메리츠화재 앱", call: "1566-7711" },
  { name: "한화손해보험", kind: "손해", web: null, app: "한화손보 앱", call: "1566-8000" },
  { name: "한화손보 캐롯(구 캐롯손보)", kind: "손해", web: "https://www.carrotins.com/desktop/reward/claim/guide/", app: null, call: "1566-0300" },
  { name: "롯데손해보험", kind: "손해", web: "https://www.lotteins.co.kr/web/C/D/C/cdc_claim_0101.jsp", app: "ALICE 앱", call: "1588-3344" },
  { name: "흥국화재", kind: "손해", web: "https://www.heungkukfire.co.kr/FRW/compensation/accidentInfo.do", app: "흥국화재 앱", call: "1688-1688" },
  { name: "예별손해보험(구 MG손보)", kind: "손해", web: "https://www.yebyeol.co.kr/RW121020MM.scp?menuId=MN5105002", app: null, call: "1588-5959" },
  { name: "NH농협손해보험", kind: "손해", web: "https://www.nhfire.co.kr/customer/guide/insuranceClaimGuide.nhfire", app: null, call: "1644-9000" },
  { name: "AIG손해보험", kind: "손해", web: "https://www.aig.co.kr/wt/dpwtm025.html?menuId=MS216", app: null, call: "1544-2792" },
  { name: "하나손해보험", kind: "손해", web: "https://www.hanainsure.co.kr/w/claim/healthReward/accidentReceipt", app: "하나손해보험 앱", call: "1566-3000" },
  // 생명보험
  { name: "삼성생명", kind: "생명", web: "https://direct.samsunglife.com/customerSupport/insuranceClaimInformation/CustomerSupportInsuranceClaimInformationView", app: "모니모", call: "1577-4118" },
  { name: "한화생명", kind: "생명", web: "https://www.hanwhalife.com/main/myPage/insurance/accident/MY_INAP000_P10000.do", app: "한화생명 앱", call: "1588-6363" },
  { name: "교보생명", kind: "생명", web: "https://d.kyobo.com/dgt/web/dti/insurance/accInq/findAccIsamInq", app: "교보생명 앱", call: "1588-1810" },
  { name: "신한라이프", kind: "생명", web: "https://www.shinhanlife.co.kr/hp/cdhf0020t01.do", app: "신한 SOL라이프", call: "1588-5580" },
  { name: "NH농협생명", kind: "생명", web: "https://m.nhlife.co.kr/mo/cm/30/20/MOCM3020P00", app: "NH농협생명 앱", call: "1833-4100" },
  { name: "동양생명", kind: "생명", web: "https://www.myangel.co.kr/customer/service/propose/WE_CR_PS_04_05_00.jsp", app: "동양생명 모바일창구", call: "1577-1004" },
  { name: "미래에셋생명", kind: "생명", web: null, app: "M-LIFE", call: "1588-0220" },
  { name: "흥국생명", kind: "생명", web: "https://www.heungkuklife.co.kr/jsps/cyber/cw_main.jsp", app: null, call: "1588-2288" },
  { name: "KB라이프", kind: "생명", web: "https://www.kblife.co.kr/customer-center/benefitClaimMethod.do", app: "KB라이프 앱", call: "1588-3374" },
  { name: "메트라이프생명", kind: "생명", web: null, app: "MetLife One", call: "1588-9600" },
  { name: "라이나생명", kind: "생명", web: "https://www.lina.co.kr/wss/insrmoney_apply_step01.htm", app: "라이나생명 앱", call: "1588-0058" },
  { name: "AIA생명", kind: "생명", web: "https://aiaplus.aia.co.kr/ko/claims/guide/claimsMethod.html", app: "AIA+", call: "1588-9898" },
  { name: "ABL생명", kind: "생명", web: "https://www.abllife.co.kr/st/custDesk/insSrvcGudn/acdtInsmClamGudn/acdtInsmClamGudn1?page=index", app: "ABL생명 모바일 센터", call: "1588-4404" },
  { name: "DB생명", kind: "생명", web: "https://www.idblife.com/support/guide/acbf_clm", app: "DB생명 앱", call: "1588-3131" },
  { name: "푸본현대생명", kind: "생명", web: null, app: null, call: "1577-3311" },
  { name: "처브라이프생명", kind: "생명", web: "https://www.chubblife.co.kr/front/ctmcenter/insurance/list.do", app: null, call: "1599-4600" },
  { name: "KDB생명", kind: "생명", web: "https://www.kdblife.co.kr/scrId/IISAI005M01P.do", app: "KDB생명 모바일창구", call: "1588-4040" },
  { name: "iM라이프(구 DGB생명)", kind: "생명", web: "https://www.imlifeins.co.kr/IAC/Iac030M01.do", app: "iM라이프 모바일창구", call: "1588-4770" },
  { name: "하나생명", kind: "생명", web: "https://www.hanalife.co.kr/csc/accidentInsuranceGuide/accidentInsuranceGuide.do", app: null, call: "1577-1112" },
  { name: "교보라이프플래닛", kind: "생명", web: "https://www.lifeplanet.co.kr/contact/ct/HPCT000S1.dev", app: "라이프플래닛 앱", call: "1566-0999" },
];
// 실손24 — 보험개발원 운영 (금융위·정책브리핑 기준)
window.SILSON = { url: "https://www.silson24.or.kr", call: "1811-3000" };
