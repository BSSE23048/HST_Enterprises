from pathlib import Path
import subprocess, json
root=Path(__file__).resolve().parent.parent
target=root/'maintenance/security-review/rollback'
names=['firestore.rules','firebase.json','package.json','frontend/package.json','.gitignore','.github/copilot-instructions.md','.vscode/tasks.json','frontend/src/index.css','maintenance/prepare-deploy.py','Authorized_sign.png','HST_Stamp.png','HST_logo.png','frontend/public/Authorized_sign.png','frontend/public/HST_Stamp.png','backend/package.json','backend/tsconfig.json','backend/src/app.ts','backend/src/index.ts','backend/src/db/sqlite.ts','backend/src/routes/clients.ts','backend/src/routes/index.ts','backend/src/routes/invoices.ts','backend/src/routes/products.ts','database/schema.sql','scripts/init-db.js','scripts/migrate-add-purchaser-name.js','dist/index.html','frontend/tsconfig.tsbuildinfo','.firebase/hosting.ZGlzdA.cache','.firebase/hosting.ZnJvbnRlbmRcZGlzdA.cache']
for name in names:
 p=root/name
 if not p.exists():continue
 try:data=p.read_bytes()
 except OSError:data=subprocess.check_output(['git','show',f'HEAD:{name}'],cwd=root)
 out=target/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
(target/'original-firestore.rules').write_bytes(subprocess.check_output(['git','show','HEAD:firestore.rules'],cwd=root))
(target/'admin-claim-before.json').write_text(json.dumps({'uid':'G1JCKkMhxIfUKU70vrG7woW4ler2','email':'admin@hst.com','customAttributes':{}}))
print(f'Rollback copies saved for {len(names)} named files; database files untouched.')
