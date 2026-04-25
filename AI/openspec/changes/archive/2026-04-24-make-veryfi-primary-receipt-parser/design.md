## Context

The current `receipt-service` workflow already solves the operational path around receipt handling: users upload images, parse jobs are queued, a worker processes them asynchronously, users review extracted fields, and a finance transaction is created only after explicit confirmation. That surrounding workflow should remain stable.

The weak part is the primary parsing path inside the worker. Today the system relies on local preprocessing, Paddle/VietOCR OCR, layout heuristics, and heuristic extraction from OCR text. This creates several failure surfaces at once: image preprocessing can distort data, OCR may fragment text, layout detection may miss regions, and heuristic extraction may misinterpret the text that survives. The result is too much variance in review quality and too much effort spent debugging OCR mechanics rather than the final parsed document result.

This change replaces that primary parsing path with Veryfi as the only primary parser provider. The system will stop treating the parse output as traditional OCR-first data and instead treat it as parser-first document intelligence. The review experience must expose three synchronized representations of the parse result: readable parser text, structured JSON, and autofilled review fields that remain user-editable before confirmation.

The change crosses multiple modules: `receipt-service` configuration, worker startup, parse pipeline orchestration, provider integration, persistence mapping, API serialization, and frontend review/debug presentation. It also introduces a new external dependency with operational concerns around credentials, request signing/authentication, latency, retries, and provider failure handling.

## Goals / Non-Goals

**Goals:**
- Replace the current primary receipt parse path with Veryfi as the only primary provider.
- Preserve the current `upload -> queue -> worker -> review -> confirm` lifecycle and data ownership rules.
- Add a parser-oriented abstraction and normalization layer so provider output is mapped into the current persistence contract safely.
- Present parser output in three user-visible forms: full text, structured JSON, and autofilled review fields.
- Keep transaction persistence review-first: no finance transaction is created until the user explicitly submits confirmation.
- Repurpose the current OCR debug concept into parser debug output that honestly reflects provider/runtime/parser metadata.
- Preserve the existing top-level extraction fields and session-finalization compatibility while allowing richer normalized parser metadata in JSON payloads.

**Non-Goals:**
- Adding a fallback OCR provider in the primary path.
- Redesigning the finance confirmation workflow, wallet/category selection, or authenticated receipt ownership checks.
- Guaranteeing OCR-style artifacts such as bounding boxes, layout blocks, or line ordering when the provider does not supply them.
- Reworking the entire frontend review UI beyond the changes required to show parser text, JSON, and autofilled fields.
- Solving provider benchmarking or procurement decisions beyond the scope of integrating Veryfi as the chosen primary provider.

## Decisions

### 1. Veryfi becomes the only primary parser provider
The parse pipeline will call Veryfi as the only primary provider for receipt parsing. Local OCR modules may remain in the codebase temporarily as legacy code, but they are no longer part of the intended primary architecture.

Why this approach:
- It creates one clear source of parsed truth instead of preserving multiple competing parse paths.
- It simplifies reasoning about failures and review quality.
- It aligns the architecture with the business decision that external parser output is preferred over local OCR heuristics.

Alternatives considered:
- Keep local OCR as an automatic fallback. Rejected because it weakens the architectural decision, complicates review semantics, and preserves two sources of truth.
- Keep Veryfi only as an OCR text source while retaining heuristic extraction. Rejected because it wastes the structured parser capability and preserves the brittle heuristic layer.

### 2. The pipeline becomes parser-first instead of OCR-first
`parse_pipeline.py` will be responsible for orchestration only: acquire the document, optionally apply minimal image preparation, call the parser provider, normalize the provider result, persist the result, and transition the job state. It will stop treating OCR payload generation and heuristic extraction as the primary two-step parsing model.

Why this approach:
- It separates provider integration from business normalization.
- It reduces the conceptual mismatch between document AI parsing and OCR line extraction.
- It keeps orchestration stable while replacing the parser internals.

Alternatives considered:
- Add Veryfi support directly inside `ocr_service.py`. Rejected because the module name and current contract are tightly coupled to traditional OCR internals.

### 3. A dedicated normalization layer maps Veryfi output into the internal review contract
Provider output will not be persisted blindly. A normalization layer will map Veryfi fields into top-level extraction columns and `extracted_json`, enforce null-safe uncertain values, validate dates and totals, and compute review hints such as `needs_review_fields`.

Why this approach:
- Provider output remains external and probabilistic, while the system state must remain review-safe.
- The existing review form already depends on normalized business fields, not raw provider payloads.
- It lets the system preserve a stable internal contract even if provider payloads evolve.

