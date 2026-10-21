# HST website release

Public site: https://hstenterprisespk.com/ — ERP: `/portal`.

## Changes by file

- `frontend/src/corporate/`: custom industrial layout, service rows, restrained project disclosures, native scroll reveals and responsive navigation. Existing project names retained; unsupported headline metrics removed.
- `frontend/public/favicon-*.png`, `apple-touch-icon.png`, `frontend/index.html`: square HST icons and explicit browser/search icon links.
- `frontend/src/seo.ts`, `frontend/prerender.ts`, `frontend/src/prerender-entry.tsx`: canonical custom domain, per-route metadata, Organization/LocalBusiness/WebSite JSON-LD, visible pre-rendered homepage, private portal metadata and real 404 page.
- `frontend/public/robots.txt`, `sitemap.xml`: one canonical public URL; fragment links removed from sitemap; ERP excluded.
- `firebase.json`: CSP with a hash for trusted JSON-LD, frame blocking, MIME protection, referrer/permissions policies, HTTPS policy, cache controls and restricted portal rewrites.
- `firestore.rules`: admin-only ERP collections, field/type/value validation, protected signing images and default-deny access. All 47 simulated authorization tests passed.
- `storage.rules`: deny-all policy for unused Storage. No bucket was provisioned; do not enable uploads without reviewing rules.
- `frontend/src/lib/validation.ts`, `api.ts`: field allowlists, bounded plain text, validated IDs/dates/prices and recalculated totals. React escapes display text; the app has no cookie-authenticated mutation API.
- `frontend/src/lib/firebase.ts`, `.env.example`: environment-based public Firebase configuration and session-scoped login persistence. Browser configuration is public by design; service credentials must never enter frontend environment variables.
- `frontend/src/App.tsx`, `lib/pdf.ts`, `lib/privateAssets.ts`: admin role check, state clearing, on-demand PDF loading, protected signing assets and PDF URL cleanup.
- Package manifests/lockfile: removed obsolete backend/animation dependencies; patched PDF and transitive dependencies. Production audit reported zero known vulnerabilities at verification time.

## Verification

Six viewport checks (320–1920px), accessibility checks, CSP/SEO browser checks, static HTML without JavaScript, 17 PDF pagination cases, input validation, strict TypeScript unused-code checks, and 47 Firestore rule simulations passed during this work. Live deployment verification is performed separately after publishing.

The existing `admin@hst.com` account already has the admin claim and private signing images already exist. No new account privilege assignment is required. Business invoices, products and clients were not migrated or deleted by this release.

Google chooses when to refresh its search favicon; publishing correctly sized icons does not guarantee immediate display or a ranking position. Reference: https://developers.google.com/search/docs/appearance/favicon-in-search

Rollback copies are local and ignored under `maintenance/security-review/rollback/`. Never publish this directory, private source documents, or signing images.

## UI restoration
At the user's request, the prior split-hero design, service cards, navigation and project presentation were restored. Security, favicon and SEO improvements remain. The restored layout passed mobile, tablet, desktop and portal smoke checks.

