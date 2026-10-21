import assert from 'node:assert/strict';
import { clientInput, productInput, invoiceInput, identifier, text } from '../frontend/src/lib/validation.ts';
assert.throws(()=>identifier('../invoices'));assert.throws(()=>productInput({productName:'X',defaultPrice:-1,isActive:true}));
assert.throws(()=>productInput({productName:'X',defaultPrice:Infinity,isActive:true}));
assert.throws(()=>clientInput({displayName:'X',email:'broken@',isActive:true}));
assert.equal(text('  A\u0000 & B  ','Name'),'A & B');
assert.equal(text('<script>alert(1)</script>','Name'),'<script>alert(1)</script>'); // React renders this as escaped text, not markup.
const product=productInput({productName:' Breaker ',defaultPrice:100,isActive:true,admin:true,id:'forged'});
assert.equal(product.productName,'Breaker');assert.ok(!('admin'in product));assert.ok(!('id'in product));
const valid={clientId:'x',clientName:'Client',clientCode:'CL',invoiceNumber:'CL-001',invoiceSequence:1,invoiceDate:'2026-10-09',recordType:'invoice',status:'draft',amountPaid:20,items:[{description:'MCB',quantity:2,unitPrice:100,unit:'Box'}],grandTotal:1};
const invoice=invoiceInput(valid);assert.equal(invoice.grandTotal,200);assert.equal(invoice.balanceDue,180);assert.equal(invoice.items[0].unit,'Box');
assert.throws(()=>invoiceInput({...valid,amountPaid:201}));assert.throws(()=>invoiceInput({...valid,items:[]}));assert.throws(()=>invoiceInput({...valid,items:Array(201).fill(valid.items[0])}));assert.throws(()=>invoiceInput({...valid,invoiceDate:'2026-02-30'}));
assert.equal(invoiceInput({...valid,recordType:'quotation'}).amountPaid,0);
console.log('Input validation passed: injection-shaped text, field allowlists, money, dates, IDs, Box units and document totals.');