Alternatives considered:
- Persist Veryfi JSON as-is and let the frontend interpret it. Rejected because it leaks provider-specific semantics into multiple layers and makes validation inconsistent.

### 4. Debug output becomes parser-centric, not OCR-centric
The current `ocr_debug` concept will be repurposed semantically into `parser_debug`. The system may keep the API field name temporarily for compatibility, but the payload content will be parser/provider diagnostics instead of OCR-mechanics assumptions. Honest `null` values are preferred over fabricated OCR artifacts.

Why this approach:
- Veryfi is not guaranteed to produce OCR-style boxes, layout blocks, or reading-order metadata.
- A parser-centric debug contract is more truthful and more stable across providers.
- The review UI needs to show meaningful data to users and operators, not synthetic placeholders.

Alternatives considered:
- Preserve OCR-centric semantics and fabricate equivalent values. Rejected because it creates misleading diagnostics and technical debt.
- Remove debug output entirely. Rejected because the review workflow still benefits from transparent parser text and structured parse inspection.

### 5. The review UI will expose three synchronized outputs
The frontend review experience will present:
- parser text,
- structured JSON,
- autofilled review form fields.

These views represent the same parse result at different abstraction levels. Users can inspect the text, inspect the structured JSON, edit the form values, and then explicitly confirm before transaction persistence.

Why this approach:
- It gives users traceability from source content to structured inference to final saved values.
- It aligns with the existing review-first workflow rather than replacing it.
- It reduces silent automation and increases user trust for finance-relevant data.

Alternatives considered:
- Show only autofilled fields. Rejected because users lose the ability to inspect the parser output and understand why a value was inferred.
- Show raw provider payload only. Rejected because users need a stable review-friendly JSON and editable form, not only provider diagnostics.

### 6. Existing persistence tables remain but their semantics shift
`receipt_extractions` remains the primary store for normalized review data. `receipt_ocr_results` remains as a compatibility/debug record, but its meaning shifts from “traditional OCR result” toward “parser result/debug metadata”. Session persistence and finalization keep their current structure.

Why this approach:
- It minimizes schema churn while the parser architecture changes.
- It preserves the existing review and confirm flow.
- It allows a cleaner migration path without requiring immediate DB redesign.

Alternatives considered:
- Introduce new parser-specific tables immediately. Rejected because it broadens the migration surface without being necessary for the first rollout.

## Risks / Trade-offs

- [Veryfi latency or outages delay parsing] → Mitigation: keep async worker execution, add bounded retries and timeouts, and fail jobs cleanly with safe error reporting.
- [Provider output does not map neatly to the current extraction contract] → Mitigation: add explicit normalization rules, nullable fallbacks, and review hints instead of forcing lossy coercion.
- [The old OCR debug panel semantics no longer fit the new provider] → Mitigation: redesign the panel around parser text, structured JSON, and parser diagnostics rather than OCR boxes/layout assumptions.
- [Keeping `receipt_ocr_results` while changing its semantics may confuse future maintainers] → Mitigation: document the semantic shift clearly in specs and design, and treat it as a compatibility layer rather than a literal OCR record.
- [No fallback provider means provider failures become parse job failures] → Mitigation: accept this as a conscious architecture trade-off, surface failures clearly, and preserve safe retry behavior.
- [Veryfi field confidence may not align with current confidence expectations] → Mitigation: normalize confidence and review hints at the backend rather than exposing provider confidence as unquestioned truth.

## Migration Plan

1. Add Veryfi parser configuration and provider integration inside `receipt-service`.
2. Introduce parser normalization and parser-debug serialization while preserving existing persistence tables.
3. Refactor the worker parse pipeline to call the Veryfi parser path instead of local OCR plus heuristic extraction.
4. Update API serialization and frontend types so parser text, structured JSON, and autofilled fields are presented coherently.
5. Switch the review/debug panel from OCR-centric presentation to parser-centric presentation.
6. Validate end-to-end review and confirmation behavior with Veryfi-parsed receipts before removing or ignoring legacy OCR internals from the primary path.
7. Roll back by reverting the parser provider integration and re-enabling the old parse path only through a deliberate code/config rollback, not by automatic runtime fallback.

## Open Questions

- Should the external API field name remain `ocr_debug` temporarily for compatibility, even if the internal design now treats it as `parser_debug`?
- Should the UI JSON panel show the normalized internal JSON only, or both normalized JSON and a sanitized provider payload view?
- How much image preprocessing should remain before the Veryfi call: none, minimal normalization only, or a provider-specific preparation subset?
- Which provider metadata fields are safe and useful to expose to end users versus only to operators/developers?
