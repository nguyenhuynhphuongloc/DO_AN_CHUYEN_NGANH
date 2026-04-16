## ADDED Requirements

### Requirement: Receipt parse jobs use Gemini Vision on the primary parsing path
The `receipt-service` SHALL preserve the existing asynchronous parse-job workflow while replacing PaddleOCR plus heuristic extraction on the primary parser path with Gemini Vision selected through service configuration.

#### Scenario: Worker parses a queued receipt with Gemini
- **WHEN** a queued parse job is claimed by the receipt worker
- **THEN** the worker SHALL load the stored receipt image from disk, invoke Gemini Vision, and continue the parse lifecycle without requiring user interaction

#### Scenario: Gemini is configured as the default provider
- **WHEN** the receipt-service parser configuration is loaded in the normal production path
- **THEN** the worker SHALL use Gemini Vision as the default parser implementation without requiring changes to the job orchestration or review flow

### Requirement: AI parser responses use a stable structured receipt schema
The `receipt-service` SHALL request and consume structured receipt JSON from Gemini Vision using a stable schema that supports review-safe nullable fields.

#### Scenario: Gemini returns a valid structured receipt payload
- **WHEN** Gemini returns a schema-valid receipt extraction
- **THEN** the service SHALL normalize and persist core fields including `merchant_name`, `transaction_date`, `total_amount`, and `currency`

#### Scenario: Gemini returns optional structured fields
- **WHEN** Gemini returns optional values such as `subtotal_amount`, `tax_amount`, `discount_amount`, `service_charge`, `payment_method`, `receipt_number`, `merchant_address`, `merchant_phone`, `cashier_name`, `table_number`, `guest_count`, `time_in`, `time_out`, `notes`, or `items`
- **THEN** the service SHALL preserve those values inside `receipt_extractions.extracted_json` using a stable additive structure

#### Scenario: Gemini is uncertain about a field
- **WHEN** Gemini cannot support a field confidently from the receipt image
- **THEN** the service SHALL keep that field `null` instead of fabricating a value

### Requirement: Receipt extraction is validated before persistence
The `receipt-service` SHALL validate and normalize AI parser output before it becomes persisted receipt extraction state.

#### Scenario: Valid core field values are accepted
- **WHEN** `merchant_name` is text-like, `transaction_date` parses cleanly, and `total_amount` is positive
- **THEN** the service SHALL persist normalized values into the existing top-level `receipt_extractions` columns

#### Scenario: Invalid or weak field values are rejected safely
- **WHEN** the parser returns invalid field types, malformed dates, non-positive totals, numeric-only merchant names, or weak optional monetary fields
- **THEN** the service SHALL coerce those fields to `null` or fail the parse safely according to the field validation rules

#### Scenario: Wallet or category is absent from parser output
- **WHEN** the parser response is normalized for persistence
- **THEN** the service SHALL NOT infer or fabricate wallet assignment or category selection during receipt parsing

### Requirement: Receipt parsing persistence preserves current review and confirm contracts
The `receipt-service` SHALL keep the existing top-level extraction contract used by the review and confirm workflow while extending the structured payload for richer parser output.

#### Scenario: Core extraction columns are persisted
- **WHEN** parsing succeeds
- **THEN** `receipt_extractions` SHALL continue to persist `merchant_name`, `transaction_date`, `total_amount`, `tax_amount`, `currency`, `confidence_score`, and `review_status`

#### Scenario: Extended parser output is persisted
- **WHEN** parsing succeeds with optional fields, item data, confidence, or parser metadata
- **THEN** the service SHALL persist those additive details inside `receipt_extractions.extracted_json`

#### Scenario: Parser metadata is available for debugging
- **WHEN** parsing succeeds
- **THEN** the service SHALL persist `parser_provider`, `parser_model`, `extraction_version`, `field_confidence`, `needs_review_fields`, and parser notes in review-safe structured output

### Requirement: Parse jobs fail cleanly on Gemini or normalization errors
The `receipt-service` SHALL handle Gemini parser failures without leaving receipt jobs in ambiguous states.

#### Scenario: Gemini timeout or temporary outage
- **WHEN** the Gemini request times out, is rate limited, or is temporarily unavailable
- **THEN** the parse job SHALL transition to `failed`, retain useful error context, and leave the receipt unconfirmed

#### Scenario: Gemini authentication or unsupported input failure
- **WHEN** Gemini rejects the request because of invalid credentials or unsupported image input
- **THEN** the parse job SHALL transition to `failed` with a clear error message for operational debugging

#### Scenario: Gemini returns malformed JSON
- **WHEN** the Gemini response cannot be parsed or normalized into the required receipt schema
- **THEN** the parse job SHALL transition to `failed` instead of persisting partial invalid extraction state

### Requirement: PaddleOCR is removed from the primary parsing path
The `receipt-service` SHALL NOT use PaddleOCR as part of the normal production receipt parsing flow once Gemini Vision parsing is enabled for this change.

#### Scenario: Primary parse pipeline executes
- **WHEN** a receipt parse job runs through the normal worker pipeline after this change
- **THEN** the service SHALL use Gemini Vision for primary parsing and SHALL NOT invoke PaddleOCR before persisting reviewable extraction results

### Requirement: Existing review-first receipt flow remains unchanged for users
The `receipt-service` SHALL preserve the current review, feedback, and confirmation flow after AI parsing replaces the primary parser.

#### Scenario: Receipt is ready for human review after successful parsing
- **WHEN** the worker finishes parsing and persistence successfully
- **THEN** the job SHALL move to `ready_for_review` and the receipt SHALL remain editable before confirmation

#### Scenario: User confirms reviewed extraction
- **WHEN** a user confirms a parsed receipt through the existing confirm endpoint
- **THEN** the service SHALL continue to create the finance transaction through `finance-service` using the edited or confirmed receipt values
