# Products from quotation QT-PS-001

`qt-ps-001-products.csv` is the readable catalogue of all 34 products from the supplied PDF dated 03-09-2026. `qt-ps-001-products.json` also preserves source row numbers, quantities and amounts for validation. Prices are the quoted rates in PKR, exclusive of GST, for the listed unit. Product names are preserved as printed, including spelling.

All 34 source rows are accounted for. Each quantity multiplied by its rate matches its line amount; their sum matches the PDF total of Rs 686,545. Source quantities are for validation, not inventory stock.

The running application's catalogue uses Firestore, not the legacy local SQLite database. The configured Firebase project is `hst-enterprises`.

With a Firebase CLI account that can access that project, run from the repository root:

```powershell
node maintenance/import-products.cjs
node maintenance/import-products.cjs --apply
```

The first command previews matches. The second backs up existing products locally, commits the import atomically, and reads back all 34 products to verify prices and units. Matching names ignore case and repeated whitespace. Existing descriptions and active status are preserved. Duplicate existing matches stop the import. Preconditions prevent overwriting records changed after inspection, and deterministic IDs prevent duplicate insertion on a repeat run.

The script does not change invoices, quotations, or stock. `import-result.json` is written only after successful live verification. Firebase credentials are handled through the installed Firebase CLI and are not written into the import files.
