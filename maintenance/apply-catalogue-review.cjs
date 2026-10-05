// Applies only the approved sections 1–4; no fuzzy merges or historical document edits.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const folder = path.join(__dirname, 'catalogue-audit');
const root = 'projects/hst-enterprises/databases/(default)/documents';
function decode(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k,v]) => [k,decode(v)]));
  return value;
}
const unpack = document => ({ ...Object.fromEntries(Object.entries(document.fields || {}).map(([k,v]) => [k,decode(v)])),
  id: document.name.split('/').pop(), _updateTime: document.updateTime });
const encode = value => typeof value === 'number' ? {doubleValue:value} : {stringValue:value};

async function main() {
  const review = JSON.parse(fs.readFileSync(path.join(folder, 'review.json'), 'utf8'));
  const snapshot = JSON.parse(fs.readFileSync(path.join(folder, 'snapshot.json'), 'utf8'));
  assert.equal(review.summary.project, 'hst-enterprises');
  assert.equal(review.summary.snapshotAt, snapshot.fetchedAt);
  assert.equal(review.products.length, 173);
  const keepIds = new Set(review.products.map(p => p.keepId));
  const removeIds = new Set(review.products.flatMap(p => p.removeIds));
  assert.equal(keepIds.size, 173);
  assert.equal(removeIds.size, 201);
  assert.ok([...keepIds].every(id => !removeIds.has(id)));
  assert.deepEqual(new Set([...keepIds,...removeIds]), new Set(snapshot.products.map(p=>p.id)));
  const auth = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
  const account = auth.getProjectDefaultAccount(path.resolve(__dirname, '..'));
  if (!account) throw new Error('Firebase login required.');
  const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  async function request(suffix, body) {
    const response = await fetch(`https://firestore.googleapis.com/v1/${root}${suffix}`, {
      method: body ? 'POST' : 'GET',
      headers: {Authorization:`Bearer ${token.access_token}`, 'Content-Type':'application/json'},
      body: body ? JSON.stringify(body) : undefined, signal:AbortSignal.timeout(30000)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Firestore ${response.status}: ${data.error?.message}`);
    return data;
  }
  async function list(collection) {
    let pageToken = '';
    const documents = [];
    do {
      const page = await request(`/${collection}?pageSize=1000` + (pageToken ? '&pageToken='+encodeURIComponent(pageToken) : ''));
      documents.push(...(page.documents || []));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return documents;
  }
  const [rawProducts, rawInvoices] = await Promise.all([list('products'),list('invoices')]);
  const liveProducts = rawProducts.map(unpack);
  const liveInvoices = rawInvoices.map(unpack);
  const byId = new Map(liveProducts.map(p => [p.id,p]));
  const checkSnapshot = (live, before, label) => {
    assert.equal(live.length, before.length, `${label} count changed since approval review`);
    const lookup = new Map(live.map(d=>[d.id,d]));
    for (const doc of before) assert.equal(lookup.get(doc.id)?._updateTime, doc._updateTime, `${label} ${doc.id} changed since approval review`);
  };
  checkSnapshot(liveProducts, snapshot.products, 'Product');
  checkSnapshot(liveInvoices, snapshot.invoices, 'Invoice/quotation');
  for (const doc of liveInvoices) for (const item of doc.items || []) {
    assert.ok(!removeIds.has(String(item.productId)), `Duplicate ${item.productId} is referenced; stop before deletion`);
  }
  const writes = [];
  const expected = new Map();
  const timestamp = new Date().toISOString();
  const counts = {removed:0, namesCorrected:0, pricesCorrected:0, unitsAdded:0, productsUpdated:0};
  for (const row of review.products) {
    const current = byId.get(row.keepId);
    const patch = {};
    if (row.proposedName !== current.productName) { patch.productName = row.proposedName; counts.namesCorrected++; }
    if (row.proposedPrice !== current.defaultPrice) { patch.defaultPrice = row.proposedPrice; counts.pricesCorrected++; }
    if (row.proposedUnit && !current.unit) { patch.unit = row.proposedUnit; counts.unitsAdded++; }
    if (Object.keys(patch).length) {
      patch.updatedAt = timestamp;
      counts.productsUpdated++;
      writes.push({update:{name:`${root}/products/${row.keepId}`, fields:Object.fromEntries(Object.entries(patch).map(([k,v])=>[k,encode(v)]))},
        updateMask:{fieldPaths:Object.keys(patch)}, currentDocument:{updateTime:current._updateTime}});
    }
    expected.set(row.keepId, {...current,...patch});
    for (const id of row.removeIds) {
      writes.push({delete:`${root}/products/${id}`,currentDocument:{updateTime:byId.get(id)._updateTime}});
      counts.removed++;
    }
  }
  assert.equal(counts.removed,201);
  assert.equal(counts.namesCorrected,134);
  assert.equal(counts.pricesCorrected,7);
  assert.equal(counts.unitsAdded,119);
  assert.ok(writes.length <= 500);
  console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'preview',...counts,writes:writes.length,invoiceChanges:0},null,2));
  if (!process.argv.includes('--apply')) return;
  const backupPath = path.join(folder, `approved-cleanup-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath,JSON.stringify({project:'hst-enterprises',createdAt:timestamp,products:rawProducts,invoices:rawInvoices,review},null,2),{flag:'wx'});
  // A single atomic commit, guarded by each product's reviewed update time.
  await request(':commit',{writes});
  const [afterProductsRaw, afterInvoicesRaw] = await Promise.all([list('products'),list('invoices')]);
  const afterProducts = afterProductsRaw.map(unpack);
  assert.equal(afterProducts.length,173);
  for (const product of afterProducts) {
    assert.ok(expected.has(product.id),'Unexpected product after cleanup');
    const {_updateTime:ignoreActual,...actual} = product;
    const {_updateTime:ignoreExpected,...wanted} = expected.get(product.id);
    assert.deepEqual(actual,wanted,`Verification mismatch for ${product.id}`);
  }
  const sortByName = docs => [...docs].sort((a,b)=>a.name.localeCompare(b.name));
  assert.deepEqual(sortByName(afterInvoicesRaw),sortByName(rawInvoices),'Historical documents changed during cleanup; inspect concurrent edits');
  assert.equal(new Set(afterProducts.map(p=>p.productName.trim().replace(/\s+/g,' ').toLowerCase())).size,173);
  const result = {project:'hst-enterprises',...counts,totalProducts:afterProducts.length,verified:true,
    unchangedHistoricalDocuments:afterInvoicesRaw.length,backupFile:path.basename(backupPath),completedAt:new Date().toISOString()};
  fs.writeFileSync(path.join(folder,'applied-result.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
