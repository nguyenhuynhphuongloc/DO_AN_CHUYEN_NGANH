## ADDED Requirements

### Requirement: Shared OCR core accepts a receipt file and optional category context
The system SHALL provide a reusable `Receipt OCR Core` workflow that accepts a binary receipt upload in the `receipt` property and MAY accept caller-provided `categories_json` for category matching.

#### Scenario: Core receives a valid receipt and category context
- **WHEN** a parent workflow invokes `Receipt OCR Core` with an image binary named `receipt` and a valid `categories_json` string
- **THEN** the core continues OCR processing using that category context without requiring any database lookup

#### Scenario: Core receives a valid receipt without categories
- **WHEN** a parent workflow invokes `Receipt OCR Core` with a valid image binary and no `categories_json`
- **THEN** the core continues OCR processing and returns structured OCR data with a category warning or null category fields instead of failing only because categories were omitted

### Requirement: Shared OCR core returns a stable structured OCR payload
The system SHALL return a structured OCR object from `Receipt OCR Core` that always includes `merchant_name`, `transaction_datetime`, `total_amount`, `tax_amount`, `currency`, `payment_method`, `ai_suggested_category`, `ai_suggested_category_id`, `warnings`, and `needs_review`.

#### Scenario: Tax is not present in the provider result
- **WHEN** OCR succeeds but the provider does not return a usable tax value
- **THEN** the core still returns `tax_amount` with a null or zero value and does not omit the key

#### Scenario: Low-confidence extraction is still usable
- **WHEN** OCR produces usable merchant, date, and total values but one or more fields have weak confidence or unmatched category data
- **THEN** the core returns the structured OCR payload with one or more warning entries and `needs_review` set to `true`

### Requirement: Shared OCR core remains stateless and provider-independent at its contract boundary
The system MUST NOT persist OCR data, MUST NOT call `finance-service`, MUST NOT store raw OCR payloads, and MUST expose only normalized structured OCR data or structured errors to calling workflows.

#### Scenario: OCR completes successfully
- **WHEN** `Receipt OCR Core` finishes a successful extraction
- **THEN** it returns only normalized structured OCR data to the caller and does not write transaction or receipt state to another system

#### Scenario: OCR provider fails
- **WHEN** Veryfi fails before producing a usable extraction
- **THEN** the core returns a structured OCR error to the caller and does not expose raw provider credentials or require the caller to understand provider-specific response fields

### Requirement: Shared OCR core matches categories against caller-provided category data
The system SHALL attempt category suggestion by matching extracted OCR signals against categories supplied in `categories_json`, and SHALL return both `ai_suggested_category` and `ai_suggested_category_id` when a match is found.

#### Scenario: Category match succeeds
- **WHEN** OCR extraction produces merchant or line-item signals that match one category in `categories_json`
- **THEN** the core returns that category's display name in `ai_suggested_category` and its identifier in `ai_suggested_category_id`

#### Scenario: Category match is unavailable
- **WHEN** `categories_json` is invalid, empty, or produces no confident match
- **THEN** the core returns a structured OCR payload with unmatched category fields and a warning instead of failing the request solely because category matching was inconclusive
