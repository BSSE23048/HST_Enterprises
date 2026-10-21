import json
from pathlib import Path
p=Path('frontend/package.json');d=json.loads(p.read_text());d['dependencies']['jspdf']='^4.2.1';p.write_text(json.dumps(d,indent=2)+'\n')
p=Path('package.json');d=json.loads(p.read_text());d['overrides']={'@grpc/grpc-js':'^1.14.6','dompurify':'^3.4.16','protobufjs':'^7.6.5'};p.write_text(json.dumps(d,indent=2)+'\n')
p=Path('maintenance/prepare-deploy.py');s=p.read_text();s=s.replace("(target / 'package.json').write_text", "package['overrides'] = json.loads((root / 'package.json').read_text()).get('overrides', {})\n(target / 'package.json').write_text");p.write_text(s)
p=Path('frontend/src/lib/firebase.ts');s=p.read_text();import re;s=re.sub(r"(import\.meta\.env\.VITE_FIREBASE_[A-Z_]+) \|\| '[^']*'",r'\1',s);p.write_text(s)
print('Prepared patched dependencies and environment-only Firebase configuration.')
