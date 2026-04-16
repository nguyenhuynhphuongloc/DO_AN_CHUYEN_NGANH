# Validation Summary

## Root Cause Of The Previous OCR Latency

The long OCR latency was caused by three issues acting together:

1. The running `receipt-worker` container was CPU-only in practice.
   - Before the fix, live runtime inspection showed:
     - `paddle.is_compiled_with_cuda() == false`
     - `paddle.device.cuda.device_count() == 0`
     - no `/dev/nvidia*` devices in the container
     - Docker inspect showed `HostConfig.Runtime = "runc"` and `DeviceRequests = null`
   - Worker logs also showed: `GPU OCR requested but CUDA runtime is unavailable; using CPU`.

2. The fast path was still resolving to a heavy detector.
   - Before the fix, worker logs showed `Creating model: ('PP-OCRv5_server_det', None)` on the fast path.
   - That meant the "fast" path was not actually using a lightweight detector.

3. The fast-path acceptance gate was too loose.
   - Real user evidence showed a bad Vietnamese OCR result (`HÓA ĐON`, `THANH TON`, broken merchant/address/footer text) being accepted with `recovery_path: null`.
   - The old gate mostly accepted output when amount/date-like data existed, even when header/footer Vietnamese text quality was poor.

## GPU Enablement Evidence

### Before

- Host GPU existed and was healthy:
  - `nvidia-smi` worked on the host and reported an NVIDIA GeForce RTX 3060.
- Container runtime did not expose GPU:
  - `docker inspect ai-receipt-worker-1 --format "{{json .HostConfig.DeviceRequests}}"` returned `null`.
  - Live container check returned:

```json
{
  "compiled_with_cuda": false,
  "cuda_device_count": 0,
  "env_cuda_visible_devices": null,
  "env_nvidia_visible_devices": null
}
```

### After

Receipt containers were rebuilt with:

- GPU-capable Paddle package:
  - `paddlepaddle-gpu==3.0.0`
- Docker GPU device request:
  - `gpus: all`
- NVIDIA env:
  - `NVIDIA_VISIBLE_DEVICES=all`
  - `NVIDIA_DRIVER_CAPABILITIES=compute,utility`
- `OCR_DEVICE=gpu`

Live container verification after the fix:

```json
{
  "compiled_with_cuda": true,
  "cuda_device_count": 1,
  "cuda_visible_devices": null,
  "nvidia_visible_devices": "all"
}
```

`docker inspect ai-receipt-worker-1 --format "{{json .HostConfig.DeviceRequests}}"` returned:

```json
[{"Driver":"","Count":-1,"DeviceIDs":null,"Capabilities":[["gpu"]],"Options":null}]
```

Conclusion: OCR is now running with a CUDA-capable Paddle runtime and the worker container has an NVIDIA GPU device request attached.

## Fast-Path Model Evidence

After the fix, runtime metadata from the worker-replayed OCR run showed:

```json
{
  "profile": "fast",
  "engine_device": "gpu",
  "text_detection_model_name": "PP-OCRv5_mobile_det",
  "text_recognition_model_name": "latin_PP-OCRv5_mobile_rec",
  "use_doc_orientation_classify": false,
  "use_doc_unwarping": false,
  "use_textline_orientation": false,
  "limit_side_len": 1536
}
```

Recovery path metadata showed:

```json
{
  "profile": "recovery",
  "engine_device": "gpu",
  "text_detection_model_name": "PP-OCRv5_server_det",
  "text_recognition_model_name": "en_PP-OCRv5_mobile_rec",
  "use_doc_orientation_classify": true,
  "use_doc_unwarping": true,
  "use_textline_orientation": true,
  "limit_side_len": 2048
}
```

Conclusion: the fast path no longer unintentionally uses `PP-OCRv5_server_det`; the heavy detector is now isolated to recovery.

## Before / After Timing Evidence

### Real user evidence before the fix

For a Vietnamese receipt that still produced degraded text quality, the recorded parse timings were:

```json
{
  "fast_path": {
    "ocr_seconds": 181.4678,
    "extraction_seconds": 0.0752,
    "preprocess_seconds": 0.3081
  },
  "recovery_path": null,
  "queue_delay_seconds": 1.0705,
  "total_parse_seconds": 182.9216
}
```

Observed text quality remained poor:

