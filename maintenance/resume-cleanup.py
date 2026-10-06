from pathlib import Path
import json, subprocess

root = Path(__file__).resolve().parent.parent

# Retain one operator-only copy of signing assets in maintenance/private-assets
private = root / 'maintenance' / 'private-assets'
private.mkdir(exist_ok=True)

for name in ['Authorized_sign.png', 'HST_Stamp.png']:
    dest = private / name
    if not dest.exists():
        try:
            data = (root / 'frontend' / 'public' / name).read_bytes()
        except OSError:
            try:
                data = subprocess.check_output(['git', 'show', f'HEAD:frontend/public/{name}'], cwd=root)
            except Exception:
                data = b''
        if data:
            dest.write_bytes(data)

    for p in [root / name, root / 'frontend' / 'public' / name, root / 'maintenance' / 'deploy-build' / 'public' / name]:
        if p.exists():
            p.unlink()

# Remove verified orphaned legacy source/generated files, never business databases.
obsolete = [
    'backend/package.json', 'backend/tsconfig.json', 'backend/src/app.ts', 'backend/src/index.ts',
    'backend/src/db/sqlite.ts', 'backend/src/routes/clients.ts', 'backend/src/routes/index.ts',
    'backend/src/routes/invoices.ts', 'backend/src/routes/products.ts', 'database/schema.sql',
    'scripts/init-db.js', 'scripts/migrate-add-purchaser-name.js', 'dist/index.html',
    'frontend/tsconfig.tsbuildinfo', '.firebase/hosting.ZGlzdA.cache',
    '.firebase/hosting.ZnJvbnRlbmRcZGlzdA.cache', 'HST_logo.png'
]

for name in obsolete:
    p = (root / name).resolve()
    if p.exists():
        if not p.is_relative_to(root):
            raise RuntimeError('Unsafe deletion')
        p.unlink()

# Remove unused custom CSS class if present
css_file = root / 'frontend' / 'src' / 'index.css'
if css_file.exists():
    css = css_file.read_text(encoding='utf-8')
    if '.glass-panel' in css:
        css_file.write_text(css[:css.index('.glass-panel')], encoding='utf-8')

# Root package.json
package = {
    'name': 'hst-enterprises',
    'private': True,
    'workspaces': ['frontend'],
    'scripts': {
        'dev': 'npm run dev --workspace frontend',
        'build': 'npm run build --workspace frontend',
        'typecheck': 'npm run typecheck --workspace frontend'
    }
}
(root / 'package.json').write_text(json.dumps(package, indent=2) + '\n')

# Frontend package.json
fp = root / 'frontend' / 'package.json'
if fp.exists():
    d = json.loads(fp.read_text(encoding='utf-8'))
    d['scripts']['build'] = 'tsc --noEmit && vite build'
    d['scripts']['typecheck'] = 'tsc --noEmit'
    fp.write_text(json.dumps(d, indent=2) + '\n')

# .gitignore
gi = root / '.gitignore'
if gi.exists():
    gi_text = gi.read_text(encoding='utf-8')
    additions = ['.env.*', '!.env.example', '.firebase/', '*debug.log', '*.tsbuildinfo', 'dist/', 'maintenance/private-assets/', 'maintenance/security-review/']
    for add in additions:
        if add not in gi_text:
            gi_text += f'\n{add}'
    gi.write_text(gi_text.rstrip() + '\n', encoding='utf-8')

# Copilot instructions
(root / '.github' / 'copilot-instructions.md').write_text('''- The deployed stack is React, Firebase Authentication, Firestore and Firebase Hosting.
- Public portfolio at /; private ERP at /portal. Never expose ERP records on public pages.
- Enforce admin custom claims in Firestore rules, not only in the UI.
- Keep private signing assets and operator backups out of Hosting and source control.
- Preserve invoice numbering, quotation conversion, catalogue data and PDF pagination.
- Run type checking, security rule tests and browser checks before deployment.
''')

# Tasks.json
task_file = root / '.vscode' / 'tasks.json'
if task_file.exists():
    try:
        td = json.loads(task_file.read_text(encoding='utf-8'))
        td['tasks'] = [t for t in td.get('tasks', []) if t.get('label') != 'db: initialize']
        task_file.write_text(json.dumps(td, indent=2) + '\n', encoding='utf-8')
    except Exception:
        pass

print('Successfully removed obsolete Express/SQLite backend, duplicate assets, and updated workspace configurations.')
