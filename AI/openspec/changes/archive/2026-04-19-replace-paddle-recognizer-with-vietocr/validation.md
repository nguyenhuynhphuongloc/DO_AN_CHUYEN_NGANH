# Validation Notes

## Static Compatibility

- `py -3 -m py_compile` passed for:
  - `app/core/config.py`
  - `app/services/ocr_pipeline.py`
  - `app/services/ocr_service.py`
  - `app/services/parse_pipeline.py`
  - `app/api/receipts.py`
  - `app/schemas/receipt.py`
  - benchmark/validation scripts

- `microservices/frontend` production build passed with `npm run build`.

This confirms the frontend still accepts the preserved `ocr_debug` shape after the backend changes.

## Runtime Validation

### Benchmark artifacts

Generated:

- `benchmark-results.json`
- `benchmark-summary.md`
- `benchmark-transformer.json`
- `benchmark-transformer.md`
- `validation-results.json`
- `validation-results.md`

### Contract validation

`validate_recognizer_contract.py` ran successfully for both:

- `OCR_RECOGNIZER_BACKEND=paddle`
- `OCR_RECOGNIZER_BACKEND=vietocr`

Results:

- required top-level OCR keys were present for both backends
- `runtime.recognizer_backend` matched the requested backend
- `engine_config.recognizer_backend` matched the requested backend
- extraction still ran successfully in both modes
- frontend-facing payload shape remained compatible

### Row grouping validation

The runtime payload now exposes:

- `ordering.row_grouping_tolerance`
- `ordering.row_tolerance_pixels`
- `ordering.row_count`
- `ordering.row_lengths`
- `ordering.ordered_box_indices`

This was validated on receipt-style layouts in the benchmark and contract scripts.

## Performance / Quality Observations

### On synthetic fixtures

For the included `tmp_receipt_tests` images:

- Paddle recognizer remained faster and more stable on CPU
- VietOCR integration worked end-to-end but was slower and weaker on the tiny synthetic samples

### On `bill-test/bill.jpg`

Detector:

- backend: Paddle
- model: `PP-OCRv5_mobile_det`
- stable in both recognizer modes

Recognizer comparison:

- Paddle:
  - better date extraction on this sample
  - faster on CPU
- VietOCR (`vgg_seq2seq`):
  - contract-compatible
  - extracted total correctly
  - merchant/date drifted compared with Paddle
- VietOCR (`vgg_transformer`):
  - contract-compatible
  - total and merchant remained usable on the sample
  - still slower than Paddle on CPU

## Current Runtime Conclusion

In the validated container run:

- OCR runtime was CPU-only
- Paddle detection worked
- Paddle recognition worked
- VietOCR recognition worked

No GPU success is claimed by this change because the validation run used CPU mode only.

## Remaining Limitations

- VietOCR quality was not universally better on the included sample set.
- Default VietOCR config remains configurable because accuracy/speed trade-offs depend on the receipt dataset.
- GPU-specific VietOCR runtime still needs separate validation on an NVIDIA-enabled host/container combination.
