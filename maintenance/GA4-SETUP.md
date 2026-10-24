# GA4 public website tracking

Measurement ID: `G-84JPTSFMGZ`. No Firebase Analytics or GTM container is initialized. The Firebase package is used for ERP Auth/Firestore only.

## Required GA4 account settings before deployment

In Analytics Admin > Data streams > the web stream for this ID, turn **Enhanced measurement OFF**. This implementation sends page views and contact events explicitly. Automatic outbound-link tracking can otherwise send the full WhatsApp URL (including the message), and history-based page views can duplicate manually controlled views. Also keep automatic user-provided data collection and Google signals disabled. These remote account settings cannot be verified or changed through this repository.

Do not add a second Google tag through GTM, Firebase Analytics or HTML. Configure event-scoped custom dimensions for `button_location` and `page_path` if you want to use them in custom reports.

## Behavior

- Only the five explicit public routes load the analytics module. `/portal`, `/admin` and unknown paths never initialize GA4.
- No Google tag request before explicit acceptance. Accept/decline have equal prominence. Cookie settings remain available to withdraw consent; choices expire after 180 days. Storage failures default to no consent on the next page.
- One manually queued `page_view` per full document load after acceptance and tag load. React Strict Mode does not initialize it twice. These pages use ordinary document navigation; hash links do not create extra views. A browser back/forward-cache restoration retains the original document view rather than adding another.
- Custom events: `whatsapp_click` and `phone_click`. The enquiry-form submit is tracked as a WhatsApp action; opening its fallback link is a separate click.
- Parameters are restricted to the canonical public URL, public metadata title, page path and fixed button-location labels. Query strings, hashes, incoming referrers, telephone destinations, link text, WhatsApp messages and form values are never added by this code. Referrer suppression deliberately reduces acquisition attribution to avoid leaking sensitive URLs.
- Advertising consent stays denied. Analytics cookies are host-only. Withdrawal disables this GA4 property and removes its two cookies; a later re-acceptance reloads the document to restart cleanly.
- Basic consent gating follows Google's consent-mode documentation. No claim is made that this alone satisfies every business-specific legal obligation.

## Manual validation (from repository root)

```powershell
python maintenance/prepare-deploy.py
node maintenance/deploy-build/node_modules/typescript/bin/tsc --noEmit -p maintenance/deploy-build/tsconfig.json
node maintenance/build-deploy.cjs
node maintenance/check-public-seo.cjs
node maintenance/check-public-analytics.cjs
```

Stop if any command fails. The analytics check mocks Google's tag and sends no analytics traffic; it checks our integration, not delivery into the GA4 account. These checks were added but not run as part of this edit.

After successful checks and the account settings above:

```powershell
firebase.cmd deploy --only hosting --project hst-enterprises --account hstenterprisespk@gmail.com --config maintenance/deploy-build/firebase.deploy.json --non-interactive
```

In an incognito window with blockers disabled, open a public page and confirm there is no Google tag request before consent. Accept analytics; Network should then show `gtag/js?id=G-84JPTSFMGZ` and GA4 `/g/collect` requests. Confirm one `page_view` for each page load and the two contact event names. Inspect event payloads for query strings or message contents, and confirm these are absent. Realtime requires accepted consent and successful requests; visitors who decline are intentionally not counted. Visit `/portal` and confirm that it loads no analytics tag, even with an accepted preference. Confirm Cookie settings can disable further collection.

References:
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/tag-platform/security/guides/consent
- https://developers.google.com/tag-platform/security/guides/csp
