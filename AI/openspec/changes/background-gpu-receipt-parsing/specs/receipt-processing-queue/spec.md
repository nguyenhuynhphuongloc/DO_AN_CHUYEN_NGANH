## ADDED Requirements

### Requirement: Parse requests SHALL queue background receipt processing
The receipt-service SHALL move preprocessing, OCR, and extraction out of the blocking parse HTTP request path and SHALL queue receipt parsing for background execution.

#### Scenario: Queue parse request
- **WHEN** the frontend triggers parsing for an uploaded receipt
- **THEN** the parse-trigger endpoint MUST return promptly after creating or reusing a queued parse job
- **THEN** the endpoint MUST NOT block on preprocessing, OCR, or extraction completion

#### Scenario: Avoid duplicate background execution
- **WHEN** a receipt already has a queued or active parse job, or already has completed parse outputs and no explicit reprocess request is supplied
- **THEN** the system MUST avoid starting duplicate OCR execution for that receipt

### Requirement: Background worker SHALL process queued receipt jobs
The system SHALL provide a worker process that pulls queued receipt jobs and performs preprocessing, OCR, extraction, persistence, and status updates outside the API request lifecycle.

#### Scenario: Worker processes a queued receipt
- **WHEN** a queued parse job is available
- **THEN** the worker MUST claim the job and execute preprocessing, OCR, extraction, OCR result persistence, extraction persistence, and receipt/job status updates
- **THEN** the worker MUST update states in order that reflects progress through the pipeline

#### Scenario: Worker keeps OCR model warm
- **WHEN** the worker processes multiple queued receipts in one process lifetime
- **THEN** it MUST reuse a long-lived OCR service instance rather than reloading the PaddleOCR model for every job

### Requirement: Job and receipt states SHALL expose parsing progress
The system SHALL expose queue and processing progress using receipt job and receipt status values that the frontend can poll safely.

#### Scenario: Transition through parsing states
- **WHEN** a receipt moves from queue entry to completed parse
- **THEN** job state MUST support `queued`, `preprocessing`, `ocr_running`, `extracting`, `ready_for_review`, and `failed`
- **THEN** receipt-level status MUST remain consistent enough for the frontend review flow to determine whether parsing is pending, ready, or failed

#### Scenario: Failed background parse
- **WHEN** preprocessing, OCR, or extraction fails
- **THEN** the worker MUST mark the job as `failed`
- **THEN** the system MUST preserve the error message for debugging and allow the user to see the failed state

### Requirement: OCR runtime SHALL prefer GPU when configured and available
The receipt-service worker SHALL initialize PaddleOCR with GPU acceleration when configured and available on the local machine and SHALL fall back safely to CPU otherwise.

#### Scenario: GPU available
- **WHEN** the worker starts on a machine with supported GPU runtime and GPU usage enabled by configuration
- **THEN** PaddleOCR MUST run on GPU for OCR inference
- **THEN** the worker MUST log that GPU execution is active

#### Scenario: GPU unavailable or misconfigured
- **WHEN** GPU usage is requested but the runtime cannot initialize PaddleOCR on GPU
- **THEN** the worker MUST fall back to CPU safely without crashing the overall service
- **THEN** the worker MUST log that CPU fallback was selected

### Requirement: Vietnamese-first OCR and nullable extraction SHALL be preserved
The background parsing redesign SHALL preserve Vietnamese-first PaddleOCR behavior, OCR debug metadata, confidence data, and nullable extraction semantics.

#### Scenario: Preserve OCR debug output
- **WHEN** a background parse completes
- **THEN** the system MUST still persist raw OCR text, line-level output, confidence data, and debugging metadata
- **THEN** the review flow MUST remain able to display this debugging information

#### Scenario: Preserve nullable missing fields
- **WHEN** OCR or extraction cannot determine one or more receipt fields reliably
- **THEN** missing extracted fields MUST remain null or omitted rather than being replaced with unsafe defaults

### Requirement: Frontend SHALL show background parsing progress and preserve review flow
The frontend SHALL poll parsing progress and SHALL keep the existing review and confirm workflow once parsing is complete.

#### Scenario: Receipt still processing
- **WHEN** the user navigates to a receipt review page while the parse job is queued or running
- **THEN** the frontend MUST show parsing progress based on receipt/job state
- **THEN** the frontend MUST continue polling until the receipt is ready for review or failed

#### Scenario: Receipt ready for review
- **WHEN** the background worker completes OCR and extraction successfully
- **THEN** the frontend MUST stop polling and present the existing review page behavior with extracted fields available for editing and confirmation

#### Scenario: Receipt parse failed
- **WHEN** the job reaches a failed state
- **THEN** the frontend MUST surface the failure state instead of waiting indefinitely
- **THEN** the review and confirm flow MUST not proceed as though parsing succeeded
