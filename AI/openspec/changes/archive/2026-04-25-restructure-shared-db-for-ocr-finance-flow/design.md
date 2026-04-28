## Context

The current repository evolved from a microservice-style split where receipt parsing, finance persistence, and frontend review each assumed different data contracts. That split is now a liability for the OCR-first workflow because the live Neon database at `neondb` does not match the service-local schema assumptions in the repository, and the receipt pipeline needs to carry richer business data than the current transaction model supports.

The target product direction is:

```text
receipt image
  -> Veryfi OCR/parser
  -> normalized receipt JSON
     (merchant name, date/time, total amount, currency, provider category context, line items)
  -> map normalized JSON into review fields
  -> Groq category analysis over allowed DB categories
  -> review draft/session
  -> confirmed transaction in shared PostgreSQL
```

This is not a pure monolith rewrite in one step. The near-term goal is a shared database contract that allows the application to stay modular while removing incompatible schema assumptions. The design therefore has to cover:
- direct schema changes on the target Neon database,
- service/module alignment to that shared schema,
- new service responsibilities for category resolution and description generation,
- a review-first transaction flow that remains safe for user confirmation.

Constraints:
- The target database is already populated and managed in Neon.
- Database changes must be explicit, reviewable, and safe to apply incrementally.
- Veryfi remains the OCR/parser provider.
- Groq is introduced only for constrained category analysis and related text generation, not as the primary OCR engine.
- The user-facing review flow should stay compact and business-oriented, not OCR-mechanics-oriented.

## Goals / Non-Goals

**Goals:**
- Align the application to a shared PostgreSQL schema in the target Neon database.
- Add explicit wallet support instead of overloading budgets or other finance tables with wallet semantics.
- Extend transaction persistence so OCR-confirmed transactions can store `merchant_name`, `receipt_id`, and source metadata.
- Add receipt and parser-result persistence tables that preserve raw and normalized OCR/AI outputs before confirmation.
- Preserve a stable normalized receipt JSON contract that can be reused by review UI, category selection, debug output, and later finance persistence.
- Add a DB-backed category-resolution flow where Groq chooses only from categories that exist for the current user or system scope.
- Keep the review form minimal: merchant name, amount, transaction time, wallet, category, and description.
- Generate a default description from parsed receipt data and selected category while preserving user override.
- Preserve parsed receipts as resumable drafts until explicit confirmation, and support explicit discard/no-save behavior without persisting a confirmed receipt.
- Keep the application logically split into services/modules, but make those services depend on one shared DB contract.

**Non-Goals:**
- Replacing Veryfi with Groq as the OCR provider.
- Treating budgets as wallets.
- Implementing full real-world wallet/bank integrations in this change.
- Implementing jar/pot budgeting in the same migration unless a later change depends on it.
- Removing service boundaries entirely and collapsing all runtime deployment into one executable immediately.
- Applying live production SQL automatically as part of the proposal; that remains an implementation and migration step.

## Decisions

### 1. The shared PostgreSQL schema becomes the source of truth for OCR-to-transaction flow
The system will target the live Neon `neondb` schema directly and align application services to it instead of continuing to maintain conflicting local schema assumptions.

Why this approach:
- The OCR pipeline needs one canonical place to store receipts, parser outputs, wallet choices, category suggestions, and confirmed transactions.
- The existing service-local schema drift is already blocking reliable implementation.
- Shared DB alignment is the smallest viable step toward a monolith-style data contract without requiring full runtime collapse.

Alternatives considered:
- Keep separate service schemas and replicate data between them. Rejected because OCR review and transaction confirmation would continue to cross inconsistent data models.
- Rewrite the whole backend into a single deployed monolith first. Rejected because it expands scope beyond what is necessary to stabilize the OCR flow.

### 2. Wallets must be modeled explicitly and budgets must not stand in for wallets
The shared schema will introduce explicit wallet support. A wallet identifies where money is spent from; a budget identifies an allowed spending limit. These concepts will remain separate.

Why this approach:
- Budgets answer “how much may I spend,” while wallets answer “where does the money come from.”
- The receipt confirmation form needs a source-of-funds field, not a planning artifact.
- Category- and period-based budgets do not support account-level transaction reasoning.

Alternatives considered:
- Reuse `budgets` as a wallet substitute. Rejected because it is semantically wrong and would contaminate both finance logic and UX.
- Drop wallet selection entirely. Rejected because the user’s target form already requires wallet selection and future finance tracking depends on it.

### 3. Receipt parsing data and confirmed finance data will be stored in separate but linked records
The design will introduce or align separate receipt-layer tables for uploaded receipts and parser results, while confirmed transactions remain the durable finance records. Transactions will link back to receipts but will not replace receipt parse history.

Why this approach:
- OCR/parser output is probabilistic and reviewable; transactions are authoritative user-confirmed finance facts.
- The system must preserve parser text, structured JSON, and suggested category/description before the user confirms anything.
- The system must preserve a normalized receipt JSON payload containing merchant name, transaction date/time, total amount, currency, provider category context, and line items before the user confirms anything.
- Receipt-linked transaction history enables traceability without turning transactions into parser debug stores.

Alternatives considered:
- Persist only transactions and discard intermediate OCR/parser state. Rejected because the review workflow requires inspection before save.
- Store all parser data directly on transactions. Rejected because unconfirmed parse state and confirmed finance state have different lifecycles.

