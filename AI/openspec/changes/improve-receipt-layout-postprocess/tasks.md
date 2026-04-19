## 1. Receipt refinement helpers

- [x] 1.1 Add receipt-aware helper functions in `app/services/layout_postprocess.py` or a small adjacent helper module for accent-insensitive keyword detection, oversized-block checks, right-strip artifact checks, and semantic priority ordering.
- [x] 1.2 Define a refinement data flow that can evaluate coarse blocks against image geometry, totals position, and optional OCR line anchors without changing layout model loading or OCR engine contracts.

## 2. Semantic block refinement

- [x] 2.1 Implement `refine_receipt_layout(...)` after the existing normalization/prune/merge pipeline and wire it into the final layout post-processing path.
- [x] 2.2 Split oversized coarse text/header blocks into `header` and `items` using OCR table-header anchors when available, with a geometric fallback when anchors are missing.
- [x] 2.3 Synthesize an `items` block when totals are present, no usable `items` block exists, and the body region between header and totals is valid.
- [x] 2.4 Demote narrow right-side false footer artifacts to `metadata` and preserve `totals` blocks from split/merge changes.
- [x] 2.5 Reorder final refined blocks into receipt semantic priority: `header`, `items`, `totals`, optional `footer`, then `metadata`.

## 3. Debug metadata and observability

- [x] 3.1 Extend block metadata additively with `original_label`, `refined_label`, `is_split`, `is_synthesized`, and `split_source_block_id` where applicable.
- [x] 3.2 Add debug-level logging for block counts before/after refinement, split events, synthesized items creation, and footer-to-metadata demotions.

## 4. Validation and fallback safety

- [x] 4.1 Validate on known problematic receipts that `header`, `items`, and `totals` are separated, totals remain stable, and right-side artifact strips become `metadata`.
- [x] 4.2 Verify fallback behavior still triggers when refinement leaves fewer than two usable non-metadata blocks or all blocks become metadata.
- [x] 4.3 Capture example OCR debug output showing separated `header` / `items` / `totals` blocks with refinement provenance fields.
