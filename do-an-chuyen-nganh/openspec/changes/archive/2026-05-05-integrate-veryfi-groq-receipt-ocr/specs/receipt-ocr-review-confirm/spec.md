## ADDED Requirements

### Requirement: Scan page presents an editable OCR review form
The system SHALL present the receipt scan result as a two-column review experience where the uploaded image is previewed and the OCR fields are editable before save.

#### Scenario: OCR parse succeeds
- **WHEN** the scan page receives a successful OCR result
- **THEN** it displays editable fields for merchant name, transaction date, total amount, currency, category, description, and user note alongside the receipt image preview

### Requirement: Receipt image is saved only after user confirmation
The system SHALL defer uploading the receipt image to `media` until the user confirms the reviewed OCR form.

#### Scenario: User reviews but does not confirm
- **WHEN** the user leaves the scan page or does not submit the confirm action
- **THEN** the system does not save a receipt image or create a transaction

#### Scenario: User confirms reviewed OCR fields
- **WHEN** the user submits the confirm action with a receipt image and reviewed fields
- **THEN** the system uploads the image to `media` and uses the resulting media record when creating the transaction

### Requirement: Confirm creates an expense transaction with minimal OCR summary fields
The system SHALL create an expense transaction from the reviewed OCR fields and SHALL store the minimal receipt summary needed for the transaction to be understandable later.

#### Scenario: Confirm succeeds
- **WHEN** the confirm route successfully validates the reviewed OCR fields
- **THEN** it creates a transaction with type `expense`, links the uploaded receipt image, and stores merchant name, currency, and source type `receipt_ai`

### Requirement: Confirm failures are reported without partial user-facing success
The system SHALL return a failure result when receipt confirm cannot complete and SHALL allow the UI to present an error instead of a false success state.

#### Scenario: Confirm fails during validation or save
- **WHEN** the confirm route cannot validate the payload or cannot finish saving the transaction
- **THEN** the UI receives a failure response and displays a save error message

### Requirement: Successful confirm resets the scan workflow for the next receipt
The system SHALL reset the scan page after a successful receipt confirm so the user can scan another receipt immediately.

#### Scenario: Confirm completes successfully
- **WHEN** the confirm route returns success
- **THEN** the UI shows a success message and clears the current receipt image, review form state, and OCR result state
