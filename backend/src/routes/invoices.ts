import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/sqlite.js';

export const invoicesRouter = Router();

const invoiceItemSchema = z.object({
  productId: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative()
});

const invoiceSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  invoiceDate: z.string().trim().optional(),
  status: z.enum(['draft', 'issued', 'paid', 'cancelled']).optional(),
  notes: z.string().trim().optional(),
  invoiceNumber: z.string().trim().optional(),
  invoiceSequence: z.coerce.number().int().positive().optional(),
  items: z.array(invoiceItemSchema).min(1)
});

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatInvoiceNumber(clientCode: string, sequence: number) {
  return `${clientCode}-${String(sequence).padStart(3, '0')}`;
}

function nextSequenceForClient(clientId: number) {
  return db.prepare('SELECT COALESCE(MAX(invoice_sequence), 0) + 1 AS next_sequence FROM invoices WHERE client_id = ?').get(clientId) as { next_sequence: number };
}

function mapInvoice(row: any) {
  return {
    id: row.id,
    clientId: row.client_id,
    clientCode: row.client_code,
    clientName: row.client_name,
    invoiceSequence: row.invoice_sequence,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    status: row.status,
    subtotal: row.subtotal,
    grandTotal: row.grand_total,
    notes: row.notes,
    itemCount: row.item_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function loadInvoice(id: number) {
  const invoice = db.prepare(
    `SELECT i.*, c.client_code, c.display_name AS client_name,
      (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) AS item_count
     FROM invoices i
     JOIN clients c ON c.id = i.client_id
     WHERE i.id = ?`
  ).get(id) as any;

  if (!invoice) {
    return null;
  }

  const items = db.prepare(
    `SELECT ii.*, p.product_name AS product_name
     FROM invoice_items ii
     LEFT JOIN products p ON p.id = ii.product_id
     WHERE ii.invoice_id = ?
     ORDER BY ii.line_no ASC`
  ).all(id).map((item: any) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    lineNo: item.line_no,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    lineTotal: item.line_total
  }));

  return { ...mapInvoice(invoice), items };
}

function saveInvoice(id: number | null, parsed: z.infer<typeof invoiceSchema>) {
  const existing = id ? db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as any : null;
  const client = db.prepare('SELECT id, client_code FROM clients WHERE id = ?').get(parsed.clientId) as any;

  if (!client) {
    throw new Error('Client not found');
  }

  const sequence = parsed.invoiceSequence ?? (existing && existing.client_id === parsed.clientId ? existing.invoice_sequence : nextSequenceForClient(parsed.clientId).next_sequence);
  const invoiceNumber = parsed.invoiceNumber && parsed.invoiceNumber.length > 0
    ? parsed.invoiceNumber
    : existing && existing.client_id === parsed.clientId
      ? existing.invoice_number
      : formatInvoiceNumber(client.client_code, sequence);
  const invoiceDate = parsed.invoiceDate && parsed.invoiceDate.length > 0 ? parsed.invoiceDate : existing?.invoice_date ?? new Date().toISOString().slice(0, 10);
  const subtotal = roundMoney(parsed.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const status = parsed.status ?? existing?.status ?? 'draft';
  const notes = parsed.notes ?? existing?.notes ?? null;

  db.exec('BEGIN');
  try {
    let invoiceId = id;

    if (invoiceId) {
      db.prepare(
        `UPDATE invoices SET
          client_id = ?,
          invoice_sequence = ?,
          invoice_number = ?,
          invoice_date = ?,
          status = ?,
          subtotal = ?,
          grand_total = ?,
          notes = ?,
          updated_at = datetime('now')
         WHERE id = ?`
      ).run(parsed.clientId, sequence, invoiceNumber, invoiceDate, status, subtotal, subtotal, notes, invoiceId);
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId);
    } else {
      const result = db.prepare(
        `INSERT INTO invoices (
          client_id, invoice_sequence, invoice_number, invoice_date, status, subtotal, grand_total, notes, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(parsed.clientId, sequence, invoiceNumber, invoiceDate, status, subtotal, subtotal, notes);
      invoiceId = Number(result.lastInsertRowid);
    }

    const insertItem = db.prepare(
      `INSERT INTO invoice_items (
        invoice_id, product_id, line_no, description, quantity, unit_price, line_total, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    );

    parsed.items.forEach((item, index) => {
      insertItem.run(
        invoiceId,
        item.productId ?? null,
        index + 1,
        item.description,
        item.quantity,
        item.unitPrice,
        roundMoney(item.quantity * item.unitPrice)
      );
    });

    db.exec('COMMIT');
    return loadInvoice(invoiceId);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

invoicesRouter.get('/next-number', (req, res) => {
  const clientId = Number(req.query.clientId);

  if (!clientId) {
    res.status(400).json({ error: 'clientId is required' });
    return;
  }

  const client = db.prepare('SELECT id, client_code FROM clients WHERE id = ?').get(clientId) as any;
  if (!client) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  const nextSequence = nextSequenceForClient(clientId).next_sequence;
  res.json({ data: { clientId: client.id, nextSequence, invoiceNumber: formatInvoiceNumber(client.client_code, nextSequence) } });
});

invoicesRouter.get('/', (req, res) => {
  const query = String(req.query.q ?? '').trim();
  const rows = query
    ? db.prepare(
        `SELECT i.*, c.client_code, c.display_name AS client_name,
          (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) AS item_count
         FROM invoices i
         JOIN clients c ON c.id = i.client_id
         WHERE i.invoice_number LIKE ? OR c.display_name LIKE ? OR c.client_code LIKE ?
         ORDER BY i.invoice_date DESC, i.id DESC`
      ).all(`%${query}%`, `%${query}%`, `%${query}%`)
    : db.prepare(
        `SELECT i.*, c.client_code, c.display_name AS client_name,
          (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) AS item_count
         FROM invoices i
         JOIN clients c ON c.id = i.client_id
         ORDER BY i.invoice_date DESC, i.id DESC`
      ).all();

  res.json({ data: rows.map(mapInvoice) });
});

invoicesRouter.get('/:id', (req, res) => {
  const invoice = loadInvoice(Number(req.params.id));

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  res.json({ data: invoice });
});

invoicesRouter.post('/', (req, res) => {
  try {
    const parsed = invoiceSchema.parse(req.body);
    const invoice = saveInvoice(null, parsed);
    res.status(201).json({ data: invoice });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create invoice' });
  }
});

invoicesRouter.put('/:id', (req, res) => {
  try {
    const parsed = invoiceSchema.parse(req.body);
    const invoice = saveInvoice(Number(req.params.id), parsed);
    res.json({ data: invoice });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update invoice' });
  }
});

invoicesRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(Number(req.params.id));

  if (result.changes === 0) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }

  res.json({ ok: true });
});
