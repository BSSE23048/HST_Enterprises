"""Generate review artifacts from a local read-only snapshot. Never writes to Firestore."""
import collections
import csv
import datetime
import html
import json
import re
from pathlib import Path

FOLDER = Path(__file__).parent / 'catalogue-audit'
snapshot = json.loads((FOLDER / 'snapshot.json').read_text(encoding='utf-8'))
products = snapshot['products']
documents = snapshot['invoices']

def exact(name):
    return ' '.join(name.casefold().split())

def match_key(name):
    name = name.lower().translate(str.maketrans({'”': '"', '“': '"', '–': '-', '—': '-'}))
    corrections = {'sleave': 'sleeve', 'try': 'tray', 'almunium': 'aluminium', 'auxial': 'axial',
                   'auxilary': 'auxiliary', 'timble': 'thimble', 'toogle': 'toggle', 'schnieder': 'schneider',
                   'contractor': 'contactor', 'mag': 'magnetic', 'aux': 'auxiliary', 'amp': 'a',
                   'selection': 'selector', 'id': 'identification', 'mtr': 'm', 'meter': 'm'}
    for before, after in corrections.items():
        name = re.sub(r'\b' + before + r'\b', after, name)
    # Preserve numbers, brand/model words, and their multiplicity. No fuzzy price matching.
    return ' '.join(sorted(re.findall(r'\d+(?:\.\d+)?|[a-z]+', name)))

def professional(name):
    name = ' '.join(name.split()).translate(str.maketrans({'”': '"', '“': '"', '–': '-', '—': '-'}))
    corrections = {'Sleave': 'Sleeve', 'Try': 'Tray', 'Almunium': 'Aluminium', 'Auxial': 'Axial',
                   'Auxilary': 'Auxiliary', 'Timble': 'Thimble', 'Toogle': 'Toggle',
                   'Schnieder': 'Schneider', 'Contractor': 'Contactor', 'SIEMENS': 'Siemens',
                   'SCHNEIDER': 'Schneider', 'wire': 'Wire', 'core': 'Core', 'shielded': 'Shielded',
                   'white': 'White', 'supply': 'Supply', 'small': 'Small', 'standard': 'Standard',
                   'super': 'Super', 'timer': 'Timer', 'Din': 'DIN', 'PIN': 'Pin', 'FUJI': 'Fuji'}
    for before, after in corrections.items():
        name = re.sub(r'\b' + before + r'\b', after, name, flags=re.I)
    name = re.sub(r'(\d)\s*KW\b', r'\1 kW', name, flags=re.I)
    name = re.sub(r'(\d)\s*KVAR\b', r'\1 kVAR', name, flags=re.I)
    name = re.sub(r'(\d)\s*(?:Amp|A)\b', r'\1 A', name, flags=re.I)
    name = re.sub(r'(\d)\s*V\b', r'\1 V', name, flags=re.I)
    name = re.sub(r'(\d)\s*VAC\b', r'\1 V AC', name, flags=re.I)
    name = re.sub(r'(\d)\s*mm\b', r'\1 mm', name, flags=re.I)
    name = re.sub(r'(\d)\s*sqmm\b', r'\1 mm²', name, flags=re.I)
    name = re.sub(r'(\d)\s*W\b', r'\1 W', name, flags=re.I)
    name = re.sub(r'(\d)\s*Pin\b', r'\1 Pin', name, flags=re.I)
    name = re.sub(r'(\d)\s*sec\b', r'\1 sec', name, flags=re.I)
    name = re.sub(r'\b(mtr|meter)\b', 'm', name, flags=re.I)
    name = name.replace('V/DC', 'V DC')
    name = re.sub(r'(\d)\s*-\s*(\d)', r'\1-\2', name)
    name = re.sub(r'\b(\d+)\s*-?\s*Pole\b', r'\1-Pole', name)
    return name

def unit(value):
    return {'feet': 'Ft', 'ft': 'Ft', 'nos': 'Nos', 'box': 'Box', 'pkt': 'Pkt', 'coil': 'Coil',
            'meter': 'Meter', 'yard': 'Yard', 'length': 'Length', 'set': 'Set', 'roll': 'Roll'}.get(str(value).lower(), value)

groups = collections.defaultdict(list)
for product in products:
    groups[exact(product['productName'])].append(product)
id_group = {p['id']: key for key, members in groups.items() for p in members}
token_groups = collections.defaultdict(set)
for key, members in groups.items():
    token_groups[match_key(members[0]['productName'])].add(key)

