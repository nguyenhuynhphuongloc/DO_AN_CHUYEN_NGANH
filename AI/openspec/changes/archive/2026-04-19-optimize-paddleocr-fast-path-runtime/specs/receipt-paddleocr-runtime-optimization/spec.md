## ADDED Requirements

### Requirement: Fast-path PaddleOCR SHALL use an explicitly lightweight runtime configuration
The receipt OCR fast path SHALL use an explicitly configured lightweight detector and recognizer pair, and it SHALL expose the resolved model names and enabled optional features in debug metadata.

#### Scenario: Fast path runs
- **WHEN** the worker executes the OCR fast path for a receipt
- **THEN** the debug metadata SHALL record the detector model name, recognizer model name, optional orientation flags, and selected fast-path profile

#### Scenario: Heavy detector is selected unintentionally
- **WHEN** the resolved fast-path detector is a heavier server-grade model contrary to the configured fast profile
- **THEN** the runtime evidence SHALL make that mismatch visible and the implementation SHALL treat it as a configuration defect to fix

### Requirement: OCR runtime evidence SHALL distinguish CPU from GPU honestly
The system SHALL record and expose whether PaddleOCR actually used CPU or GPU, along with the checks that led to that outcome.

#### Scenario: GPU is available and used
- **WHEN** the receipt worker has a CUDA-capable Paddle runtime and visible NVIDIA devices
- **THEN** the OCR debug and logs SHALL report actual device `gpu`

#### Scenario: GPU is unavailable
- **WHEN** the worker cannot use NVIDIA GPU because of packaging, runtime, or host constraints
- **THEN** the OCR debug and logs SHALL report actual device `cpu` and include the availability/fallback evidence without claiming GPU success

### Requirement: OCR instrumentation SHALL expose runtime bottlenecks
The system SHALL record enough runtime metadata to diagnose OCR latency and line detection behavior for each parse.

#### Scenario: Parse completes
- **WHEN** a receipt parse attempt completes
- **THEN** the debug payload SHALL include OCR device, detector model, recognizer model, line count, preprocessed image dimensions, queue delay, preprocess time, OCR time, extraction time, and total parse time

#### Scenario: Parse logs are reviewed
- **WHEN** operators inspect worker logs for a slow receipt parse
- **THEN** the logs SHALL make the selected profile, actual device, and recovery decision visible
