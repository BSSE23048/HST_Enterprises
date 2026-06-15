const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.resolve(__dirname, '../database/hst-enterprises.sqlite3');

function columnExists(db, table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => String(r.name).toLowerCase() === column.toLowerCase());
}

try {
  const db = new DatabaseSync(dbPath);
  console.log(`Opened DB: ${dbPath}`);

  if (columnExists(db, 'clients', 'purchaser_name')) {
    console.log('Column purchaser_name already exists on clients — no action taken.');
    db.close();
    process.exit(0);
  }

  console.log('Adding purchaser_name column to clients...');
  db.exec("ALTER TABLE clients ADD COLUMN purchaser_name TEXT;");
  console.log('Column added successfully.');
  db.close();
  process.exit(0);
} catch (err) {
  console.error('Migration failed:', err && err.message ? err.message : err);
  process.exit(1);
}
