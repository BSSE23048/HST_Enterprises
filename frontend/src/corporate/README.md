# HST corporate website

The public homepage is `/`. The existing authenticated ERP is lazy-loaded at `/portal` (`/admin` remains an alias). Firebase Hosting's SPA rewrite supports direct entry to these routes. Public visitors do not load the ERP or Firebase client.

Edit company details, services and industry copy in `content.ts`. Sections are composed in `CorporateSite.tsx`; navigation and enquiries are separate components. Styles are scoped to `.corporate`, with reduced-motion support and self-hosted Manrope fonts.

The enquiry form validates details and opens a WhatsApp draft for the visitor to send. It does not store submissions or claim to send email. The map loads only on request. WhatsApp enquiries go to +923004025599.

Copy is based on the supplied introduction and company profile. Source PDFs, registration images and conflicting tax identifiers are not included in the corporate page. Existing ERP signing assets are unchanged. Brand names describe product sourcing, not certified partnerships. Photography is representative, not a claimed HST project.

## Assets

- Foundry photograph: [Ant Rozetsky / Unsplash](https://unsplash.com/photos/SLIFI67jv5k).
- Power infrastructure: [Aldward Castillo / Unsplash](https://unsplash.com/photos/jnoVECivNJU).
- Photographs downloaded under the free Unsplash license; optimized WebP copies are local.
- Manrope is self-hosted from Google Fonts (SIL Open Font License).
- Company emblem is the existing HST logo.

## Validation and deployment

Normal workspace build: `npm run build --workspace frontend` with the existing Firebase environment configuration.

For this OneDrive workspace, `python maintenance/prepare-deploy.py` prepares the isolated build, then `node maintenance/build-deploy.cjs` builds it using the local Firebase public configuration. Neither configuration secrets nor audit snapshots belong in public assets.

`maintenance/check-corporate.cjs` checks the production preview on port 4173 using Playwright with installed Edge and axe-core: 320, 390, 768, 1024, 1440 and 1920 pixels, menu keyboard behavior, industry tabs, enquiry drafts, overflow, runtime errors, accessibility and portal login. Test enquiries are intercepted and never sent.