history = collections.defaultdict(list)
unmatched = collections.defaultdict(list)
issues = []
reference_counts = collections.Counter()
for document in documents:
    date = document.get('invoiceDate', '')
    try:
        datetime.date.fromisoformat(date)
    except ValueError:
        issues.append({'document': document.get('invoiceNumber'), 'issue': 'Invalid date; excluded from price ranking'})
        continue
    for index, item in enumerate(document.get('items', [])):
        if item.get('productId'):
            reference_counts[item['productId']] += 1
        description = item.get('description', '').strip()
        if not description:
            issues.append({'document': document.get('invoiceNumber'), 'line': index + 1, 'issue': 'Blank item; excluded from catalogue proposals'})
            continue
        entry = {'documentId': document['id'], 'document': document.get('invoiceNumber'), 'date': date,
                 'createdAt': document.get('createdAt', ''), 'status': document.get('status', ''),
                 'type': document.get('recordType', document.get('documentType', 'invoice')),
                 'line': index + 1, 'description': description, 'price': item.get('unitPrice'), 'unit': unit(item.get('unit'))}
        key = id_group.get(str(item.get('productId')))
        method = 'Product ID'
        if key is None and exact(description) in groups:
            key, method = exact(description), 'Exact name'
        if key is None:
            candidates = token_groups.get(match_key(description), set())
            if len(candidates) == 1:
                key, method = next(iter(candidates)), 'Same specification words (format/spelling/order normalized)'
        entry['match'] = method if key else 'Needs identity review'
        if key:
            history[key].append(entry)
        else:
            unmatched[exact(description)].append(entry)

rows = []
duplicate_rows = []
price_rows = []
unit_rows = []
name_rows = []
for index, (key, members) in enumerate(sorted(groups.items()), 1):
    members = sorted(members, key=lambda p: (-reference_counts[p['id']], p.get('createdAt', ''), p['id']))
    keep = members[0]
    histories = sorted(history[key], key=lambda e: (e['date'], e['createdAt'], e['documentId'], e['line']), reverse=True)
    eligible = [e for e in histories if e['status'] != 'cancelled' and isinstance(e['price'], (int, float)) and e['price'] > 0]
    latest = eligible[0] if eligible else None
    latest_day = [e for e in eligible if latest and e['date'] == latest['date']]
    units = sorted({e['unit'] for e in eligible if e['unit']})
    existing_units = sorted({unit(p.get('unit')) for p in members if p.get('unit')})
    flags = []
    if key == exact('Breaker 2 Pole 10 A (CHINT)'):
        flags.append('Possible newer use under the MCB name at Rs 1,250 (QT-BE-001, 2026-07-29); retain price until identity confirmed')
    if len(units) > 1 or (existing_units and units and set(existing_units) != set(units)):
        flags.append('Unit/pack conflict: keep price pending review')
    if len({e['price'] for e in latest_day}) > 1:
        flags.append('Multiple prices on newest document date: confirm which to use')
    proposed_price = latest['price'] if latest and not flags else keep['defaultPrice']
    proposed_unit = (existing_units[0] if existing_units else (units[0] if len(units) == 1 else ''))
    if not proposed_unit:
        flags.append('Unit not verified')
    old_price = keep['defaultPrice']
    old_name = keep['productName']
    new_name = professional(old_name)
    remove_ids = [p['id'] for p in members[1:]]
    row = {'reviewId': f'P{index:03}', 'currentName': old_name, 'proposedName': new_name,
           'copies': len(members), 'removeCopies': len(remove_ids), 'currentPrice': old_price, 'proposedPrice': proposed_price,
           'currentUnit': keep.get('unit', ''), 'proposedUnit': proposed_unit,
           'source': f"{latest['document']} / {latest['date']} / {latest['status']}" if latest else 'No verified history match; retain catalogue price',
           'match': latest['match'] if latest else '', 'flags': '; '.join(flags),
           'keepId': keep['id'], 'removeIds': remove_ids,
           'relinkCount': sum(reference_counts[pid] for pid in remove_ids),
           'historyPrices': sorted({e['price'] for e in eligible}), 'history': histories,
           'baseline': [{k:p.get(k) for k in ['id','_updateTime','productName','description','defaultPrice','unit','isActive']} for p in members]}
    rows.append(row)
    if remove_ids:
        duplicate_rows.append(row)
    if old_price != proposed_price:
        price_rows.append(row)
    if old_name != new_name:
        name_rows.append(row)
    if proposed_unit and any(not p.get('unit') for p in members):
        unit_rows.append(row)

