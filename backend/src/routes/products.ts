import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/sqlite.js';

export const productsRouter = Router();

const productSchema = z.object({
  productName: z.string().trim().min(2),
  description: z.string().trim().optional(),
  defaultPrice: z.coerce.number().nonnegative(),
  isActive: z.boolean().optional()
});

function mapProduct(row: any) {
  return {
    id: row.id,
    productName: row.product_name,
    description: row.description,
    defaultPrice: row.default_price,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

productsRouter.get('/', (req, res) => {
  const query = String(req.query.q ?? '').trim();
  const rows = query
    ? db.prepare(
        `SELECT * FROM products
         WHERE product_name LIKE ? OR description LIKE ?
         ORDER BY product_name ASC`
      ).all(`%${query}%`, `%${query}%`)
    : db.prepare('SELECT * FROM products ORDER BY product_name ASC').all();

  res.json({ data: rows.map(mapProduct) });
});

productsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));

  if (!row) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  res.json({ data: mapProduct(row) });
});

productsRouter.post('/', (req, res) => {
  const parsed = productSchema.parse(req.body);
  const result = db.prepare(
    `INSERT INTO products (product_name, description, default_price, is_active, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(
    parsed.productName,
    parsed.description ?? null,
    parsed.defaultPrice,
    parsed.isActive === false ? 0 : 1
  );

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: mapProduct(row) });
});

productsRouter.put('/:id', (req, res) => {
  const parsed = productSchema.parse(req.body);
  const id = Number(req.params.id);
  const current = db.prepare('SELECT id FROM products WHERE id = ?').get(id);

  if (!current) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  db.prepare(
    `UPDATE products SET
      product_name = ?,
      description = ?,
      default_price = ?,
      is_active = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    parsed.productName,
    parsed.description ?? null,
    parsed.defaultPrice,
    parsed.isActive === false ? 0 : 1,
    id
  );

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({ data: mapProduct(row) });
});

productsRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(Number(req.params.id));

  if (result.changes === 0) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  res.json({ ok: true });
});
