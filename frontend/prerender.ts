import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createServer, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
const esc = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
export function prerender(): Plugin {
  let root = '', out = '';
  return {
    name: 'hst-static-pages', apply: 'build',
    configResolved(config) { root = config.root; out = path.resolve(root, config.build.outDir); },
    async closeBundle() {
      const server = await createServer({ root, configFile: false, plugins: [react()], server: { middlewareMode: true }, appType: 'custom' });
      try {
        const { render } = await server.ssrLoadModule('/src/prerender-entry.tsx');
        const { pages, publicPages, schemaForPage, siteUrl } = await server.ssrLoadModule('/src/seo.ts');
        const { catalogueProducts } = await server.ssrLoadModule('/src/corporate/catalogueData.ts');
        const { findCatalogueCategory } = await server.ssrLoadModule('/src/corporate/catalogueCategories.ts');
        const base = await fs.readFile(path.join(out, 'index.html'), 'utf8');
        const assets = await fs.readdir(path.join(out, 'assets'));
        const styles = assets.filter(file => file.endsWith('.css')).map(file => `<link rel="stylesheet" href="/assets/${file}">`).join('');
        if (!styles) throw new Error('Missing public stylesheets');
        const hashes = new Set<string>();
        for (const page of [...publicPages, pages.portal, pages.missing]) {
          const isPublic = publicPages.includes(page);
          const category = findCatalogueCategory(page.path);
          const listedProducts = page.path === '/products' ? catalogueProducts : category
            ? catalogueProducts.filter((product: { category: string }) => product.category === category.name) : undefined;
          const json = isPublic ? JSON.stringify(schemaForPage(page, listedProducts)).replaceAll('<', '\\u003c') : '';
          if (isPublic) hashes.add(`'sha256-${createHash('sha256').update(json).digest('base64')}'`);
          const metadata = `<title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="${page.robots}"><link rel="canonical" href="${siteUrl}${page.path}"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${siteUrl}${page.path}"><meta property="og:type" content="website"><meta property="og:site_name" content="HST Enterprises"><meta property="og:locale" content="en_PK"><meta property="og:image" content="${siteUrl}/company/industry.webp"><meta property="og:image:alt" content="Industrial production facility"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(page.title)}"><meta name="twitter:description" content="${esc(page.description)}"><meta name="twitter:image" content="${siteUrl}/company/industry.webp"><meta name="twitter:image:alt" content="Industrial production facility">`;
          const extra = isPublic ? `${styles}<link rel="preload" href="/company/manrope-0.woff2" as="font" type="font/woff2" crossorigin><script id="business-schema" type="application/ld+json">${json}</script>` : '';
          const body = isPublic ? `<div id="root" data-prerendered="true">${render(page.path)}</div>` : page === pages.portal ? '<div id="root"><main class="route-message" role="status">Loading employee portal...</main></div>' : '<div id="root"><main class="route-message"><h1>Page not found</h1><a href="/products">Back to All Products</a><p><a href="/">Return to HST Enterprises</a></p></main></div>';
          const relative = isPublic ? (page.path === '/' ? 'index.html' : page.path === '/products' ? 'products.html' : page.path.startsWith('/products/category/') ? `product-categories/${page.path.split('/').pop()}.html` : `${page.path.slice(1)}index.html`) : page === pages.portal ? 'portal/index.html' : '404.html';
          const destination = path.join(out, relative);
          await fs.mkdir(path.dirname(destination), { recursive: true });
          await fs.writeFile(destination, base.replace('<!--page-head-->', metadata + extra).replace('<div id="root"></div>', body));
        }
        const urls = [...new Set<string>(publicPages.map((page: { path: string }) => `${siteUrl}${page.path}`))];
        await fs.writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${esc(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
        // One hash per exact public JSON-LD payload; no unsafe-inline scripts.
        await fs.writeFile(path.join(out, '..', 'schema-csp-hash.txt'), [...hashes].join(' '));
        console.log(`Pre-rendered ${publicPages.length} public pages, portal metadata, 404 and sitemap.`);
      } finally { await server.close(); }
    },
  };
}
