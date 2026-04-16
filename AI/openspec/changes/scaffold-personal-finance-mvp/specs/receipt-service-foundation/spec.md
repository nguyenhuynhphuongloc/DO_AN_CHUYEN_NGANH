## ADDED Requirements

### Requirement: Receipt upload and persistence
The `receipt-service` SHALL accept receipt uploads, store local file metadata, and persist receipt records in the `receipt_db` PostgreSQL database.

#### Scenario: Upload receipt
- **WHEN** a client submits a receipt image to `POST /receipts/upload`
- **THEN** the service stores the file in a local upload directory, creates a receipt record, and returns the created receipt metadata

#### Scenario: Retrieve receipt
- **WHEN** a client calls `GET /receipts/{id}`
- **THEN** the service returns the stored receipt record including upload metadata, parse state, and extracted fields if available

### Requirement: Placeholder receipt parsing and feedback
The `receipt-service` SHALL provide a mock parsing flow that populates extracted receipt fields and accepts user feedback on the result.

#### Scenario: Parse receipt with placeholder OCR
- **WHEN** a client calls `POST /receipts/{id}/parse`
- **THEN** the service runs the placeholder parsing function and returns mock extracted fields for `merchant_name`, `transaction_date`, and `total_amount`

#### Scenario: Submit extraction feedback
- **WHEN** a client submits feedback to `POST /receipts/{id}/feedback`
- **THEN** the service stores the feedback against the receipt record for later review

### Requirement: Confirm receipt into finance transaction
The `receipt-service` SHALL convert a reviewed receipt into a finance transaction by calling the `finance-service` REST API.

#### Scenario: Confirm receipt successfully
- **WHEN** a client submits approved receipt data to `POST /receipts/{id}/confirm`
- **THEN** the service records the confirmation and creates a corresponding transaction through `finance-service`

#### Scenario: Finance integration fails during confirmation
- **WHEN** the `finance-service` call fails during `POST /receipts/{id}/confirm`
- **THEN** the service returns an integration error and does not mark the receipt as successfully confirmed
