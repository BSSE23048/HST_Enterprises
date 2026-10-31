# HST Enterprises — Business Website and Invoice Portal

A React/TypeScript application for a construction, electrical and procurement business: a public product/company website and an authenticated employee workspace for client records, quotations and invoices.

- Public website listed by the project: [hstenterprisespk.com](https://hstenterprisespk.com/)
- [Source](https://github.com/BSSE23048/HST_Enterprises)
- Repository maintainer: [Agha Shoaib Zaib](https://github.com/BSSE23048)
- Deployment availability and real customer workflows were not verified during this documentation update.

## What the code contains

- Public company, category and product pages, with pre-rendering and search metadata.
- Employee portal at `/portal`.
- Client/product records and invoice/quotation input validation.
- Line-item totals, paid amounts, balances and PDF generation.
- Firebase Authentication, Firestore rules and private signing-asset retrieval.

The current repository uses Firebase. Earlier local invoicing work may have used Express/SQLite; those are not the current deployed-stack instructions.

## Stack and structure

| Area | Location / technology |
| --- | --- |
| UI | React, TypeScript, Tailwind CSS, Vite |
| Auth and data | Firebase Authentication, Firestore |
| PDF output | jsPDF and jspdf-autotable |
| Public pages | `frontend/src/corporate/` |
| Validation / PDF | `frontend/src/lib/` |
| Hosting and access rules | `firebase.json`, `firestore.rules`, `storage.rules` |
| Operational scripts | `maintenance/` |

## Local setup

Use Node.js 22 and npm. From the repository root:

```sh
npm ci
```

Copy `.env.example` to `.env`, fill the public Firebase configuration, then run:

```sh
npm run dev
npm run typecheck
npm run build
```

Use a separate Firebase project and synthetic records for development. Never add Admin SDK credentials or signing assets to browser variables or source control.

## Demonstrating the workflow

1. Show the public homepage and one product/category page on desktop and mobile.
2. In a separate test project, sign in as a provisioned administrator.
3. Create a synthetic client and quotation with multiple line items.
4. Check totals, invoice numbering and PDF pagination.
5. Demonstrate unauthorized access denial and logout.

Screenshots should use synthetic company/customer records with no real signatures, account details or private addresses. This update does not supply or claim a completed visual demonstration.

## Security and limitations

Firestore access requires a trusted admin custom claim; UI route protection alone is insufficient. Signing images are retrieved from the admin-only `privateAssets/signing` document.

Preserve invoice numbering, quotation conversion, catalogue data and PDF pagination when changing this project. Never deploy source documents, backups or maintenance directories. Before deployment, run the checks required by [.github/copilot-instructions.md](.github/copilot-instructions.md), including rules and browser checks.

This workspace uses `maintenance/prepare-deploy.py` and `maintenance/build-deploy.cjs` for isolated deployment preparation. The build script synchronizes the JSON-LD CSP hash. Read [the security review](maintenance/SECURITY-REVIEW.md) before using these operational scripts.

## Contribution and maintenance

The repository is maintained under Agha Shoaib Zaib's account. Its current code, business requirements and supplied assets are distinct forms of evidence; repository ownership does not establish sole authorship of every asset. No client-count, revenue or performance improvement is claimed here.
