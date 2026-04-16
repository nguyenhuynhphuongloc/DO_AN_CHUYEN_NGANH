## Context

The receipt pipeline already runs asynchronously through a queued parse job and worker. OCR is performed by PaddleOCR, OCR debug output is persisted, and the review-and-confirm workflow is already connected to finance-service. The weak point is now the extraction layer: it still depends too heavily on first-line merchant selection, narrow date parsing, simplistic total heuristics, and weak item support.

This change must stay incremental. It cannot replace PaddleOCR, redesign the queue-backed worker architecture, remove OCR debug persistence, or break ownership/authentication behavior. The design therefore focuses on a layered hybrid extraction engine that improves structured output quality inside the existing receipt-service and keeps the frontend contract additive and null-safe.

## Goals / Non-Goals

**Goals:**
- Introduce a hybrid extraction pipeline with normalization, soft zoning, candidate generation, heuristic scoring, business validation, and final output shaping.
- Improve extraction quality across multiple receipt layouts instead of tuning for a single merchant or template.
- Preserve existing top-level `receipt_extractions` columns and the current async parse and confirm flow.
- Add richer nullable fields, line-item support, field confidence, and practical source-line traceability inside `extracted_json`.
- Keep frontend changes minimal and safe while exposing enough data for later category and wallet suggestion features.
- Add broader validation coverage for clear, restaurant, blurry, long, promo-heavy, missing-merchant, payment-method, and OCR-corrupted receipts.

**Non-Goals:**
- Replacing PaddleOCR or adding a new OCR engine.
- Introducing a new queueing system or changing the worker orchestration model.
- Building a full document-layout parser or merchant-specific template engine as the primary strategy.
- Auto-filling wallet or category choices from weak signals.
- Redesigning the review page into a new extraction-debug interface.

## Decisions

### 1. Use a layered hybrid extraction pipeline
Extraction will be organized into explicit stages:
1. OCR text normalization
2. Soft receipt zoning
3. Field candidate generation
4. Candidate scoring and ranking
5. Business validation
6. Structured output shaping

Why this approach:
- It improves generalization across receipt layouts better than extending one heuristic function.
- Each stage is easier to validate and tune independently.
- It supports optional fields and items without forcing every receipt through the same rigid path.

Alternatives considered:
- Continue expanding the current extraction function. Rejected because the rules become opaque and harder to validate.
- Introduce a full ML-based receipt parser. Rejected because it is too large a change for the current system and deployment posture.

### 2. Use soft zones instead of hard layout assumptions
The pipeline will infer heuristic zones such as header, metadata, item table, payment summary, and footer/promo. These zones will guide scoring but will not be treated as mandatory structure.

Why this approach:
- Many receipts partially follow a common layout, and zone hints improve merchant, metadata, and amount selection.
- Soft zones degrade safely when OCR order is messy or the receipt lacks clear section boundaries.

Alternatives considered:
- Treat every line equally. Rejected because line position and section context are strong signals for merchant and total selection.
- Require a strict table/header/footer segmentation. Rejected because many receipts would fail outright.

### 3. Keep the stable persistence contract and enrich `extracted_json`
Top-level persisted columns remain:
- `merchant_name`
- `transaction_date`
- `total_amount`
- `tax_amount`
- `currency`
- `confidence_score`
- `review_status`

Richer output moves into `extracted_json`, including optional fields, items, field confidence, trace metadata, review hints, and extraction versioning.

Why this approach:
- It preserves current review and confirm behavior.
- It avoids schema churn while allowing broader extraction richness.
- It keeps nullable fallback behavior simple and explicit.

Alternatives considered:
- Add many new top-level DB columns immediately. Rejected because the optional-field shape is still evolving and the current UI does not require hard schema expansion yet.

### 4. Make scoring field-specific and multi-signal
Candidate scoring will combine practical heuristics such as:
- line position
- zone location
- keyword proximity
- exclusion hints
- neighboring lines
- numeric plausibility
- OCR confidence when it is available and useful

Why this approach:
- Merchant, date, total, payment method, and items all have different signal patterns.
- It avoids single first-match behavior and reduces dependence on “largest number anywhere” fallback logic.

Alternatives considered:
- A single generic line scorer for all fields. Rejected because receipt fields need different ranking logic.

### 5. Keep uncertain values null and explicitly reviewable
Business validation runs after scoring. Invalid merchants, weak dates, weak totals, or weak optional fields remain `null` and are surfaced through `needs_review_fields` instead of being force-filled.

Why this approach:
- Review safety is more important than overfitting a guess.
- Downstream suggestion features benefit from structured uncertainty instead of fabricated values.

Alternatives considered:
- Always emit a best guess. Rejected because it makes the review flow less trustworthy.

### 6. Keep item extraction conservative
Items will only be emitted when row-like evidence is strong enough. Item extraction will prefer omission over noisy false positives and will use the detected summary section as a stop condition.

Why this approach:
- Line-item errors are especially harmful to future downstream use.
- Receipts vary too much to justify forced item parsing on every document.

Alternatives considered:
- Parse items for every receipt. Rejected because footer, metadata, and promo lines would often become false items.

## Risks / Trade-offs

- [Heuristic growth can become hard to maintain] → Mitigate by separating pipeline stages and keeping candidate helpers narrow and testable.
- [Soft zoning may still misclassify lines on unusual receipts] → Mitigate by using zones as scoring hints only, not as hard gates.
- [Optional field extraction may create false positives] → Mitigate by applying post-selection validation and leaving weak values null.
- [Richer `extracted_json` could drift without documentation] → Mitigate by locking the nested output shape in spec and validation notes.
- [Frontend consumers may start depending on weak optional fields] → Mitigate by keeping current top-level review contract primary and optional fields explicitly null-safe.

## Migration Plan

1. Refactor receipt extraction into staged helpers within receipt-service.
2. Introduce soft zoning, candidate families, and richer structured output in `extracted_json`.
3. Preserve current top-level extraction persistence and merge reviewed values back into the structured payload safely.
4. Update frontend types and review-page data access only where richer data must be surfaced or preserved.
5. Run validation across the required hybrid extraction receipt scenarios and record pass/fail results.
6. Roll back by reverting the extraction module and output-shaping changes while leaving the async OCR worker flow untouched.

## Open Questions

- Should `source_lines` store only line indices, or both indices and OCR text excerpts by default?
- Should `extraction_notes` be limited to validation warnings, or also include zone-detection observations?
- Should missing-merchant receipts expose a separate explicit review hint beyond `needs_review_fields`, or is the current review-safe hint list sufficient?
