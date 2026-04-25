## Rollout Notes

- The primary parser path now targets Veryfi through `receipt_parser_service.py`.
- Local OCR modules remain in the repository as legacy code, but startup and worker runtime now validate the Veryfi parser path instead of warming local OCR as the primary engine.
- Frontend review now surfaces parser text and structured JSON alongside the editable confirmation form.

## Validation Status

- `py -m compileall microservices/receipt-service/app`: pass
- `$env:PYTHONPATH='microservices/receipt-service'; py -m unittest discover -s microservices/receipt-service/tests -p "test_veryfi_*.py"`: pass
- `$env:PYTHONPATH='microservices/receipt-service'; py -m unittest microservices.receipt-service.tests.test_receipt_review_and_confirm_flow`: pass
- `$env:PYTHONPATH='microservices/receipt-service'; py -m unittest discover -s microservices/receipt-service/tests -p "test_*.py"`: pass

## Automated Validation Matrix

The remaining validation work for this change is now covered by fixture-driven automated tests instead of only ad hoc manual checks:

| Scenario | Coverage | Expected outcome |
|----------|----------|------------------|
| Clean receipt | `test_veryfi_validation_matrix.py::test_representative_receipt_payloads[clean_receipt]` | Normalized fields are populated without review-required core fields |
| Long receipt | `test_veryfi_validation_matrix.py::test_representative_receipt_payloads[long_receipt]` | Long line-item lists remain readable and items are preserved in structured output |
| Noisy receipt | `test_veryfi_validation_matrix.py::test_representative_receipt_payloads[noisy_receipt]` | Parser text is preserved and stable normalized fields are still produced |
| Missing-field receipt | `test_veryfi_validation_matrix.py::test_representative_receipt_payloads[missing_fields_receipt]` | Nullable fields remain `null` and `needs_review_fields` flags the missing core data |
| Provider retry / failure | `test_veryfi_parser_service.py`, `test_veryfi_parse_pipeline.py` | Retryable provider errors are retried, auth errors map cleanly, and parse jobs fail safely without local OCR fallback |
| Review override before confirm | `test_receipt_review_and_confirm_flow.py::test_save_feedback_overrides_autofilled_values_without_creating_transaction` | User feedback updates normalized fields and does not create a finance transaction |
| Confirm-to-transaction persistence | `test_receipt_review_and_confirm_flow.py`, `test_veryfi_parse_pipeline.py` | Explicit confirm creates the finance transaction and persists user-confirmed fields plus transaction linkage |

## Outstanding Validation Blockers

- Live Veryfi validation against production credentials remains an operational rollout check, but automated representative-payload coverage and confirm-flow tests now provide sufficient implementation validation for this change.

## Follow-up Stabilization Items

- Run the parse flow against representative real receipts after providing `VERYFI_CLIENT_ID`, `VERYFI_CLIENT_SECRET`, `VERYFI_USERNAME`, and `VERYFI_API_KEY`.
- Verify the returned Veryfi payload shape against real receipts and tighten field mapping where provider output differs from the assumptions used in the first normalizer pass.
- Run frontend build/type validation in the intended Node environment and confirm the parser panel renders correctly with real API responses.
