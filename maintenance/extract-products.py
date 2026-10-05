import csv, json, re
from pathlib import Path
text = Path('maintenance/products-source.txt').read_text(encoding='utf-8')
rows = []
for line in text.splitlines():
    match = re.match(r'^\s*(\d{2})\s{2,}(.+?)\s{2,}(Nos|Pkt|Coil|Meter|Ft)\s+(\d+)\s+Rs\s+([\d,]+)\s+Rs\s+([\d,]+)\s*$', line)
    if match:
        number, name, unit, quantity, rate, amount = match.groups()
        rows.append(dict(sourceLine=int(number), productName=name.strip(), unit=unit, defaultPrice=int(rate.replace(',', '')), sourceQuantity=int(quantity), sourceAmount=int(amount.replace(',', ''))))
    elif rows and re.match(r'^\s{8,}\S', line) and not re.search(r'Rs|Subtotal|Total|DATE:|QUOTE|Contact|Emails|@|Fax:|Tel:|Market|Road|NTN', line):
        # Only continuation lines in the description column, before totals/footer.
        content = line.strip()
        if content in ['Black) COPPERGAT', 'COPPERGAT', 'Polyolefin (for 50sqmm Cable)', 'Polyolefin (for 120sqmm Cable)', 'Polyolefin (for 300sqmm Cable)', 'SCHNEIDER', '(SCHNEIDER)', '100VAC-240VAC ST3P', '240VAC', 'RM22/RM35', 'RM22 TR33']:
            rows[-1]['productName'] += ' ' + content
assert [r['sourceLine'] for r in rows] == list(range(1,35))
assert all(r['defaultPrice'] * r['sourceQuantity'] == r['sourceAmount'] for r in rows)
assert sum(r['sourceAmount'] for r in rows) == 686545
assert len({r['productName'].casefold() for r in rows}) == 34
for row in rows:
    row['description'] = f"Unit: {row['unit']}. Source: quotation QT-PS-001 dated 03-09-2026. Price in PKR, exclusive of GST."
    row['isActive'] = True
Path('maintenance/qt-ps-001-products.json').write_text(json.dumps(rows, indent=2) + '\n', encoding='utf-8')
with Path('maintenance/qt-ps-001-products.csv').open('w', newline='', encoding='utf-8-sig') as file:
    writer = csv.DictWriter(file, fieldnames=['productName', 'defaultPrice', 'unit', 'description'])
    writer.writeheader()
    writer.writerows({k:r[k] for k in writer.fieldnames} for r in rows)
print(json.dumps(rows, indent=2))
