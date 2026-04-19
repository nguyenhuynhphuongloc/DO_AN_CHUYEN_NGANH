## MODIFIED Requirements

### Requirement: Receipt detail API exposes OCR debug data
The system SHALL expose OCR debug data for the active pre-confirm review object and SHALL include runtime evidence sufficient to verify actual OCR device usage and model selection.

#### Scenario: Session OCR data exists
- **WHEN** a client requests a temp parse session or confirmed receipt that has OCR results
- **THEN** the response SHALL include raw OCR text, OCR lines, actual OCR device, detector model, recognizer model, selected parse path, line count, and timing/debug fields needed for review troubleshooting

#### Scenario: OCR data is missing
- **WHEN** a client requests a temp parse session or receipt that does not yet have OCR results
- **THEN** the response SHALL include `ocr_debug` as `null` or safe empty values without failing the request

### Requirement: OCR debug panel is safe for long raw text
The system SHALL present OCR debug content in a readable, scrollable, read-only format suitable for UI debugging, including long OCR output and structured timing/runtime metadata.

#### Scenario: Timing and runtime metadata are present
- **WHEN** the parse pipeline records fast-path or recovery-path timings, device evidence, model names, and preprocessing metadata
- **THEN** the panel SHALL display those values in a readable debug format without blocking the main review form
