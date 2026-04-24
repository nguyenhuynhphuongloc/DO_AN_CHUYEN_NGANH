## ADDED Requirements

### Requirement: Chatbot OCR endpoint delegates extraction to the shared OCR core
The system SHALL expose a chatbot-oriented receipt OCR workflow that accepts a receipt upload, forwards optional `categories_json`, invokes `Receipt OCR Core`, and uses the shared core result instead of duplicating OCR logic.

#### Scenario: Chatbot OCR request succeeds
- **WHEN** a chatbot client uploads a valid receipt image to the chatbot OCR endpoint
- **THEN** the endpoint delegates extraction to `Receipt OCR Core` and returns a chatbot-safe response derived from the core result

#### Scenario: Chatbot OCR request fails validation
- **WHEN** a chatbot client submits no receipt or a non-image upload
- **THEN** the endpoint returns a structured validation error without calling the OCR provider directly

### Requirement: Chatbot OCR endpoint returns structured OCR data for conversational use
The system SHALL return chatbot OCR responses that preserve the normalized structured OCR data from the shared core and identify the response as chatbot-mode OCR output.

#### Scenario: Chatbot receives structured OCR result
- **WHEN** shared OCR extraction succeeds for a chatbot request
- **THEN** the endpoint response contains mode metadata and the structured OCR data needed for the chatbot flow without exposing raw provider fields

#### Scenario: Chatbot receives review-needed OCR result
- **WHEN** the shared OCR core returns warnings or `needs_review: true`
- **THEN** the chatbot endpoint still returns the structured OCR result so the conversational flow can decide how to follow up
