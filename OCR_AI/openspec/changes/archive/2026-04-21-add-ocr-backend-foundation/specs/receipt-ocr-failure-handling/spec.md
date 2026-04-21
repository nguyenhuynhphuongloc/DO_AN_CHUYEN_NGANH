## ADDED Requirements

### Requirement: Caller-correctable OCR failures return structured HTTP 400 errors
The system SHALL return HTTP 400 with a JSON error body containing `error_code` and `message` whenever the uploaded receipt cannot produce a trustworthy normalized result because of invalid input, OCR failure, blur, or insufficient extracted data.

#### Scenario: OCR provider cannot produce a usable extraction
- **WHEN** the OCR provider returns no usable extraction result for an otherwise valid receipt upload
- **THEN** the system returns HTTP 400 with `error_code` set to `OCR_FAILED` and a meaningful message describing the failure

### Requirement: Blurry or low-confidence receipt images are rejected
The system SHALL reject a receipt as blurry when the provider flags the document as blurry or when the configured image-quality confidence threshold for required fields is not met.

#### Scenario: Blurry image is rejected
- **WHEN** OCR processing indicates the uploaded receipt is blurry or below the configured image-quality threshold
- **THEN** the system returns HTTP 400 with `error_code` set to `BLURRY_IMAGE`

### Requirement: Missing essential expense fields are treated as insufficient data
The system SHALL reject OCR output as insufficient data when any of `total_amount`, `currency`, `merchant_name`, or the transaction date cannot be determined reliably enough to build the normalized success response.

#### Scenario: Required fields are missing after OCR
- **WHEN** OCR completes but one or more essential normalized fields cannot be derived reliably
- **THEN** the system returns HTTP 400 with `error_code` set to `INSUFFICIENT_DATA` and a message that identifies the missing or unreliable fields
