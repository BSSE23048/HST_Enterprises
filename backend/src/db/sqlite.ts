import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.resolve(currentDir, '../../../database/hst-enterprises.sqlite3');

export const db = new DatabaseSync(databasePath);
db.exec('PRAGMA foreign_keys = ON;');
