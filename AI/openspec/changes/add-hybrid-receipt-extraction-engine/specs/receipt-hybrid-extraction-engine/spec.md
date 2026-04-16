## ADDED Requirements

### Requirement: Hybrid extraction pipeline stages
The system SHALL process receipt extraction through a layered hybrid pipeline that normalizes OCR text, builds soft logical zones, generates field candidates, scores and ranks candidates, validates selected values, and persists structured output without changing the existing async OCR worker architecture.

#### Scenario: Async parse uses the hybrid pipeline
- **WHEN** a queued receipt parse job reaches the extraction stage after OCR completes
- **THEN** the receipt-service MUST execute the hybrid extraction stages in order before persisting `receipt_extractions`

#### Scenario: Imperfect zoning does not fail extraction
- **WHEN** OCR lines do not map cleanly into header, metadata, item, summary, or footer zones
- **THEN** the extraction pipeline MUST continue with heuristic fallback behavior instead of failing the parse job solely because zoning is imperfect

### Requirement: OCR normalization and preservation
The system SHALL normalize OCR text for extraction use while preserving the original OCR `raw_text`, OCR lines, and OCR debug payloads exactly as captured from the OCR stage.

#### Scenario: Normalized extraction text is additive
- **WHEN** the extraction pipeline normalizes whitespace, separators, punctuation corruption, or payment-method tokens
- **THEN** it MUST store normalized data separately from the original OCR payload and MUST NOT overwrite the persisted OCR debug content

#### Scenario: Common OCR corruption is normalized safely
- **WHEN** OCR output contains noisy whitespace, corrupted amount separators, corrupted date or time separators, or common payment tokens such as `cash`, `visa`, `mastercard`, `momo`, or `qr`
- **THEN** the normalization stage MUST make those signals easier to extract without inventing new receipt values

### Requirement: Candidate-based core field selection
The system SHALL generate, score, and rank candidates for `merchant_name`, `transaction_date`, `total_amount`, and `currency` using multiple practical signals instead of a single first-match or largest-number rule.

#### Scenario: Merchant is selected from strong header evidence
- **WHEN** the receipt header contains multiple candidate lines such as a merchant name, website, phone number, invoice label, or promo slogan
- **THEN** the system MUST prefer merchant-like header lines and MUST exclude obvious website, phone, invoice-label, and promo candidates from winning by default

#### Scenario: Date supports real-world separator variation
- **WHEN** OCR output includes date or time strings with mixed or corrupted separators
- **THEN** the system MUST attempt practical normalization and parsing before leaving `transaction_date` null

#### Scenario: Total is not selected by largest amount alone
- **WHEN** the receipt contains subtotal, tax, service charge, discount, tendered cash, change, and total-like lines
- **THEN** the system MUST rank total candidates using contextual heuristics and MUST NOT rely only on the largest amount anywhere on the receipt

### Requirement: Optional structured receipt fields
The system SHALL support nullable optional receipt fields and line items inside `extracted_json` without forcing unsupported or weak values into the output.

#### Scenario: Optional summary fields are emitted when strong
- **WHEN** the receipt contains strong evidence for fields such as `subtotal_amount`, `tax_amount`, `discount_amount`, `service_charge`, `payment_method`, or `receipt_number`
- **THEN** the system MUST include those fields in structured extraction output

#### Scenario: Weak optional fields remain null
- **WHEN** optional fields such as `merchant_address`, `merchant_phone`, `cashier_name`, `table_number`, `guest_count`, `time_in`, or `time_out` are weak or ambiguous
- **THEN** the system MUST leave them null or omitted rather than inventing values

#### Scenario: Line items are parsed conservatively
- **WHEN** OCR lines contain plausible row-like item content between metadata and payment summary regions
- **THEN** the system MUST emit `items[]` entries with `name`, `quantity`, `unit_price`, and `line_total` only when the row evidence is strong enough

### Requirement: Business validation and nullable safety
The system SHALL validate selected values before persistence and SHALL prefer nullable fallback behavior over unsafe guesses.

#### Scenario: Invalid totals are rejected
- **WHEN** a selected `total_amount` is non-positive or implausible after validation
- **THEN** the system MUST leave `total_amount` null and mark it for review instead of persisting the invalid value

#### Scenario: Invalid merchant names are rejected
- **WHEN** the best merchant candidate is numeric-only or otherwise fails merchant validation
- **THEN** the system MUST leave `merchant_name` null and keep the receipt review-safe

#### Scenario: Supporting totals are used only when coherent
- **WHEN** subtotal, tax, discount, service charge, and total are all present
- **THEN** the system MUST treat supporting totals as confidence signals and MUST NOT force inconsistent values into persisted output

### Requirement: Rich structured extraction output
The system SHALL preserve the existing top-level `receipt_extractions` columns while extending `extracted_json` with richer hybrid extraction metadata.

#### Scenario: Top-level columns remain stable
- **WHEN** extraction results are persisted
- **THEN** the system MUST continue writing `merchant_name`, `transaction_date`, `total_amount`, `tax_amount`, `currency`, `confidence_score`, and `review_status` to their current top-level columns

#### Scenario: Hybrid metadata is persisted in extracted_json
- **WHEN** the hybrid extraction pipeline finishes
- **THEN** `extracted_json` MUST include normalized text, optional structured fields, `items`, field-level confidence, source-line or trace metadata, `needs_review_fields`, and an `extraction_version`

### Requirement: Review-safe frontend compatibility
The system SHALL expose richer extraction output in a way that preserves the current editable review and confirm flow.

#### Scenario: Review flow remains intact
- **WHEN** the frontend receives richer extraction output
- **THEN** the current review page MUST remain editable, null-safe, and compatible with the existing confirm-to-finance workflow

#### Scenario: Future suggestion inputs are preserved
- **WHEN** extraction output is returned to the frontend
- **THEN** it MUST preserve access to merchant name, payment method, item data, and description-like extraction text for future suggestion features

### Requirement: Validation coverage across receipt styles
The system SHALL be validated against multiple receipt styles rather than a single tuned sample.

#### Scenario: Hybrid validation set is recorded
- **WHEN** the change is prepared for implementation review
- **THEN** validation notes MUST cover clear retail, restaurant subtotal/SVC/VAT, blurry, long, payment-method, footer-heavy, missing-merchant, and OCR-corrupted receipts with pass or fail outcomes