unmatched_rows = []
for index, (_, entries) in enumerate(sorted(unmatched.items()), 1):
    entries.sort(key=lambda e: (e['date'], e['createdAt']), reverse=True)
    latest = entries[0]
    unmatched_rows.append({'reviewId': f'H{index:03}', 'description': latest['description'],
                           'proposedName': professional(latest['description']), 'latestPrice': latest['price'], 'unit': latest['unit'],
                           'source': f"{latest['document']} / {latest['date']} / {latest['status']}",
                           'action': 'Review identity; may be a missing product or an existing product with incomplete specifications',
                           'history': entries})

manual = [
    ('CHINT 10 A 2-Pole breakers', 'Breaker 2 Pole 10 A (CHINT) / Breaker 10 Amp 2 Pole MCB (CHINT)', 'Both Rs 1,250. Likely same item; confirm MCB type before merging their groups.'),
    ('Single-core flexible 1 mm wire', 'Single Core Wire / Single Core Wire Coil (same colour list)', 'Both Rs 5,000. Confirm both prices are per coil; retain COPPERGAT Rs 5,500 separately.'),
    ('16 A 2-Pole breaker', 'Catalogue Breaker 2 Pole 16A / PT-035 Breaker MCB 2 Pole 16 Amp', 'Conditional price Rs 1,450 → Rs 1,250 (PT-035, 2026-05-07). Confirm same breaker type; catalogue omits MCB.'),
    ('MPCB adjustment range', '1.5–2.5 A / 1.6–2.5 A', 'Both Rs 9,100, but ratings differ. Confirm the correct rating/model; do not merge yet.'),
    ('Glass fuse variants', 'Glass Fuse 1 Amp / 25 Amp', 'One catalogue record combines two ratings. History has 1 A and 25 A at Rs 14 each. Propose separate products after confirming size.'),
    ('Heat shrink sizes', 'Heat Shrink Tube 2mm / 2mm-4mm-6mm / 3-inch red', 'Catalogue 2 mm is Rs 20; PT-046 lists grouped 2/4/6 mm at Rs 33 per metre and 3-inch red at Rs 350. Confirm sizes before splitting or updating.'),
    ('Cable brands', 'PVC flexible copper cables 50/70/95 mm, with and without COPPERGAT', 'Keep branded and unspecified-brand records separate. Different prices alone do not prove duplication.'),
    ('Cable ties', '300 mm Taiwan / 300 mm unspecified / 8-inch', 'Keep separate: brand and length differ. Rs 1,375 / Rs 450 / latest Rs 300 respectively.'),
    ('Thimbles and shrouds', 'Standalone thimbles / standalone shrouds / lug-and-shroud sets / tube thimbles', 'Keep separate. Packet quantities and included parts differ; do not use one price across them.'),
    ('Connector strips', '15 A / 16 A', '15 A is Rs 2,000 per Box; 16 A is Rs 25 per piece. Keep separate; do not treat as price conflict.'),
    ('25 mm flexible cable', '440 V at Rs 390 per foot / coloured cable at Rs 1,300 per yard', 'Unit and specification differ. Confirm equivalence before any conversion or price replacement.'),
    ('Selector switches', '1-way / 1-way returnable', 'Rs 475 versus Rs 575; confirm whether returnable is a spring-return variant. Keep separate meanwhile.'),
    ('Proximity sensors', 'Proxy Sensor NPN / PR18-80N 10–30 V DC NPN', 'Rs 1,150 versus Rs 900; generic sensor lacks a model. Do not merge without model confirmation.'),
    ('Incomplete product names', 'SIEMENS with Auxiliary / Fire Breaker / GADA 2 Pole AC 32 Amp', 'Confirm product type/model; names cannot be completed reliably from stored data.'),
    ('Specifications requiring confirmation', 'LED Flood Light 2000W / HRC Fuse NH00 125 mp / MS DB Box 1.5 x 2 / Fan 4 x 4', 'Confirm 2000 W, whether mp means A, and missing dimension units. Preserve values until confirmed.'),
    ('Combined colour variants', 'Push Button (Green/Red/ON) / multicolour wire and tape', 'Confirm whether separate colour SKUs are desired; do not invent quantities or automatically split.'),
    ('Thermocouple and auxiliary models', 'PT100 4 mtr / GAVE11 / GVAE 11 / GAV11', 'History omits length or spells auxiliary model differently. Retain recorded models until confirmed.'),
    ('Other ambiguous labels', 'Thimble Thin Coated / Breaker S Pole', 'Confirm whether Thin Coated means tin-coated and S Pole means single-pole before renaming these specifications.'),
    ('Other unit options', 'History contains Roll and Set', 'Box is now added. Roll and Set also occur in older records; approve adding these options if required.'),
]

