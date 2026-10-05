// Read-only Firestore snapshot for the catalogue review. No database writes.
const fs = require('node:fs');
const path = require('node:path');
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
async function main() {
  const auth = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
  const account = auth.getProjectDefaultAccount(path.resolve(__dirname, '..'));
  if (!account) throw new Error('Firebase login required.');
  const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  async function list(collection) {
    const docs = [];
    let pageToken = '';
    do {
      const url = `https://firestore.googleapis.com/v1/projects/hst-enterprises/databases/(default)/documents/${collection}?pageSize=1000`
        + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(30000) });
      const page = await response.json();
      if (!response.ok) throw new Error(`Firestore ${response.status}: ${page.error?.message}`);
      docs.push(...(page.documents || []).map(d => ({ ...Object.fromEntries(Object.entries(d.fields || {}).map(([k,v]) => [k,decode(v)])), id: d.name.split('/').pop(), _updateTime: d.updateTime })));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return docs;
  }
  const [products, invoices] = await Promise.all([list('products'), list('invoices')]);
  const folder = path.join(__dirname, 'catalogue-audit');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'snapshot.json'), JSON.stringify({ project: 'hst-enterprises', fetchedAt: new Date().toISOString(), products, invoices }, null, 2));
  console.log(JSON.stringify({ products: products.length, documents: invoices.length, itemLines: invoices.reduce((sum,d) => sum + (d.items?.length || 0), 0), types: [...new Set(invoices.map(d => d.recordType || d.documentType || 'invoice'))] }));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
