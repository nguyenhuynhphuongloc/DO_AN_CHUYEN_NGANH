## ADDED Requirements

### Requirement: The OCR page shows a protected upload-and-review flow
The system SHALL provide a protected OCR page that lets an authenticated user upload a receipt, run OCR, review only important extracted fields, and edit the final transaction values before save.

#### Scenario: Authenticated user uploads a receipt on the OCR page
- **WHEN** an authenticated user selects a receipt and starts OCR
- **THEN** the frontend calls the configured OCR endpoint and shows the upload, loading, success, or error state on the protected OCR page

#### Scenario: User edits important fields before save
- **WHEN** OCR returns important extracted invoice fields
- **THEN** the OCR page shows editable values for amount, currency, transaction date, merchant name, payment method, suggested category, wallet, final category, and note before save

### Requirement: The OCR page uses finance data to drive wallet and category confirmation
The system SHALL load the authenticated user’s wallets and categories from `finance-service`, SHALL prefill category selection by matching the AI-suggested category when possible, and SHALL allow the user to override the final wallet and category values.

#### Scenario: Suggested category matches a user-defined category
- **WHEN** the OCR result includes an AI-suggested category that matches one of the user’s finance categories
- **THEN** the frontend preselects that category while still allowing the user to choose a different final category

#### Scenario: Suggested category does not match a user-defined category
- **WHEN** the OCR result includes an AI-suggested category that does not match any loaded finance category
- **THEN** the frontend leaves the final category selection editable and requires the user to confirm a category before save

### Requirement: Confirmed OCR results are saved as finance transactions
The system SHALL submit the user-confirmed OCR result to `finance-service` as a transaction save request, SHALL mark the source as OCR-based input such as `receipt`, and MUST NOT send raw OCR text or raw OCR JSON for persistence.

#### Scenario: User confirms and saves an OCR result
- **WHEN** the user submits the confirmed OCR form
- **THEN** the frontend sends the final confirmed transaction data to `finance-service`, shows the resulting save success or error state, and treats the save as transaction persistence rather than receipt persistence
