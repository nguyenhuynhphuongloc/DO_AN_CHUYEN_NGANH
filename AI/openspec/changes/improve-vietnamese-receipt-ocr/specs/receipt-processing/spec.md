## ADDED Requirements

### Requirement: Vietnamese-first OCR processing
The receipt-service SHALL use a PaddleOCR configuration that recognizes Vietnamese receipt text, including diacritics, while remaining compatible with mixed-language printed receipts and the existing parse pipeline.

#### Scenario: Parse a clear Vietnamese receipt
- **WHEN** a user parses a clear printed Vietnamese receipt image
- **THEN** the service MUST run PaddleOCR with a Vietnamese-capable or multilingual configuration instead of an English-only configuration
- **THEN** the OCR result MUST preserve raw OCR text, line-level output, and confidence data for debugging

#### Scenario: Keep OCR provider unchanged
- **WHEN** the improved OCR pipeline is deployed
- **THEN** the system MUST continue using PaddleOCR as the primary OCR engine for receipt parsing in this flow

### Requirement: Robust receipt image normalization
The receipt-service SHALL preprocess receipt images before OCR to improve recognition quality for rotated, skewed, blurry, noisy, and long printed receipts.

#### Scenario: Parse a rotated or skewed receipt
- **WHEN** the uploaded receipt image is rotated, skewed, or upside down within the practical limits of the image pipeline
- **THEN** the service MUST apply orientation or deskew correction before or during OCR
- **THEN** the resulting OCR debug payload MUST retain preprocessing metadata sufficient to explain the applied corrections

#### Scenario: Parse a blurry or noisy receipt
- **WHEN** the uploaded receipt image has blur, low contrast, or background noise
- **THEN** the preprocessing pipeline MUST apply normalization steps such as grayscale conversion, denoise, and contrast adjustment before OCR
- **THEN** the system MUST preserve a processed image artifact or equivalent debug reference for troubleshooting

#### Scenario: Parse a long receipt safely
- **WHEN** the uploaded receipt is significantly taller than a typical receipt image
- **THEN** the preprocessing pipeline MUST resize it with aspect-ratio preservation and a safe long-edge strategy
- **THEN** the system MUST avoid aggressive shrinking that makes text unreadable

### Requirement: Confidence-aware receipt extraction
The receipt-service SHALL extract receipt fields from OCR output using labeled heuristics and confidence-aware fallbacks instead of positional assumptions or fabricated defaults.

#### Scenario: Determine merchant name without using the first line blindly
- **WHEN** OCR output contains multiple header lines such as merchant name, address, hotline, or tax identifier
- **THEN** the extractor MUST rank merchant candidates using receipt header heuristics
- **THEN** the extractor MUST NOT blindly assign the first OCR line as the merchant name

#### Scenario: Parse Vietnamese-friendly dates
- **WHEN** OCR output contains receipt dates using Vietnamese-friendly formats or OCR-corrupted separators
- **THEN** the extractor MUST support date parsing across slash, dash, dot, and whitespace-separated formats commonly found on Vietnamese receipts
- **THEN** the extractor MUST leave `transaction_date` null when no candidate date is trustworthy

#### Scenario: Distinguish total from subtotal and charges
- **WHEN** OCR output includes subtotal, VAT, service charge, discount, and final total values
- **THEN** the extractor MUST distinguish the final payable total from subtotal and intermediate charges using surrounding labels
- **THEN** the extractor MUST avoid selecting VAT, subtotal, or discount as `total_amount` when a clearer total candidate exists

#### Scenario: Extract tax without stub defaults
- **WHEN** OCR output includes a VAT or tax-labeled amount
- **THEN** the extractor MUST populate `tax_amount` from the recognized tax candidate
- **THEN** the extractor MUST leave `tax_amount` null when no reliable tax amount is found

### Requirement: Extended optional receipt metadata
The receipt-service SHALL populate `extracted_json` with optional extended receipt fields when they are recognized with sufficient confidence, while keeping absent fields nullable or omitted.

#### Scenario: Include optional extended fields
- **WHEN** OCR output contains recognizable optional receipt details
- **THEN** `extracted_json` MUST support optional fields for `merchant_address`, `receipt_number`, `payment_method`, `subtotal_amount`, `discount_amount`, `service_charge`, and `items`
- **THEN** the parse response MUST continue returning existing top-level fields used by the review page

#### Scenario: Low-confidence optional extraction
- **WHEN** an optional field cannot be recognized with acceptable confidence
- **THEN** the service MUST omit that field from `extracted_json` or set it to null
- **THEN** the missing optional value MUST NOT block receipt review or confirmation

### Requirement: Backward-compatible review and confirmation flow
The improved OCR and extraction pipeline SHALL preserve the existing authenticated upload, parse, review, feedback, and confirm workflow and MUST not force unsafe defaults for unknown fields.

#### Scenario: Review receipt with missing date or tax
- **WHEN** a parsed receipt has low confidence for `transaction_date`, `tax_amount`, or optional extended fields
- **THEN** the review page MUST still load and allow manual correction
- **THEN** the system MUST NOT substitute unsafe defaults such as the current date for an unknown receipt date during parsing

#### Scenario: Confirm receipt with optional fields absent
- **WHEN** the user confirms a receipt whose optional extracted fields are absent
- **THEN** the existing confirm-to-finance transaction flow MUST continue working with the required confirmed values
- **THEN** optional extracted fields MUST remain non-blocking for confirmation

#### Scenario: Preserve future suggestion context
- **WHEN** a receipt is parsed successfully
- **THEN** the stored extraction payload MUST retain enough structured context for future category and wallet suggestion features without changing the current confirmation contract
