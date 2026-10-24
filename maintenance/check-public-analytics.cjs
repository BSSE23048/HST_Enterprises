// Manual check: mocks Google's tag, never sends analytics to the real property.
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('./deploy-build/node_modules/playwright');
const routes = ['/', '/industrial-switchgear/', '/mccb-circuit-breakers/', '/industrial-electrical-cables/', '/electrical-control-components/'];
const base = 'http://127.0.0.1:4177';
const commands = page => page.evaluate(() => (window.dataLayer || []).map(entry => Array.from(entry)));

(async () => {
  const preview = spawn(process.execPath, [path.join(__dirname, 'serve-production.cjs')], {
    env: { ...process.env, HST_PREVIEW_PORT: '4177' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let browser;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Preview startup timeout')), 10000);
      preview.stdout.once('data', () => { clearTimeout(timer); resolve(); });
      preview.once('error', error => { clearTimeout(timer); reject(error); });
      preview.once('exit', code => { clearTimeout(timer); reject(Error(`Preview exited: ${code}`)); });
    });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext();
    let tagRequests = 0;
    await context.route('https://www.googletagmanager.com/**', route => {
      assert.ok(route.request().url().includes('/gtag/js?id=G-84JPTSFMGZ'));
      tagRequests++;
      return route.fulfill({ contentType: 'text/javascript', body: '/* Google tag mocked for verification. */' });
    });
    await context.route(/https:\/\/[^/]*google-analytics\.com\//, route => route.abort());
    await context.addInitScript(() => {
      document.addEventListener('click', e => {
        if (e.target instanceof Element && e.target.closest('a[href^="https://wa.me/"], a[href^="tel:"]')) e.preventDefault();
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/?email=private@example.com#secret', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Accept analytics', exact: true }).waitFor();
    assert.equal(tagRequests, 0);
    await page.getByRole('button', { name: 'Decline analytics', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(tagRequests, 0);
    await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
    await page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    await page.waitForFunction(() => (window.dataLayer || []).some(entry => entry[0] === 'event' && entry[1] === 'page_view'));
    assert.equal(tagRequests, 1);
    let queue = await commands(page);
    assert.equal(queue.filter(entry => entry[0] === 'config').length, 1);
    assert.equal(queue.find(entry => entry[0] === 'config')[2].send_page_view, false);
    assert.equal(queue.filter(entry => entry[1] === 'page_view').length, 1);
    await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
    await page.getByRole('button', { name: 'Accept analytics', exact: true }).click();
    assert.equal(tagRequests, 1);
    assert.equal((await commands(page)).filter(entry => entry[1] === 'page_view').length, 1);
    await page.locator('.floating-whatsapp').click();
    await page.locator('a[href^="tel:"]').first().dispatchEvent('click');
    queue = await commands(page);
    assert.equal(queue.filter(entry => entry[1] === 'whatsapp_click').length, 1);
    assert.equal(queue.filter(entry => entry[1] === 'phone_click').length, 1);
    for (const entry of queue.filter(entry => entry[0] === 'event')) {
      assert.deepEqual(Object.keys(entry[2]).sort(), ['button_location', 'page_location', 'page_path', 'page_referrer', 'page_title', 'send_to']);
      assert.equal(entry[2].page_location, 'https://hstenterprisespk.com/');
      assert.equal(entry[2].page_referrer, '');
      assert.ok(!JSON.stringify(entry).includes('private@example.com'));
      assert.ok(!JSON.stringify(entry).includes('wa.me'));
    }
    for (const route of routes.slice(1)) {
      const before = tagRequests;
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => (window.dataLayer || []).some(entry => entry[1] === 'page_view'));
      assert.equal(tagRequests, before + 1);
      const events = (await commands(page)).filter(entry => entry[1] === 'page_view');
      assert.equal(events.length, 1);
      assert.equal(events[0][2].page_path, route);
    }
    await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
    await page.getByRole('button', { name: 'Decline analytics', exact: true }).click();
    const count = (await commands(page)).length;
    await page.locator('.floating-whatsapp').click();
    assert.equal((await commands(page)).length, count, 'No custom events after withdrawal');
    assert.equal(await page.evaluate(() => window['ga-disable-G-84JPTSFMGZ']), true);
    // Even a stored grant must never enable tracking on private or unknown routes.
    await page.evaluate(() => localStorage.setItem('hst.analytics-consent.v1', JSON.stringify({ choice: 'accepted', time: Date.now() })));
    const beforePrivate = tagRequests;
    for (const route of ['/portal', '/admin', '/unknown-analytics-test']) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      assert.equal(tagRequests, beforePrivate);
      assert.equal(await page.locator('#hst-analytics-preferences').count(), 0);
      assert.equal((await commands(page)).length, 0);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: consent, one public page view, safe contact events, withdrawal and portal isolation (mock tag only).');
    await context.close();
  } finally { if (browser) await browser.close(); preview.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
