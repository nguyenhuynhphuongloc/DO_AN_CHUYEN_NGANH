## Why

The current system separates receipt parsing and finance persistence across services and schemas that no longer match the target product direction. We now need a shared PostgreSQL data model, centered on the Neon database `neondb`, so the OCR pipeline can move from image ingestion to review-ready transaction data with consistent category selection, wallet support, and service contracts.

## What Changes

- Restructure the shared PostgreSQL schema in the target Neon database so it can support the end-to-end OCR flow: receipt ingestion, parser output storage, AI-assisted category selection, review, and final transaction persistence.
- Add or reshape core finance tables required by the OCR flow, including wallet support, receipt persistence, parser-result persistence, and transaction fields such as `merchant_name` and receipt linkage.
- Keep the application logically split into services/modules, but align those services to a single shared database contract instead of incompatible per-service schema assumptions.
- Introduce a category-resolution flow where Veryfi extracts receipt data, Groq evaluates the normalized JSON against allowed categories from the shared DB, and the system stores a suggested category rather than inventing categories outside the database.
- Narrow the receipt review form to the business fields required for confirmation:
  - merchant/store name,
  - amount,
  - transaction time,
  - wallet,
  - category,
  - description.
- Generate a default human-readable description from parsed receipt data and selected category, with user override before confirmation.
- **BREAKING** Replace assumptions that budgets can stand in for wallets; wallet support must be modeled explicitly in the shared schema.
- **BREAKING** Replace the current receipt/finance service assumptions that transaction persistence happens through a separate finance schema that does not store merchant-aware OCR review data.
- Add any new service/module contracts needed to support the OCR-first path, including parser-result persistence, category resolution, wallet lookup, and description generation.

## Capabilities

### New Capabilities
- `shared-finance-database-schema`: Define and migrate the shared Neon database schema needed for OCR-driven transaction capture, including wallets, receipts, parser results, and merchant-aware transactions.
- `receipt-ai-category-selection`: Resolve a suggested category by combining Veryfi receipt output, Groq analysis, and the set of allowed categories stored in the shared database.
- `ocr-to-transaction-pipeline`: Persist OCR/parser output and carry it through review-ready transaction creation using the shared database as the source of truth.
- `receipt-review-transaction-form`: Present a minimal confirmation form with merchant name, amount, transaction time, wallet, category, and description, populated from parsed data and DB-backed suggestions.

### Modified Capabilities
- `receipt-ocr-debug-panel`: Change the debug panel contract so it prioritizes parser text and structured JSON while removing confidence-heavy and OCR-mechanics-oriented review clutter from the primary confirmation experience.

## Impact

- Affected database target: the Neon PostgreSQL database at `neondb`, including direct schema changes and follow-on service alignment.
- Affected backend code in `microservices/receipt-service`: parser orchestration, result persistence, review serialization, confirmation flow, and any new category/wallet/description helper services.
- Affected backend code in `microservices/finance-service` or successor shared-data modules: transaction persistence, wallet/category lookup, and shared-schema alignment.
- Affected frontend code in `microservices/frontend`: receipt review form fields, category/wallet selection, structured JSON display, and confirmation payloads.
- New dependency on Groq for constrained category selection over DB-backed categories, in addition to the existing Veryfi parser dependency.
- Operational impact: implementation will need explicit database migration planning for the live Neon schema before code rollout, because the current database shape does not match the target OCR-to-transaction flow.
