## ADDED Requirements

### Requirement: Admin can inspect receipt OCR history
The system SHALL let admins inspect receipt/OCR history for support, audit, and debugging.

#### Scenario: Admin opens OCR receipt detail
- **WHEN** an admin opens an OCR receipt detail from the admin interface
- **THEN** the system displays the receipt image, linked transaction, parsed receipt fields, reviewed fields, line items or raw OCR details when available, category suggestion state, and owner context

#### Scenario: Normal user opens admin receipt detail
- **WHEN** a normal user requests an admin receipt/OCR detail route or API
- **THEN** the system denies access

### Requirement: Admin receipt list supports audit filters
The system SHALL provide filters for admin receipt/OCR review.

#### Scenario: Admin filters OCR receipts
- **WHEN** an admin filters receipts by user, date range, source type, parse status, category resolution, merchant, or amount range
- **THEN** the system returns matching receipt-related records with pagination
