## Context

The existing system already has a working receipt pipeline in `receipt-service`: upload, parse, review, feedback, confirm, and finance transaction creation. The current parse step is backed by a mock OCR placeholder, while the database schema and frontend API contract are already in use and must remain unchanged. This change introduces PaddleOCR as a real OCR engine inside `receipt-service` and keeps that service as the center of receipt business logic rather than pushing OCR orchestration into another tool or service.

## Goals / Non-Goals

**Goals:**
- Replace mock OCR with a real PaddleOCR-based pipeline in `receipt-service`.
- Preserve existing receipt API routes, response shape, and database writes.
- Store OCR output and extracted values in the existing receipt tables with no schema changes.
- Keep OCR initialization efficient by loading the model once per process.
- Add resilient error handling so parse failures update receipt/job state instead of crashing the API.

**Non-Goals:**
- Changing receipt, finance, or auth database schemas.
- Reworking the frontend review flow or changing route contracts.
- Introducing async job infrastructure, message brokers, or external workflow tools.
- Building a highly accurate ML extraction engine beyond MVP-friendly preprocessing plus rule-based field extraction.

## Decisions

### Keep OCR orchestration inside `receipt-service`
The parse route will continue to own file lookup, preprocessing, OCR execution, structured extraction, persistence, and status transitions. This preserves the current service boundaries and avoids duplicating receipt workflow rules elsewhere.

Alternative considered:
- Move OCR into a separate service or workflow tool. Rejected because it adds deployment and coordination complexity without solving an immediate MVP problem.

### Add a singleton PaddleOCR service
`app/services/ocr_service.py` will initialize PaddleOCR once and expose a stable `extract_text(image_path: str)` method. Singleton initialization avoids reloading models on every request and keeps the code ready for future async/background parsing.

Alternative considered:
- Instantiate PaddleOCR inside each parse request. Rejected due to heavy startup cost and poor throughput.

### Introduce a dedicated preprocessing step before OCR
`app/services/image_preprocess.py` will create a processed file using grayscale conversion, contrast enhancement, and light blur. The parse route will operate on the processed image path, leaving the original upload intact.

Alternative considered:
- Run OCR directly on the original upload. Rejected because common phone photos and compressed receipt images benefit from lightweight cleanup with little added complexity.

### Use rule-based extraction over OCR lines and raw text
`app/services/extraction_service.py` will derive merchant name from the first OCR line, transaction date from regex matching, total amount from the largest numeric value, and currency defaulting to `VND`. This keeps extraction transparent, testable, and aligned with the current MVP requirement.

Alternative considered:
- Use a second AI model or prompt-based extraction. Rejected because it adds external dependencies and unpredictability while the project only needs deterministic structured extraction for now.

### Preserve existing persistence contract
The parse route will continue writing to `receipts`, `receipt_jobs`, `receipt_ocr_results`, and `receipt_extractions` exactly as defined by the finalized ERD. `receipt_feedback` and `confirm` behavior remain unchanged except that they will now operate on real OCR-derived values.

Alternative considered:
- Add extra status or OCR metadata columns. Rejected because schema changes are explicitly out of scope.

### Treat OCR and extraction failures as stateful parse failures
The parse endpoint will wrap preprocessing, OCR, and extraction in guarded steps. On error it will update the relevant `receipt_jobs` rows to `failed`, set `receipts.status` to `failed`, capture an error message where supported, and return a controlled API error instead of leaving inconsistent records.

Alternative considered:
- Allow exceptions to bubble through. Rejected because it breaks the current UX and makes operational debugging harder.

## Risks / Trade-offs

- [PaddleOCR increases image size and startup time] → Mitigation: initialize once, document dependencies clearly, and keep the rest of the pipeline synchronous and simple.
- [Rule-based extraction can miss unusual receipt formats] → Mitigation: preserve the existing review and feedback step so users can correct values before confirmation.
- [OCR quality varies on blurry or rotated images] → Mitigation: preprocess images, enable `use_angle_cls=True`, and persist raw OCR text for debugging.
- [Synchronous OCR may slow parse responses] → Mitigation: keep the interface compatible with future async processing and isolate OCR logic behind service modules.
- [Platform-specific Python dependency issues] → Mitigation: pin compatible packages, update Docker/runtime setup, and verify the full local flow before implementation is considered complete.

## Migration Plan

- Add PaddleOCR and image-processing dependencies to `receipt-service`.
- Introduce the OCR, preprocessing, and extraction service modules behind the existing parse route.
- Update parse persistence to write real OCR and extraction results into the current receipt tables.
- Rebuild and run the full system locally.
- Verify upload, parse, review, feedback, confirm, and finance transaction creation end to end.
- If PaddleOCR integration proves unstable, rollback by restoring the previous mock OCR implementation while keeping the database untouched.

## Open Questions

- Which exact `paddlepaddle`/`paddleocr` versions are most reliable for the current Python runtime and target deployment image?
- Should the preprocessing step preserve processed files for debugging, or overwrite temporary artifacts after OCR completes?
- Should low-confidence OCR output trigger automatic `needs_review` handling beyond the current default review flow?
