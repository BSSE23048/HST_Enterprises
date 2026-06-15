# HST Enterprises Local Invoice System

Local-only invoice generation and client management for HST Enterprises.

## Stack
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite

## What is implemented
- Client CRUD with client-specific invoice prefixes
- Product CRUD with default per-piece pricing
- Invoice generation, editing, deletion, and history view
- Client-specific invoice numbering such as `PT-001`
- Live line-item totals and grand total calculations
- PDF download and print actions from the invoice workspace
- SQLite database bootstrap with strict foreign-key constraints

## Architecture
- `frontend/` contains the React dashboard, invoice builder, PDF actions, and local UI state.
- `backend/` contains the Express API, SQLite access, and CRUD routes.
- `database/schema.sql` is the source of truth for local schema creation.
- `scripts/init-db.js` initializes the SQLite file from the schema.

## Folder structure
- `backend/src/routes/` API routes for clients, products, and invoices
- `backend/src/db/` SQLite connection helper
- `frontend/src/lib/` API and PDF helpers
- `frontend/src/` dashboard UI and styles
- `database/` schema and local `.sqlite3` file
- `scripts/` database bootstrap script

## Local development
- Install dependencies: `npm install`
- Initialize the SQLite file: `npm run db:init`
- Run both apps locally: `npm run dev`
- Build both workspaces: `npm run build`

The backend starts on port `4000` and the frontend starts on port `5173`.

## Schema source
The schema creation queries live in [database/schema.sql](database/schema.sql).
