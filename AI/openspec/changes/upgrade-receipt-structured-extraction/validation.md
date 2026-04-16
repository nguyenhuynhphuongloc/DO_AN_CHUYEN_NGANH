# Validation Report

## Commands Run

```powershell
python -m compileall app
npm.cmd run build
@'
import json
from pathlib import Path
from app.services.extraction_service import extract_all
fixtures = json.loads((Path.cwd().parents[1] / 'tmp_receipt_tests' / 'extraction-fixtures.json').read_text(encoding='utf-8'))
for fixture in fixtures:
    result = extract_all(fixture['lines'], '\n'.join(fixture['lines']))
    print(result['extracted_json']['fields'])
'@ | python -
@'
# async upload -> queued job -> worker parse -> feedback -> confirm harness
# paddle/paddleocr were stubbed in-process to avoid local Torch DLL issues
'@ | python -
```

## Validation Inputs

- `AI/tmp_receipt_tests/extraction-fixtures.json`
- Covered cases:
  - clear simple receipt
  - blurry-like OCR-noisy receipt
  - long receipt
  - clear subtotal/tax/discount receipt
  - receipt with visible payment method
  - noisy receipt with promo/footer text
- Async workflow harness:
  - generated PNG upload
  - mocked OCR payload with realistic receipt lines
  - feedback and confirm flow over the existing receipt API functions

## Results

### Build and Type Safety

- `python -m compileall app`: pass
- `npm.cmd run build`: pass

### Structured Extraction Fixtures

- `clear-simple`: pass
  - merchant: `GREEN CAFE`
  - date: `2026-04-02`
  - total: `85000.0`
  - payment method remains `null` under weak evidence
  - items: `1`
- `blurry-like-ocr-noise`: pass
  - merchant: `MART 88`
  - date: `2026-04-02`
  - total: `45000.0`
  - subtotal: `45000.0`
  - `needs_review_fields` correctly keeps merchant, date, payment method, and total under review
  - items: `2`
- `long-receipt`: pass
  - merchant: `FAMILY RESTAURANT`
  - date: `2026-04-02`
  - total: `254100.0`
  - tax: `23100.0`
  - service charge: `11000.0`
  - payment method: `qr`
  - items: `5`
- `subtotal-tax-discount`: pass
  - merchant: `THE COFFEE HOUSE`
  - date: `2026-04-02`
  - total: `127500.0`
  - optional fields: subtotal `125000.0`, tax `12500.0`, discount `10000.0`, payment method `visa`
  - items: `2`
- `payment-method`: pass
  - merchant: `FRESH MART`
  - date: `2026-04-02`
  - total: `37.5`
  - payment method: `mastercard`
  - items: `2`
  - weak date confidence still correctly surfaces `needs_review_fields=["transaction_date"]`
- `noisy-promo-footer`: pass
  - merchant: `CITY STORE`
  - date: `2026-04-03`
  - total: `60000.0`
  - service charge: `5000.0`
  - phone: `0123 456 789`
  - items: `1`
  - payment method remains `null` under weak evidence

### Async Flow Regression Check

- Upload returned immediately with receipt/job status `queued`: pass
- Worker processing moved receipt to `ready_for_review`: pass
- OCR debug output persisted with `device="cpu"` and line-level content: pass
- Feedback preserved the richer `extracted_json.fields` and `items` structure instead of flattening the payload: pass
- Confirm flow preserved richer extraction metadata and added `finance_transaction_id`: pass

Observed async harness summary:

```text
receipt_status_after_upload=queued
receipt_status_after_worker=ready_for_review
review_status_after_feedback=reviewed
receipt_status_after_confirm=confirmed
ocr_device=cpu
merchant_after_feedback=CITY STORE - VERIFIED
items_count=1
finance_transaction_id=txn-test-1
```

## Follow-up Fixes Applied During Validation

- Tightened phone detection so amount-like strings such as `25000 50000` are no longer treated as merchant phone numbers.
- Fixed feedback/confirm persistence so manual review updates merge into `extracted_json.fields` instead of overwriting the structured extraction payload.
- Added practical OCR-noise normalization for labels such as `t0tal`, `sub t0tal`, and `inv0ice`, and changed amount tie-breaking so higher-confidence, larger total candidates win over item-line numbers.

## Pass/Fail Summary

- Clear receipt: pass
- Blurry receipt: pass
- Long receipt: pass
- Subtotal/tax/discount receipt: pass
- Receipt with visible payment method: pass
- Noisy receipt with promo/footer text: pass
- Async parse and confirm-to-finance regression check: pass with in-process OCR stubbing

## Notes

- This change preserved the async OCR queue/worker architecture and focused on the extraction layer and payload shape.
- The host Python environment still has a real `paddleocr` import path risk caused by a local Torch DLL issue, so the async regression harness intentionally stubbed PaddleOCR in-process for deterministic validation.
