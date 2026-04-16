## Context

The current `receipt-service` architecture already solves the operational parts of receipt handling well. Upload requests create `receipts` rows, parsing is delegated to `receipt_jobs`, a background worker runs the pipeline asynchronously, users review and edit extracted fields, and confirmation creates the final transaction through `finance-service`. Those parts are stable and must remain intact.

The weak point is the parsing engine inside the worker. Today that engine is split between local image preprocessing, PaddleOCR line recognition, and heuristic extraction over flattened text. The current approach loses layout understanding early, depends on keyword and line-order heuristics, and degrades on blurry, multilingual, long, or structurally unusual receipts. The redesign therefore focuses on replacing that primary parsing path with Gemini Vision while preserving the surrounding queue, persistence, ownership, and review workflow.

This change crosses multiple modules: `receipt-service` configuration, worker pipeline, parsing service layer, persistence payload shape, API serialization, and frontend receipt-review type handling. It also introduces a new external dependency on an AI vision API and corresponding operational concerns such as retries, timeouts, provider failures, and safe debug metadata.

## Goals / Non-Goals

**Goals:**
- Replace PaddleOCR plus heuristic extraction as the primary receipt parser with Gemini Vision parsing that reads the receipt image directly.
- Preserve the current `upload -> queue -> worker -> review -> feedback -> confirm` lifecycle and table structure.
- Add a provider abstraction so the parser can be switched by configuration without rewriting the worker pipeline.
- Require the AI parser to return a stable structured JSON contract with nullable uncertain fields.
- Add backend validation and normalization between provider output and persistence.
- Preserve the current top-level `receipt_extractions` columns while storing richer parser output and parser metadata inside `extracted_json`.
- Keep review-first behavior and confirm-to-finance behavior unchanged from a user-flow perspective.
- Surface safe parser/provider debug data to the existing review page.

**Non-Goals:**
- Redesigning `finance-service`, `auth-service`, or authenticated ownership behavior.
- Redesigning the review page UX beyond additive type/data updates.
- Adding wallet suggestion, category suggestion, or any auto-confirm flow.
- Introducing model fine-tuning, training pipelines, or a provider-specific orchestration framework.
- Guaranteeing full OCR-style line output when the selected AI parser does not provide traditional OCR tokens.

## Decisions

### 1. Replace the parser behind the existing worker pipeline, not the receipt workflow
The worker pipeline will keep the same orchestration boundaries: it loads the receipt image from disk, parses it asynchronously, persists results, and moves the job toward `ready_for_review` or `failed`. The only architectural replacement is the parser implementation inside that pipeline.

Why this approach:
- It preserves the parts of the system that already work well operationally.
- It keeps the change incremental and production-minded.
- It avoids cascading changes into frontend flow, finance confirmation, and receipt ownership logic.

Alternatives considered:
- A synchronous request-time parser. Rejected because it would regress latency and remove the existing queue/worker benefits.
- A full receipt-service redesign. Rejected because the problem is accuracy in the parsing engine, not the workflow shell around it.

### 2. Introduce an explicit AI parser provider abstraction with Gemini as the default implementation
`receipt-service` should gain a dedicated parser service interface, for example `ReceiptParserProvider`, with `GeminiVisionReceiptParser` as the initial and default implementation. The parse pipeline will depend on the provider interface, not directly on a vendor SDK.

Why this approach:
- Gemini can be the production-default provider without coupling orchestration directly to one SDK.
- Swapping providers or models will not require parse-pipeline rewrites.
- Request formatting, authentication, retries, and vendor-specific response handling stay isolated.

Alternatives considered:
- Calling a single provider directly from `parse_pipeline.py`. Rejected because it couples orchestration and provider logic and makes future provider swaps harder.

### 3. Make Gemini return a strict structured JSON contract
The Gemini request should instruct the model to return only a stable JSON object containing the defined receipt schema: core fields, optional fields, items, review metadata, and parser metadata. The backend will treat malformed JSON or wrong field types as parser failure or normalization failure, not as partially trusted output.

Why this approach:
- The review page and persistence need a predictable schema.
- Strict JSON reduces post-processing ambiguity.
- Nullable fields are easier to preserve when the provider is explicitly told not to guess.

Alternatives considered:
- Parsing free-form text from the model. Rejected because it would recreate the same brittleness as the current OCR-plus-heuristics flow in a different form.

### 4. Keep a backend normalization and validation layer after provider output
Even with AI parsing, the backend will not persist provider output blindly. A normalization layer will coerce types, parse dates, trim strings, reject numeric-only merchant names, ensure positive totals, keep weak optional amounts nullable, and compute review hints where needed.

Why this approach:
- Provider responses are probabilistic and need enforcement before they become system state.
- Validation preserves review safety and prevents invalid structured data from reaching confirmation.
- The current top-level extraction contract already expects normalized values.

Alternatives considered:
- Trust provider output as final. Rejected because malformed or weak values would leak directly into persisted extraction and the review form.

