## MODIFIED Requirements

### Requirement: Successful OCR responses use the normalized expense schema
The system SHALL return normalized OCR success data from the shared OCR core with these top-level fields present: `merchant_name`, `transaction_datetime`, `total_amount`, `tax_amount`, `currency`, `payment_method`, `ai_suggested_category`, `ai_suggested_category_id`, `warnings`, and `needs_review`.

#### Scenario: Successful receipt extraction returns the stable schema
- **WHEN** OCR and validation succeed for an uploaded receipt
- **THEN** the normalized OCR success data contains all required fields and no raw provider-specific top-level fields

#### Scenario: Optional fields remain present when missing
- **WHEN** OCR succeeds but tax or category id cannot be derived reliably
- **THEN** the normalized OCR success data still includes `tax_amount` and `ai_suggested_category_id` with null or safe fallback values instead of omitting those keys

### Requirement: Normalized values follow deterministic mapping rules
The system SHALL normalize OCR success data using these rules: `total_amount` from the extracted total, `tax_amount` from the extracted tax with null or zero fallback, `currency` from the extracted currency code with configured fallback, `merchant_name` from the cleaned vendor name with raw-name fallback, `transaction_datetime` as an ISO 8601 UTC timestamp, `payment_method` from extracted payment details with deterministic fallback, `ai_suggested_category` and `ai_suggested_category_id` from caller-supplied category matching when possible, `warnings` as a list of review signals, and `needs_review` derived from confidence gaps or missing optional data.

#### Scenario: Date-only receipts are normalized to a timestamp
- **WHEN** OCR provides a transaction date but no explicit transaction time
- **THEN** the system returns `transaction_datetime` as that date at `00:00:00Z`

#### Scenario: Missing payment details use a safe fallback
- **WHEN** OCR succeeds but the receipt does not include a reliable payment method
- **THEN** the system still returns normalized OCR data and sets `payment_method` to a deterministic fallback value instead of omitting the field

#### Scenario: Category matching uses caller-provided categories
- **WHEN** OCR succeeds and the caller provides categories that contain a confident match
- **THEN** the system sets both `ai_suggested_category` and `ai_suggested_category_id` from that matched category rather than from hardcoded regex groups alone

#### Scenario: Weak extraction is flagged for review
- **WHEN** OCR succeeds but any supported field has low confidence or a required review warning
- **THEN** the system returns normalized OCR data with one or more `warnings` and `needs_review` set to `true`
