# Validation Report

## Commands Run

```powershell
docker run --rm -e PYTHONPATH=/workspace/microservices/receipt-service -v "d:\School_Proj\DO_AN_CHUYEN_NGANH\AI:/workspace" -w /workspace/microservices/receipt-service ai-receipt-service:local python -m compileall app
docker run --rm -e PYTHONPATH=/workspace/microservices/receipt-service -v "d:\School_Proj\DO_AN_CHUYEN_NGANH\AI:/workspace" -w /workspace/microservices/receipt-service ai-receipt-service:local python /workspace/openspec/changes/improve-vietnamese-receipt-ocr/validation_harness.py
npm.cmd run build
```

## Validation Inputs

- OCR extraction fixtures (inside `validation_harness.py`) covering:
  - clear Vietnamese receipt text
  - blurry/noisy OCR-like text
  - long receipt text
  - subtotal/VAT/discount/total labeled text
- Preprocessing image cases generated in harness:
  - clear
  - blurry
  - rotated 90 degrees
  - long stacked receipt
- Workflow regression harness (real DB session + stub OCR + stub finance handoff):
  - enqueue parse job
  - worker claim + process
  - review feedback update
  - confirm transaction
  - ownership enforcement check

## Results

### Build and Type Safety

- `receipt-service` compile (`python -m compileall app`): pass
- `frontend` build (`npm.cmd run build`): pass

### 4.1 Parse Flow Coverage

- Clear Vietnamese fixture: pass
  - merchant, date, total extracted
- Blurry/noisy fixture: pass
  - date and total extracted, optional fields remain nullable
- Long receipt fixture: pass
  - total and VAT extracted, missing fields remain nullable
- Subtotal/VAT/discount fixture: pass
  - final total selected correctly, VAT extracted

Preprocessing metadata confirms pipeline behavior on required image types:

- `clear`: resize + CLAHE + denoise + sharpen + deskew pipeline applied
- `blurry`: same normalization pipeline applied with deskew detection
- `rotated`: `rotated_90=true` and normalized output portrait-oriented
- `long`: safe long-edge resize (`resized_to=[427,2200]`) without aggressive collapse

### 4.2 Regression Check (Upload/Parse/Review/Feedback/Confirm/Auth Ownership)

Observed harness summary:

```text
status_after_parse=ready_for_review
status_after_feedback=reviewed
status_after_confirm=confirmed
finance_transaction_id=txn-validation-vi-1
ownership_enforced=true
```

Result: pass for async parse pipeline, review feedback update path, confirm flow, finance handoff contract shape, and authenticated ownership guard.

### 4.3 Acceptance Criteria Confirmation

- Vietnamese-first OCR strategy: pass
  - `OCRService` now initializes `ocr_primary_language=vi` first and only falls back when low-confidence / low-quality heuristics trigger.
- Improved Vietnamese text quality: pass
  - Post-processing normalization examples:
    - `HOA DON` → `HÓA ĐƠN`
    - `cåm on` → `cảm ơn`
    - `hen gp lai` → `hẹn gặp lại`
    - `THANH TOAN` → `THANH TOÁN`
  - Measurable improvement in harness example set: **4/5 lines corrected**.
- Optional fields non-blocking: pass
  - optional extracted fields remain nullable when weak/missing.
- Missing fields nullable (no unsafe defaults): pass
  - fixtures and workflow keep absent fields as `null` instead of fabricating values.

## Notes

- Validation harness uses stubbed OCR payload and stubbed finance transaction call for deterministic workflow verification while keeping the real async queue/worker orchestration intact.
- Warnings from runtime dependencies (`requests`/`ccache`) are non-blocking for this change.
