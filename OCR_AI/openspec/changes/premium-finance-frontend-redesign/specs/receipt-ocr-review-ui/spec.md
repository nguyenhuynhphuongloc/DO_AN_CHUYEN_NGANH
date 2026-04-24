## MODIFIED Requirements

### Requirement: The receipt OCR module renders an embeddable upload-and-review experience
The system SHALL provide a reusable React-based OCR review experience that can be embedded into the protected OCR page or the AI Vanilla OCR workspace, and that experience SHALL render a receipt upload area, image preview area, OCR trigger action, processing state, editable important OCR fields, wallet selection, category selection, notes field, and submit action.

#### Scenario: Host application mounts the review module
- **WHEN** a host application renders the OCR review experience
- **THEN** users can select a receipt image, preview the image, run OCR, review OCR output in editable important fields, choose a wallet, choose a final category, enter notes, and submit the confirmed transaction

### Requirement: OCR result fields remain editable before submission
The system SHALL populate the review form with OCR results after a successful OCR response and SHALL allow the user to edit merchant name, total amount, tax amount, currency, transaction datetime, payment method, notes, category-related fields, and other important finance-facing values before saving.

#### Scenario: User corrects extracted values
- **WHEN** OCR returns normalized receipt data
- **THEN** the frontend fills the form with those values and allows the user to change them before saving

### Requirement: Category review includes OCR suggestion and user override
The system SHALL use `ai_suggested_category` only as a prefill mechanism for the final category selection, SHALL load actual selectable categories from the user’s finance data when available, and SHALL allow the user to choose a different final category value before submission.

#### Scenario: User overrides the suggested category
- **WHEN** OCR suggests a category that the user does not want to keep
- **THEN** the user can select another user-defined category and the new selection becomes the final saved category
