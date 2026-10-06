from pathlib import Path
import json, shutil, subprocess
root=Path(__file__).resolve().parent.parent
def edit(name, old, new):
    p=root/name
    s=p.read_text(encoding='utf-8')
    if old not in s: raise RuntimeError(f'Missing edit anchor: {name}: {old[:60]}')
    p.write_text(s.replace(old,new),encoding='utf-8')
edit('frontend/src/lib/api.ts', "import type { Invoice } from '../types';", "import type { Invoice } from '../types';\nimport { clientInput, productInput, invoiceInput, identifier } from './validation';")
edit('frontend/src/lib/api.ts', "({ id: d.id, ...d.data() })", "({ ...d.data(), id: d.id })")
for entity,validator in [('Client','clientInput'),('Product','productInput'),('Invoice','invoiceInput')]:
    edit('frontend/src/lib/api.ts', f'create{entity}(body: any) {{', f'create{entity}(input: unknown) {{\n  const body = {validator}(input);')
    old=f'update{entity}(id: string, body: any) {{'
    new=f'update{entity}(id: string, input: unknown) {{\n  const body = {validator}(input);'
    if entity=='Invoice': new=f'updateInvoice(id: string, input: Partial<Invoice>) {{\n  const existing = await loadInvoice(id);\n  const body = invoiceInput({{ ...existing.data, ...input }});'
    edit('frontend/src/lib/api.ts',old,new)
for collection in ['clients','products','invoices']:
    edit('frontend/src/lib/api.ts',f"doc(db, '{collection}', id)",f"doc(db, '{collection}', identifier(id))")