- `HÓA ĐON` instead of `HÓA ĐƠN`
- `THANH TON` instead of `THANH TOÁN`
- broken merchant/address lines
- corrupted footer diacritics

### Equivalent local validation after the fix

Validation was run inside the live GPU-enabled worker container against the repo’s local Vietnamese receipt fixtures in `tmp_receipt_tests/`.

#### Clear receipt, cold first run

```json
{
  "preprocess_seconds": 0.1022,
  "ocr_seconds": 22.5574,
  "extraction_seconds": 0.0007,
  "total_seconds": 22.6604,
  "device": "gpu",
  "detector": "PP-OCRv5_mobile_det",
  "recognizer": "latin_PP-OCRv5_mobile_rec",
  "recovery_needed": false
}
```

Notes:
- The cold run still includes first-time model materialization inside the fresh container.
- That cold-start cost is no longer CPU-bound and is dramatically lower than the previous 181 second evidence.

#### Clear receipt, warm run

```json
{
  "preprocess_seconds": 0.0785,
  "ocr_seconds": 0.1841,
  "extraction_seconds": 0.0003,
  "total_seconds": 0.2629,
  "device": "gpu",
  "detector": "PP-OCRv5_mobile_det",
  "recognizer": "latin_PP-OCRv5_mobile_rec",
  "recovery_needed": false
}
```

Warm-path OCR is now sub-second on the equivalent clear sample.

#### Blurry receipt, warm run

```json
{
  "fast": {
    "preprocess_seconds": 0.0901,
    "ocr_seconds": 0.2205,
    "extraction_seconds": 0.0002,
    "total_seconds": 0.3108,
    "recovery_needed": true,
    "recovery_reasons": [
      "fragmented_header_lines",
      "fragmented_line_output",
      "low_confidence",
      "missing_total_amount",
      "orientation_corrected",
      "short_ocr_output",
      "too_few_detected_lines",
      "weak_header_quality"
    ]
  },
  "recovery": {
    "preprocess_seconds": 0.1196,
    "ocr_seconds": 1.6261,
    "extraction_seconds": 0.0
  }
}
```

Conclusion:
- bad fast-path OCR is no longer silently accepted just because a receipt exists
- fragmented/garbled output now triggers recovery automatically

## What Changed In Code

- `app/services/ocr_service.py`
  - explicit fast detector/recognizer model names
  - explicit recovery model names
  - runtime/device/CUDA/model/flag instrumentation
  - lazy engine initialization so fast primary loads before heavier engines

- `app/services/parse_pipeline.py`
  - persisted runtime/model/line-count/box-count metadata
  - tighter quality gate using corruption, fragmentation, header quality, merchant weakness, line count, and orientation in context

- `app/services/image_preprocess.py`
  - added explicit input image size metadata

- `app/api/receipts.py`
- `app/schemas/receipt.py`
- `frontend/lib/types.ts`
- `frontend/components/receipt-ocr-text-panel.tsx`
  - surfaced the new debug/runtime metadata in API/UI

- `microservices/receipt-service/Dockerfile`
  - configurable Paddle install command for CPU vs GPU runtime

- `docker-compose.gpu.yml`
  - GPU override for `receipt-service` and `receipt-worker`

## Remaining Trade-Offs / Limitations

1. First-run model download still costs time.
   - The first OCR call in a fresh container still downloads or hydrates official Paddle models if the container cache is empty.
   - Warm-path timings are the relevant steady-state latency.

2. Recovery quality still needs further tuning on some synthetic fixtures.
   - In the synthetic blurry/missing fixtures used here, recovery path sometimes returned empty output.
   - This change was focused on the confirmed root causes: CPU fallback, heavy fast-path detector, and overly loose quality gating.

3. The exact failing user receipt was not replayed via the authenticated API in this session.
   - Validation used equivalent local Vietnamese fixtures and live worker-container runtime checks instead.

## Result

- Previous bottleneck: CPU-only OCR runtime + unintended `PP-OCRv5_server_det` on fast path + loose quality gate.
- Current runtime: NVIDIA GPU enabled and confirmed in the live worker container.
- Current fast path: explicit `PP-OCRv5_mobile_det` + `latin_PP-OCRv5_mobile_rec`.
- Current gate: blurred/fragmented OCR now triggers recovery instead of being accepted as a successful fast parse.
