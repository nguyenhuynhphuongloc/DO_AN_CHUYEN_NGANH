## Context

`receipt-service` already loads a document layout model and turns raw detections into canonical layout blocks through normalization, confidence filtering, overlap suppression, merge rules, and anchor-based semantic promotion. That path is sufficient to enable `layout.used=true`, but in practice many receipt images still produce only a few coarse blocks such as one oversized `header/plain text` region, one valid `totals` region, and one false `footer` artifact column.

The change must improve semantic segmentation quality without modifying layout model loading, the OCR engine stack, async worker/session flow, or existing API contracts. The only intended implementation scope is `app/services/layout_postprocess.py` plus small helper utilities, so the design must work as a deterministic refinement layer on top of existing detections and metadata.

## Goals / Non-Goals

**Goals:**
- Refine coarse layout detections into receipt-aware semantic blocks, especially separating `header` from `items`.
- Preserve valid `totals` blocks and keep them stable for downstream extraction.
- Reclassify false right-side `footer` artifacts into `metadata`.
- Emit richer debug provenance showing when blocks were split, synthesized, or demoted.
- Preserve current fallback behavior when refined layout is still unusable.

**Non-Goals:**
- Retraining or replacing the layout model.
- Modifying model loading, runtime dependency selection, or detector backends.
- Changing Paddle detection, VietOCR/Paddle recognition, parse queueing, or API response contracts.
- Introducing a new persistence model for layout blocks.

## Decisions

### Add a dedicated receipt refinement stage after existing post-processing
The refinement logic will run after normalization, suppression, merge, and anchor promotion. This keeps the existing generic layout pipeline intact and limits receipt-specific behavior to a final semantic correction layer.

Alternative considered:
- Replace the existing post-processing heuristics entirely. Rejected because it would raise regression risk for already-working totals handling and broaden the scope beyond the targeted fix.

### Use OCR-line anchors when available, with geometry fallback
The refinement stage will accept optional OCR line data and line vertical positions to find the item-table start using accent-insensitive keyword matching for anchors such as `Tên hàng`, `SL`, `Đơn giá`, and `Thành tiền`. If anchors are missing, the block will fall back to a geometric split using the top quarter as `header` and the remainder as `items` up to the totals region.

Alternative considered:
- Split oversized blocks using geometry only. Rejected because receipts often vary in top matter height, and OCR anchor lines provide a stronger receipt-specific cue when available.

### Treat totals as immutable during refinement
Blocks already labeled `totals` will not be split or merged during refinement. They remain the strongest semantic anchor for receipt extraction and for computing the split boundary of oversized text blocks above them.

Alternative considered:
- Re-evaluate totals during refinement. Rejected because current totals identification is already stable and changing it would risk regression in extraction.

### Synthesize `items` only when refinement still leaves it missing
If a totals block exists and no `items` block survives refinement, the system will synthesize an `items` block from the region between the header bottom and totals top when a large text block or usable receipt body area is present. The synthesized block will be explicitly marked in metadata.

Alternative considered:
- Force fallback immediately when `items` is missing. Rejected because many receipts still contain enough geometry to produce a useful block-aware OCR path after synthesis.

### Keep debug metadata additive and provenance-focused
Each refined block will include `original_label`, `refined_label`, `is_split`, `is_synthesized`, and `split_source_block_id` when applicable. This preserves the current debug payload shape while making transformation decisions inspectable.

Alternative considered:
- Introduce a separate nested refinement object. Rejected because the existing debug panel already consumes block-level metadata, and additive per-block fields are lower risk.

## Risks / Trade-offs

- [False anchor detection from noisy OCR text] → Normalize text accent-insensitively, require table-header style keyword matches, and fall back to geometric splitting when anchors are ambiguous.
- [Over-splitting receipts that genuinely have large headers] → Gate splitting behind oversized-block geometry and totals overlap checks, not on label alone.
- [Synthesized items block may still be imprecise] → Mark synthesized blocks explicitly in debug metadata and keep fallback behavior when usable semantic coverage remains too weak.
- [Receipt-specific heuristics may not generalize to non-receipt documents] → Keep the refinement stage isolated and receipt-aware so it can be bypassed or adjusted without changing the generic detector path.

## Migration Plan

1. Add receipt refinement helpers and integrate them at the end of the current layout post-processing pipeline.
2. Preserve current block serialization fields while adding refinement provenance metadata additively.
3. Validate on known problematic receipts to confirm `header`, `items`, and `totals` are separated and right-side strips are demoted to `metadata`.
4. Roll back by disabling the refinement call in `layout_postprocess.py` if unexpected regressions appear; no schema, API, or worker migration is required.

## Open Questions

- Whether OCR line geometry needed by refinement should come from existing ordered OCR box metadata directly or through a lightweight helper structure passed into post-processing.
- Whether footer synthesis should remain out of scope entirely for now, since the current problem statement only requires preserving totals and fixing false footer artifacts.
