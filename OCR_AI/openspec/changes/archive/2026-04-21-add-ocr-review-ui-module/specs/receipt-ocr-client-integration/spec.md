## ADDED Requirements

### Requirement: The UI module accepts configurable OCR and save endpoints
The system SHALL allow a host application to configure the OCR request target and reviewed-data save target without changing the component's internal implementation.

#### Scenario: Module is embedded in a different host system
- **WHEN** a host application supplies different endpoint props
- **THEN** the module sends OCR and save requests to those configured endpoints

### Requirement: OCR requests use multipart form upload with the receipt field
The system SHALL submit the selected receipt to the OCR endpoint as `multipart/form-data` using the file field name `receipt`.

#### Scenario: Selected image is sent for OCR
- **WHEN** a user starts OCR for a selected receipt image
- **THEN** the module sends a multipart request containing the image file under the `receipt` field name

### Requirement: OCR and save request states are visible to the user
The system SHALL show distinct loading and error states for OCR and save operations, SHALL surface backend OCR error messages to the user, and SHALL show a success message after a reviewed receipt is saved.

#### Scenario: OCR request fails
- **WHEN** the OCR endpoint returns an error response
- **THEN** the module displays a visible OCR error message to the user and does not treat the response as a successful extraction

#### Scenario: Save request succeeds
- **WHEN** the reviewed receipt is accepted by the save endpoint
- **THEN** the module displays a visible save success message while preserving the final reviewed values
