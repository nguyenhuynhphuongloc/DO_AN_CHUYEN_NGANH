## ADDED Requirements

### Requirement: The receipt OCR module renders an embeddable upload-and-review experience
The system SHALL provide a reusable React component that can be embedded into an existing application and that renders a receipt upload area, image preview area, editable OCR result form, notes field, category dropdown, and submit action.

#### Scenario: Host application mounts the review module
- **WHEN** a host application renders the receipt OCR module
- **THEN** users can select a receipt image, review OCR output in editable fields, enter notes, choose a category, and submit the reviewed receipt

### Requirement: OCR result fields remain editable before submission
The system SHALL populate the form with OCR results after a successful OCR response and SHALL allow the user to edit `total_amount`, `currency`, `transaction_datetime`, `merchant_name`, `payment_method`, and category before submitting.

#### Scenario: User corrects extracted values
- **WHEN** OCR returns normalized receipt data
- **THEN** the module fills the form with those values and allows the user to change them before saving

### Requirement: Category review includes OCR suggestion and user override
The system SHALL initialize the category selector from `ai_suggested_category` and SHALL allow the user to choose a different category value before submission.

#### Scenario: User overrides the suggested category
- **WHEN** OCR suggests a category that the user does not want to keep
- **THEN** the user can select another category from the dropdown and the new value becomes the final reviewed category
