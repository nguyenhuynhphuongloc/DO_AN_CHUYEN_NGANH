## 1. Shared Database Restructure

- [x] 1.1 Inspect the live Neon `neondb` schema and document the exact diff required for wallets, receipts, parser results, and merchant-aware transactions.
- [x] 1.2 Design additive SQL migrations for the shared database, including new tables and altered transaction columns such as `merchant_name`, `wallet_id`, `receipt_id`, and source metadata.
- [x] 1.3 Add explicit wallet schema support and ensure budgets remain untouched as planning entities rather than payment-source entities.
- [x] 1.4 Define rollback-safe migration notes for each schema change before applying any SQL to the live Neon database.

## 2. Shared Data Contract Alignment

- [x] 2.1 Align backend models and persistence code with the shared Neon schema instead of the current incompatible service-local assumptions.
- [x] 2.2 Update receipt-related persistence to store uploaded receipts and parser-result records separately from confirmed transactions.
- [x] 2.3 Update transaction persistence logic so confirmed OCR-backed transactions write merchant-aware fields and receipt linkage into the shared database.
- [x] 2.4 Add or refactor shared lookup services for wallets, categories, and receipt-linked transaction retrieval.
- [x] 2.5 Audit and adjust legacy database code, old schema assumptions, and service-local model mappings so the application remains compatible after moving from per-service databases to one shared database.

## 3. OCR And AI Support Services

- [x] 3.1 Keep Veryfi as the parser provider and normalize its output into a stable internal receipt structure for downstream services.
- [x] 3.2 Add a category-resolution service that sends normalized receipt context plus DB-backed allowed categories to Groq and returns only valid category suggestions.
- [x] 3.3 Add a description-generation helper that creates a default human-readable description from parsed receipt context and selected category.
- [x] 3.4 Ensure parser-result persistence stores raw text, normalized JSON, suggested category, and generated description before user confirmation.

## 4. Review Flow And Frontend Changes

- [x] 4.1 Reduce the receipt confirmation form to merchant name, amount, transaction time, wallet, category, and description.
- [x] 4.2 Prefill the review form from normalized parser output, wallet defaults, and AI-backed category suggestions from the shared database.
- [x] 4.3 Update the parser/debug panel to emphasize parser text and structured JSON while removing confidence-heavy clutter from the primary confirmation experience.
- [x] 4.4 Preserve user override behavior so edited wallet, category, and description values replace suggestions at confirmation time.

## 5. Migration Validation And Service Rollout

- [ ] 5.1 Validate end-to-end receipt upload, Veryfi parse, Groq category suggestion, review, and confirmed transaction persistence against the shared Neon schema.
- [ ] 5.2 Verify that transactions created from OCR can be queried back with wallet, category, merchant name, description, and receipt linkage intact.
- [ ] 5.3 Validate failure paths for missing wallets, invalid category suggestions, partial parser output, and abandoned review sessions.
- [x] 5.4 Record rollout notes, migration decisions, and follow-up cleanup tasks for any legacy finance-service or receipt-service code that still assumes the old schema.
