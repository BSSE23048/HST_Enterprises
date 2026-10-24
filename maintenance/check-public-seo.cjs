const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawn } = require('node:child_process');
const { chromium } = require('./deploy-build/node_modules/playwright');
const AxeBuilder = require('./deploy-build/node_modules/@axe-core/playwright').default;
const root = path.join(__dirname, 'deploy-build/dist');
const origin = 'https://hstenterprisespk.com';
const categoryRoutes = ["/products/category/circuit-protection","/products/category/motor-control","/products/category/sensors-automation","/products/category/cables-wires","/products/category/panels-enclosures","/products/category/switches-indicators","/products/category/cable-accessories"];
const routes = ['/', '/products', ...categoryRoutes, '/industrial-switchgear/', '/mccb-circuit-breakers/', '/industrial-electrical-cables/', '/electrical-control-components/'];
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'deploy-build/firebase.deploy.json'), 'utf8'));
const csp = config.hosting.headers[0].headers.find(header => header.key === 'Content-Security-Policy').value;
for (const redirect of config.hosting.redirects) {
  assert.notEqual(redirect.source.replace(/\/+$/, ''), redirect.destination.replace(/\/+$/, ''), 'Hosting redirect must not self-match after slash normalization');
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), routes.map(route => origin + route));
const titles = new Set(), descriptions = new Set();
for (const route of routes) {
  const html = fs.readFileSync(route === '/products' ? path.join(root, 'products.html') : route.startsWith('/products/category/') ? path.join(root, 'product-categories', route.split('/').pop() + '.html') : path.join(root, route.slice(1), 'index.html'), 'utf8');
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, route + ' has one H1');
  assert.ok(html.includes(`rel="canonical" href="${origin}${route}"`));
  assert.ok(!html.includes('923004025599'));
  assert.ok(html.includes('923084103434'));
  titles.add(html.match(/<title>(.*?)<\/title>/)[1]);
  descriptions.add(html.match(/name="description" content="([^"]*)"/)[1]);
  const json = html.match(/<script id="business-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1];
  const graph = JSON.parse(json)['@graph'];
  assert.equal(graph.filter(item => Array.isArray(item['@type']) && item['@type'].includes('Organization')).length, 1);
  assert.ok(csp.includes(`'sha256-${createHash('sha256').update(json).digest('base64')}'`));
  assert.equal(graph.some(item => item['@type'] === 'BreadcrumbList'), route !== '/');
  if (route === '/products' || route.startsWith('/products/category/')) {
    const list = graph.find(item => item['@type'] === 'ItemList');
    assert.ok(list, route + ' has catalogue ItemList');
    const productIds = [...html.matchAll(/<article[^>]*id="product-([^"]+)"/g)].map(match => match[1]);
    assert.ok(productIds.length > 0, 'Complete catalogue is rendered');
    assert.equal(new Set(productIds).size, productIds.length);
    assert.equal(list.numberOfItems, productIds.length);
    assert.equal(list.itemListElement.length, productIds.length);
    list.itemListElement.forEach((item, index) => {
      assert.equal(item.position, index + 1);
      assert.equal(item.url, origin + route + '#product-' + productIds[index]);
    });
    assert.ok(!/<noscript>\s*<details class="catalogue-static"/.test(html), 'Full list must be available with JavaScript enabled');
  }
  assert.ok(html.length > 5000, 'Meaningful rendered HTML');
}
assert.equal(titles.size, routes.length);
assert.equal(descriptions.size, routes.length);
assert.ok(!/script-src[^;]*'unsafe-inline'/.test(csp));
assert.ok(fs.readFileSync(path.join(root, 'portal/index.html'), 'utf8').includes('noindex, nofollow, noarchive'));

(async () => {
  const preview = spawn(process.execPath, [path.join(__dirname, 'serve-production.cjs')], { env: { ...process.env, HST_PREVIEW_PORT: '4176' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Preview startup timeout')), 10000);
      preview.stdout.once('data', () => { clearTimeout(timer); resolve(); });
      preview.once('error', error => { clearTimeout(timer); reject(error); });
      preview.once('exit', code => { clearTimeout(timer); reject(Error(`Preview exited: ${code}`)); });
    });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const base = 'http://127.0.0.1:4176';
    for (const javaScriptEnabled of [false, true]) {
      const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const errors = [], requests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('request', request => requests.push(request.url()));
      for (const route of routes) {
        assert.equal((await page.goto(base + route)).status(), 200);
        await page.locator('h1').waitFor();
        if (javaScriptEnabled) await page.waitForLoadState('networkidle');
        if (javaScriptEnabled && await page.getByRole('button', { name: 'Decline analytics', exact: true }).isVisible()) {
          await page.getByRole('button', { name: 'Decline analytics', exact: true }).click();
        }
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), origin + route);
        assert.ok(await page.locator('a[href^="https://wa.me/923084103434"]').count());
        for (const width of [320, 393, 430, 768, 1024, 1280, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + ` overflow at ${width}px`);
        }
        const products = page.locator('.products-menu');
        await products.locator('summary').click();
        assert.equal(await products.locator('a').count(), categoryRoutes.length);
        for (const productPath of categoryRoutes) assert.ok(await products.locator(`a[href="${productPath}"]`).isVisible());
        if (javaScriptEnabled) {
          await page.keyboard.press('Escape');
          assert.equal(await products.getAttribute('open'), null);
        } else await products.locator('summary').click();
        if (route !== '/' && javaScriptEnabled) {
          await page.setViewportSize({ width: 390, height: 844 });
          await page.getByRole('button', { name: 'Open menu' }).click();
          assert.equal(await page.locator('.mobile-products a').count(), categoryRoutes.length);
          assert.equal(await page.locator('#mobile-navigation a').first().getAttribute('href'), '/#projects');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#mobile-navigation').count(), 0);
        }
        if (javaScriptEnabled) {
          const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
          assert.deepEqual(accessibility.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })), [], route + ' accessibility');
          if (route === '/industrial-switchgear/') {
            fs.mkdirSync(path.join(__dirname, 'corporate-review'), { recursive: true });
            await page.screenshot({ path: path.join(__dirname, 'corporate-review/category-mobile.png'), fullPage: true });
          }
        }
      }
      assert.deepEqual(errors, []);
      assert.ok(!requests.some(url => /\/assets\/(App-|firebase-|pdf-)|firestore\.googleapis/.test(url)), 'Public pages must not load ERP, Firebase or PDF bundles');
      await context.close();
    }
    const page = await browser.newPage();
    for (const route of routes.filter(route => route !== '/' && route.endsWith('/'))) {
      const response = await page.request.get(base + route.slice(0, -1), { maxRedirects: 0 });
      assert.equal(response.status(), 301);
      assert.equal(response.headers().location, route);
    }
    for (const route of ['/not-a-real-page', '/products/category/not-a-category', '/maintenance/snapshot.json', '/src/seo.ts', '/private-assets/HST_Stamp.png']) {
      assert.equal((await page.request.get(base + route)).status(), 404);
    }
    await page.goto(base + '/portal');
    await page.getByText('Secure Login', { exact: true }).waitFor();
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow, noarchive');
    console.log('PASS: public catalogue and SEO pages, unique metadata, sitemap, CSP hashes, breadcrumbs, no-JS content, responsive layouts, hydration, WhatsApp links, redirects, 404s and private portal.');
  } finally { if (browser) await browser.close(); preview.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
