## MODIFIED Requirements

### Requirement: Temp parse sessions SHALL use fast-path-first OCR with recovery fallback
The temp parse pipeline SHALL run a truly lightweight fast OCR path first and SHALL run at most one recovery OCR path only when the fast result fails the configured quality gate.

#### Scenario: Fast path succeeds
- **WHEN** a clear receipt produces acceptable OCR quality, acceptable merchant/header quality, and critical extraction fields on the fast path
- **THEN** the system SHALL accept the fast result and SHALL NOT run the recovery path

#### Scenario: Recovery path is required
- **WHEN** the fast path produces low OCR confidence, corrupted Vietnamese text, fragmented merchant/header lines, insufficient output, or missing critical extraction fields
- **THEN** the system SHALL run one recovery parse attempt with the heavier preprocessing/profile before marking the session ready for review or failed

### Requirement: Temp parse sessions SHALL capture timing and debug metadata
The system SHALL record parse timings and runtime metadata for each temp parse session so OCR latency, model selection, and CPU/GPU behavior can be inspected during review or troubleshooting.

#### Scenario: Parse completes with runtime evidence
- **WHEN** a session parse attempt completes
- **THEN** the session SHALL store queue delay, preprocessing time, OCR time by profile, extraction time, total parse time, actual OCR device, resolved model names, line count, and preprocess/OCR debug metadata

#### Scenario: Session debug payload is requested during review
- **WHEN** the frontend loads a parsed temp session
- **THEN** the response SHALL include session-safe OCR raw text, line output, model/device/runtime evidence, profile/debug metadata, and timing summaries needed by the unified review workspace
