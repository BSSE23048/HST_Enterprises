// Executes simulated rule requests; creates no users or business records.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {session}=require('./firebase-session.cjs');
const admin={uid:'test-admin',token:{admin:true}};
const ordinary={uid:'test-user',token:{}};
const cases=[];
function test(name,method,target,auth,expectation,data){
 cases.push({name,test:{expectation,request:{path:`/databases/(default)/documents/${target}`,method,auth,...(data?{resource:{data}}:{})},resource:{data:data||{}}}});
}
for(const collection of ['clients','products','invoices']) for(const method of ['get','list','delete']){
 test(`${collection} ${method}: anonymous denied`,method,`${collection}/test`,null,'DENY');
 test(`${collection} ${method}: non-admin denied`,method,`${collection}/test`,ordinary,'DENY');
 test(`${collection} ${method}: admin allowed`,method,`${collection}/test`,admin,'ALLOW');
}
test('unknown collection denied','get','users/test',admin,'DENY');
test('signing anonymous denied','get','privateAssets/signing',null,'DENY');
test('signing non-admin denied','get','privateAssets/signing',ordinary,'DENY');
test('signing admin allowed','get','privateAssets/signing',admin,'ALLOW');
test('signing client mutation denied','create','privateAssets/signing',admin,'DENY',{signature:'x'});
const product={productName:'Circuit breaker',description:'MCB',defaultPrice:100,isActive:true,unit:'Box'};
for(const method of ['create','update']){
 test(`product ${method} valid`,method,'products/test',admin,'ALLOW',product);
 test(`product ${method} non-admin`,method,'products/test',ordinary,'DENY',product);
 test(`product ${method} negative price`,method,'products/test',admin,'DENY',{...product,defaultPrice:-1});
 test(`product ${method} unexpected field`,method,'products/test',admin,'DENY',{...product,admin:true});
}
const invoice={clientId:'client',clientName:'Example',clientCode:'EX',invoiceNumber:'EX-001',invoiceSequence:1,invoiceDate:'2026-10-09',recordType:'invoice',status:'draft',items:[{description:'MCB',quantity:1,unitPrice:100,unit:'Box'}],itemCount:1,subtotal:100,grandTotal:100,amountPaid:0,balanceDue:100};
test('invoice valid','create','invoices/test',admin,'ALLOW',invoice);
test('invoice non-admin','create','invoices/test',ordinary,'DENY',invoice);
test('invoice invalid balance','create','invoices/test',admin,'DENY',{...invoice,balanceDue:-1});
test('invoice unexpected field','create','invoices/test',admin,'DENY',{...invoice,admin:true});
test('invoice excessive lines','create','invoices/test',admin,'DENY',{...invoice,items:Array(201).fill({}),itemCount:201});
test('client valid','create','clients/test',admin,'ALLOW',{displayName:'Example',isActive:true});
test('client invalid','create','clients/test',admin,'DENY',{displayName:'',isActive:true});
(async()=>{
 const api=await session();
 const response=await api('https://firebaserules.googleapis.com/v1/projects/hst-enterprises:test',{method:'POST',body:JSON.stringify({source:{files:[{name:'firestore.rules',content:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}]},testSuite:{testCases:cases.map(c=>c.test)}})});
 const results=(response.testResults||[]).map((r,i)=>({name:cases[i].name,state:r.state,errors:r.errors}));
 const out=path.join(__dirname,'security-review');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'rules-results.json'),JSON.stringify({issues:response.issues,results},null,2));
 console.log(JSON.stringify({issues:response.issues,passed:results.filter(r=>r.state==='SUCCESS').length,total:cases.length,failures:results.filter(r=>r.state!=='SUCCESS')},null,2));
 assert.equal(results.length,cases.length);assert.ok(results.every(r=>r.state==='SUCCESS'));
})().catch(e=>{console.error(e.message);process.exitCode=1});
