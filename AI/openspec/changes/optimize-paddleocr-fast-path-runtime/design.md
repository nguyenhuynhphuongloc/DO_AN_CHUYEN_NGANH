## Context

The current session-first receipt pipeline already records parse timings and chooses between fast and recovery OCR profiles, but recent production-like evidence shows the fast path is still too slow and too permissive. Worker logs show `GPU OCR requested but CUDA runtime is unavailable; using CPU`, followed by model creation for `PP-OCRv5_server_det`, `latin_PP-OCRv5_mobile_rec`, `en_PP-OCRv5_mobile_rec`, and multiple document-orientation models. The observed parse completed on the fast path with about 181 seconds of OCR time and visibly corrupted Vietnamese output.

This means there are at least three concrete runtime problems:
- fast path is still using a heavy detector (`PP-OCRv5_server_det`)
- the runtime is actually CPU, not GPU
- the quality gate is accepting output that is still too corrupted for reliable Vietnamese review

## Goals / Non-Goals

**Goals:**
- Make the fast path use a truly lightweight model/configuration.
- Verify with runtime evidence whether OCR is using CPU or NVIDIA GPU.
- Enable GPU when the environment supports it, with explicit proof in logs/debug output.
- Improve debug metadata so model names, device, text box counts, image dimensions, and timings are inspectable.
- Tighten fast-path acceptance so poor Vietnamese OCR quality triggers recovery automatically.

**Non-Goals:**
- Replacing PaddleOCR.
- Reworking the temp-session architecture or confirm flow.
- Claiming GPU success without real runtime evidence.
- Adding AI vision parsing or a cloud OCR dependency.

## Decisions

### 1. Separate model selection from profile naming
Fast path and recovery path will each declare explicit detector and recognizer model names in code and debug metadata rather than relying on implicit Paddle defaults. The fast path must use a mobile/lightweight detector and recognizer pair; recovery can use heavier options only if needed.

Why:
- Current logs prove the fast profile name alone is not enough; the actual detector still resolves to `PP-OCRv5_server_det`.

### 2. Instrument runtime device and OCR topology explicitly
The OCR debug payload and worker logs will record:
- requested device
- actual device used
- whether CUDA is available to Paddle
- whether the container can see NVIDIA devices
- detector and recognizer model names
- whether doc orientation/unwarping/textline orientation are enabled
- number of detected text boxes/lines
- preprocessed image dimensions

Why:
- Without this evidence, latency and device claims remain guesswork.

### 3. Gate fast-path acceptance on text quality, not only extracted totals
Fast-path acceptance will continue considering confidence and critical fields, but it must also reject:
- high garbled-text ratio
- badly fragmented merchant/header lines
- weak merchant candidate quality
- suspicious line fragmentation despite a normal receipt image

Why:
- The current gate allows a receipt through because total/date are present even when Vietnamese text quality is still poor.

### 4. Treat GPU enablement as an environment + packaging problem
GPU usage will only be considered enabled when all of the following are true:
- Docker runtime exposes NVIDIA devices to the receipt containers
- the installed Paddle package supports CUDA
- runtime checks inside the worker confirm CUDA/device visibility
- OCR debug/log output reports actual device `gpu`

Why:
- Current Dockerfile installs `paddlepaddle==3.3.1`, which is typically CPU-oriented in this setup, and Compose does not currently expose GPU resources.

## Risks / Trade-offs

- [GPU cannot be enabled on the host] -> Keep CPU fallback honest, optimize mobile fast-path config, and document the exact blocker.
- [Model selection becomes version-sensitive] -> Emit actual resolved model names in logs/debug so behavior is visible even when Paddle defaults shift.
- [Stricter quality gate can trigger more recovery passes] -> Keep recovery capped at one retry and use targeted corruption/merchant quality heuristics.
- [More debug metadata increases payload size] -> Limit metadata to runtime evidence and timing summaries rather than raw intermediate blobs.

## Migration Plan

1. Add runtime instrumentation and device/model logging first so current behavior is measurable.
2. Update Docker/runtime configuration for GPU exposure where supported and verify with live checks.
3. Refactor fast-path model/config selection and quality gate thresholds.
4. Validate before/after timings and OCR quality on the same or equivalent Vietnamese receipts.
5. If GPU cannot be enabled, ship the CPU-optimized fast path and document the blocker explicitly in the validation report.

Rollback:
- Revert to the prior OCR profile configuration and disable GPU-specific runtime settings.
- Keep instrumentation in place if possible since it improves troubleshooting even on rollback.

## Open Questions

- None for proposal scope. The implementation must prove whether the current host/runtime can actually run PaddleOCR on NVIDIA GPU and document the result rather than leaving it open-ended.
