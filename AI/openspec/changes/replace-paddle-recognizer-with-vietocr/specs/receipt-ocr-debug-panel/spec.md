## MODIFIED Requirements

### Requirement: Receipt detail API exposes OCR debug data
The system SHALL extend receipt detail responses with additive `ocr_debug` data built from OCR result storage, without breaking the existing receipt workflow, and that debug payload SHALL expose detector/recognizer runtime evidence for the hybrid OCR pipeline.

#### Scenario: OCR data exists
- **WHEN** a client requests a receipt or receipt parse session that has OCR results
- **THEN** the response SHALL include `ocr_debug.raw_text`, `ocr_debug.lines`, `ocr_debug.provider`, and `ocr_debug.confidence_score`

#### Scenario: Hybrid OCR runtime metadata exists
- **WHEN** OCR completed through the detector-plus-recognizer pipeline
- **THEN** the response SHALL additively expose debug metadata including selected detector backend, selected recognizer backend, detector and recognizer timings, total OCR timing, actual runtime device, and detector/recognizer model names when available

#### Scenario: Existing debug keys remain compatible
- **WHEN** OCR debug data is serialized after the recognizer migration
- **THEN** existing `ocr_debug` and `raw_json` keys already consumed by the frontend SHALL remain available in backward-compatible form and new metadata SHALL be additive

#### Scenario: OCR data is missing
- **WHEN** a client requests a receipt or receipt parse session that does not yet have OCR results
- **THEN** the response SHALL include `ocr_debug` as `null` or safe empty values without failing the request

### Requirement: Receipt review page shows an isolated OCR debug panel
The system SHALL render OCR debug information in a separate, read-only panel on the receipt review page, and that panel SHALL remain independent from the extraction form while supporting the additive detector/recognizer metadata introduced by the hybrid OCR pipeline.

#### Scenario: Debug panel enabled
- **WHEN** the review page loads with OCR debug data available
- **THEN** the page SHALL render a dedicated OCR debug card separate from the extraction form and SHALL be able to show recognizer backend and timing details without changing extraction business logic

#### Scenario: Debug panel disabled or removed
- **WHEN** the OCR debug panel is disabled or removed from the page
- **THEN** the existing extraction, feedback, and confirmation form SHALL continue to work without code changes to its business logic

### Requirement: OCR debug panel is safe for long raw text
The system SHALL present OCR debug content in a readable, scrollable, read-only format suitable for UI debugging, including long OCR output and additive timing/runtime fields.

#### Scenario: Long OCR content is present
- **WHEN** OCR raw text or line output is long
- **THEN** the panel SHALL preserve line breaks, use monospaced text for raw OCR, and remain scrollable inside its own bordered card

#### Scenario: Timing and runtime metadata are present
- **WHEN** OCR debug data includes detector/recognizer timings and runtime evidence
- **THEN** the panel SHALL display that metadata in a readable secondary format without obscuring the primary OCR text

#### Scenario: No OCR data is available
- **WHEN** the page renders a receipt without OCR debug content
- **THEN** the panel SHALL display a fallback message indicating that no OCR data is available
