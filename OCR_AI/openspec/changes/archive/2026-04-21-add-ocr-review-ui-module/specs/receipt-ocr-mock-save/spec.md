## ADDED Requirements

### Requirement: The mock save endpoint accepts reviewed OCR submissions
The system SHALL expose a mock save endpoint that accepts the reviewed receipt payload including normalized OCR fields, final category, and notes so persistence can be simulated without a real backend database.

#### Scenario: Reviewed receipt is submitted to the mock API
- **WHEN** the user submits reviewed receipt data from the UI module
- **THEN** the mock save endpoint accepts the request payload and returns a successful persistence simulation response

### Requirement: The mock save response confirms a stable saved result
The system SHALL return a structured success response from the mock save endpoint that confirms the reviewed receipt was saved and provides a mock identifier or equivalent confirmation data.

#### Scenario: Mock save returns confirmation
- **WHEN** the mock save endpoint handles a valid reviewed receipt request
- **THEN** the response includes a clear success indicator and a mock receipt identifier that the UI can use to confirm submission
