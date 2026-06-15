const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.resolve(__dirname, '../database/hst-enterprises.sqlite3');
const schemaPath = path.resolve(__dirname, '../database/schema.sql');

const db = new DatabaseSync(dbPath);
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema);
db.close();

console.log(`SQLite database initialized at ${dbPath}`);
