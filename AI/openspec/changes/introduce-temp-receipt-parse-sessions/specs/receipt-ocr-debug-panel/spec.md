## MODIFIED Requirements

### Requirement: Receipt detail API exposes OCR debug data
The system SHALL expose OCR debug data for the active pre-confirm review object, whether that object is a temp parse session during session-first mode or a confirmed receipt after finalization, and SHALL include path-selection and timing metadata in addition to OCR text content.

#### Scenario: Session OCR data exists
- **WHEN** a client requests a temp parse session or confirmed receipt that has OCR results
- **THEN** the response SHALL include raw OCR text, OCR lines, provider/profile metadata, confidence summary, selected parse path, and timing/debug fields needed for review troubleshooting

#### Scenario: OCR data is missing
- **WHEN** a client requests a temp parse session or receipt that does not yet have OCR results
- **THEN** the response SHALL include `ocr_debug` as `null` or safe empty values without failing the request

### Requirement: Receipt review page shows an isolated OCR debug panel
The system SHALL render OCR debug information in a separate, read-only panel within the unified receipt workspace, and that panel SHALL remain independent from the extraction form whether review is driven by a temp parse session or a confirmed receipt.

#### Scenario: Debug panel enabled
- **WHEN** the unified receipt workspace loads with OCR debug enabled
- **THEN** the page SHALL render a dedicated OCR debug card separate from the extraction form

#### Scenario: Debug panel disabled or removed
- **WHEN** the OCR debug panel is disabled or removed from the page
- **THEN** the existing extraction, feedback, and confirmation workflow SHALL continue to work without code changes to its business logic

### Requirement: OCR debug panel is safe for long raw text
The system SHALL present OCR debug content in a readable, scrollable, read-only format suitable for UI debugging, including long OCR output and structured timing/profile metadata.

#### Scenario: Long OCR content is present
- **WHEN** OCR raw text or line output is long
- **THEN** the panel SHALL preserve line breaks, use monospaced text for OCR content, and remain scrollable inside its own bordered card

#### Scenario: Timing and path metadata are present
- **WHEN** the parse pipeline records fast-path or recovery-path timings and preprocessing metadata
- **THEN** the panel SHALL display those values in a readable debug format without blocking the main review form
