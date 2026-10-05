// Uses the existing Firebase CLI login; never prints or stores credentials.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const project = 'hst-enterprises';
const root = `projects/${project}/databases/(default)/documents`;
const base = `https://firestore.googleapis.com/v1/${root}`;
const normalize = name => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const encode = value => typeof value === 'boolean' ? { booleanValue: value }
  : typeof value === 'number' ? { doubleValue: value } : { stringValue: value };

async function main() {
  const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'qt-ps-001-products.json'), 'utf8'));
  if (products.length !== 34 || new Set(products.map(p => normalize(p.productName))).size !== 34
      || products.some(p => !Number.isFinite(p.defaultPrice) || p.defaultPrice < 0
        || p.defaultPrice * p.sourceQuantity !== p.sourceAmount)
      || products.reduce((sum, p) => sum + p.sourceAmount, 0) !== 686545) {
    throw new Error('Source validation failed. No writes performed.');
  }
  const auth = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
  const account = auth.getProjectDefaultAccount(path.resolve(__dirname, '..'));
  if (!account) throw new Error('Sign into Firebase CLI first.');
  const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  async function request(suffix, body) {
    const response = await fetch(base + suffix, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(`Firestore ${response.status}: ${result.error?.message || 'Request failed'}`);
    return result;
  }
  async function list() {
    const docs = [];
    let pageToken = '';
    do {
      const page = await request('/products?pageSize=1000' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''));
      docs.push(...(page.documents || []));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return docs;
  }
  const existing = await list();
  const writes = [], plan = [];
  const timestamp = new Date().toISOString();
  for (const product of products) {
    const matches = existing.filter(d => normalize(d.fields.productName?.stringValue || '') === normalize(product.productName));
    if (matches.length > 1) throw new Error(`Multiple existing matches for ${product.productName}; no writes performed.`);
    const current = matches[0];
    const id = 'qt-ps-001-' + crypto.createHash('sha256').update(normalize(product.productName)).digest('hex').slice(0, 24);
    const name = current?.name || `${root}/products/${id}`;
    const values = { productName: product.productName, defaultPrice: product.defaultPrice, unit: product.unit };
    if (!current) Object.assign(values, { description: product.description, isActive: true, createdAt: timestamp });
    const price = current?.fields.defaultPrice;
    const unchanged = current && Number(price?.doubleValue ?? price?.integerValue) === product.defaultPrice
      && current.fields.unit?.stringValue === product.unit;
    plan.push({ productName: product.productName, defaultPrice: product.defaultPrice, unit: product.unit,
      action: unchanged ? 'unchanged' : current ? 'update' : 'create' });
    if (unchanged) continue;
    values.updatedAt = timestamp;
    writes.push({ update: { name, fields: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, encode(v)])) },
      ...(current ? { updateMask: { fieldPaths: Object.keys(values) }, currentDocument: { updateTime: current.updateTime } }
        : { currentDocument: { exists: false } }) });
  }
  console.log(JSON.stringify({ project, existingProducts: existing.length, plan }, null, 2));
  if (!process.argv.includes('--apply')) return;
  const backup = path.join(__dirname, `products-backup-${Date.now()}.json`);
  fs.writeFileSync(backup, JSON.stringify(existing, null, 2));
  if (writes.length) await request(':commit', { writes });
  const after = await list();
  for (const product of products) {
    const matches = after.filter(d => normalize(d.fields.productName?.stringValue || '') === normalize(product.productName));
    const found = matches[0]?.fields;
    if (matches.length !== 1 || Number(found.defaultPrice?.doubleValue ?? found.defaultPrice?.integerValue) !== product.defaultPrice
        || found.unit?.stringValue !== product.unit) throw new Error(`Post-import verification failed: ${product.productName}`);
  }
  const result = { project, verified: products.length, created: plan.filter(p => p.action === 'create').length,
    updated: plan.filter(p => p.action === 'update').length, unchanged: plan.filter(p => p.action === 'unchanged').length,
    totalProducts: after.length, completedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(__dirname, 'import-result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
