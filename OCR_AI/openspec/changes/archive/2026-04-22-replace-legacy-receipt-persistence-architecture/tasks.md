## 1. Audit And Remove Legacy Receipt-Persistence Runtime

- [x] 1.1 Remove or deprecate `services/receipt-save-service` source, SQL, and env example files so the repo no longer ships a runnable reviewed-receipt persistence service
- [x] 1.2 Remove legacy package scripts and test entry points tied to `receipt-save-service` and reviewed-receipt persistence
- [x] 1.3 Replace any remaining runtime or config references to `NEON_DATABASE_URL` that only exist for the retired save-service path

## 2. Rewrite Contracts, Tests, And Naming

- [x] 2.1 Update or remove tests that assert reviewed-receipt save behavior, `receipt_id` responses, or receipt-save endpoints
- [x] 2.2 Replace legacy reviewed-save contract files and example payloads with confirmed finance-transaction contract language
- [x] 2.3 Align OCR UI and integration wording so OCR output is temporary review input and persistence happens only through confirmed transaction creation in `finance-service`

## 3. Align Documentation With Fixed Architecture

- [x] 3.1 Rewrite root and module docs that still mention `receipt-save-service`, `receipt_reviews`, `receipt_db`, `ocr-audit-service`, OCR persistence tables, or receipt lifecycle persistence
- [x] 3.2 Normalize setup and Neon env guidance to use `AUTH_DATABASE_URL` and `FINANCE_DATABASE_URL` and to distinguish services from databases or tables
- [x] 3.3 Update run-flow and end-to-end docs so they describe stateless OCR feeding user-confirmed data into `finance-service.transactions`

## 4. Clean The Spec Baseline And Verify Consistency

- [x] 4.1 Apply the spec delta updates for OCR integration, OCR review UI, developer docs, validation scenarios, and mock-save removal to the active baseline
- [x] 4.2 Search the repository for stale architecture references and clear any remaining active mentions of retired services, tables, or OCR persistence concepts
- [x] 4.3 Verify the final repo state, document deprecated or removed folders, and confirm the architecture summary matches `auth_db`, `finance_db`, and stateless OCR only
