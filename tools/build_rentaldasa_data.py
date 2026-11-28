# /rentaldasa/ 상품 데이터 생성 (rm/data/items.json → rentaldasa/data.json)
# 사용: python3 tools/build_rentaldasa_data.py   (렌탈 상품 데이터가 바뀌면 다시 실행)
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
items = json.load(open(os.path.join(ROOT, 'rm/data/items.json'), encoding='utf-8'))

def terms(s):
    # 렌탈사별로 나눈다 {렌탈사: [[개월, 요금], ...]} — 한 줄에 섞으면 다른 렌탈사 요금이 이 렌탈사 것처럼 보인다
    # (11-28 대표님 "빌리고 화면 오류 고쳐" — LIM-055A '스마트렌탈' 줄에 현대 60개월 72,100이 붙어 있었다)
    by = {}
    for row in (s or '').split('"|"'):
        f = row.strip('"').split('"^"')
        if len(f) >= 4 and f[2].isdigit() and f[3].isdigit():
            by.setdefault(f[1], set()).add((int(f[3]), int(f[2])))
    return {co: sorted(v, reverse=True) for co, v in by.items()}

out = []
for no, it in items.items():
    img = os.path.splitext(it.get('Image1') or '')[0]
    thumb = '/imageserver/webp/50/' + img + '.webp' if img and os.path.exists(os.path.join(ROOT, 'imageserver/webp/50', img + '.webp')) else ''
    fee = int(it.get('RentalFee') or 0)
    if not fee:
        continue
    o = {'id': no, 'title': it['ItemName'], 'model': it.get('ModelName', ''), 'cat': it.get('CategoryName', ''),
         'co': it.get('BrandName', ''), 'brand': it.get('ManufacturerName', ''), 'm': fee,
         'mo': int(it.get('DutyUsePeriod') or 0), 'thumb': thumb}
    # 빌리고 상품은 렌탈사별 요금(Offers)을 한 줄씩 펼친다 — 렌탈사로 걸렀을 때 빠지지 않게 (10-26 대표님). 상세는 같은 상품(it)
    # Offers = [렌탈사, 기본 요금, [[개월, 요금, 카드할인 시 요금, 표기], ...], A/S]
    if it.get('Offers'):
        for i, of in enumerate(it['Offers']):
            tl = of[2] if len(of) > 2 else []
            base = next((x for x in tl if x[1] == of[1]), None)
            r = dict(o, co=of[0], m=int(of[1]), mo=base[0] if base else 0)
            if i:
                r.update(id=no + '~' + str(i), it=no)
            # 카드할인 금액은 안 넣는다 — 기본 월 요금만 (10-27 대표님 "카드할인 빼고 금액 적자")
            tt = [[x[0], x[1]] for x in tl if x[0]]
            if len(tt) > 1: r['t'] = tt
            out.append(r)
        continue
    by = terms(it.get('ItemAllianceCardDetail'))
    own = o['co']
    cos = ([own] if own in by else []) + sorted((c for c in by if c != own), key=lambda c: min(x[1] for x in by[c]))
    if not cos:
        out.append(o)
        continue
    for i, co in enumerate(cos):  # 렌탈사마다 한 줄 (첫 줄 = 상품 기본 렌탈사, id 그대로)
        tl = by[co]
        if co == own:
            r = dict(o)
        else:
            cheap = min(tl, key=lambda x: x[1])
            r = dict(o, co=co, m=cheap[1], mo=cheap[0])
        if i:
            r.update(id=no + '~' + str(i), it=no)
        if len(tl) > 1: r['t'] = [list(x) for x in tl]
        out.append(r)
json.dump(out, open(os.path.join(ROOT, 'rentaldasa/data.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'items', os.path.getsize(os.path.join(ROOT, 'rentaldasa/data.json')) // 1024, 'KB')
