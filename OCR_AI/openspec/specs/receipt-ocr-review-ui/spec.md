# receipt-ocr-review-ui Specification

## Purpose
TBD - created by archiving change add-ocr-review-ui-module. Update Purpose after archive.
## Requirements
### Requirement: The receipt OCR module renders an embeddable upload-and-review experience
The system SHALL provide a reusable React-based OCR review experience that can be embedded into an existing application or hosted inside the protected OCR page, and that experience SHALL render a receipt upload area, image preview area, editable important OCR fields, wallet selection, category selection, notes field, and submit action.

#### Scenario: Host application mounts the review module
- **WHEN** a host application renders the OCR review experience
- **THEN** users can select a receipt image, review OCR output in editable important fields, choose a wallet, choose a final category, enter notes, and submit the confirmed transaction

### Requirement: OCR result fields remain editable before submission
The system SHALL populate the form with OCR results after a successful OCR response and SHALL allow the user to edit amount, currency, transaction datetime, merchant name, payment method, and final finance selection values before submitting.

#### Scenario: User corrects extracted values
- **WHEN** OCR returns normalized receipt data
- **THEN** the frontend fills the form with those values and allows the user to change them before saving

### Requirement: Category review includes OCR suggestion and user override
The system SHALL use `ai_suggested_category` only as a prefill mechanism for the final category selection, SHALL load actual selectable categories from the user’s finance data, and SHALL allow the user to choose a different final category value before submission.

#### Scenario: User overrides the suggested category
- **WHEN** OCR suggests a category that the user does not want to keep
- **THEN** the user can select another user-defined category and the new selection becomes the final saved category

