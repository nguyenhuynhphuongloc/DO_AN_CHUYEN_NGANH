## Context

The receipt pipeline already moved OCR and extraction out of the blocking request path and into a queue-backed worker. That means the next bottleneck is not runtime architecture but extraction quality: the current `extract_all` function still relies on first-line merchant selection, limited date regexes, and largest-number heuristics for totals. This causes avoidable review friction and does not yet produce the richer structured output needed for future suggestion features.

The change must stay incremental. The async queue and worker flow, PaddleOCR integration, ownership checks, and current review-and-confirm workflow are already working and must remain stable. The main design problem is therefore how to improve extraction depth and traceability without changing core storage tables or forcing a UI redesign.

## Goals / Non-Goals

**Goals:**
- Refactor extraction into a staged pipeline with normalization, candidate generation, scoring, validation, and persistence.
- Improve reliability for merchant, date, and total selection while keeping uncertain fields nullable.
- Add practical optional fields and simple line-item support in `extracted_json`.
- Add field-level confidence and compact source-line traceability.
- Preserve the current async parse flow, receipt tables, top-level extraction columns, and review/confirm UX.
- Prepare the output shape for later category and wallet suggestion features.

**Non-Goals:**
- Replacing PaddleOCR or redesigning the queue/worker flow.
- Introducing locale-specific OCR behavior or aggressive text correction.
- Adding a new database table for extraction provenance or a full document-layout engine.
- Redesigning the review page into a new multi-panel editor.

## Decisions

### 1. Introduce a staged extraction module rather than expanding one function
The new extraction logic should be decomposed into explicit stages: normalization, candidate generation, scoring, validation, and shaping final output. This keeps the pipeline testable and makes future tuning less risky than continuing to grow a single heuristic function.

Why this approach:
- Each stage can be reasoned about and tested independently.
- Candidate scoring and validation become explicit instead of hidden inside ad hoc conditionals.
- Optional fields and item extraction can be added incrementally without rewriting the whole pipeline again.

Alternatives considered:
- Keep extending `extract_all` in place. Rejected because the code would become harder to reason about and harder to validate.

### 2. Keep top-level receipt columns stable and move richer output into `extracted_json`
The receipt review flow already depends on `merchant_name`, `transaction_date`, `total_amount`, `tax_amount`, `currency`, `confidence_score`, and `review_status`. Those top-level fields should remain the stable contract, while richer optional data such as items, field confidence, source lines, normalized text, payment method, and support totals should live inside `extracted_json`.

Why this approach:
- It preserves backward compatibility for the current review page and confirmation flow.
- It avoids schema churn while still allowing materially richer extraction output.
- It keeps nullable behavior straightforward for uncertain fields.

Alternatives considered:
- Add many new top-level columns immediately. Rejected because it increases schema coupling before the optional-field model has stabilized.

### 3. Use compact field-trace metadata instead of full provenance graphs
The system should store traceability in a pragmatic shape such as `field_confidence`, `source_lines`, and `needs_review_fields` inside `extracted_json`. This is enough to support later UI hints and debugging without building a heavy provenance subsystem.

Why this approach:
- The future frontend only needs to know which OCR lines likely influenced a field.
- Compact metadata is easier to persist, serialize, and evolve.

Alternatives considered:
- Store full candidate graphs or every scoring feature for every field. Rejected because it is too heavy for the current use case.

### 4. Use normalized text and candidate families for field extraction
Before selecting values, the pipeline should normalize OCR text and build candidate families for merchant, date, totals, payment method, optional labels, and line items. Candidate families allow different selection rules per field while still sharing common OCR cleanup logic.

Why this approach:
- Merchant extraction benefits from header-focused candidate families.
- Amount extraction benefits from labeled totals, supporting totals, and row totals being treated separately.
- Date and payment-method extraction need different patterns and validation than merchant or amount fields.

Alternatives considered:
- Apply one generic line-scoring rule to all fields. Rejected because receipt fields have materially different signal patterns.

### 5. Keep item extraction conservative
The system should only emit `items[]` when rows look plausibly structured. If layout quality is weak, it should prefer no items over misleading items.

Why this approach:
- False-positive items are more damaging than missing items for downstream suggestion features.
- OCR quality varies heavily across receipts and simple row extraction is safer than pretending every receipt is line-item ready.

Alternatives considered:
- Force item extraction on every receipt. Rejected because noisy layouts would create low-value, misleading output.

## Risks / Trade-offs

- [Heuristic complexity grows quickly] → Mitigate by separating stages, using small helper functions, and validating each field family independently.
- [Richer `extracted_json` may drift into an undocumented shape] → Mitigate by defining a stable nested structure in code and specs, then keeping frontend handling null-safe.
- [Optional-field extraction may introduce false positives] → Mitigate by preferring omission or `null` over weak guesses and by using validation rules after scoring.
- [Item extraction may remain brittle on noisy receipts] → Mitigate by gating item output behind conservative row-shape checks and confidence thresholds.
- [Frontend may be tempted to depend on every optional field immediately] → Mitigate by keeping current review UI contract primary and treating optional fields as additive.

## Migration Plan

1. Refactor receipt extraction into stage-based helpers inside receipt-service.
2. Extend the extraction result shape and `extracted_json` payload without changing the async parse orchestration.
3. Update parse persistence so top-level columns remain stable while richer metadata is stored alongside them.
4. Update frontend types and null-safe rendering only where richer extraction output is surfaced.
5. Validate against clear, blurry, long, subtotal/tax/discount, payment-method, and noisy receipts.
6. Roll back by keeping the previous extraction heuristics available behind a narrow internal fallback if needed during patch stabilization.

## Open Questions

- Should the first iteration store field trace metadata by OCR line index, raw line text, or both?
- Should description-like text for future category suggestion be derived from normalized body lines, selected item names, or both?
- Should optional extracted fields be shown immediately in the current review page or remain API-only until a later UI change?
