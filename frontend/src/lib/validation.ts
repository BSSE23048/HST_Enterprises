// Accept plain text, never HTML. React escapes these values at render time.
// Validation is a UX/data-quality boundary; Firebase rules enforce authorization.
type Data = Record<string, unknown>;
export function object(value: unknown): Data {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid record.');
  return value as Data;
}
export function text(value: unknown, label: string, max = 200, required = false): string {
  if (value !== undefined && value !== null && typeof value !== 'string') throw new Error(`${label} must be text.`);
  const result = String(value ?? '').normalize('NFC').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (result.length > max || (required && !result)) throw new Error(`${label} is required and must be at most ${max} characters.`);
  return result;
}
export function number(value: unknown, label: string, max = 1e12): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) throw new Error(`${label} must be a valid non-negative number.`);
  return value;
}
export function identifier(value: unknown): string {
  const id = text(value, 'Record ID', 1500, true);
  if (id.includes('/') || id === '.' || id === '..') throw new Error('Invalid record ID.');
  return id;
}
function active(value: unknown) { if (typeof value !== 'boolean') throw new Error('Invalid active status.'); return value; }
export function clientInput(input: unknown) {
  const d = object(input);
  const email = text(d.email, 'Email', 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  return { displayName: text(d.displayName, 'Client name', 200, true), clientCode: text(d.clientCode, 'Client code', 40), purchaserName: text(d.purchaserName, 'Purchaser', 200), businessName: text(d.businessName, 'Business name', 200), phone: text(d.phone, 'Phone', 40), email, billingAddress: text(d.billingAddress, 'Address', 1000), notes: text(d.notes, 'Notes', 5000), isActive: active(d.isActive) };
}
export function productInput(input: unknown) {
  const d = object(input);
  return { productName: text(d.productName, 'Product name', 250, true), description: text(d.description, 'Description', 2000), defaultPrice: number(d.defaultPrice, 'Price'), isActive: active(d.isActive), ...(d.unit !== undefined ? { unit: text(d.unit, 'Unit', 40, true) } : {}) };
}
const statuses = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'];
export function invoiceInput(input: unknown) {
  const d = object(input);
  if (!['invoice', 'quotation'].includes(String(d.recordType))) throw new Error('Invalid document type.');
  if (!statuses.includes(String(d.status))) throw new Error('Invalid status.');
  const invoiceDate = text(d.invoiceDate, 'Date', 10, true);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate) || new Date(invoiceDate).toISOString().slice(0, 10) !== invoiceDate) throw new Error('Invalid date.');
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 200) throw new Error('A document requires 1–200 lines.');
  const items = d.items.map(raw => {
    const i = object(raw);
    const quantity = number(i.quantity, 'Quantity', 1e8);
    if (!quantity) throw new Error('Quantity must be greater than zero.');
    return { productId: i.productId ? identifier(i.productId) : null, description: text(i.description, 'Line description', 2000), quantity, unitPrice: number(i.unitPrice, 'Unit price'), unit: text(i.unit || 'Nos', 'Unit', 40, true) };
  });
  if (!items.some(i => i.description)) throw new Error('Add at least one product description.');
  const subtotal = number(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), 'Total');
  const amountPaid = d.recordType === 'quotation' ? 0 : number(d.amountPaid, 'Amount paid');
  if (amountPaid > subtotal) throw new Error('Amount paid cannot exceed the total.');
  const invoiceSequence = number(Number(d.invoiceSequence), 'Sequence', 1e9);
  if (!Number.isInteger(invoiceSequence)) throw new Error('Invalid sequence.');
  return { clientId: identifier(d.clientId), clientName: text(d.clientName, 'Client name', 200, true), clientCode: text(d.clientCode, 'Client code', 40), invoiceNumber: text(d.invoiceNumber, 'Document number', 100, true), invoiceSequence, invoiceDate, recordType: String(d.recordType), status: String(d.status), terms: text(d.terms, 'Terms', 15000), notes: text(d.notes, 'Notes', 15000), items, itemCount: items.length, subtotal, grandTotal: subtotal, amountPaid, balanceDue: Math.max(0, subtotal - amountPaid) };
}
