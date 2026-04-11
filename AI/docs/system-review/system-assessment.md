# System Assessment

## Current Strengths

- Clear microservice separation by domain
- Working end-to-end receipt flow
- JWT-authenticated user context is enforced across frontend, finance-service, and receipt-service
- Ownership checks now block cross-user access to receipts and finance data
- Real PaddleOCR integration is already active
- Async OCR worker flow is already active
- Receipt database mapping is closely aligned with the existing ERD
- OCR debug panel is isolated and removable
- Docker Compose orchestration is serviceable for local development
- Error propagation between services is better than in the initial scaffold

## Current Weaknesses

### Identity and access control

- frontend session still lives only in browser local storage, which limits SSR-friendly auth handling
- finance-service and receipt-service must keep JWT verification config aligned with auth-service
- categories remain reference data and are not modeled as fully user-isolated resources

### OCR limitations

- OCR language is set to English/default and intentionally avoids Vietnamese-specific behavior
- text orientation and document correction features are disabled
- first worker initialization can still be slow because OCR models warm up lazily

### Extraction fragility

- extraction is materially stronger than the initial first-line and max-number baseline, but it is still heuristic rather than layout-aware
- merchant, date, total, currency, payment-method, and receipt-number fields now come from hybrid staged candidate scoring with field-level confidence, trace metadata, and soft receipt zones
- optional fields such as subtotal, discount, service charge, contact info, cashier, table number, guest count, and `items[]` are available when supported by the OCR lines
- optional fields intentionally remain `null` when confidence is weak
- currency remains nullable by default unless later set by review flow

### Runtime robustness

- parsing is asynchronous now, but still DB-polled and runtime-dependent
- local file storage is a runtime dependency
- receipt-service uses `create_all()` instead of managed migrations
- job status handling is string-based but now actively drives the frontend review flow

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

- current approach: header-focused candidate scoring with soft-zone hints and promo, website, phone, invoice-label, and summary-line exclusions
- remaining weakness: highly stylized logos or noisy headers can still outrank the true merchant line

### Date detection

- current approach: regex plus normalization over practical separator corruption
- remaining weakness: ambiguous short dates and heavily broken OCR can still force `null`

### Amount detection

- current approach: candidate buckets for total, subtotal, tax, discount, and service charge, with stronger total-selection rules
- remaining weakness: dense multi-column receipts can still confuse totals and line items when OCR ordering is poor

### Currency

- current approach: `null` by default
- weakness: no currency inference and no multi-currency support

## Frontend Review Flow Evaluation

### What works

- review page groups the workflow into status, editable form, and OCR debug panel
- OCR debug panel is separate from business editing
- feedback and confirm actions are visible and simple
- review page now polls explicit async job states and avoids blocking the user during OCR

### What is fragile

- page depends on multiple concurrent API calls
- status text is lightweight and easy to miss
- workflow guidance is minimal for ambiguous OCR results
- progress UI is present but still text-heavy and basic

## Stability and Error Handling

### Good practices already present

- parse failures update receipt and job states to `failed`
- large images are resized before OCR
- finance-service errors are surfaced to the frontend
- missing or invalid bearer tokens now fail with `401`
- cross-user receipt and wallet access now fails with `403`
- duplicate parse requests are skipped unless force-rerun is requested

### Remaining risks

- model warm-up causes latency spikes
- local uploads are a persistence risk
- DB-backed polling queue is simple but still less robust than a dedicated external queue

## Performance Notes

### Main bottlenecks

- PaddleOCR inference
- first-run model initialization
- worker-side OCR execution
- repeated review-page data loading

### Scaling concerns

- one OCR-heavy worker can still dominate a container if worker concurrency is low
- queue is implemented in the database and still has limited retry orchestration
- local files complicate horizontal scaling

## Suggested Improvement Roadmap

## Priority 1

- improve OCR accuracy for rotated and noisy receipts without introducing locale-specific assumptions
- strengthen total/date/merchant extraction heuristics
- replace DB polling with a more robust queue only if throughput requires it

## Priority 2

- move frontend auth toward a session model that also works cleanly for SSR-protected pages
- replace startup `create_all()` with migration-based receipt DB management
- introduce typed enums and stricter internal status contracts
- improve review UX with clearer parse progress and confidence display
- expand parse diagnostics for support and debugging

## Priority 3

- add smarter receipt classification and vendor-aware extraction profiles
- move file storage to durable object storage
- add metrics and monitoring for OCR latency, parse failure, and confirm failure
- optimize warm-up and throughput for OCR runtime
