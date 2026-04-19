## Why

The current receipt layout pipeline can run a real layout detector, but the post-processing layer still produces coarse semantic blocks for many receipts. Large text regions are often mislabeled as `header`, `items` may be missing entirely, and narrow artifact columns can be misclassified as `footer`, which reduces the practical value of layout-aware OCR for extraction and debugging.

Improving receipt-aware post-processing now is the lowest-risk way to make the existing layout model useful without retraining models or changing the OCR engine, worker flow, or API contracts.

## What Changes

- Add a receipt-aware refinement stage after the existing layout normalization, suppression, and merge pipeline.
- Detect oversized coarse text/header blocks and split them into separate `header` and `items` regions using receipt-specific OCR text anchors and fallback geometric rules.
- Synthesize an `items` block when totals are present but the coarse layout output still misses item-list segmentation.
- Demote narrow right-side artifact columns from `footer` to `metadata` when they match receipt-noise geometry rather than real footer structure.
- Preserve `totals` blocks strictly so extraction continues to receive stable summary regions.
- Enrich block debug metadata with refinement provenance such as original label, refined label, split/synthesized flags, and source block linkage.
- Add refinement-stage debug logging so layout transformations are observable during validation and regression testing.

## Capabilities

### New Capabilities
- `receipt-layout-postprocess-refinement`: Receipt-aware semantic refinement of coarse layout detections into stable `header`, `items`, `totals`, `footer`, and `metadata` blocks.

### Modified Capabilities
- `receipt-ocr-debug-panel`: OCR debug payloads must expose refinement provenance for layout blocks so developers can inspect split, synthesized, and demoted regions without changing the existing API contract shape.

## Impact

- Affected backend code is limited to `microservices/receipt-service/app/services/layout_postprocess.py` and small helper utilities used by receipt layout refinement.
- Affected runtime behavior is limited to layout block semantics, ordering, metadata, and logging; model loading, OCR engines, async workers, and API contracts remain unchanged.
- Affected debugging flows include OCR debug payload inspection and layout validation on sample receipts.
