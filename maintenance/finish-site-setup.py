from pathlib import Path
import json
root=Path(__file__).resolve().parent.parent
p=root/'frontend/package.json'; d=json.loads(p.read_text());d['dependencies'].pop('framer-motion',None);p.write_text(json.dumps(d,indent=2)+'\n')
p=root/'maintenance/prepare-deploy.py';s=p.read_text();s=s.replace("'index.html', 'vite.config.ts'", "'index.html', 'prerender.ts', 'vite.config.ts'");p.write_text(s)
p=root/'frontend/src/corporate/Navigation.tsx';s=p.read_text(encoding='utf-8');s=s.replace("['About us', '#about'], ['Industries', '#industries']", "['About us', '#about'], ['Projects', '#projects']");p.write_text(s,encoding='utf-8')
p=root/'frontend/src/corporate/Icons.tsx';s=p.read_text(encoding='utf-8');s=s.replace(" | 'down'",'');s='\n'.join(line for line in s.splitlines() if not line.strip().startswith('down:'));p.write_text(s+'\n',encoding='utf-8')
p=root/'frontend/src/index.css';s=p.read_text();s+='\n.route-message { min-height: 100vh; padding: 15vh 24px; text-align: center; font-family: sans-serif; background: #f8f8f5; color: #232361; }\n';p.write_text(s)
p=root/'frontend/public/sitemap.xml';s=p.read_text().replace('https://hst-enterprises.web.app','https://hstenterprisespk.com');p.write_text(s)
p=root/'frontend/public/robots.txt';s=p.read_text().replace('https://hst-enterprises.web.app','https://hstenterprisespk.com');p.write_text(s)
config=json.loads((root/'firebase.json').read_text());h=config['hosting'];h['rewrites']=[{'source':'/portal','destination':'/portal/index.html'},{'source':'/portal/**','destination':'/portal/index.html'}];h['redirects']=[{'source':'/admin','destination':'/portal','type':301}]
csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com; frame-src https://maps.google.com https://www.google.com blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"
h['headers']=[{'source':'**','headers':[{'key':k,'value':v} for k,v in {'Content-Security-Policy':csp,'X-Frame-Options':'DENY','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Strict-Transport-Security':'max-age=31536000; includeSubDomains','Cross-Origin-Opener-Policy':'same-origin-allow-popups','Cache-Control':'no-cache'}.items()]},{'source':'/assets/**','headers':[{'key':'Cache-Control','value':'public, max-age=31536000, immutable'}]},{'source':'/portal{,/**}','headers':[{'key':'X-Robots-Tag','value':'noindex, nofollow, noarchive'},{'key':'Cache-Control','value':'no-store'}]},{'source':'/404.html','headers':[{'key':'X-Robots-Tag','value':'noindex, nofollow'}]}]
(root/'firebase.json').write_text(json.dumps(config,indent=2)+'\n')
print('Updated routes, canonical domain, security headers and build preparation.')
