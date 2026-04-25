## Why

The current receipt parsing path still depends on local OCR plus heuristic extraction, which is hard to stabilize across real-world receipts and makes review quality too sensitive to image quality, layout variance, and OCR fragmentation. We now want to replace that primary parsing path with Veryfi so the system can present trustworthy parser text, structured JSON, and autofilled review fields while preserving the existing async review-first transaction flow.

## What Changes

- Replace the current primary receipt parsing path in `receipt-service` with Veryfi as the only primary parser provider for receipt images.
- Preserve the existing `upload -> queue -> worker -> review -> confirm` workflow so parser replacement does not redesign receipt ownership, background job handling, review semantics, or finance transaction confirmation.
- Introduce a parser-oriented service abstraction and normalization layer that maps Veryfi output into the current persistence contract used by receipt review and transaction confirmation.
- Repurpose OCR debug behavior into parser debug behavior so the system honestly exposes provider/runtime/parser metadata instead of assuming traditional OCR boxes, line ordering, or layout artifacts.
- Require the review experience to show three synchronized outputs after parsing completes:
  - parser text that the user can read,
  - structured JSON with the extracted fields and metadata,
  - autofilled form inputs that the user can edit before submit.
- Keep transaction creation review-first: parsed data may prefill form inputs, but no finance transaction is stored until the user submits confirmation.
- Persist normalized parser output, review hints, parser/provider metadata, and structured fields in a way that remains compatible with the current `receipt_extractions` top-level columns and session-finalization flow.
- Remove local OCR pipeline components from the primary parse path; they may remain in the codebase temporarily as legacy internals but are no longer part of the target primary architecture.

## Capabilities

### New Capabilities
- `veryfi-primary-receipt-parsing`: Parse receipt images through Veryfi as the only primary provider, normalize the provider output, and persist review-safe structured receipt data for the existing async workflow.
- `receipt-parser-review-output`: Expose parser text, structured JSON, and autofilled review fields together so users can inspect extracted content before confirming a transaction.

### Modified Capabilities
- `receipt-ocr-debug-panel`: Change the debug panel contract from OCR-centric output to parser-centric output so the frontend can display honest parser/provider diagnostics and artifacts under the Veryfi-primary architecture.

## Impact

- Affected backend modules in `microservices/receipt-service`: parse pipeline orchestration, service-layer provider integration, configuration, persistence mapping, worker startup/runtime checks, session finalization compatibility, and receipt API serialization.
- Affected frontend modules in `microservices/frontend`: receipt workflow types, parser/debug display, JSON/text presentation, and autofilled review form behavior.
- New external dependency on the Veryfi API, including credentials, request signing/authentication, timeout and retry controls, and provider error handling.
- Existing local OCR modules such as Paddle/VietOCR/layout processing are no longer part of the intended primary path and should be treated as legacy implementation detail until removed or explicitly retained for non-primary use.
- No intended redesign of `finance-service`, authenticated ownership checks, review approval semantics, or the rule that transaction persistence happens only after explicit user confirmation.
