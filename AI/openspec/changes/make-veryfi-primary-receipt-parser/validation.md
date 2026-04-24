## Rollout Notes

- The primary parser path now targets Veryfi through `receipt_parser_service.py`.
- Local OCR modules remain in the repository as legacy code, but startup and worker runtime now validate the Veryfi parser path instead of warming local OCR as the primary engine.
- Frontend review now surfaces parser text and structured JSON alongside the editable confirmation form.

## Validation Status

- `py -m compileall microservices/receipt-service/app`: pass
- `py -m unittest discover -s microservices/receipt-service/tests -p "test_veryfi_*.py"`: pass with 2 skipped tests

## Outstanding Validation Blockers

- End-to-end Veryfi validation against real receipts is still pending because it requires valid Veryfi credentials and a configured runtime environment with the `veryfi` SDK dependencies installed.
- Integration-style tests that import the full parse pipeline are skipped in the local Windows Python environment because required runtime packages such as `pydantic-settings` and `sqlalchemy` are not installed there.

## Follow-up Stabilization Items

- Run the parse flow against representative real receipts after providing `VERYFI_CLIENT_ID`, `VERYFI_CLIENT_SECRET`, `VERYFI_USERNAME`, and `VERYFI_API_KEY`.
- Verify the returned Veryfi payload shape against real receipts and tighten field mapping where provider output differs from the assumptions used in the first normalizer pass.
- Run frontend build/type validation in the intended Node environment and confirm the parser panel renders correctly with real API responses.
