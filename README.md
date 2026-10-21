# HST Enterprises

React, TypeScript, Tailwind CSS and Firebase Authentication/Firestore, hosted on Firebase Hosting.

- Public website: https://hstenterprisespk.com/
- Private employee ERP: /portal
- Local development: copy .env.example to .env, fill the public Firebase configuration, then run npm install and npm run dev.
- Checks: npm run typecheck
- Production build: npm run build

The homepage is pre-rendered for search engines and works without JavaScript. The authenticated ERP and PDF generator load separately. Firestore requires an admin custom claim. Signing images are retrieved from the admin-only privateAssets/signing document.

This OneDrive workspace uses maintenance/prepare-deploy.py and maintenance/build-deploy.cjs for an isolated build. The build script also synchronizes the JSON-LD CSP hash with firebase.json. Do not deploy source documents, backups or maintenance directories.

See maintenance/SECURITY-REVIEW.md for the file-by-file changes, checks and security boundaries. Company copy is in frontend/src/corporate/content.ts; SEO metadata is in frontend/src/seo.ts.
