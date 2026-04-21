# receipt-ocr-client-integration Specification

## Purpose
TBD - created by archiving change add-ocr-review-ui-module. Update Purpose after archive.
## Requirements
### Requirement: The UI module accepts configurable OCR and save endpoints
The system SHALL allow a host application to configure the OCR request target, authenticated application endpoints, and `finance-service` transaction-save target without changing the component or page internal implementation.

#### Scenario: Module is embedded in a different host system
- **WHEN** a host application supplies different endpoint configuration values
- **THEN** the frontend sends OCR, finance-data loading, and transaction-save requests to those configured endpoints

### Requirement: OCR requests use multipart form upload with the receipt field
The system SHALL submit the selected receipt to the OCR endpoint as `multipart/form-data` using the file field name `receipt`.

#### Scenario: Selected image is sent for OCR
- **WHEN** a user starts OCR for a selected receipt image
- **THEN** the module sends a multipart request containing the image file under the `receipt` field name

### Requirement: OCR and save request states are visible to the user
The system SHALL show distinct loading and error states for OCR, finance-data loading, and transaction save operations, SHALL surface backend error messages to the user, and SHALL show a success message after a confirmed OCR transaction is created.

#### Scenario: OCR request fails
- **WHEN** the OCR endpoint returns an error response
- **THEN** the module displays a visible OCR error message to the user and does not treat the response as a successful extraction

#### Scenario: Transaction save succeeds
- **WHEN** the confirmed OCR data is accepted by `finance-service`
- **THEN** the frontend displays a visible transaction save success message while preserving the final confirmed values
