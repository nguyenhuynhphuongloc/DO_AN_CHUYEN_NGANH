## ADDED Requirements

### Requirement: Receipt OCR webhook accepts a single receipt image upload
The system SHALL expose a synchronous HTTP `POST` webhook for receipt OCR that accepts exactly one receipt image file per request and starts OCR processing for that file.

#### Scenario: Valid image upload is accepted
- **WHEN** a client submits one supported receipt image file to the OCR webhook
- **THEN** the system processes that file through the OCR workflow and keeps the HTTP request open until a final response is ready

#### Scenario: Missing upload is rejected
- **WHEN** a client calls the OCR webhook without a receipt image file
- **THEN** the system returns HTTP 400 with an `INVALID_INPUT` error instead of calling the OCR provider

### Requirement: The webhook contract hides provider-specific integration details
The system MUST call the configured OCR provider internally and MUST NOT require callers to know provider-specific endpoints, credentials, or raw response fields.

#### Scenario: Caller receives provider-independent output
- **WHEN** OCR processing completes
- **THEN** the system returns only the module's normalized success payload or structured error payload and does not expose the raw provider response as the public contract
