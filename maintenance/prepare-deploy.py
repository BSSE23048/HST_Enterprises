import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
target = root / 'maintenance' / 'deploy-build'
target.mkdir(exist_ok=True)
files = list((root / 'frontend' / 'src').rglob('*')) + list((root / 'frontend' / 'public').rglob('*'))
files += [root / 'frontend' / name for name in ['index.html', 'vite.config.ts', 'postcss.config.cjs', 'tailwind.config.cjs', 'tsconfig.json']]
for source in files:
    if not source.is_file():
        continue
    relative = source.relative_to(root)
    destination = target / source.relative_to(root / 'frontend')
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        data = source.read_bytes()
    except OSError:
        # Recover only unchanged tracked cloud placeholders from the local Git object.
        status = subprocess.check_output(['git', 'status', '--porcelain', '--', relative.as_posix()], cwd=root)
        if status.strip():
            raise RuntimeError(f'Cannot read modified file {relative}')
        data = subprocess.check_output(['git', 'show', f'HEAD:{relative.as_posix()}'], cwd=root)
    destination.write_bytes(data)
package = json.loads((root / 'frontend' / 'package.json').read_text())
package['dependencies']['firebase'] = json.loads((root / 'package.json').read_text())['dependencies']['firebase']
(target / 'package.json').write_text(json.dumps(package, indent=2))
print(f'Prepared isolated build at {target}')
