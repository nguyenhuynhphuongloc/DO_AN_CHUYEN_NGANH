# Layout OCR Architecture

## Overview

This change adds an optional layout-recognition stage to the existing receipt OCR pipeline. The goal is to preserve the current async parsing architecture while making OCR and extraction block-aware when a compatible layout model is configured.

## Old OCR Path

1. upload receipt image
2. queue parse job / session parse job
3. worker selects `fast` or `recovery` preprocessing profile
4. OCR runs on the whole processed image
5. extraction runs on flattened OCR text
6. review / confirm flow consumes the stable OCR and extraction payloads

Core files in the old path:

- `app/services/image_preprocess.py`
- `app/services/ocr_service.py`
- `app/services/ocr_pipeline.py`
- `app/services/parse_pipeline.py`
- `app/services/extraction_service.py`

## New Layout-Aware Path

1. preprocess image using the selected `fast` or `recovery` profile
2. if layout is enabled, run YOLO layout detection on that processed image
3. normalize raw layout detections into canonical blocks
4. prune, merge, and cap blocks to control OCR overhead
5. run OCR inside each ordered block
6. flatten block OCR output back into compatible `raw_text` and `lines`
7. run extraction with optional layout block preferences
8. persist additive layout and provenance metadata into OCR debug output

## Fallback Path

The current whole-image OCR path remains the fallback for every layout failure mode:

- layout disabled by config
- missing model path
- Ultralytics import/runtime error
- no usable blocks after filtering
- layout inference exception

Fallback behavior is runtime-safe:

- parse jobs continue
- debug payload records why layout was not used
- extraction still runs on whole-image OCR output

## Canonical Layout Taxonomy

Raw detector labels are mapped into:

- `header`
- `items`
- `totals`
- `footer`
- `payment_info`
- `metadata`

Unknown labels:

- keep `raw_label` in debug metadata
- route to `metadata` when still OCR-eligible
- do not receive strong extraction preference

## Fast / Recovery Strategy

Layout is not a new profile. It is an enhancement inside each existing OCR profile.

### Fast path

- run fast preprocessing
- run layout on the fast-preprocessed image when enabled
- OCR within blocks if usable
- otherwise use whole-image fast OCR

### Recovery path

- recovery is still chosen by the existing OCR quality gate
- if recovery runs, layout runs on the recovery-preprocessed image
- OCR within blocks if usable
- otherwise use whole-image recovery OCR

This keeps the current fast/recovery decision logic intact.

## File Responsibilities

### `app/services/layout_models.py`

- raw layout detection model
- canonical block model
- layout detection result model

### `app/services/layout_postprocess.py`

- raw-label normalization
- canonical taxonomy mapping
- overlap suppression
- same-label merge
- max-block capping
- ordered block output

### `app/services/layout_service.py`

- Ultralytics YOLO loading
- external model path handling
- inference-only runtime
- fallback-safe error handling

### `app/services/ocr_service.py`

- layout invocation after preprocessing
- block-level OCR orchestration
- flattened output contract preservation
- additive debug/runtime metadata

### `app/services/extraction_service.py`

- optional block-aware field routing
- field provenance generation

## Config Flags

- `OCR_LAYOUT_ENABLED`
- `OCR_LAYOUT_BACKEND`
- `OCR_LAYOUT_MODEL_PATH`
- `OCR_LAYOUT_CONFIDENCE_THRESHOLD`
- `OCR_LAYOUT_IOU_THRESHOLD`
- `OCR_LAYOUT_MAX_BLOCKS`
- `OCR_LAYOUT_MIN_BLOCK_AREA_RATIO`
- `OCR_LAYOUT_MERGE_SAME_LABEL_GAP_PIXELS`

## OCR Output Contract

Preserved top-level fields:

- `raw_text`
- `lines`
- `confidence`
- `confidences`
- `provider`
- `device`
- `runtime`
- `engine_config`

Additive fields:

- `layout`
- `field_provenance` inside extraction debug payload

## Rollback Steps

1. set `OCR_LAYOUT_ENABLED=false`
2. keep recognizer backend settings unchanged
3. keep worker/session flow unchanged
4. optionally remove Ultralytics dependency and layout modules in a later cleanup

This returns the system to the existing whole-image OCR behavior without a schema or workflow rewrite.
