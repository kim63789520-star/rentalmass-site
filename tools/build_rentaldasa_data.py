# /rentaldasa/ 상품 데이터 생성 (rm/data/items.json → rentaldasa/data.json)
# 사용: python3 tools/build_rentaldasa_data.py   (렌탈 상품 데이터가 바뀌면 다시 실행)
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
items = json.load(open(os.path.join(ROOT, 'rm/data/items.json'), encoding='utf-8'))

def terms(s):
    out = []
    for row in (s or '').split('"|"'):
        f = row.strip('"').split('"^"')
        if len(f) >= 4 and f[2].isdigit() and f[3].isdigit():
            out.append([int(f[3]), int(f[2])])
    return sorted(set(map(tuple, out)), reverse=True)

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
    d = int(it.get('MaxDiscountAmount') or 0)
    if d: o['d'] = d
    t = terms(it.get('ItemAllianceCardDetail'))
    if len(t) > 1: o['t'] = [list(x) for x in t]
    out.append(o)
json.dump(out, open(os.path.join(ROOT, 'rentaldasa/data.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'items', os.path.getsize(os.path.join(ROOT, 'rentaldasa/data.json')) // 1024, 'KB')