summary = {'project': snapshot['project'], 'snapshotAt': snapshot['fetchedAt'], 'products': len(products),
           'documents': len(documents), 'historyLines': sum(len(d.get('items',[])) for d in documents),
           'duplicateGroups': len(duplicate_rows), 'surplusCopies': sum(r['removeCopies'] for r in rows),
           'afterExactDeduplication': len(rows), 'priceChanges': len(price_rows), 'nameChanges': len(name_rows),
           'unitEnrichments': len(unit_rows), 'unverifiedUnits': sum(not r['proposedUnit'] for r in rows),
           'unmatchedHistoryDescriptions': len(unmatched_rows), 'referencesToRelink': sum(r['relinkCount'] for r in rows),
           'databaseChanged': False}
review = {'summary': summary, 'products': rows, 'unmatchedHistory': unmatched_rows, 'manualReview': manual, 'documentIssues': issues}
(FOLDER / 'review.json').write_text(json.dumps(review, ensure_ascii=False, indent=2), encoding='utf-8')

def export_csv(filename, data, fields):
    with (FOLDER / filename).open('w', encoding='utf-8-sig', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        for row in data:
            writer.writerow({k: '; '.join(str(v) for v in row[k]) if isinstance(row.get(k), list) else row.get(k, '') for k in fields})

fields = ['reviewId','currentName','proposedName','copies','removeCopies','currentPrice','proposedPrice','currentUnit','proposedUnit','source','match','flags','keepId','removeIds','relinkCount']
export_csv('catalogue-proposals.csv', rows, fields)
export_csv('price-changes.csv', price_rows, fields)
export_csv('unmatched-history.csv', unmatched_rows, ['reviewId','description','proposedName','latestPrice','unit','source','action'])

def table(headers, data):
    return '<div class="table-wrap"><table><thead><tr>' + ''.join('<th>'+html.escape(h)+'</th>' for h in headers) + '</tr></thead><tbody>' + ''.join('<tr>'+''.join('<td>'+html.escape(str(v))+'</td>' for v in row)+'</tr>' for row in data) + '</tbody></table></div>'

def money(number):
    return f'Rs {number:,.2f}'.removesuffix('.00')

sections = []
sections.append('<section id="prices"><h2>1. Proposed price changes</h2><p>Latest matching invoice or quotation date, including drafts. No price is selected from a differently specified or differently packaged item.</p>' + table(['ID','Product','Current','Proposed','Evidence'], [[r['reviewId'],r['proposedName'],money(r['currentPrice']),money(r['proposedPrice']),r['source']] for r in price_rows]) + '</section>')
sections.append('<section id="duplicates"><h2>2. Exact duplicate groups</h2><p>These records have the same normalized name, price, description, active status and unit. Keep the most-referenced record (oldest creation time breaks ties). Proposed removals require approval. Existing invoice descriptions, rates, quantities and totals remain unchanged.</p>' + table(['ID','Current name','Copies','Remove','Keep price','Keep ID','Remove IDs','Historical IDs to relink'], [[r['reviewId'],r['currentName'],r['copies'],r['removeCopies'],money(r['proposedPrice']),r['keepId'],', '.join(r['removeIds']),r['relinkCount']] for r in duplicate_rows]) + '</section>')
sections.append('<section id="names"><h2>3. Proposed name corrections</h2><p>Correct spelling, spacing, capitalization and unit formatting. Preserve brands, model numbers and ratings. Do not infer square millimetres from mm or invent missing dimensions. Ambiguous specifications remain in section 5.</p>' + table(['ID','Current name','Proposed name'], [[r['reviewId'],r['currentName'],r['proposedName']] for r in name_rows]) + '</section>')
sections.append('<section id="units"><h2>4. Units recovered from matching history</h2><p>One proposed unit per surviving product only where matching history has a consistent unit. Feet is normalized to Ft. Missing or ambiguous units remain unfilled.</p>' + table(['ID','Product','Proposed unit','Evidence'], [[r['reviewId'],r['proposedName'],r['proposedUnit'],r['source']] for r in unit_rows]) + '</section>')
sections.append('<section id="manual"><h2>5. Decisions requiring confirmation</h2>' + table(['Case','Products','Recommendation / question'],manual) + '<h3>Document data issues</h3>' + table(['Document','Line','Finding'], [[i['document'],i.get('line',''),i['issue']] for i in issues]) + '</section>')
sections.append('<section id="history"><h2>6. History descriptions needing identity review</h2><p>These do not have a confident catalogue match. Some are missing products; others omit a brand, model or specification. Listed prices are the latest observed prices, not approved additions or replacements.</p>' + table(['ID','Historical description','Formatted name','Latest price','Unit','Evidence'], [[r['reviewId'],r['description'],r['proposedName'],money(r['latestPrice']),r['unit'],r['source']] for r in unmatched_rows]) + '</section>')
sections.append('<section id="all"><h2>7. Complete proposed catalogue after exact deduplication</h2>' + table(['ID','Proposed name','Proposed price','Unit','Evidence','Flags'], [[r['reviewId'],r['proposedName'],money(r['proposedPrice']),r['proposedUnit'] or 'Unverified',r['source'],r['flags']] for r in rows]) + '</section>')

page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HST Catalogue Approval Review</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#f3f5f8;color:#172238}header,main{max-width:1500px;margin:auto;padding:24px}header{background:#172238;color:white;box-sizing:border-box}h1{margin:0}h2{color:#7b141b}section{background:white;border-radius:12px;padding:22px;margin:20px 0;scroll-margin-top:90px}.notice{padding:14px;background:#fff3cc;color:#493b10;border-radius:8px}.cards{display:flex;gap:12px;flex-wrap:wrap}.card{background:#263752;padding:15px;border-radius:8px}.card strong{font-size:25px;display:block}nav{position:sticky;top:0;background:#fff;padding:14px;box-shadow:0 2px 8px #0001;z-index:2;display:flex;gap:16px;flex-wrap:wrap}a{color:#174d94}input{padding:8px;min-width:280px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd;vertical-align:top;overflow-wrap:anywhere}th{background:#edf1f7}tbody tr:nth-child(even){background:#f8fafc}.table-wrap{overflow:auto}td{min-width:75px}td:nth-child(2){min-width:220px}@media print{nav{display:none}body{background:white}section{break-inside:auto}thead{display:table-header-group}}</style>
<header><h1>HST Enterprises · Catalogue review</h1><p>Approval draft — no catalogue records have been changed.</p><div class="cards">'''
for value, label in [(summary['products'],'Current records'),(summary['surplusCopies'],'Duplicate copies proposed for removal'),(summary['afterExactDeduplication'],'Records after exact deduplication'),(summary['priceChanges'],'Price corrections'),(summary['nameChanges'],'Name corrections')]:
    page += f'<div class="card"><strong>{value}</strong>{label}</div>'
page += '</div></header><nav>' + ''.join(f'<a href="#{link}">{label}</a>' for link,label in [('prices','Prices'),('duplicates','Duplicates'),('names','Names'),('units','Units'),('manual','Decisions'),('history','History'),('all','Full catalogue')]) + '<input id="search" type="search" placeholder="Filter tables by product, ID or source"></nav><main>'
page += f'<p>Read-only snapshot: {html.escape(snapshot["fetchedAt"])} · {len(documents)} invoices/quotations · {summary["historyLines"]} item lines.</p>'
page += '<p class="notice">Approval requested for sections 1–4 only. Section 5 requires specific decisions; section 6 is an unresolved identity list, not permission to add or merge. Recheck live data and save a backup before applying any approved changes.</p>'
page += '<p><b>Price rule:</b> compare document dates, not upload or payment-edit times. Include non-cancelled invoices and quotations, including drafts; exclude blank and non-positive-price lines. Match product ID, exact name, or identical specification words after formatting/spelling normalization. Conflicting units or same-day prices are held for review. Missing history retains the current price. Document dates can be backdated; flag any incorrect dates before approval.</p>'
page += ''.join(sections) + '''</main><script>document.querySelector('#search').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('tbody tr').forEach(row=>{row.hidden=!row.textContent.toLowerCase().includes(q)})});</script></html>'''
(FOLDER / 'catalogue-review.html').write_text(page, encoding='utf-8')

# Verify review completeness and safe exact-duplicate metadata before presenting it.
assert sum(r['copies'] for r in rows) == len(products)
assert len({p['id'] for p in products}) == len(products)
assert sum(r['removeCopies'] for r in rows) + len(rows) == len(products)
for members in groups.values():
    assert len({(p.get('description',''), p.get('unit',''), p.get('isActive',True), p['defaultPrice']) for p in members}) == 1
assert all(r['history'] and any(h['price'] == r['proposedPrice'] for h in r['history']) for r in price_rows)
print(json.dumps(summary, indent=2))
print('PRICE CHANGES')
for row in price_rows:
    print(row['reviewId'], row['currentName'], row['currentPrice'], '->', row['proposedPrice'], row['source'])
