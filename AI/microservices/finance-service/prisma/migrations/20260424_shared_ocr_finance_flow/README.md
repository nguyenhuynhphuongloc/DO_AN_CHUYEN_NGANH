# Shared OCR Finance Flow Migration Notes

## Target

- Database: Neon PostgreSQL `neondb`
- Change intent: align the shared finance schema with the OCR-to-transaction workflow

## Observed Live Schema Gaps

The current live schema already contains:

- `users`
- `categories`
- `transactions`
- `budgets`

The current live schema does **not** yet provide the minimum OCR finance structures required by the new flow:

- `wallets`
- `receipts`
- `receipt_parser_results`

The current `transactions` table also lacks several OCR-oriented business fields:

- `wallet_id`
- `merchant_name`
- `source_type`
- `source_ref_id`

## Required Additive Diff

### New table: `wallets`

Purpose:
- represent the source of funds selected during receipt confirmation
- remain distinct from `budgets`

Core columns:
- `id`
- `user_id`
- `name`
- `wallet_type`
- `currency`
- `balance`
- `is_default`
- `created_at`
- `updated_at`

### New table: `receipts`

Purpose:
- persist uploaded receipt images and lifecycle state before transaction confirmation

Core columns:
- `id`
- `user_id`
- `file_name`
- `image_url`
- `mime_type`
- `file_size`
- `image_hash`
- `status`
- `uploaded_at`
- `processed_at`
- `created_at`
- `updated_at`

### New table: `receipt_parser_results`

Purpose:
- persist parser text and structured OCR/AI state before a transaction is confirmed

Core columns:
- `id`
- `receipt_id`
- `provider`
- `raw_text`
- `provider_json`
- `normalized_json`
- `suggested_category_id`
- `suggested_description`
- `created_at`
- `updated_at`

### Altered table: `transactions`

Required additive columns:
- `wallet_id`
- `merchant_name`
- `source_type`
- `source_ref_id`

Existing column retained:
- `receipt_id`

Recommended follow-up:
- backfill `wallet_id` from a default wallet before making it non-nullable
- add foreign keys only after new referenced tables exist

## Wallet vs Budget Decision

`budgets` remain unchanged in this migration because they model planning limits, not payment sources.

- wallet = where money is spent from
- budget = how much may be spent in a period

Using `budgets` as `wallets` would break confirmation semantics and future reporting.

## Rollback Notes

This migration is intentionally additive-first.

Safe rollback sequence:
1. stop application writes that depend on new tables/columns
2. drop foreign keys added by this migration
3. drop indexes added by this migration
4. drop `receipt_parser_results`
5. drop `receipts`
6. drop `wallets`
7. drop newly added nullable columns from `transactions`

Rollback warning:
- do not drop newly added structures until application code has been reverted
- if production data is written into new tables, export or archive it before rollback

## Rollout Notes

- `finance-service` was aligned to the shared Neon schema and now treats shared DB integer IDs as canonical, while still accepting JWT user identities that originated from the legacy auth flow.
- `receipt-service` was aligned to the shared `receipts` and `receipt_parser_results` tables and no longer depends on the old `receipt_ocr_results` / `receipt_extractions` split for primary persistence.
- Parser output is now persisted before confirmation with:
  - raw text
  - provider/debug JSON
  - normalized JSON
  - suggested category
  - suggested description
- Confirmed OCR-backed transactions now carry:
  - `receipt_id`
  - `merchant_name`
  - `wallet_id`
  - `source_type`
  - `source_ref_id`

## Follow-up Cleanup

- Remove or archive the old receipt-service SQL migration assets that still describe the pre-shared-DB receipt session schema once the live shared DB migration is applied successfully.
- Decide whether the auth-service itself should move from UUID-centric identities to the shared finance DB integer user ID model, rather than relying on email-based bridging in downstream services.
- Replace any remaining reliance on `Base.metadata.create_all(...)` for shared-schema rollout with explicit reviewed migrations once the DB migration is fully validated.
- Re-run end-to-end validation against the live app stack after applying the migration, because parser/provider integrations were validated at compile/test level but not yet through a full uploaded receipt lifecycle in this session.