### 3a. Parsed receipts remain drafts until the user confirms or discards them
The system will keep parsed receipt sessions as resumable drafts after OCR/AI processing. Promotion into a durable confirmed receipt record happens only at confirmation time, while explicit discard removes the draft without keeping a confirmed receipt.

Why this approach:
- Users may leave the review flow after OCR has already finished, and the system must let them resume instead of forcing a full re-upload.
- Confirmation is the boundary where finance truth is created, so receipt permanence and finance linkage should follow that same boundary.
- Explicit discard is different from timeout-based cleanup: it represents a user choice not to save the receipt.

Alternatives considered:
- Create the durable receipt record immediately after OCR and keep it forever even if the user abandons review. Rejected because it keeps unwanted receipt records the user chose not to save.
- Delete all draft state as soon as the user leaves the page. Rejected because it makes the OCR flow fragile and frustrating for resumable review.

### 4. Groq will perform constrained category selection, not open-ended category invention
Groq will receive normalized receipt data plus the allowed categories from the shared DB and will return a suggested category from that set only. The system will not allow Groq to invent categories outside the DB.

Why this approach:
- Category consistency must remain tied to the user’s finance taxonomy.
- It prevents the model from returning labels that have no corresponding DB record.
- It makes the output explainable and implementable in a deterministic confirmation flow.
- It keeps parser/provider categories as context only; the finance category still comes from DB-backed suggestion and user confirmation.

Alternatives considered:
- Use Veryfi category directly as the final finance category. Rejected because Veryfi categories do not match the app’s DB taxonomy.
- Use only frequency rules over DB categories. Rejected because merchant text alone is not sufficient for new or ambiguous receipts.

### 5. Description generation is a separate helper responsibility and remains user-overridable
The system will generate a default short description from transaction time, category, merchant name, and amount. That generated description is a suggestion only and may be overwritten by the user before confirmation.

Why this approach:
- A generated description reduces manual typing for the user.
- Keeping it separate from OCR parsing and category resolution reduces prompt/logic coupling.
- User override remains important because description style is partly personal preference.

Alternatives considered:
- Persist raw OCR text as description. Rejected because it is noisy and not suitable for transaction lists.
- Require the user to type every description manually. Rejected because it adds friction after OCR has already extracted most of the needed context.

### 6. The primary review form must be reduced to six business fields
The review form will focus on merchant/store name, amount, transaction time, wallet, category, and description. Confidence and detected metadata will remain available only in parser/debug contexts, not in the main confirmation block.

Why this approach:
- The confirmation step should focus on the data needed to save a transaction.
- OCR confidence and metadata clutter the primary UX and do not help most confirmation actions.
- This aligns the UI with mainstream personal-finance app patterns and the intended product direction.

Alternatives considered:
- Preserve the current larger OCR-centric review form. Rejected because it exposes internal parse mechanics instead of the minimum business decision set.

## Risks / Trade-offs

- [Live Neon schema differs from repository assumptions] -> Mitigation: treat the database as the canonical target, document every required schema change explicitly, and update services against the target contract instead of local wishful models.
- [Adding shared DB access across modules weakens strict microservice isolation] -> Mitigation: keep service/module boundaries in code and API responsibilities, but accept shared-schema coupling as an intentional architecture decision.
- [Groq may choose the wrong category among similar category names] -> Mitigation: constrain the candidate set by user scope, pass normalized receipt context, and preserve manual user override before save.
- [Introducing wallets requires data migration and UI changes before full benefit appears] -> Mitigation: keep wallet schema minimal at first and support a default wallet path for existing users.
- [Receipt and transaction tables may duplicate some business fields] -> Mitigation: treat receipt-layer data as pre-confirmation traceability and transaction-layer data as confirmed finance truth.
- [Description generation can sound unnatural in edge cases] -> Mitigation: use simple deterministic templates first, optionally with model assistance, and keep the field user-editable.
- [Users may expect "do not save" to delete drafts immediately] -> Mitigation: distinguish explicit discard from passive timeout cleanup and make discard semantics part of the API/UI contract.

## Migration Plan

1. Inspect the live Neon schema and generate an explicit migration plan against `neondb`.
2. Add or alter shared DB tables for wallets, receipts, parser results, and merchant-aware transactions.
3. Backfill minimal defaults where required, such as default wallets or null-safe merchant fields.
4. Align backend services/modules to the shared schema contract before switching confirmation writes.
5. Introduce the Groq-backed category-resolution service and parser-result persistence path.
6. Update the review form and confirmation API to consume wallet/category/description suggestions from the shared DB-backed flow and to preserve resumable drafts until confirmation.
7. Add explicit discard/no-save behavior so draft receipt sessions can be removed without creating a confirmed receipt.
8. Validate end-to-end receipt upload, parse, review, resume, discard, confirm, and transaction lookup against the shared DB.
9. Roll back by reverting service reads/writes to the previous contract only if schema migration steps were designed to be additive; otherwise require a reverse migration plan before deployment.

## Open Questions

- Should wallet records begin as purely manual user-defined wallets, or should the migration create a single default wallet automatically for each user?
- Should Groq also return a suggested wallet, or should wallet selection remain purely DB-default/manual in this change?
- How much receipt/provider payload should remain visible in the debug panel once the primary form has been reduced?
- Should description generation be fully deterministic from templates in v1, with Groq used only for category selection, or should Groq also participate in wording the default description?
- Should parser/provider category remain visible in debug JSON only, or should it also appear as a read-only comparison field in review?
