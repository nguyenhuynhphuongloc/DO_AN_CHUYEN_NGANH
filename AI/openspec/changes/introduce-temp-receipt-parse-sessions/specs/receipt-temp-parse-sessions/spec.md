## ADDED Requirements

### Requirement: Receipt uploads SHALL create temporary parse sessions before confirmation
When session-first mode is enabled, the receipt upload flow SHALL create a temporary parse session and SHALL NOT create an official confirmed receipt record until the user confirms the extracted fields.

#### Scenario: Upload creates temp parse session
- **WHEN** an authenticated user uploads a receipt image through `POST /receipts/upload` while session-first mode is enabled
- **THEN** the system SHALL create a temp parse session with the uploaded image in temporary storage and SHALL return session-first review data without creating a confirmed `Receipt` row

#### Scenario: Legacy behavior remains available during compatibility phase
- **WHEN** session-first mode is disabled during rollout
- **THEN** `POST /receipts/upload` SHALL preserve the existing receipt-first behavior until the flag is enabled

### Requirement: Temp parse sessions SHALL support asynchronous parsing and review
The system SHALL support background parsing, status polling, OCR/debug output, extracted fields, and reviewer edits against a temp parse session before confirmation.

#### Scenario: Session parse job is queued and polled
- **WHEN** a temp parse session is created or reparsed
- **THEN** the system SHALL enqueue a temp parse job and SHALL expose session status, active job state, and current OCR/extraction payload through session endpoints

#### Scenario: Reviewer saves feedback before confirm
- **WHEN** a user updates extracted fields or reviewer notes for a temp parse session
- **THEN** the system SHALL persist those edits on the temp session without creating or mutating an official confirmed receipt

### Requirement: Temp parse sessions SHALL use fast-path-first OCR with recovery fallback
The temp parse pipeline SHALL run a fast OCR path first and SHALL run at most one recovery OCR path only when the fast result fails the configured quality gate.

#### Scenario: Fast path succeeds
- **WHEN** a clear receipt produces acceptable OCR quality and critical extraction fields on the fast path
- **THEN** the system SHALL accept the fast result and SHALL NOT run the recovery path

#### Scenario: Recovery path is required
- **WHEN** the fast path produces low OCR confidence, corrupted text, insufficient output, or missing critical extraction fields
- **THEN** the system SHALL run one recovery parse attempt with the heavier preprocessing profile before marking the session ready for review or failed

### Requirement: Temp parse sessions SHALL capture timing and debug metadata
The system SHALL record parse timings and path-selection metadata for each temp parse session so OCR latency and quality decisions can be inspected during review or troubleshooting.

#### Scenario: Parse completes with timing data
- **WHEN** a session parse attempt completes
- **THEN** the session SHALL store queue delay, preprocessing time, OCR time by profile, extraction time, total parse time, selected path, and preprocess/OCR debug metadata

#### Scenario: Session debug payload is requested during review
- **WHEN** the frontend loads a parsed temp session
- **THEN** the response SHALL include session-safe OCR raw text, line output, profile/debug metadata, and timing summaries needed by the unified review workspace

### Requirement: Confirmation SHALL create official receipt persistence from a finalized temp session
The system SHALL create the official confirmed receipt and finance transaction only when a temp session is confirmed.

#### Scenario: Confirm finalized temp session
- **WHEN** a user confirms a parsed temp session with edited or accepted fields
- **THEN** the system SHALL create the official receipt persistence, create the finance transaction, link the transaction id, and mark the session finalized

#### Scenario: Optional fields remain nullable at confirm time
- **WHEN** a temp session is confirmed with missing optional extraction fields
- **THEN** the system SHALL allow confirmation as long as required business validation succeeds and SHALL preserve unknown optional values as null

### Requirement: Temp parse sessions SHALL expire and be cleanup-eligible
The system SHALL expire abandoned temp sessions and SHALL clean up their temporary images and temp OCR/extraction data after the configured grace period.

#### Scenario: Expired unconfirmed session is cleaned up
- **WHEN** a temp parse session reaches expiry and remains unconfirmed past the cleanup grace period
- **THEN** the system SHALL remove its temp image and temp parse data without creating a confirmed receipt

#### Scenario: Confirmed image is retained by default
- **WHEN** a temp session is successfully confirmed
- **THEN** the system SHALL promote or copy the original image into permanent receipt storage and retain it by default
