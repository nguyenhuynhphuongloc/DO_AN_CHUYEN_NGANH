## ADDED Requirements

### Requirement: Upside-down receipts are corrected before OCR row ordering
The receipt OCR service SHALL evaluate document-level upside-down evidence before the primary OCR row-ordering step and SHALL rotate the full image by 180 degrees when the majority of eligible text-line crops indicate an upside-down receipt.

#### Scenario: Majority upside-down evidence rotates the document
- **WHEN** document-level orientation checking observes enough detected text lines and more than half of eligible line crops are classified as `180_degree`
- **THEN** the service rotates the full image by 180 degrees before continuing with OCR row ordering and text recognition

#### Scenario: Weak upside-down evidence leaves the document unchanged
- **WHEN** document-level orientation checking does not observe a majority upside-down signal
- **THEN** the service keeps the original image orientation and proceeds with OCR without rotating the full image

### Requirement: Orientation decisions remain observable in OCR debug metadata
The receipt OCR service SHALL record whether document-level orientation checking ran, whether a 180-degree rotation was applied, and the supporting consensus metrics in OCR debug metadata.

#### Scenario: Rotation metadata is captured after a rotation
- **WHEN** the service rotates a receipt image by 180 degrees during document-level orientation handling
- **THEN** the OCR debug payload includes that document orientation checking was enabled, checked, and applied with the recorded consensus ratio and box count

#### Scenario: No-rotation metadata is captured after evaluation
- **WHEN** the service evaluates document-level orientation but does not rotate the image
- **THEN** the OCR debug payload includes that document orientation checking ran and records the consensus metrics that led to no full-image rotation
