## ADDED Requirements

### Requirement: Receipt OCR SHALL support an optional layout-recognition stage
The `receipt-service` SHALL support an optional layout-recognition stage after preprocessing and before OCR so receipts can be segmented into semantic blocks without replacing the current async parse architecture.

#### Scenario: Layout enhancement enabled
- **WHEN** `OCR_LAYOUT_ENABLED=true` and a queued receipt parse job reaches the OCR stage
- **THEN** the pipeline SHALL run layout detection on the processed image before text OCR

#### Scenario: Layout enhancement disabled
- **WHEN** `OCR_LAYOUT_ENABLED=false`
- **THEN** the pipeline SHALL skip layout detection and SHALL use the current whole-image OCR path

### Requirement: Layout detection SHALL return ordered semantic receipt blocks
The layout-recognition stage SHALL normalize layout detections into ordered semantic receipt blocks containing label, bounding box, and confidence.

#### Scenario: Layout detections are produced
- **WHEN** the layout model detects receipt regions
- **THEN** the pipeline SHALL normalize them into ordered blocks with semantic labels such as `header`, `items`, `totals`, `footer`, and optional payment/info regions

#### Scenario: Layout ordering is needed
- **WHEN** multiple layout blocks are detected
- **THEN** the pipeline SHALL order them deterministically for downstream OCR and extraction

#### Scenario: Raw detector labels vary by model
- **WHEN** the YOLO layout model emits raw class labels that differ from the service's semantic routing labels
- **THEN** the pipeline SHALL map them into a canonical internal taxonomy of `header`, `items`, `totals`, `footer`, `payment_info`, and `metadata`, while preserving the raw label additively in debug metadata

#### Scenario: Detector emits an unknown label
- **WHEN** layout detection emits a label that is not recognized by the canonical taxonomy mapping
- **THEN** the parse flow SHALL remain successful, the block SHALL not receive strong extraction-routing preference, and the unknown/raw label SHALL be preserved additively for debug purposes

### Requirement: Layout-aware OCR SHALL control OCR overhead
The layout-aware OCR path SHALL cap the number of OCR-eligible blocks and apply pruning/merge rules before block-level OCR runs.

#### Scenario: Too many blocks are detected
- **WHEN** layout detection returns more candidate blocks than the configured OCR cap
- **THEN** the pipeline SHALL apply confidence, size, overlap, and merge rules before limiting the final OCR-eligible block set

#### Scenario: Tiny or duplicate blocks are detected
- **WHEN** layout detection returns tiny, duplicate, or heavily overlapping blocks
- **THEN** the pipeline SHALL prune or merge them before OCR rather than OCR'ing every raw detection

#### Scenario: No usable blocks remain after pruning
- **WHEN** all layout blocks are filtered out by confidence, size, overlap, or cap rules
- **THEN** the worker SHALL fall back to the current whole-image OCR path instead of failing the parse job

### Requirement: OCR SHALL run inside layout blocks using the existing OCR stack
The layout-aware OCR path SHALL run the current Paddle detection plus configurable recognizer pipeline inside each ordered layout block rather than replacing the current OCR engines.

#### Scenario: Layout block is processed
- **WHEN** the layout-aware path selects a semantic block for OCR
- **THEN** Paddle text detection SHALL run inside the block and the selected recognizer backend SHALL read ordered text crops from that block

#### Scenario: Recognizer backend changes
- **WHEN** `OCR_RECOGNIZER_BACKEND` is set to `vietocr` or `paddle`
- **THEN** the layout-aware path SHALL preserve the same recognizer-selection behavior inside each block

### Requirement: Extraction SHALL become block-aware without breaking its contract
The extraction layer SHALL optionally consume layout block metadata so field selection can prefer semantically relevant regions while preserving the existing output contract.

#### Scenario: Header fields are extracted
- **WHEN** layout block metadata is available
- **THEN** merchant, date, and other header-oriented fields SHALL prefer header-like blocks over unrelated regions

#### Scenario: Totals fields are extracted
- **WHEN** layout block metadata is available
- **THEN** subtotal, tax, discount, service charge, and total fields SHALL prefer totals-like blocks over unrelated regions

#### Scenario: Item rows are extracted
- **WHEN** layout block metadata is available
- **THEN** extracted line items SHALL prefer item-like blocks over header, totals, or footer blocks

### Requirement: Layout failure SHALL fall back to the current whole-image OCR path
The parse flow SHALL remain successful when layout detection is disabled, unavailable, misconfigured, or produces unusable blocks.

#### Scenario: Layout model path is missing or inference fails
- **WHEN** layout inference cannot be completed
- **THEN** the worker SHALL log the layout failure and SHALL continue with the current whole-image OCR path instead of failing the parse job

#### Scenario: Layout detections are unusable
- **WHEN** layout detection returns no valid blocks after post-processing
- **THEN** the worker SHALL continue with the current whole-image OCR path instead of failing the parse job

### Requirement: Layout enhancement SHALL follow the existing fast/recovery OCR strategy
The layout-aware enhancement SHALL run inside the currently selected OCR profile rather than introducing an independent third profile-selection path.

#### Scenario: Fast path is selected
- **WHEN** the parse pipeline selects the `fast` OCR profile
- **THEN** any enabled layout detection SHALL run on the fast-preprocessed image and SHALL fall back to whole-image fast OCR if layout is unusable

#### Scenario: Recovery path is selected
- **WHEN** the parse pipeline escalates to the `recovery` OCR profile
- **THEN** any enabled layout detection SHALL run on the recovery-preprocessed image and SHALL fall back to whole-image recovery OCR if layout is unusable

#### Scenario: Layout is enabled but does not change profile selection
- **WHEN** `OCR_LAYOUT_ENABLED=true`
- **THEN** layout enhancement SHALL not by itself create an additional OCR profile branch beyond the existing fast/recovery decision

### Requirement: Layout-aware OCR SHALL preserve downstream OCR contracts
The layout-aware OCR path SHALL preserve the existing review-safe OCR contract while adding block-aware metadata additively.

#### Scenario: OCR result is stored after layout-aware parsing
- **WHEN** layout-aware OCR completes successfully
- **THEN** the stored OCR payload SHALL still expose compatible `raw_text`, `lines`, confidence/debug fields, and additive layout metadata

#### Scenario: Legacy consumers read OCR data
- **WHEN** existing extraction or frontend consumers request receipt/session detail
- **THEN** they SHALL continue to receive backward-compatible OCR payload fields even when layout metadata is present

### Requirement: Layout-aware OCR SHALL be benchmarkable and configurable
The project SHALL provide configuration flags and evaluation scripts for comparing no-layout OCR and layout-aware OCR on the same receipts.

#### Scenario: Benchmark script runs
- **WHEN** a developer runs the layout OCR benchmark on a set of receipt images
- **THEN** it SHALL produce JSON results and a markdown summary comparing no-layout OCR versus layout-aware OCR

#### Scenario: Field quality is compared
- **WHEN** benchmark or evaluation runs on the same receipt set in no-layout and layout-aware modes
- **THEN** the results SHALL compare extracted merchant, transaction date, and total quality between the two modes and summarize whether layout improved, regressed, or matched baseline

#### Scenario: Layout mode is toggled
- **WHEN** configuration toggles layout support on or off
- **THEN** the same parse architecture SHALL continue working with only config-level changes
