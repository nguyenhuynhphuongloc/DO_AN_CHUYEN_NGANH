## MODIFIED Requirements

### Requirement: The receipt OCR module renders an embeddable upload-and-review experience
The system SHALL provide a reusable React component that can be embedded into an existing application and that renders a receipt upload area, image preview area, editable important OCR result fields, notes field, category selection, and submit action for confirmed transaction creation.

#### Scenario: Host application mounts the review module
- **WHEN** a host application renders the receipt OCR module
- **THEN** users can select a receipt image, review OCR output in editable important fields, enter notes, choose a category, and submit the final confirmed transaction data

### Requirement: OCR result fields remain editable before submission
The system SHALL populate the form with OCR results after a successful OCR response and SHALL allow the user to edit `total_amount`, `currency`, `transaction_datetime`, `merchant_name`, `payment_method`, and category before submission.

#### Scenario: User corrects extracted values
- **WHEN** OCR returns normalized receipt data
- **THEN** the module fills the form with those values and allows the user to change them before saving

### Requirement: Category review includes OCR suggestion and user override
The system SHALL treat `ai_suggested_category` as a suggestion only, SHALL allow the user to choose a different final category value before submission, and SHALL persist only the user-confirmed category through the final finance transaction flow.

#### Scenario: User overrides the suggested category
- **WHEN** OCR suggests a category that the user does not want to keep
- **THEN** the user can select another category from the dropdown and the new value becomes the final saved category
