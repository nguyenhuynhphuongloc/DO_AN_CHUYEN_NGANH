## ADDED Requirements

### Requirement: Receipt OCR SHALL separate text detection from text recognition
The `receipt-service` SHALL execute receipt OCR through explicit detector and recognizer components so Paddle-based text detection can remain in place while recognition backends can be switched independently.

#### Scenario: Worker processes a receipt image
- **WHEN** the async worker runs OCR for a queued receipt parse job
- **THEN** the OCR pipeline SHALL invoke a detector stage that returns ordered text boxes before invoking a recognizer stage over cropped text regions

#### Scenario: Recognizer backend changes
- **WHEN** configuration switches the recognizer backend from `paddle` to `vietocr` or back again
- **THEN** the worker SHALL preserve the same upload, queue, parse, extraction, and review flow without changing downstream API contracts

### Requirement: Paddle SHALL remain the text detector for receipt OCR
The `receipt-service` SHALL continue using Paddle-based text detection for box discovery, box coordinates, and line ordering in the receipt OCR pipeline.

#### Scenario: Text regions are detected
- **WHEN** the OCR pipeline runs on a receipt image
- **THEN** Paddle detection SHALL produce text boxes that are sorted top-to-bottom and left-to-right before recognition

#### Scenario: Ordered lines are emitted
- **WHEN** recognition completes for detected text crops
- **THEN** the final `lines` output SHALL follow the detector-derived stable order rather than recognizer completion order

#### Scenario: Row grouping tolerance is configured
- **WHEN** receipt OCR sorts detected text boxes into ordered lines
- **THEN** the detector ordering logic SHALL apply a configurable row-grouping tolerance before left-to-right ordering and SHALL preserve stable ordering for receipt-style layouts

### Requirement: VietOCR SHALL be supported as a primary receipt recognizer backend
The `receipt-service` SHALL support VietOCR as a configurable recognition backend for text crops while preserving Paddle recognition as a temporary fallback or rollback-safe option.

#### Scenario: VietOCR backend selected
- **WHEN** `OCR_RECOGNIZER_BACKEND=vietocr`
- **THEN** the OCR pipeline SHALL recognize detected text crops with VietOCR and return the recognized text through the existing OCR result contract

#### Scenario: Paddle backend selected
- **WHEN** `OCR_RECOGNIZER_BACKEND=paddle`
- **THEN** the OCR pipeline SHALL recognize detected text crops with the Paddle recognizer adapter and return the recognized text through the same OCR result contract

### Requirement: OCR output compatibility SHALL be preserved for extraction and review
The receipt OCR pipeline SHALL continue emitting additive-compatible OCR results so downstream extraction and the review UI remain functional without a workflow rewrite.

#### Scenario: OCR result is stored after recognition
- **WHEN** a receipt parse completes successfully
- **THEN** the stored OCR result SHALL still include ordered `lines`, joined `raw_text`, confidence/debug metadata, and existing review-safe response structure

#### Scenario: Review UI reads OCR data
- **WHEN** the frontend requests receipt or session detail after OCR completes
- **THEN** the API SHALL continue exposing OCR debug data in a backward-compatible shape so extraction and OCR text panels do not break

#### Scenario: Confidence semantics remain review-safe
- **WHEN** the selected recognizer backend reports confidence differently from another backend
- **THEN** the OCR result SHALL preserve or normalize confidence into the existing contract and SHALL document backend-specific caveats in additive debug metadata instead of silently changing existing semantics

### Requirement: Recognizer execution SHALL support GPU with honest CPU fallback
The recognizer layer SHALL use GPU execution when CUDA is available and enabled, and SHALL otherwise fall back to CPU while reporting the actual runtime device used.

#### Scenario: CUDA is available
- **WHEN** the worker environment exposes a CUDA-capable runtime and recognizer GPU usage is enabled
- **THEN** the recognizer SHALL execute on GPU and record `gpu` as the actual OCR device in runtime/debug metadata

#### Scenario: CUDA is unavailable
- **WHEN** the worker environment does not expose CUDA or recognizer GPU initialization fails
- **THEN** the recognizer SHALL fall back to CPU without failing the parse job and SHALL record `cpu` as the actual OCR device in runtime/debug metadata

### Requirement: Crop recognition SHALL be batch-capable and benchmarkable
The recognizer layer SHALL support recognizing multiple ordered crops in batches where practical, and the project SHALL provide a benchmark path to compare Paddle recognition and VietOCR recognition on Vietnamese receipts.

#### Scenario: Batch recognition is enabled
- **WHEN** the OCR pipeline has multiple text crops ready for recognition
- **THEN** the recognizer adapter SHALL be able to process them in batches while preserving the original crop order in the final output

#### Scenario: Benchmark comparison is run
- **WHEN** a developer runs the OCR benchmark or evaluation script against a set of Vietnamese receipt images
- **THEN** the script SHALL produce timing and recognizer-comparison output for both Paddle recognition and VietOCR recognition without changing the normal worker flow

#### Scenario: Benchmark artifacts are generated
- **WHEN** the recognizer benchmark finishes on a receipt image set
- **THEN** it SHALL output machine-readable JSON results and a markdown summary comparing Paddle vs VietOCR on the same images

### Requirement: The recognizer migration SHALL be documented for maintenance and rollback
The project SHALL include a markdown report describing the recognizer migration, changed files, class responsibilities, flow changes, and rollback path.

#### Scenario: Developer reviews the migration
- **WHEN** a developer opens the generated OCR recognizer migration report
- **THEN** the report SHALL identify the changed files, detector/recognizer abstractions, runtime configuration changes, benchmark path, and rollback-safe backend switch

### Requirement: Both recognizer modes SHALL be validated end to end
The project SHALL validate the async receipt parse flow with both `OCR_RECOGNIZER_BACKEND=vietocr` and `OCR_RECOGNIZER_BACKEND=paddle` so the migration remains rollback-safe.

#### Scenario: VietOCR mode is validated
- **WHEN** the worker runs the parse flow with `OCR_RECOGNIZER_BACKEND=vietocr`
- **THEN** upload, queued parse, OCR result persistence, extraction, and review retrieval SHALL complete without breaking the existing flow

#### Scenario: Paddle mode is validated
- **WHEN** the worker runs the parse flow with `OCR_RECOGNIZER_BACKEND=paddle`
- **THEN** upload, queued parse, OCR result persistence, extraction, and review retrieval SHALL still complete without breaking the existing flow
