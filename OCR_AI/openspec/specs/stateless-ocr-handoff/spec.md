# stateless-ocr-handoff Specification

## Purpose
TBD - created by archiving change add-neon-microservices-architecture. Update Purpose after archive.
## Requirements
### Requirement: OCR remains stateless in the new architecture
The system SHALL keep OCR as a stateless integration flow that processes receipt input and returns important extracted fields to the frontend without creating OCR database persistence.

#### Scenario: OCR extraction completes successfully
- **WHEN** a receipt is processed through the OCR flow
- **THEN** the OCR layer returns the important extracted fields to the frontend and does not persist raw OCR output or receipt lifecycle state

### Requirement: Confirmed OCR data is handed off to finance-service
The system SHALL treat the frontend as the confirmation step for OCR output, and after confirmation the frontend SHALL submit the reviewed result directly to finance-service instead of any receipt-specific save service.

#### Scenario: Frontend confirms OCR result
- **WHEN** a user reviews and confirms OCR output in the frontend
- **THEN** the confirmed payload is sent to finance-service for transaction persistence

### Requirement: The architecture supersedes the old receipt-persistence direction
The system MUST NOT continue the old design direction around `receipt-save-service`, `receipt_reviews`, `ocr-audit-service`, `receipt_db`, or OCR persistence tables as the intended target architecture for this project.

#### Scenario: Developer reviews the microservice target structure
- **WHEN** a developer follows the new microservice architecture
- **THEN** the implementation target consists of `auth-service`, `finance-service`, and a stateless OCR handoff flow rather than receipt-centric persistence services

