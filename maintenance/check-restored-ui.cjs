const {chromium}=require('./deploy-build/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.getByRole('heading',{level:1}).waitFor();
  assert.match(await page.locator('h1').innerText(),/next big move/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.locator('.hero-trust-card').count(),1);
  if(width===1440)await page.screenshot({path:'maintenance/corporate-review/restored-desktop.png'});
  if(width<768){await page.getByRole('button',{name:'Open menu'}).click();await page.keyboard.press('Escape');}
  assert.deepEqual(errors,[]);await page.close();
 }
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/portal');await page.getByRole('button',{name:'Secure Login'}).waitFor();
 await browser.close();console.log('Previous hero, cards, mobile navigation, responsive layout and ERP login verified.');
})().catch(e=>{console.error(e);process.exit(1)});
