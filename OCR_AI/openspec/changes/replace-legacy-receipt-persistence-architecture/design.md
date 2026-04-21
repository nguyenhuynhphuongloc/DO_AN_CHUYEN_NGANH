## Context

The repository already contains the newer backend split under `microservices/auth-service` and `microservices/finance-service`, plus docs that partially describe stateless OCR and direct transaction persistence. At the same time, the repo still ships a legacy runtime surface under `services/receipt-save-service`, a save-service npm script, receipt-review SQL, tests that assert `receipt_id` responses, and base OpenSpec specs that still describe mock-save or reviewed-receipt persistence.

The cleanup is cross-cutting because the stale architecture appears in multiple layers:

- runnable code: `services/receipt-save-service/**`
- scripts: `package.json`
- tests and contracts: `tests/receiptSaveService.test.ts`, `contracts/reviewed-save-response.json`
- setup and architecture docs: `microservices.md`, `docs/receipt-ocr-backend.md`, archived or base spec language
- naming and env assumptions: `NEON_DATABASE_URL`, reviewed-receipt save terminology, receipt-persistence language

The target architecture is fixed:

- `auth-service` owns `auth_db`
- `finance-service` owns `finance_db`
- OCR is stateless and not DB-backed
- only confirmed important invoice fields are saved
- confirmed invoice data is saved directly into `finance_db.transactions`
- wallets, budgets, allocation rules, and categories remain finance-service concerns

## Goals / Non-Goals

**Goals:**

- Make the repository internally consistent with the fixed architecture and remove conflicting guidance.
- Replace receipt-centric save semantics with finance transaction semantics in docs, tests, contracts, and naming.
- Eliminate single-DB assumptions where stale references still imply one Neon database or one OCR save database.
- Mark legacy runtime code and folders for removal or deprecation when they no longer belong in the architecture.
- Preserve the already-correct parts of the newer auth and finance microservice structure.

**Non-Goals:**

- Redesigning the auth-service or finance-service schemas beyond the fixed table ownership already defined.
- Introducing any OCR persistence, audit trail, job queue, feedback table, or receipt lifecycle storage.
- Expanding the OCR payload to include raw OCR text, extraction JSON archives, or receipt draft persistence.
- Re-opening architecture decisions that are already settled by the current target design.

## Decisions

### 1. Treat stale receipt-persistence code as incorrect architecture, not as an alternative implementation

The cleanup will treat `receipt-save-service`, `receipt_reviews`, `receipt_db`, `ocr-audit-service`, and related wording as invalid target architecture. This is stricter than “legacy but still supported” language because keeping both narratives alive would keep misleading future contributors.

Alternative considered: documenting both the old and new designs side by side.
Rejected because the user’s fixed architecture explicitly supersedes the old design and the repo should not imply both are valid.

### 2. Normalize save semantics around confirmed finance transactions

Docs, tests, and contracts will describe OCR output as temporary UI input. The persistence boundary starts only when the user confirms the extracted fields and `finance-service` creates a transaction. Success payloads should therefore center on transaction creation, not receipt save confirmation or `receipt_id`.

Alternative considered: preserving reviewed-receipt contract files for backwards-reference.
Rejected because the repository’s active contract surface should match the supported runtime path, not the retired path.

### 3. Distinguish application services from databases and tables everywhere

The rewrite will explicitly separate:

- application services: `auth-service`, `finance-service`, OCR integration layer
- databases: `auth_db`, `finance_db`
- tables: auth tables and finance tables owned by those services

This avoids vague wording such as “service in DB” and prevents docs from conflating a service boundary with a schema or table.

Alternative considered: only fixing env variable names and leaving broader wording intact.
Rejected because the repo’s main confusion comes from mixed terminology, not just one variable name.

### 4. Use service-specific database URLs as the only supported database env model

Where the repo still points to a legacy single-database assumption, the design will replace it with `AUTH_DATABASE_URL` and `FINANCE_DATABASE_URL`. `NEON_DATABASE_URL` is only acceptable if a file genuinely represents some separate shared tooling, which current stale save-service files do not.

Alternative considered: keeping `NEON_DATABASE_URL` as an alias for compatibility.
Rejected because the legacy save-service should be removed or deprecated, not adapted into the new architecture.

### 5. Clean the OpenSpec baseline so future changes inherit the correct architecture

Base specs that still encode mock-save or reviewed-receipt persistence will be updated or removed so future proposals do not inherit obsolete requirements. This includes removing the `receipt-ocr-mock-save` capability and rewriting the OCR integration and developer-doc specs to target `finance-service`.

Alternative considered: correcting only repo docs and code while leaving base specs unchanged.
Rejected because stale base specs would keep reintroducing the wrong assumptions during later spec work.

## Risks / Trade-offs

- [Archived changes and old specs still mention mock save or reviewed receipts] -> Mitigation: update active base specs and current docs, and call archived references historical rather than canonical.
- [Deleting legacy files may break ad hoc local workflows] -> Mitigation: tasks should either delete them with replacement guidance or clearly mark them deprecated before removal.
- [Search-and-replace without semantic review could damage already-correct stateless OCR wording] -> Mitigation: review each hit and only rewrite references that still imply persistence or unsupported services.
- [Some tests and fixtures may depend on old response shapes] -> Mitigation: migrate them to confirmed-transaction contracts and remove assertions around `receipt_id`.

## Migration Plan

1. Audit all stale references in code, docs, tests, contracts, env examples, npm scripts, and folder names.
2. Remove or deprecate `services/receipt-save-service` and its related script, SQL, env template, and tests.
3. Rewrite any remaining docs to use the fixed ownership model: `auth_db` for auth-service, `finance_db` for finance-service, stateless OCR with no persistence tables.
4. Replace reviewed-receipt and mock-save contract language with confirmed transaction creation language in tests, contracts, and OCR integration docs.
5. Update active OpenSpec base specs so the repo’s specification baseline matches the fixed architecture.
6. Verify no active references remain to `receipt-save-service`, `receipt_reviews`, `ocr-audit-service`, `receipt_db`, or stale single-DB env assumptions.

Rollback strategy: because this is mainly a consistency cleanup, rollback is file-level restoration of removed docs or code if a dependent path was missed. No data migration or schema rollback is expected because the target design already excludes the retired persistence model.

## Open Questions

- None required for the proposal. The target architecture and the list of outdated assumptions to remove were provided explicitly.
