## MODIFIED Requirements

### Requirement: Receipt detail API exposes OCR debug data
The system SHALL extend receipt and session detail responses with additive OCR debug data, and that debug payload SHALL support both the current whole-image OCR path and the new optional layout-aware OCR path.

#### Scenario: Layout-aware OCR metadata exists
- **WHEN** OCR completed through the layout-aware path
- **THEN** the response SHALL additively expose layout metadata including block list, layout backend, layout timings, block OCR text, and field provenance when available

#### Scenario: Layout-aware OCR is disabled or unavailable
- **WHEN** OCR completed through the current whole-image fallback path
- **THEN** the response SHALL still expose the existing OCR debug fields in backward-compatible form and SHALL include additive fallback reason metadata when available

#### Scenario: Existing debug keys remain compatible
- **WHEN** receipt or session detail is serialized after layout enhancement
- **THEN** existing `ocr_debug` and `raw_json` keys already consumed by the frontend SHALL remain available and new layout metadata SHALL be additive only

### Requirement: Receipt review workspace shows isolated OCR debug data
The system SHALL keep OCR debug rendering separate from the extraction form while allowing the debug panel to display layout-aware OCR evidence.

#### Scenario: Layout blocks are available
- **WHEN** the review workspace loads OCR debug data containing layout blocks
- **THEN** the OCR debug panel SHALL be able to show detected blocks, OCR text per block, and layout-related runtime metadata without changing the review/edit flow

#### Scenario: Field provenance exists
- **WHEN** extraction reports which block contributed to a selected field
- **THEN** the OCR debug panel SHALL be able to show that provenance additively without affecting the existing field editing workflow

#### Scenario: Layout metadata is absent
- **WHEN** OCR completed without layout enhancement
- **THEN** the OCR debug panel SHALL continue to render safely using the existing non-layout OCR fields
