# receipt-ocr-normalization Specification

## Purpose
TBD - created by archiving change add-ocr-backend-foundation. Update Purpose after archive.
## Requirements
### Requirement: Successful OCR responses use the normalized expense schema
The system SHALL return HTTP 200 with a JSON body containing exactly these top-level fields on successful OCR: `total_amount`, `currency`, `transaction_datetime`, `merchant_name`, `payment_method`, and `ai_suggested_category`.

#### Scenario: Successful receipt extraction returns the strict schema
- **WHEN** OCR and validation succeed for an uploaded receipt
- **THEN** the response body contains exactly the required normalized fields and no raw provider-specific top-level fields

### Requirement: Normalized values follow deterministic mapping rules
The system SHALL normalize success responses using these rules: `total_amount` from the extracted total, `currency` from the extracted currency code, `merchant_name` from the cleaned vendor name with raw-name fallback, `transaction_datetime` as an ISO 8601 UTC timestamp, `payment_method` from extracted payment details with `Unknown` fallback, and `ai_suggested_category` from deterministic category mapping with `Khác` fallback.

#### Scenario: Date-only receipts are normalized to a timestamp
- **WHEN** OCR provides a transaction date but no explicit transaction time
- **THEN** the system returns `transaction_datetime` as that date at `00:00:00Z`

#### Scenario: Missing payment details use a safe fallback
- **WHEN** OCR succeeds but the receipt does not include a reliable payment method
- **THEN** the system still returns HTTP 200 and sets `payment_method` to `Unknown`

#### Scenario: Category mapping uses a fallback label
- **WHEN** OCR succeeds but no category rule matches the extracted merchant or provider category signals
- **THEN** the system sets `ai_suggested_category` to `Khác`

