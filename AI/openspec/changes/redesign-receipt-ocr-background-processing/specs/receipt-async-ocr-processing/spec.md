## ADDED Requirements

### Requirement: Receipt submission queues parsing without blocking the request
The system SHALL persist the uploaded receipt file, create a receipt record, enqueue a parse job in `receipt_jobs`, and return the receipt response without waiting for preprocessing, OCR, or extraction to finish.

#### Scenario: Upload creates a queued parse job
- **WHEN** an authenticated user uploads a valid receipt image
- **THEN** the system SHALL store the file, create the `receipts` row, create a `receipt_jobs` queue entry for parsing with status `queued`, and return immediately

#### Scenario: Explicit parse request reuses the asynchronous queue
- **WHEN** an authenticated user requests parsing for an existing receipt
- **THEN** the system SHALL enqueue or reuse an asynchronous parse job and SHALL NOT execute OCR or extraction inline in the HTTP request

### Requirement: Receipt parsing jobs expose explicit pipeline states
The system SHALL represent asynchronous parsing progress using the states `queued`, `preprocessing`, `ocr_running`, `extracting`, `ready_for_review`, and `failed`, and SHALL expose those states through receipt APIs used by the frontend.

#### Scenario: Worker advances the parse state
- **WHEN** a worker claims a queued parse job
- **THEN** the job state SHALL progress through preprocessing, OCR, extraction, and review-ready states in order as each stage completes

#### Scenario: Worker fails during processing
- **WHEN** preprocessing, OCR, or extraction raises an error for a receipt
- **THEN** the job status SHALL become `failed`, the receipt SHALL remain retrievable, and the failure reason SHALL be recorded without crashing the API process

### Requirement: OCR execution is GPU-aware and safe on CPU-only hosts
The system SHALL keep a warm PaddleOCR model in the worker, prefer GPU execution when enabled and available, log whether OCR is running on GPU or CPU, and automatically fall back to CPU if GPU initialization is unavailable or misconfigured.

#### Scenario: GPU is available and enabled
- **WHEN** the worker starts in an environment with supported GPU runtime and GPU OCR enabled
- **THEN** PaddleOCR SHALL initialize once with GPU execution and subsequent jobs SHALL reuse the warm model instance

#### Scenario: GPU is unavailable or misconfigured
- **WHEN** the worker cannot start PaddleOCR with GPU support
- **THEN** the worker SHALL log the fallback reason, continue using CPU OCR automatically, and keep processing queued jobs

### Requirement: OCR and extraction outputs preserve current receipt review data contracts
The system SHALL store OCR debug data in `receipt_ocr_results`, store extracted fields in `receipt_extractions`, preserve `raw_text`, `lines`, confidence data, and `extracted_json`, and leave uncertain or missing extracted fields as `null` instead of inventing defaults.

#### Scenario: OCR and extraction succeed with partial data
- **WHEN** the worker can read only part of a receipt or cannot determine every field confidently
- **THEN** the saved extraction SHALL keep unknown fields as `null` while preserving the available OCR and extraction payloads for review

#### Scenario: Review page loads a completed parse
- **WHEN** a receipt reaches `ready_for_review`
- **THEN** the existing review and confirm flow SHALL continue to load OCR debug data and editable extracted fields from the persisted receipt records

### Requirement: Duplicate parsing is controlled explicitly
The system SHALL avoid re-running OCR for a receipt that already has completed OCR and extraction results unless the caller explicitly requests a re-run.

#### Scenario: Existing OCR result is already available
- **WHEN** a user or frontend requests parsing for a receipt that already has persisted OCR and extraction outputs and does not request a forced re-run
- **THEN** the system SHALL return the current receipt state without enqueuing duplicate OCR work

#### Scenario: Forced re-run is requested
- **WHEN** a caller explicitly requests a re-run for a receipt
- **THEN** the system SHALL enqueue a new parse job, replace or refresh the persisted OCR and extraction outputs for that receipt, and preserve authentication and ownership checks

### Requirement: Frontend review flow reflects asynchronous readiness
The system SHALL allow the frontend to poll receipt status after submission, show queued or processing states until parsing completes, show failures when parsing fails, and keep confirm-to-finance behavior unchanged after review-ready data is available.

#### Scenario: Receipt is still processing
- **WHEN** the frontend requests a receipt whose parse job is in `queued`, `preprocessing`, `ocr_running`, or `extracting`
- **THEN** the API SHALL return the current receipt and job status so the UI can show progress without breaking the page

#### Scenario: Receipt is confirmed after async parsing
- **WHEN** the user confirms a reviewed receipt after asynchronous parsing has completed
- **THEN** the receipt service SHALL forward the bearer token to the finance service and create the final transaction exactly as before
