## ADDED Requirements

### Requirement: Receipt extraction uses a staged selection pipeline
The system SHALL replace the current first-line and simple regex extraction flow with a staged pipeline that normalizes OCR text, derives practical receipt zones when possible, generates field candidates, scores and ranks candidates, validates selected values, and persists the selected extraction output.

#### Scenario: OCR text is processed for extraction
- **WHEN** a parse job reaches the extraction stage
- **THEN** the system SHALL run normalization, candidate generation, scoring, validation, and persistence before marking the receipt ready for review

#### Scenario: OCR text is noisy or incomplete
- **WHEN** OCR text is incomplete, inconsistent, or partially corrupted
- **THEN** the extraction pipeline SHALL keep uncertain fields nullable instead of inventing values and SHALL still persist traceable review-safe output

### Requirement: Core fields are extracted with stronger heuristics and validation
The system SHALL improve extraction for `merchant_name`, `transaction_date`, `total_amount`, and `currency` using candidate-based heuristics and business validation rather than blindly choosing the first OCR line or the largest number.

#### Scenario: Merchant header competes with promo or contact text
- **WHEN** header OCR lines include store name candidates alongside websites, phones, invoice labels, or promotional text
- **THEN** the system SHALL prefer likely merchant header candidates and exclude obviously non-merchant lines from selection

#### Scenario: Amount-like values compete on the receipt
- **WHEN** subtotal, tax, discount, service charge, cash tendered, and total-like values all appear in OCR text
- **THEN** the system SHALL select `total_amount` using stronger labeling and validation rules so totals are less likely to be confused with supporting amounts

#### Scenario: Selected core value fails validation
- **WHEN** a chosen merchant, date, or total value fails basic validation such as numeric-only merchant name, unparseable date, or non-positive total
- **THEN** the system SHALL set that field to `null` or keep a lower-confidence review hint instead of persisting an invalid top-level value

### Requirement: Optional receipt fields are persisted when confidence is practical
The system SHALL attempt to extract optional structured receipt fields including `subtotal_amount`, `tax_amount`, `discount_amount`, `service_charge`, `payment_method`, `receipt_number`, `merchant_address`, `merchant_phone`, `cashier_name`, `time_in`, `time_out`, and `items`, while leaving them `null` or omitted when confidence is weak.

#### Scenario: Optional labeled fields are clearly present
- **WHEN** OCR text contains practical label or layout cues for optional receipt fields
- **THEN** the extraction output SHALL persist those optional fields in `extracted_json` with confidence and trace metadata

#### Scenario: Receipt layout is too noisy for optional fields
- **WHEN** OCR content does not support safe optional-field selection
- **THEN** the system SHALL omit those fields or set them to `null` without degrading the current review workflow

### Requirement: Item rows are extracted conservatively
The system SHALL support simple line-item extraction for receipts that resemble row-based item listings, while falling back safely when layout quality is too poor.

#### Scenario: Receipt contains simple row-like items
- **WHEN** OCR lines resemble stable line-item rows with recognizable name and amount structure
- **THEN** the extraction output SHALL persist `items[]` entries with fields such as `name`, `quantity`, `unit_price`, and `line_total` where confidence is practical

#### Scenario: Receipt layout is ambiguous
- **WHEN** OCR lines cannot be separated into reliable item rows
- **THEN** the system SHALL leave `items[]` empty or omit it instead of generating misleading item data

### Requirement: Extraction output includes field-level confidence and traceability
The system SHALL persist compact confidence and source-trace metadata for extracted fields so review consumers can understand which OCR content influenced a selected value.

#### Scenario: Field is extracted successfully
- **WHEN** the system selects a value for a field such as merchant name, transaction date, total amount, or payment method
- **THEN** `extracted_json` SHALL include field-level confidence and practical source-line or trace metadata for that field

#### Scenario: Field needs manual review
- **WHEN** a field remains ambiguous or low confidence after scoring and validation
- **THEN** `extracted_json` SHALL identify that field in a review hint structure such as `needs_review_fields`

### Requirement: Persisted extraction remains compatible with the current review flow
The system SHALL keep writing top-level extraction columns to `receipt_extractions` and SHALL extend `extracted_json` in a backward-compatible way that preserves the current review page and confirm-to-finance flow.

#### Scenario: Rich extraction is persisted
- **WHEN** extraction completes successfully
- **THEN** the top-level columns `merchant_name`, `transaction_date`, `total_amount`, `tax_amount`, `currency`, `confidence_score`, and `review_status` SHALL remain populated in a review-safe way while richer optional data is stored in `extracted_json`

#### Scenario: Frontend loads a richer extraction payload
- **WHEN** the review page loads a receipt with enriched `extracted_json`
- **THEN** the frontend SHALL remain null-safe, preserve the existing editable confirmation flow, and expose optional extracted fields only when available
