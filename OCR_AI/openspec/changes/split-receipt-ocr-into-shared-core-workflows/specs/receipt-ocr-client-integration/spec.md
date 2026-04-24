## MODIFIED Requirements

### Requirement: The UI module accepts configurable OCR and save endpoints
The system SHALL allow a host application to configure separate OCR-form and chatbot OCR request targets, authenticated application endpoints, and `finance-service` transaction-save target without changing the component or page internal implementation.

#### Scenario: Module is embedded in a different host system
- **WHEN** a host application supplies different endpoint configuration values
- **THEN** the frontend sends OCR-form, chatbot OCR, finance-data loading, and transaction-save requests to those configured endpoints

### Requirement: OCR requests use multipart form upload with the receipt field
The system SHALL submit the selected receipt to either OCR endpoint as `multipart/form-data` using the file field name `receipt`, and SHALL forward category context required by the OCR contract when available.

#### Scenario: Selected image is sent for OCR form review
- **WHEN** a user starts OCR for a selected receipt from the OCR review flow
- **THEN** the frontend sends a multipart request containing the image file under the `receipt` field name to the OCR-form endpoint and includes category context when it is available

#### Scenario: Selected image is sent from chatbot OCR mode
- **WHEN** a user starts OCR from chatbot mode
- **THEN** the frontend sends a multipart request containing the image file under the `receipt` field name to the chatbot OCR endpoint and includes category context when it is available

### Requirement: OCR and save request states are visible to the user
The system SHALL show distinct loading and error states for OCR, finance-data loading, and transaction save operations, SHALL surface backend error messages to the user, and SHALL show a success message after a confirmed OCR transaction is created.

#### Scenario: OCR request fails
- **WHEN** either OCR endpoint returns an error response
- **THEN** the frontend displays a visible OCR error message to the user and does not treat the response as a successful extraction

#### Scenario: OCR form response is shaped for review editing
- **WHEN** the OCR-form endpoint returns a successful OCR extraction
- **THEN** the frontend receives a response with `mode: \"ocr_form\"` and a `receipt_data` object that contains the normalized OCR fields required to prefill the editable review form

#### Scenario: Transaction save succeeds
- **WHEN** the confirmed OCR data is accepted by `finance-service`
- **THEN** the frontend displays a visible transaction save success message while preserving the final confirmed values