edit('frontend/src/App.tsx', 'useEffect, useMemo, useState, type FormEvent','useEffect, useMemo, useRef, useState, type FormEvent')
edit('frontend/src/App.tsx',"import { downloadInvoicePdf, viewInvoicePdf } from './lib/pdf';", "// PDF code is loaded only when a document action is requested.")
edit('frontend/src/App.tsx','  const [user, setUser]', '  const toastTimers = useRef(new Set<number>());\n  const [user, setUser]')
start=(root/'frontend/src/App.tsx').read_text(encoding='utf-8')
old=start[start.index('  useEffect(() => {\n    const unsubscribe'):start.index('  async function handleLogin')]
new='''  useEffect(() => {
    let mounted = true;
    let version = 0;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const ownVersion = ++version;
      setAuthChecking(true);
      setUser(null); setClients([]); setProducts([]); setInvoices([]);
      resetInvoice(); setClientForm(emptyClientForm); setProductForm(emptyProductForm);
      setEditingClientId(null); setEditingProductId(null);
      try {
        const token = currentUser ? await currentUser.getIdTokenResult(true) : null;
        if (!mounted || version !== ownVersion) return;
        if (currentUser && token?.claims.admin === true) {
          setUser(currentUser);
          void refreshAll();
        } else if (currentUser) {
          setLoginError('This account is not authorized for the employee portal.');
          await signOut(auth);
        }
      } catch {
        if (mounted) setLoginError('Unable to verify access. Please sign in again.');
      } finally {
        if (mounted && version === ownVersion) setAuthChecking(false);
      }
    });
    return () => { mounted = false; version++; unsubscribe(); toastTimers.current.forEach(clearTimeout); };
  }, []);

'''
edit('frontend/src/App.tsx',old,new)
edit('frontend/src/App.tsx','auth, loginEmail, loginPassword','auth, loginEmail.trim(), loginPassword')
edit('frontend/src/App.tsx',"finally { setBusy(false); }\n  }\n\n  async function handleLogout", "finally { setLoginPassword(''); setBusy(false); }\n  }\n\n  async function handleLogout")
edit('frontend/src/App.tsx',"    if (!invoiceDraft.clientId || activeInvoice) return;", "    if (!user || !invoiceDraft.clientId || activeInvoice) return;\n    let cancelled = false;")
edit('frontend/src/App.tsx',"        setInvoiceDraft(cur => ({ ...cur, invoiceSequence:","        if (cancelled) return;\n        setInvoiceDraft(cur => ({ ...cur, invoiceSequence:")
edit('frontend/src/App.tsx',"  }, [activeInvoice, invoiceDraft.clientId, invoiceDraft.recordType]);", "    return () => { cancelled = true; };\n  }, [user, activeInvoice, invoiceDraft.clientId, invoiceDraft.recordType]);")
edit('frontend/src/App.tsx',"    window.setTimeout(() => setToasts(c => c.filter(e => e.id !== id)), 4000);", "    const timer = window.setTimeout(() => { setToasts(c => c.filter(e => e.id !== id)); toastTimers.current.delete(timer); }, 4000);\n    toastTimers.current.add(timer);")
edit('frontend/src/App.tsx','  async function refreshAll() {\n    setLoading(true);', '  async function refreshAll() {\n    const uid = auth.currentUser?.uid;\n    if (!uid) return;\n    setLoading(true);')
edit('frontend/src/App.tsx','      setClients(cr.data as any);', '      if (auth.currentUser?.uid !== uid) return;\n      setClients(cr.data as any);')
edit('frontend/src/App.tsx',"      await downloadInvoicePdf({", "      const { downloadInvoicePdf } = await import('./lib/pdf');\n      await downloadInvoicePdf({")
edit('frontend/src/App.tsx',"      if (action === 'view') await viewInvoicePdf", "      const { downloadInvoicePdf, viewInvoicePdf } = await import('./lib/pdf');\n      if (action === 'view') await viewInvoicePdf")
edit('frontend/src/App.tsx',"window.open(url, '_blank');", "window.open(url, '_blank', 'noopener,noreferrer');")
edit('frontend/src/App.tsx',"WARNING: Delete this client and ALL associated history?", "Delete this client? Existing invoice history will be retained.")
edit('frontend/src/App.tsx',"quantity: Number(i.quantity || 1)","quantity: Number(i.quantity)")
edit('frontend/src/App.tsx',"notify('System error saving document.', 'error');", "notify(e instanceof Error ? e.message : 'Unable to save document.', 'error');")
edit('frontend/src/App.tsx',"notify('Error saving client data.', 'error');", "notify(e instanceof Error ? e.message : 'Unable to save client.', 'error');")
edit('frontend/src/App.tsx',"notify('Error saving product data.', 'error');", "notify(e instanceof Error ? e.message : 'Unable to save product.', 'error');")
edit('frontend/src/lib/firebase.ts',"import { getAuth } from 'firebase/auth';", "import { initializeAuth, browserSessionPersistence } from 'firebase/auth';")
edit('frontend/src/lib/firebase.ts',"export const auth = getAuth(app);", "export const auth = initializeAuth(app, { persistence: browserSessionPersistence });")
edit('frontend/src/lib/pdf.ts',"  LIGHT_BG: '#f9f9f9',\n",'')
edit('frontend/src/lib/pdf.ts',"  SUBTEXT: '#000000',\n",'')
edit('frontend/src/lib/pdf.ts',"  HEADER: 'Helvetica',\n",'')
edit('frontend/src/lib/pdf.ts',"  BOLD: 'Helvetica-Bold'","  BOLD: 'Helvetica'")
edit('frontend/src/lib/pdf.ts',"  terms?: string;\n})", "  terms?: string;\n  signingAssets?: { signature: string; stamp: string };\n})")
edit('frontend/src/lib/pdf.ts',"  const stampData = await loadImageAsDataURL('/HST_Stamp.png');\n  const signatureData = await loadImageAsDataURL('/Authorized_sign.png');", "  const assets = params.signingAssets ?? await (await import('./privateAssets')).loadSigningAssets();\n  const stampData = assets.stamp;\n  const signatureData = assets.signature;")
p=root/'frontend/src/lib/pdf.ts';s=p.read_text(encoding='utf-8');s=s[:s.index('export async function printInvoicePdf')];p.write_text(s,encoding='utf-8')
edit('frontend/src/lib/pdf.ts',"    const viewWindow = window.open(blobUrl, '_blank');", "    const viewWindow = window.open(blobUrl, '_blank');\n    if (viewWindow) viewWindow.opener = null;\n    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);")
edit('frontend/src/lib/pdf.ts',"Please allow pop-ups for localhost.","Please allow pop-ups for this site.")
edit('frontend/src/lib/pdf.ts',"    doc.save(`${params.invoice?.invoiceNumber ?? params.invoiceNumber}.pdf`);", "    const filename = (params.invoice?.invoiceNumber ?? params.invoiceNumber).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100) || 'HST-document';\n    doc.save(`${filename}.pdf`);")
# Retain one operator-only copy of signing assets; remove all public duplicates.
private=root/'maintenance/private-assets';private.mkdir(exist_ok=True)
for name in ['Authorized_sign.png','HST_Stamp.png']:
    try: data=(root/'frontend/public'/name).read_bytes()
    except OSError: data=subprocess.check_output(['git','show',f'HEAD:frontend/public/{name}'],cwd=root)
    (private/name).write_bytes(data)
    for p in [root/name,root/'frontend/public'/name,root/'maintenance/deploy-build/public'/name]:
        if p.exists(): p.unlink()
