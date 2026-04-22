## REMOVED Requirements

### Requirement: The mock save endpoint accepts reviewed OCR submissions
**Reason**: The fixed architecture no longer supports a reviewed-receipt persistence target or mock save path as the intended runtime flow. Confirmed OCR data must be handed directly to `finance-service` for transaction creation.
**Migration**: Replace mock reviewed-receipt submissions with confirmed transaction requests to `POST /transactions/confirmed-ocr` and remove dependencies on receipt-save service behavior.

### Requirement: The mock save response confirms a stable saved result
**Reason**: The canonical success contract is now confirmed finance transaction creation, not a simulated saved receipt result with receipt-specific identifiers.
**Migration**: Update tests, docs, and fixtures to assert transaction-oriented success payloads and remove `receipt_id`-based expectations.
