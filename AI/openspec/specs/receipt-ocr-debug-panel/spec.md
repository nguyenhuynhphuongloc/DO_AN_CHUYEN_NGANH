# receipt-ocr-debug-panel Specification

## Purpose
TBD - created by archiving change add-receipt-ocr-debug-panel. Update Purpose after archive.
## Requirements
### Requirement: Receipt detail API exposes OCR debug data
The system SHALL expose OCR debug data for the active pre-confirm review object with additive `ocr_debug` data built from OCR result storage, without breaking the existing receipt workflow, and that debug payload SHALL expose detector/recognizer runtime evidence, actual OCR device usage, selected parse path, and optional layout-aware metadata.

#### Scenario: Session OCR data exists
- **WHEN** a client requests a temp parse session or confirmed receipt that has OCR results
- **THEN** the response SHALL include `ocr_debug.raw_text`, `ocr_debug.lines`, `ocr_debug.provider`, `ocr_debug.confidence_score`, actual OCR device, detector model, recognizer model, selected parse path, line count, and timing/debug fields needed for review troubleshooting

#### Scenario: Hybrid OCR runtime metadata exists
- **WHEN** OCR completed through the detector-plus-recognizer pipeline
- **THEN** the response SHALL additively expose debug metadata including selected detector backend, selected recognizer backend, detector and recognizer timings, total OCR timing, actual runtime device, and detector/recognizer model names when available

#### Scenario: Layout-aware OCR metadata exists
- **WHEN** OCR completed through the layout-aware path
- **THEN** the response SHALL additively expose layout metadata including block list, layout backend, layout timings, block OCR text, and field provenance when available

#### Scenario: Existing debug keys remain compatible
- **WHEN** receipt or session detail is serialized after recognizer migration or layout enhancement
- **THEN** existing `ocr_debug` and `raw_json` keys already consumed by the frontend SHALL remain available in backward-compatible form and new metadata SHALL be additive

#### Scenario: OCR data is missing
- **WHEN** a client requests a temp parse session or receipt that does not yet have OCR results
- **THEN** the response SHALL include `ocr_debug` as `null` or safe empty values without failing the request

### Requirement: Receipt review workspace shows isolated OCR debug data
The system SHALL keep OCR debug rendering separate from the extraction form while allowing the debug panel to display additive detector/recognizer metadata and layout-aware OCR evidence.

#### Scenario: Debug panel enabled
- **WHEN** the review page loads with OCR debug data available
- **THEN** the page SHALL render a dedicated OCR debug card separate from the extraction form and SHALL be able to show recognizer backend and timing details without changing extraction business logic

#### Scenario: Layout blocks are available
- **WHEN** the review workspace loads OCR debug data containing layout blocks
- **THEN** the OCR debug panel SHALL be able to show detected blocks, OCR text per block, and layout-related runtime metadata without changing the review/edit flow

#### Scenario: Field provenance exists
- **WHEN** extraction reports which block contributed to a selected field
- **THEN** the OCR debug panel SHALL be able to show that provenance additively without affecting the existing field editing workflow

#### Scenario: Debug panel disabled or removed
- **WHEN** the OCR debug panel is disabled or removed from the page
- **THEN** the existing extraction, feedback, and confirmation form SHALL continue to work without code changes to its business logic

### Requirement: OCR debug panel is safe for long raw text
The system SHALL present OCR debug content in a readable, scrollable, read-only format suitable for UI debugging, including long OCR output and additive timing/runtime fields.

#### Scenario: Long OCR content is present
- **WHEN** OCR raw text or line output is long
- **THEN** the panel SHALL preserve line breaks, use monospaced text for raw OCR, and remain scrollable inside its own bordered card

#### Scenario: Timing and runtime metadata are present
- **WHEN** the parse pipeline records fast-path or recovery-path timings, device evidence, model names, preprocessing metadata, or layout-related runtime evidence
- **THEN** the panel SHALL display that metadata in a readable secondary format without obscuring the primary OCR text

#### Scenario: No OCR data is available
- **WHEN** the page renders a receipt without OCR debug content
- **THEN** the panel SHALL display a fallback message indicating that no OCR data is available