# Remove verified orphaned legacy source/generated files, never business databases.
obsolete=['backend/package.json','backend/tsconfig.json','backend/src/app.ts','backend/src/index.ts','backend/src/db/sqlite.ts','backend/src/routes/clients.ts','backend/src/routes/index.ts','backend/src/routes/invoices.ts','backend/src/routes/products.ts','database/schema.sql','scripts/init-db.js','scripts/migrate-add-purchaser-name.js','dist/index.html','frontend/tsconfig.tsbuildinfo','.firebase/hosting.ZGlzdA.cache','.firebase/hosting.ZnJvbnRlbmRcZGlzdA.cache','HST_logo.png']
for name in obsolete:
    p=(root/name).resolve()
    if not p.is_relative_to(root): raise RuntimeError('Unsafe deletion')
    if p.exists():p.unlink()
# Remove the only unused custom CSS class.
p=root/'frontend/src/index.css';s=p.read_text(encoding='utf-8');p.write_text(s[:s.index('.glass-panel')],encoding='utf-8')
package={'name':'hst-enterprises','private':True,'workspaces':['frontend'],'scripts':{'dev':'npm run dev --workspace frontend','build':'npm run build --workspace frontend','typecheck':'npm run typecheck --workspace frontend'}}
(root/'package.json').write_text(json.dumps(package,indent=2)+'\n')
p=root/'frontend/package.json';d=json.loads(p.read_text());d['scripts']['build']='tsc --noEmit && vite build';d['scripts']['typecheck']='tsc --noEmit';p.write_text(json.dumps(d,indent=2)+'\n')
edit('maintenance/prepare-deploy.py',"package['dependencies']['firebase'] = json.loads((root / 'package.json').read_text())['dependencies']['firebase']\n",'')
p=root/'.gitignore';p.write_text(p.read_text()+'\n.env.*\n!.env.example\n.firebase/\n*debug.log\n*.tsbuildinfo\ndist/\nmaintenance/private-assets/\nmaintenance/security-review/\n')
(root/'.github/copilot-instructions.md').write_text('''- The deployed stack is React, Firebase Authentication, Firestore and Firebase Hosting.
- Public portfolio at /; private ERP at /portal. Never expose ERP records on public pages.
- Enforce admin custom claims in Firestore rules, not only in the UI.
- Keep private signing assets and operator backups out of Hosting and source control.
- Preserve invoice numbering, quotation conversion, catalogue data and PDF pagination.
- Run type checking, security rule tests and browser checks before deployment.
''')
p=root/'.vscode/tasks.json';d=json.loads(p.read_text());d['tasks']=[t for t in d['tasks'] if t['label']!='db: initialize'];p.write_text(json.dumps(d,indent=2)+'\n')
print('Applied input validation, admin UI, lazy PDF loading and verified legacy cleanup.')