### 5. Preserve top-level extraction columns and extend `extracted_json`
The existing columns `merchant_name`, `transaction_date`, `total_amount`, `tax_amount`, `currency`, `confidence_score`, and `review_status` remain the stable top-level contract. All richer output goes into `extracted_json`, including optional fields, items, field-level confidence, `needs_review_fields`, `parser_notes`, `parser_provider`, `parser_model`, `extraction_version`, normalized parser output, and safe provider debug summary.

Why this approach:
- Current API and frontend flows already rely on those top-level columns.
- It keeps the migration incremental and avoids schema churn outside the parsing layer.
- It gives the new parser room to return richer data without forcing immediate DB shape expansion.

Alternatives considered:
- Adding many new database columns immediately. Rejected because most new fields are optional and better treated as additive structured payload first.

### 6. Repurpose `receipt_ocr_results` into parser debug metadata compatibility, not faux OCR
The system should stop pretending the new parser is traditional OCR. `receipt_ocr_results` can remain for compatibility, but its usage must change to represent Gemini parser metadata safely. If Gemini does not emit OCR lines, the service should store null or minimal debug-safe fields rather than fabricated line output.

Why this approach:
- Existing API/frontend wiring already references OCR/debug records.
- Keeping the table avoids unnecessary migration complexity in this change.
- Honest metadata is preferable to synthetic OCR artifacts that could mislead debugging.

Alternatives considered:
- Dropping `receipt_ocr_results` immediately. Rejected because it would create broader API/UI changes than needed for this parser replacement.

### 7. Preserve review-first semantics by keeping uncertain fields nullable
The provider prompt, normalization layer, and persistence contract will all treat uncertain fields conservatively. Missing or weak values remain `null`, and `needs_review_fields` explicitly flags important fields such as merchant name, transaction date, total amount, currency, or payment method when confidence or validation is insufficient.

Why this approach:
- Review-first behavior is already a core strength of the system.
- Null-safe uncertainty is safer than fabricated data for financial workflows.

Alternatives considered:
- Aggressively filling likely values. Rejected because the system must not hallucinate finance-relevant fields.

### 8. Introduce Gemini/runtime configuration explicitly in `receipt-service`
Configuration should cover parser provider, Gemini API keys, model name, timeout, retry count, optional input size constraints, and debug mode. Provider configuration belongs in `receipt-service` settings rather than in ad hoc environment reads inside provider classes.

Why this approach:
- Operational configuration becomes explicit and testable.
- Runtime failure handling can be standardized across providers.

Alternatives considered:
- Hard-coding one provider and one model. Rejected because the request explicitly requires provider abstraction and future swap flexibility.

## Risks / Trade-offs

- [Gemini latency or outages can delay parsing] → Mitigation: keep async worker architecture, add request timeout and bounded retries, and fail jobs cleanly with preserved error context.
- [Provider may return malformed or schema-incompatible JSON] → Mitigation: add strict response parsing and normalization; malformed output becomes a controlled parse failure.
- [Vision model confidence is not directly comparable across providers] → Mitigation: treat provider confidence as advisory metadata and drive review hints from normalized field validity plus provider-provided confidence when available.
- [Keeping `receipt_ocr_results` for compatibility can blur semantics] → Mitigation: rename serialized meanings in API/debug payloads where necessary and store parser metadata honestly instead of fake OCR line data.
- [Long receipts or large images may exceed provider limits or cost budgets] → Mitigation: add configurable image constraints and safe request failure handling.
- [Gemini output may vary across models or prompt revisions] → Mitigation: keep parser access behind one interface and one normalized schema so model swaps do not force storage-contract changes.

## Migration Plan

1. Add parser provider configuration and Gemini parser service abstractions in `receipt-service`.
2. Implement the Gemini-backed parser client and a normalization/validation layer for structured receipt output.
3. Refactor the worker parse pipeline to call the new parser service instead of PaddleOCR plus `extract_all`, removing PaddleOCR from the primary path.
4. Update persistence so `receipt_extractions` keeps current top-level fields while `extracted_json` stores the richer parser payload and metadata.
5. Update `receipt_ocr_results` serialization/usage for parser debug compatibility.
6. Update API schemas and frontend receipt types only where the parser/debug payload shape changes.
7. Validate the new pipeline against the listed receipt scenarios and explicit failure cases.
8. Roll back by switching Gemini model or parser configuration within the new parser layer if the deployment needs temporary retreat during stabilization, without restoring PaddleOCR to the primary path.

## Open Questions

- Which Gemini model should be the default first implementation for production receipts?
- Should Gemini raw-response storage be limited to normalized summaries only, or is a sanitized partial payload acceptable in debug mode?
- If Gemini returns item-level confidence unevenly, should the system keep provider confidence as-is or normalize it into a backend-defined 0-1 convention?
- Should the service keep any non-primary compatibility path for debugging only, while ensuring PaddleOCR is never reintroduced into the primary parse pipeline?
