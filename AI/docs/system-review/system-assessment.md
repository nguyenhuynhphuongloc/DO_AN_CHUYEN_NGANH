# System Assessment

## Current Strengths

- Clear microservice separation by domain
- Working end-to-end receipt flow
- Real PaddleOCR integration is already active
- Receipt database mapping is closely aligned with the existing ERD
- OCR debug panel is isolated and removable
- Docker Compose orchestration is serviceable for local development
- Error propagation between services is better than in the initial scaffold

## Current Weaknesses

### Identity and access control

- frontend stores JWT but does not attach it to finance or receipt requests
- finance and receipt operations are not yet scoped by authenticated user context
- default-user settings still drive important writes

### OCR limitations

- OCR language is set to English even though receipts often contain Vietnamese text
- text orientation and document correction features are disabled
- first parse is slow because OCR models warm up lazily

### Extraction fragility

- merchant name uses the first OCR line
- date parsing supports only a small set of formats
- total detection still relies on keyword heuristics and max numeric value
- tax extraction is effectively stubbed

### Runtime robustness

- parse is synchronous and CPU-bound
- local file storage is a runtime dependency
- receipt-service uses `create_all()` instead of managed migrations
- job status handling is string-based and only partially used

## OCR Quality Evaluation

### Current configuration

- PaddleOCR singleton
- `lang="en"`
- preprocessing: resize, grayscale, contrast, blur
- average confidence computed from recognized lines

### Reliability level

- acceptable for clear, printed receipts
- weak for rotated, blurred, multilingual, or visually noisy receipts

### Typical failure cases

- blurry image
- rotated or skewed bill
- multi-column or long restaurant bills
- Vietnamese words OCRed inconsistently
- dates and totals distorted by OCR noise

## Extraction Evaluation

### Merchant detection

- current approach: first OCR line
- weakness: headers, logos, or store slogans are often selected instead

### Date detection

- current approach: regex on raw text
- weakness: misses alternate date styles and OCR-corrupted separators

### Amount detection

- current approach: prefer lines with total-like keywords, else max fallback value
- weakness: can confuse total with subtotal, VAT, service charge, or unrelated large numbers

### Currency

- current approach: hardcoded `VND`
- weakness: no currency inference and no multi-currency support

## Frontend Review Flow Evaluation

### What works

- review page groups the workflow into status, editable form, and OCR debug panel
- OCR debug panel is separate from business editing
- feedback and confirm actions are visible and simple

### What is fragile

- page depends on multiple concurrent API calls
- status text is lightweight and easy to miss
- workflow guidance is minimal for ambiguous OCR results
- no explicit progress UI for long OCR runs

## Stability and Error Handling

### Good practices already present

- parse failures update receipt and job states to `failed`
- large images are resized before OCR
- finance-service errors are surfaced to the frontend

### Remaining risks

- synchronous OCR can monopolize request time
- model warm-up causes latency spikes
- local uploads are a persistence risk
- there is still no queued background processing

## Performance Notes

### Main bottlenecks

- PaddleOCR inference
- first-run model initialization
- synchronous parse endpoint
- repeated review-page data loading

### Scaling concerns

- one OCR-heavy request can dominate a container
- no worker queue, no retry orchestration, no concurrency control
- local files complicate horizontal scaling

## Suggested Improvement Roadmap

## Priority 1

- enforce authenticated user context across all services
- improve OCR accuracy for Vietnamese and rotated receipts
- strengthen total/date/merchant extraction heuristics
- move parsing toward background-job execution

## Priority 2

- replace startup `create_all()` with migration-based receipt DB management
- introduce typed enums and stricter internal status contracts
- improve review UX with clearer parse progress and confidence display
- expand parse diagnostics for support and debugging

## Priority 3

- add smarter receipt classification and vendor-aware extraction profiles
- move file storage to durable object storage
- add metrics and monitoring for OCR latency, parse failure, and confirm failure
- optimize warm-up and throughput for OCR runtime
