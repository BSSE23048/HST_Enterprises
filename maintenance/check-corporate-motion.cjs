const {chromium}=require('./deploy-build/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.getByRole('heading',{level:1}).waitFor();
 await page.waitForTimeout(1200);
 assert.ok(await page.locator('h1').isVisible());
 for(const image of await page.locator('img').all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(i=>i.decode()); }
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForTimeout(400);
 assert.equal(await page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true);
 await page.screenshot({path:'maintenance/corporate-review/desktop-hero.png'});
 await page.getByRole('button',{name:'Load interactive map of our Lahore office'}).click();
 await page.locator('iframe[title="HST Enterprises address on Google Maps"]').waitFor();
 await page.goto('http://127.0.0.1:4173/portal');
 await page.getByRole('button',{name:'Secure Login'}).waitFor();
 await page.getByLabel('Email').fill('preview@example.com');
 await page.getByRole('link',{name:/company/i}).click();
 await page.getByRole('heading',{level:1}).waitFor();
 console.log('Normal motion, local images, interactive map and portal return passed.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
