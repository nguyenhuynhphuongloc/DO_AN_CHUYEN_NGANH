## Why

The current `receipt-service` OCR stack already has several important pieces in place:

- async upload -> queue -> worker execution
- session-first parse persistence
- fast/recovery preprocessing
- Paddle text detection
- VietOCR as the default recognizer
- OCR debug payloads and a unified review workspace

That stack is workable, but extraction still depends on a flat ordered line list. For receipts with visually distinct sections, this means extraction has to infer header, item rows, totals, and footer zones indirectly from text order alone. This increases ambiguity for merchant, date, tax, subtotal, total, and line-item extraction, especially when the receipt layout is noisy or long.

The next incremental improvement is to add a layout-recognition layer before text OCR so the pipeline becomes block-aware without replacing the existing OCR engine or worker architecture.

## What Changes

- Add an optional layout-recognition stage after preprocessing and before OCR.
- Use a YOLO-based layout detector through Ultralytics to segment receipts into ordered semantic blocks such as `header`, `items`, `totals`, `footer`, and optional payment/info regions.
- Run the current Paddle detection + recognizer pipeline inside each layout block rather than only on the whole image.
- Keep VietOCR as the default recognizer and preserve Paddle recognizer as a rollback-safe optional mode through config.
- Make extraction block-aware so merchant/date prefer header blocks, items prefer item blocks, and summary amounts prefer totals blocks.
- Preserve existing async parse jobs, session-first review/confirm flow, and API contracts with additive debug metadata only.
- Add benchmark and validation tooling to compare no-layout OCR versus layout-aware OCR on the same receipt images.
- Document the old OCR path, new layout-aware path, fallback behavior, file/class responsibilities, config flags, and rollback steps.

## Capabilities

### New Capabilities
- `receipt-layout-aware-ocr`: Optional YOLO-based receipt layout segmentation that feeds the existing OCR stack block by block while preserving rollback safety.

### Modified Capabilities
- `receipt-ocr-debug-panel`: OCR debug payloads and the frontend debug panel must expose layout blocks, block-level OCR text, layout-aware field provenance, and fallback-path evidence additively.

## Impact

- Affected backend modules in `microservices/receipt-service`:
  - OCR orchestration
  - parse pipeline
  - extraction
  - config
  - Docker/runtime dependencies
  - benchmark and validation tooling
- Affected frontend debug/types modules only additively so the review workspace can render layout block metadata without a workflow rewrite.
- Additional architecture documentation will be added for maintainers and rollback operators.
