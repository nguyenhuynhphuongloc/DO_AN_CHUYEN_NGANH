# receipt-ocr-e2e-consistency Specification

## Purpose
TBD - created by archiving change finalize-ocr-e2e-module. Update Purpose after archive.
## Requirements
### Requirement: The OCR module uses one canonical success contract end to end
The system SHALL keep the successful OCR response contract exactly as `total_amount`, `currency`, `transaction_datetime`, `merchant_name`, `payment_method`, and `ai_suggested_category`, and all downstream review and finance-save flows SHALL consume those exact OCR field names without redefining them.

#### Scenario: Frontend consumes the OCR response without remapping canonical field names
- **WHEN** the OCR webhook returns a successful normalized response
- **THEN** the frontend review module reads the canonical OCR fields directly and does not require alternate backend-specific field names

### Requirement: Reviewed receipt submissions extend the OCR contract predictably
The system SHALL represent user-confirmed OCR transaction submissions by preserving the canonical OCR fields and adding explicit confirmation fields such as the final selected wallet, final selected category, and note before sending the save request to `finance-service`.

#### Scenario: Confirmed OCR transaction is submitted after user edits
- **WHEN** a user edits OCR output and submits the confirmed OCR form
- **THEN** the save request contains the canonical OCR fields plus explicit confirmation fields rather than replacing or renaming the OCR contract

### Requirement: User-correctable failures use a consistent structured error shape
The system SHALL expose user-correctable OCR, finance-data loading, and save failures as structured JSON responses containing at least `error_code` and `message`, and the frontend SHALL display the returned message when available.

#### Scenario: Structured backend error is shown in the UI
- **WHEN** the OCR or save endpoint returns a structured error response
- **THEN** the frontend displays the provided `message` and keeps the failure associated with the correct request stage
