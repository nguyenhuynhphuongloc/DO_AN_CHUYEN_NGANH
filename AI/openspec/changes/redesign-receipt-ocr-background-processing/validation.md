## Validation Summary

### Commands run

- `python -m compileall app` in `microservices/receipt-service`
- `npm.cmd run build` in `microservices/frontend`
- Direct receipt-service validation script using the real sample files in `tmp_receipt_tests/` and `bill-test/`
- `python` GPU capability probe with `paddle.is_compiled_with_cuda()` and `paddle.device.cuda.device_count()`

### Runtime observations

- CPU OCR initialization succeeded and processed receipt jobs asynchronously.
- Local GPU capability probe reported:
  - `is_compiled_with_cuda=false`
  - `cuda_device_count=0`
- On this machine, GPU OCR is therefore not available and the worker must fall back to CPU.

### Sample receipt results

| Case | Upload returned immediately | Final job state | Final receipt state | OCR device | Result |
| --- | --- | --- | --- | --- | --- |
| Clear receipt | Yes, queued | `ready_for_review` | `ready_for_review` | `cpu` | Pass |
| Blurry receipt | Yes, queued | `ready_for_review` | `ready_for_review` | `cpu` | Pass |
| Long receipt | Yes, queued | `ready_for_review` | `ready_for_review` | `cpu` | Pass |
| Invalid input (`invalid.txt`) | Yes, queued | `failed` | `failed` | N/A | Pass |

### Additional flow checks

- Duplicate control:
  - `POST /receipts/{id}/parse` without `force` did not create a second job after a successful parse.
- Forced rerun:
  - `POST /receipts/{id}/parse?force=true` queued a new parse job and completed successfully.
- Feedback flow:
  - Receipt moved to `reviewed`.
- Confirm flow:
  - Receipt moved to `confirmed`.
  - Mocked finance transaction id was returned unchanged.

### Logs and noteworthy issues

- Validation caught a real compatibility issue during implementation: the installed `paddleocr` version rejected the old `use_gpu` argument. The OCR service was updated to use device-based initialization.
- A second local rerun after package installation exposed a Windows-specific `torch` DLL issue during a fresh `paddleocr` import path. The successful async OCR validation run completed before that environment problem surfaced, and the repository code was kept focused on runtime-safe OCR device selection and CPU fallback rather than local global Python repair.

### Pass/Fail outcome

- Async upload and parse queueing: Pass
- Worker job processing: Pass
- OCR persistence and nullable extraction flow: Pass
- Duplicate control and forced rerun: Pass
- Confirm-to-finance behavior: Pass
- GPU-enabled execution on this host: Not available
- CPU fallback on this host: Pass
