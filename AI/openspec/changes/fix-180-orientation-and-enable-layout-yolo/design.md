## Context

The receipt OCR service currently preprocesses an image, runs Paddle text detection, orders text boxes into rows, applies text-line orientation per crop, and recognizes text with VietOCR or Paddle. Document-level orientation correction already exists, but it only rotates the full image when upside-down evidence clears a relatively strict consensus threshold before row ordering is reused. This leaves a failure mode where text is recognized correctly yet emitted in reverse top-to-bottom order for 180-degree images.

The same service contains an optional layout branch that can run YOLO layout detection before OCR, but runtime defaults keep it disabled and the existing post-processing logic assumes receipt-friendly aliases or geometric relabeling. A generic DocLayout-YOLO style model can improve receipt structure handling, but its raw labels do not match the six canonical receipt labels the OCR pipeline expects.

## Goals / Non-Goals

**Goals:**
- Make document-level 180-degree rotation more permissive when the majority of line crops are predicted upside down, while keeping the correction decision ahead of OCR row ordering.
- Enable layout-guided OCR configuration for receipt parsing with a clear model path contract.
- Normalize generic YOLO layout labels into the canonical receipt block labels required by `_layout_payload(...)` and downstream extraction.
- Preserve safe fallback behavior when layout output is absent, low-confidence, or semantically weak.

**Non-Goals:**
- Replacing the OCR detector or recognizer stack.
- Removing all heuristic field extraction from `extraction_service.py`.
- Training or shipping DocLayout-YOLO weights as part of this change.
- Redesigning the receipt extraction schema or review workflow.

## Decisions

### Decision: Keep document orientation correction in `OCRService` and adjust its decision rule
Document orientation correction already happens in `_maybe_correct_document_orientation(...)`, which is the correct place because it runs before the primary OCR path chooses between `_whole_image_payload(...)` and `_layout_payload(...)`. The change will keep correction there and make the rule explicitly prefer rotating the full image when a clear majority of line crops are classified as `180_degree`, even if the previous consensus threshold is not reached.

Alternative considered:
- Move the correction into preprocessing. Rejected because the decision depends on detector boxes and line-orientation model output, both of which already live in the OCR service runtime.

### Decision: Enable layout by configuration, not by hardcoded runtime branching
The service will set `ocr_layout_enabled = True` in configuration and define a placeholder `ocr_layout_model_path` for a DocLayout-YOLO compatible weight file. This keeps the feature operationally visible while still allowing deployment environments to provide the real model path through `.env` overrides.

Alternative considered:
- Leave layout disabled by default and require a manual env-only opt-in. Rejected because the requested change is to make layout-guided OCR the intended path for the service.

### Decision: Add explicit generic-YOLO label mapping in `layout_postprocess.py`
The canonical label contract remains `header`, `items`, `totals`, `footer`, `payment_info`, and `metadata`. Instead of teaching `layout_service.py` new model-specific branches, the change will add a focused mapping function in `layout_postprocess.py` that converts generic raw labels such as `Page-header`, `Title`, `Table`, `List-item`, `Text`, and `Page-footer` into canonical receipt labels. For ambiguous generic labels, the mapping will use relative vertical position as a fallback.

Alternative considered:
- Perform raw-class remapping directly in `layout_service.py`. Rejected because post-processing already owns semantic normalization and geometric fallback for layout blocks.

### Decision: Keep post-processing fallback geometry for weak or generic layout output
Even with explicit raw-label mapping, generic document models remain imperfect for receipts. The design keeps geometric fallback and semantic reassignment so the system can recover when raw labels are unknown, sparse, or overly generic. This reduces coupling to any one model family and makes later fine-tuning optional rather than mandatory.

Alternative considered:
- Trust model labels without semantic post-processing. Rejected because it would make receipt parsing brittle whenever the layout model emits generic document classes or semantically incorrect regions.

## Risks / Trade-offs

- [More aggressive 180-degree rotation may over-correct noisy images] → Mitigation: require a majority upside-down signal, keep debug metadata for the decision, and preserve current no-rotation behavior when evidence is weak.
- [Layout enablement without a valid model path can confuse deployments] → Mitigation: keep the existing runtime fallback behavior and document that the checked-in path is a placeholder to be overridden per environment.
- [Generic layout labels may still misclassify receipt totals or payment regions] → Mitigation: combine raw-label mapping with Y-center geometric fallback and preserve semantic reassignment in post-processing.
- [Extraction remains partially heuristic even with layout blocks] → Mitigation: scope this change to stronger zoning inputs, not a full extraction redesign.

## Migration Plan

1. Update configuration defaults for layout enablement and model path placeholder.
2. Adjust document-level orientation logic and validate that full-image rotation still occurs before row ordering in the primary OCR path.
3. Add generic YOLO label mapping plus geometric fallback in layout post-processing.
4. Run receipt OCR debug flows on upside-down and standard receipt images to validate orientation metadata, layout labels, and fallback behavior.
5. Deploy with a valid DocLayout-YOLO compatible `.pt` file supplied through environment-specific configuration.

Rollback strategy:
- Set `OCR_LAYOUT_ENABLED=false` to return to whole-image OCR.
- Restore the previous document orientation thresholding behavior if the new majority rule proves too permissive.

## Open Questions

- Which exact DocLayout-YOLO class names will be present in the production weight file after any receipt-specific fine-tuning?
- Should the placeholder `ocr_layout_model_path` remain non-empty in committed config, or should only deployment manifests supply the path?
- Do we want to expose the orientation-rotation decision reason explicitly in OCR debug payloads for easier regression analysis?
