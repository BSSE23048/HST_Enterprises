import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { renderInvoicePdf } from './deploy-build/src/lib/pdf.ts';
globalThis.fetch = async file => ({ ok: true, blob: async () => new Blob([await fs.readFile(new URL(`./deploy-build/public${file}`, import.meta.url))]) });
globalThis.FileReader = class {
  readAsDataURL(blob) {
    blob.arrayBuffer().then(data => {
      this.result = 'data:image/png;base64,' + Buffer.from(data).toString('base64');
      this.onloadend();
    });
  }
};
let checked = 0;
for (const recordType of ['invoice','quotation']) {
  for (const count of [1,11,16,30]) {
    for (const longText of [false,true]) {
      const pdf = await renderInvoicePdf({ invoice:null, invoiceNumber:'TEST', invoiceDate:'2026-10-05', recordType,
        draftItems:Array.from({length:count},(_,i)=>({description:`Product ${i+1}`,quantity:1,unitPrice:100,unit:'Box'})),
        terms:longText ? 'Terms and delivery conditions.\n'.repeat(120) : 'Delivery within 15 days.\nPayment in advance.',
        notes:longText ? 'Additional note for testing pagination.\n'.repeat(140) : '' });
      const pages = pdf.internal.pages.slice(1).map(commands=>commands.join('\n'));
      assert.equal(pages.reduce((n,p)=>n+(p.match(/Authorized Signature/g)||[]).length,0),1);
      const last = pages.at(-1);
      assert.ok(last.includes('(Agha Zulfiqar Ahmed)'));
      const labelPosition = last.match(/([\d.]+) ([\d.]+) Td\n\(Agha Zulfiqar Ahmed\)/);
      assert.ok(labelPosition,'Signature label position found');
      assert.ok(Number(labelPosition[2]) >= 35 * 72 / 25.4,'Complete signature label is above footer safety boundary');
      // Both images must be on the signature page, fully above the reserved footer.
      for (const x of [16,65]) {
        const images = [...last.matchAll(/([\d.]+) 0 0 ([\d.]+) ([\d.]+) ([\d.]+) cm\n\/I\d+ Do/g)];
        assert.ok(images.some(m=>Math.abs(Number(m[3])-x*72/25.4)<0.01 && Number(m[4])>=35*72/25.4),`Image at x=${x} stays above footer`);
      }
      for (const page of pages) assert.equal((page.match(/\(Office Address\)/g)||[]).length,1,'One footer per page');
      checked++;
    }
  }
}
console.log(`PASS: ${checked} invoice/quotation pagination cases with actual signature and stamp images.`);
const terms = '1. Validity: This quotation is valid for 15 days.\n2. Payment: 100% Advance Payment.\n3. Delivery: 3 to 4 working days after confirmation.\n4. Taxes: All prices are exclusive of GST unless mentioned.';
const regression = await renderInvoicePdf({invoice:{items:Array.from({length:9},(_,i)=>({description:i===8?'':`Product ${i+1}`,quantity:1,unitPrice:100,unit:'Nos'}))},
  draftItems:[],client:{displayName:'Bmexon Engineering Services',purchaserName:'Mr. Mohtasim Ali Khan'},invoiceNumber:'QT-BE-001',invoiceDate:'2026-07-29',recordType:'quotation',terms});
assert.equal(regression.getNumberOfPages(),1,'Nine-row quotation must use available space instead of creating a signature-only page');
const regressionPage = regression.internal.pages[1].join('\n');
const namePosition = regressionPage.match(/([\d.]+) ([\d.]+) Td\n\(Agha Zulfiqar Ahmed\)/);
assert.ok(Number(namePosition[2])>=35*72/25.4);
console.log('PASS: supplied nine-row quotation stays on one page with the compact signing block.');
