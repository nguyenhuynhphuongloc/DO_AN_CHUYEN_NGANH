# veryfi-primary-receipt-parsing Specification

## Purpose
TBD - created by archiving change make-veryfi-primary-receipt-parser. Update Purpose after archive.
## Requirements
### Requirement: Receipt service SHALL parse receipts through Veryfi as the only primary provider
The system SHALL use Veryfi as the only primary provider for parsing receipt images in the async receipt parsing workflow, and the primary worker path SHALL no longer depend on local OCR plus heuristic extraction to produce the persisted review result.

#### Scenario: Parse job runs for an uploaded receipt
- **WHEN** a queued receipt parse job is claimed by the worker
- **THEN** the worker SHALL call the Veryfi-based primary parser path and SHALL persist the normalized provider result for review

#### Scenario: Provider is unavailable
- **WHEN** the Veryfi request fails due to timeout, authentication failure, request rejection, or temporary provider outage
- **THEN** the parse job SHALL fail cleanly with safe error context and SHALL NOT automatically fall back to a local OCR primary path

### Requirement: Provider output SHALL be normalized into the existing review contract
The system SHALL normalize Veryfi output into the existing receipt extraction contract so that top-level review fields remain stable while richer parser output is stored in structured JSON.

#### Scenario: Provider returns valid receipt data
- **WHEN** Veryfi returns a successful parsed receipt response
- **THEN** the system SHALL map normalized values into top-level receipt extraction fields including merchant name, transaction date, total amount, tax amount, and currency

#### Scenario: Provider returns weak or incomplete fields
- **WHEN** Veryfi omits a critical field or returns a value that fails backend validation
- **THEN** the system SHALL keep the affected field nullable, SHALL preserve review-safe structured output, and SHALL mark the relevant field for user review

### Requirement: Parser persistence SHALL preserve review-first confirmation semantics
The system SHALL persist parse results for review without creating a finance transaction until the user explicitly confirms the autofilled receipt form.

#### Scenario: Parse completes successfully
- **WHEN** the worker finishes parsing a receipt or parse session successfully
- **THEN** the system SHALL store parser results and move the receipt into a review-ready state without creating a finance transaction

#### Scenario: User confirms the reviewed receipt
- **WHEN** the user submits the confirmed receipt form after reviewing or editing the parsed values
- **THEN** the system SHALL create the finance transaction using the submitted values and SHALL persist the confirmation outcome

