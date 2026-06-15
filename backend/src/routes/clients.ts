import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/sqlite.js';

export const clientsRouter = Router();

const clientSchema = z.object({
  purchaserName: z.string().trim().optional(),
  displayName: z.string().trim().min(2),
  clientCode: z.string().trim().min(2).optional(),
  businessName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  billingAddress: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean().optional()
});

function normalizeCode(value: string) {
  const code = value.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 6);
  return code || 'CL';
}

function uniqueCode(baseCode: string, ignoreId?: number) {
  const exists = db.prepare('SELECT id FROM clients WHERE client_code = ? AND (? IS NULL OR id != ?) LIMIT 1');
  let candidate = baseCode;
  let suffix = 2;

  while (exists.get(candidate, ignoreId ?? null, ignoreId ?? null)) {
    candidate = `${baseCode}${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function mapClient(row: any) {
  return {
    id: row.id,
    clientCode: row.client_code,
    purchaserName: row.purchaser_name ?? null,
    displayName: row.display_name,
    businessName: row.business_name,
    phone: row.phone,
    email: row.email,
    billingAddress: row.billing_address,
    notes: row.notes,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

clientsRouter.get('/', (req, res) => {
  const query = String(req.query.q ?? '').trim();
  const rows = query
    ? db.prepare(
        `SELECT * FROM clients
         WHERE display_name LIKE ? OR client_code LIKE ? OR business_name LIKE ?
         ORDER BY display_name ASC`
      ).all(`%${query}%`, `%${query}%`, `%${query}%`)
    : db.prepare('SELECT * FROM clients ORDER BY display_name ASC').all();

  res.json({ data: rows.map(mapClient) });
});

clientsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(Number(req.params.id));

  if (!row) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  res.json({ data: mapClient(row) });
});

clientsRouter.post('/', (req, res) => {
  const parsed = clientSchema.parse(req.body);
  const proposedCode = parsed.clientCode ? normalizeCode(parsed.clientCode) : normalizeCode(parsed.displayName);
  const clientCode = uniqueCode(proposedCode);

  const result = db.prepare(
    `INSERT INTO clients (
      client_code, purchaser_name, display_name, business_name, phone, email, billing_address, notes, is_active, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    clientCode,
    parsed.purchaserName ?? null,
    parsed.displayName,
    parsed.businessName ?? null,
    parsed.phone ?? null,
    parsed.email ?? null,
    parsed.billingAddress ?? null,
    parsed.notes ?? null,
    parsed.isActive === false ? 0 : 1
  );

  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: mapClient(row) });
});

clientsRouter.put('/:id', (req, res) => {
  const parsed = clientSchema.parse(req.body);
  const id = Number(req.params.id);
  const current = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

  if (!current) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  const currentRow = current as any;
  const proposedCode = parsed.clientCode ? normalizeCode(parsed.clientCode) : currentRow.client_code;
  const clientCode = normalizeCode(proposedCode) === currentRow.client_code ? currentRow.client_code : uniqueCode(normalizeCode(proposedCode), id);

  db.prepare(
    `UPDATE clients SET
      client_code = ?,
      purchaser_name = ?,
      display_name = ?,
      business_name = ?,
      phone = ?,
      email = ?,
      billing_address = ?,
      notes = ?,
      is_active = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    clientCode,
    parsed.purchaserName ?? null,
    parsed.displayName,
    parsed.businessName ?? null,
    parsed.phone ?? null,
    parsed.email ?? null,
    parsed.billingAddress ?? null,
    parsed.notes ?? null,
    parsed.isActive === false ? 0 : 1,
    id
  );

  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  res.json({ data: mapClient(row) });
});

clientsRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM clients WHERE id = ?').run(Number(req.params.id));

  if (result.changes === 0) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  res.json({ ok: true });
});
