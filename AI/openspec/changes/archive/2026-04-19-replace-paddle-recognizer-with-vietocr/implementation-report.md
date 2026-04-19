# VietOCR Integration Report

## Summary

This change refactors `receipt-service` OCR into a detector/recognizer pipeline:

- Paddle remains the text detector.
- Recognition is selectable with `OCR_RECOGNIZER_BACKEND`.
- Supported recognizers:
  - `paddle`
  - `vietocr`
- The existing async upload -> queue -> worker -> extraction -> review flow is unchanged.
- Existing OCR payload keys used by the frontend remain intact, with additive metadata only.

## Changed Files

### Backend OCR pipeline

- `microservices/receipt-service/app/services/ocr_pipeline.py`
  - new detector/recognizer abstractions
  - Paddle detector adapter
  - Paddle recognizer adapter
  - VietOCR recognizer adapter
  - crop extraction from detected polygons
  - row-based stable ordering with configurable tolerance

- `microservices/receipt-service/app/services/ocr_service.py`
  - now acts as the OCR coordinator
  - runs Paddle detection once
  - orders boxes
  - crops regions
  - dispatches recognition to the selected backend
  - preserves OCR result contract and confidence/debug metadata

- `microservices/receipt-service/app/services/parse_pipeline.py`
  - preserves existing workflow
  - stores additive OCR ordering/debug metadata

### API / schema compatibility

- `microservices/receipt-service/app/api/receipts.py`
  - continues serializing existing `ocr_debug`
  - includes additive `ordering` metadata

- `microservices/receipt-service/app/schemas/receipt.py`
  - extends `ReceiptOcrDebugResponse` with optional `ordering`

### Runtime config and packaging

- `microservices/receipt-service/app/core/config.py`
  - adds recognizer backend flags
  - adds row-grouping tolerance
  - adds batch size
  - adds VietOCR config/weights settings

- `microservices/receipt-service/requirements.txt`
  - adds `vietocr`
  - aligns Pillow with VietOCR requirements
  - pins `paddleocr==3.3.3`

- `microservices/receipt-service/Dockerfile`
  - adds `VIETOCR_INSTALL_COMMAND`
  - installs Torch separately so CPU/GPU wheels can be swapped safely
  - defaults Paddle runtime to `paddlepaddle==3.2.0`

- `docker-compose.yml`
  - passes `VIETOCR_INSTALL_COMMAND`

- `docker-compose.gpu.yml`
  - passes `VIETOCR_INSTALL_COMMAND` for CUDA Torch
  - updates Paddle GPU install command to match the detector-only stable combo

- `microservices/receipt-service/.env.example`
  - documents new OCR backend settings

### Tooling / validation

- `microservices/receipt-service/scripts/benchmark_recognizers.py`
  - compares Paddle vs VietOCR recognizers on the same preprocessed images and detector flow
  - emits JSON and Markdown reports

- `microservices/receipt-service/scripts/validate_recognizer_contract.py`
  - validates output contract keys for both backends
  - validates additive runtime/debug metadata
  - exercises extraction in both modes

### Frontend compatibility

- `microservices/frontend/lib/types.ts`
  - adds optional `ordering` debug field

- `microservices/frontend/components/receipt-ocr-text-panel.tsx`
  - remains compatible with existing payload shape
  - shows recognizer backend and ordering/runtime details when present

## New OCR Flow

1. `parse_pipeline` preprocesses the image as before.
2. `OCRService.extract_text(...)` loads the preprocessed image.
3. Paddle detector finds text polygons.
4. Polygons are sorted top-to-bottom and left-to-right using row grouping:
   - row tolerance = `median_box_height * OCR_ROW_GROUPING_TOLERANCE`
5. Ordered polygons are cropped with perspective warp.
6. Crops are recognized by:
   - Paddle recognizer, or
   - VietOCR recognizer
7. Recognized lines are normalized with the existing Vietnamese post-processing step.
8. Existing OCR/extraction payload structure is returned and persisted.

## Confidence Semantics

- Paddle recognizer:
  - uses Paddle recognition score semantics
  - reported as `paddle_rec_score`

- VietOCR recognizer:
  - uses sequence probability returned by VietOCR
  - reported as `vietocr_sequence_probability`
  - this is not identical to Paddle line confidence

Backend-specific caveats are exposed in:

- `runtime.recognizer_backend_caveats`
- `engine_config.recognizer_confidence_semantics`

## Rollback Procedure

Rollback is config-driven.

To revert to the old recognizer path behavior without removing the new pipeline:

1. Set `OCR_RECOGNIZER_BACKEND=paddle`
2. Leave `OCR_FALLBACK_RECOGNIZER_BACKEND=` empty, or set it to `vietocr` only for experiments
3. Restart `receipt-service` and `receipt-worker`

No schema rollback is required for this change because the payload shape remained backward-compatible.

## Implementation Caveat

The original `paddleocr==3.4.0` / `paddlepaddle==3.3.1` combo produced a runtime failure when using detector-only APIs in the container. To make Paddle detection-only execution reliable for this change, the service was moved to:

- `paddleocr==3.3.3`
- `paddlepaddle==3.2.0`

This was necessary to support a true detector/recognizer split inside the current runtime.
