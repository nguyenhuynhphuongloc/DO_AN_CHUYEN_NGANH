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
- Covered scenarios:
  - clear retail receipt
  - restaurant receipt with subtotal, SVC, VAT, total, table number, and guest count
  - blurry OCR-like receipt
  - long receipt
  - receipt with visible payment method
  - receipt with strong footer promo text
  - receipt missing an obvious merchant line
  - receipt with OCR-corrupted date and amount separators
- Async regression harness:
  - generated PNG upload
  - mocked OCR payload for a restaurant receipt
  - feedback and confirm flow through the existing receipt API functions

## Results

### Build and Type Safety

- `python -m compileall app`: pass
- `npm.cmd run build`: pass

### Hybrid Extraction Fixtures

- `clear-simple`: pass
  - merchant: `GREEN CAFE`
  - date: `2026-04-02`
  - total: `85000.0`
  - receipt number: `GC-2001`
  - payment method: `cash`
- `restaurant-svc-vat-total`: pass
  - merchant: `SUNSET BISTRO`
  - date: `2026-04-03`
  - subtotal: `290000.0`
  - service charge: `29000.0`
  - tax: `31900.0`
  - total: `350900.0`
  - payment method: `visa`
  - table number: `12`
  - guest count: `4`
- `blurry-like-ocr-noise`: pass
  - merchant remains `null`
  - date: `2026-04-02`
  - total: `45000.0`
  - subtotal: `45000.0`
  - `needs_review_fields` flags merchant and payment method
- `long-receipt`: pass
  - merchant: `FAMILY RESTAURANT`
  - date: `2026-04-02`
  - total: `254100.0`
  - tax: `23100.0`
  - service charge: `11000.0`
  - payment method: `qr`
  - items: `5`
- `payment-method`: pass
  - merchant: `FRESH MART`
  - date: `2026-04-02`
  - total: `37.5`
  - payment method: `mastercard`
- `noisy-promo-footer`: pass
  - merchant: `CITY STORE`
  - date: `2026-04-03`
  - total: `60000.0`
  - service charge: `5000.0`
  - table number: `08`
  - guest count: `2`
  - promo/footer text did not replace the merchant
- `missing-merchant-line`: pass
  - merchant remains `null`
  - date: `2026-04-03`
  - total: `35000.0`
  - receipt number: `M-2001`
  - extraction note: `merchant missing or weak`
- `ocr-corrupted-separators`: pass
  - merchant: `CITY MART`
  - date: `2026-04-03`
  - subtotal: `31000.0`
  - total: `31000.0`
  - payment method: `qr`

### Async Flow Regression Check

- Upload returned immediately and queued a parse job: pass
- Worker processing reached `ready_for_review`: pass
- OCR debug output remained intact and reported `device="cpu"`: pass
- Hybrid extraction payload persisted `table_number`, `guest_count`, and `extraction_version`: pass
- Feedback preserved structured `fields`, `items`, and `extraction_version` metadata: pass
- Confirm flow preserved the hybrid payload and added `finance_transaction_id`: pass

Observed async harness summary:

```text
receipt_status_after_worker=ready_for_review
merchant=SUNSET BISTRO
table_number=12
guest_count=4
payment_method=visa
extraction_version=hybrid-v1
review_status_after_feedback=reviewed
receipt_status_after_confirm=confirmed
```

## Follow-up Fixes Applied During Validation

- Tightened merchant scoring so metadata, summary, payment-method, and item lines cannot win merchant selection by default.
- Tightened `table_number` parsing so unrelated strings no longer match table identifiers.
- Added missing-merchant review notes and hybrid extraction versioning to the persisted payload.

## Pass/Fail Summary

- Clear retail receipt: pass
- Restaurant subtotal/SVC/VAT/total receipt: pass
- Blurry receipt: pass
- Long receipt: pass
- Receipt with visible payment method: pass
- Receipt with strong footer promo text: pass
- Receipt missing obvious merchant line: pass
- Receipt with OCR-corrupted date or amount separators: pass
- Async parse and confirm-to-finance regression check: pass with in-process OCR stubbing

## Notes

- The hybrid extraction engine preserved the async OCR queue and worker architecture.
- The host Python environment still has a real `paddleocr` import risk caused by a local Torch DLL issue, so the async regression harness stubbed PaddleOCR in-process for deterministic verification.
