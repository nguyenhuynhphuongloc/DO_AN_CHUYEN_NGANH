## MODIFIED Requirements

### Requirement: Receipt OCR webhook accepts a single receipt image upload
The system SHALL expose dedicated synchronous HTTP `POST` OCR entry-point webhooks for receipt OCR form mode and chatbot mode, and each public OCR webhook SHALL accept exactly one receipt image file per request and start OCR processing for that file through the shared OCR core.

#### Scenario: Valid image upload is accepted by the form webhook
- **WHEN** a client submits one supported receipt image file to the OCR form webhook
- **THEN** the system processes that file through the shared OCR core and keeps the HTTP request open until a final form-oriented response is ready

#### Scenario: Valid image upload is accepted by the chatbot webhook
- **WHEN** a client submits one supported receipt image file to the chatbot OCR webhook
- **THEN** the system processes that file through the shared OCR core and keeps the HTTP request open until a final chatbot-oriented response is ready

#### Scenario: Missing upload is rejected
- **WHEN** a client calls either OCR webhook without a receipt image file
- **THEN** the system returns HTTP 400 with an `INVALID_INPUT` error instead of calling the OCR provider

### Requirement: The webhook contract hides provider-specific integration details
The system MUST call the configured OCR provider internally through the shared OCR core and MUST NOT require callers of either public OCR webhook to know provider-specific endpoints, credentials, or raw response fields.

#### Scenario: Caller receives provider-independent output
- **WHEN** OCR processing completes through either public OCR webhook
- **THEN** the system returns only that endpoint's normalized success payload or structured error payload and does not expose the raw provider response as the public contract
