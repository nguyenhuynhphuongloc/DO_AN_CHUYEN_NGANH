## Context

The current receipt pipeline already has the right product flow: upload in the Next.js frontend, parse in `receipt-service`, review corrected fields in the receipt review page, save feedback, then confirm into `finance-service`. The weak point is the OCR and extraction layer inside `receipt-service`, where `PaddleOCR` is initialized with `lang="en"` and document orientation helpers are disabled in [`ocr_service.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/services/ocr_service.py), preprocessing only resizes and lightly blurs in [`image_preprocess.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/services/image_preprocess.py), and extraction currently defaults merchant name to the first line and tax to zero in [`extraction_service.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/services/extraction_service.py) and [`receipts.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/api/receipts.py).

This change is cross-cutting because it affects OCR runtime behavior, preprocessing, extraction payload shape, response schemas, and the receipt review frontend. It also introduces richer optional receipt metadata that must remain backward-compatible with existing review and confirm flows while leaving room for later category and wallet suggestions.

## Goals / Non-Goals

**Goals:**
- Improve OCR accuracy for Vietnamese printed receipts, including diacritics, without replacing PaddleOCR.
- Improve parse robustness for rotated, skewed, blurry, noisy, and long receipt images before OCR.
- Keep the current upload, parse, review, feedback, confirm, and finance handoff workflow unchanged from the user’s perspective.
- Replace brittle extraction heuristics with confidence-aware field selection that prefers nullable outputs over fabricated defaults.
- Extend `extracted_json` with optional receipt metadata that can support future suggestion features.
- Preserve OCR debugging output and expose enough metadata to understand preprocessing and recognition results.

**Non-Goals:**
- Replacing PaddleOCR with a managed OCR provider or redesigning the receipt pipeline.
- Building category suggestion, wallet suggestion, or automatic itemized transaction creation in this change.
- Guaranteeing perfect extraction for handwriting or heavily damaged receipts.
- Requiring new non-null database columns or blocking confirmation when optional extracted fields are missing.

## Decisions

### Use Vietnamese-capable PaddleOCR with orientation support

`receipt-service` will keep PaddleOCR as the primary engine, but switch from English-only recognition to a Vietnamese-capable or multilingual configuration that better recognizes Vietnamese diacritics and mixed-language receipts. The OCR service will also enable orientation / direction helpers supported by the installed PaddleOCR version, such as document orientation classification and text line angle handling, while keeping a single shared cached OCR instance.

Why this over keeping `lang="en"`: the current configuration structurally loses Vietnamese characters before extraction even begins.

Alternative considered: adding a second OCR engine. Rejected for this change because it increases operational scope and violates the incremental requirement.

### Make preprocessing produce a normalized OCR input plus debug metadata

Preprocessing in [`image_preprocess.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/services/image_preprocess.py) will be upgraded from basic grayscale and blur to a staged pipeline:
- safe load and resize with aspect-ratio preservation, using a long-edge strategy that avoids shrinking long receipts too aggressively
- grayscale conversion and contrast normalization
- denoise tuned for printed text
- thresholding or sharpening where beneficial
- deskew estimation from text-like contours or Hough-based line detection
- rotation correction for common 90/180/270 degree cases when OCR orientation flags or image geometry indicate it

The preprocessing result will remain a saved processed image file, and the OCR debug payload will retain raw text, per-line output, confidences, and add preprocessing metadata such as applied rotation, resize dimensions, and preprocessing stages. This keeps debugging intact while making the new behavior explainable.

Alternative considered: relying only on PaddleOCR orientation support without image normalization. Rejected because blur, skew, and contrast problems are currently upstream of OCR.

### Separate field extraction into labeled candidates with confidence-aware fallbacks

Extraction will continue to run after OCR inside `receipt-service`, but the heuristics in [`extraction_service.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/services/extraction_service.py) will be reworked around candidate detection rather than positional assumptions:
- merchant candidates from top-of-receipt lines, header block patterns, capitalization, and exclusion of address / phone / tax ID lines
- date candidates from Vietnamese-friendly formats and OCR-corrupted separators such as `.`, `-`, `/`, spaces, and partial labels (`Ngay`, `Ngày`, `Date`, `Gio`)
- amount candidates classified by labels like total, subtotal, VAT, tax, service charge, discount, payment, and cash received
- tax extraction from actual VAT or tax-labeled lines instead of stubbing zero
- optional extraction of address, receipt number, payment method, subtotal, discount, service charge, and item lines into `extracted_json`

The extractor will return both top-level fields used today and an expanded `extracted_json` containing optional values only when found with acceptable confidence. Unknown fields will stay `null` or be omitted. Top-level `tax_amount` will remain nullable rather than defaulting to zero.

Alternative considered: pushing all extraction logic into the frontend review page. Rejected because extraction belongs in the service boundary and must be reusable by future suggestion features.

### Keep response compatibility while exposing richer data to the frontend

The API response models in [`receipt.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/schemas/receipt.py) and serialization in [`receipts.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/api/receipts.py) will stay compatible with the existing review page: existing fields remain present, but low-confidence or unknown values remain nullable. The frontend types in [`types.ts`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/frontend/lib/types.ts) and the review page in [`page.tsx`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/frontend/app/receipts/[id]/review/page.tsx) will be updated only enough to:
- avoid using the current date when the extraction date is unknown
- display optional extracted fields or low-confidence metadata without requiring them
- preserve the existing manual correction and confirmation workflow

Alternative considered: redesigning the review UI around a new multi-step extraction editor. Rejected because it is outside the incremental scope and risks regression in the current flow.

### Preserve data model compatibility by extending JSON first

The SQLAlchemy model in [`receipt.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/models/receipt.py) already stores the structured extraction payload in `extracted_json`, so the new optional fields will be added there first instead of as new required columns. Existing top-level columns remain for merchant name, transaction date, total, tax, currency, confidence, and review status. This minimizes migration risk and keeps the review page compatible.

Alternative considered: adding many first-class columns immediately for every optional receipt field. Rejected because the current requirement only needs optional structured availability, not relational querying.

## Risks / Trade-offs

- [PaddleOCR Vietnamese model availability may differ by installed version] -> Mitigation: use the best supported Vietnamese-capable configuration in the deployed PaddleOCR version and keep the service interface unchanged so the model option can be adjusted without API churn.
- [More preprocessing can over-correct some clean images] -> Mitigation: keep preprocessing stages conservative, record applied transforms in debug metadata, and prefer deterministic resize / deskew thresholds.
- [Heuristic extraction may still confuse subtotal, VAT, and total on unusual layouts] -> Mitigation: use labeled candidate ranking, keep ambiguous fields nullable, and expose raw OCR plus extracted JSON for review.
- [Frontend regressions can occur if the page still assumes values always exist] -> Mitigation: explicitly update review state initialization so blank dates and nullable amounts do not crash parse, feedback, or confirm flows.
- [Expanded `extracted_json` shape can drift across parse, feedback, and confirm operations] -> Mitigation: centralize payload construction and preserve unknown optional fields when feedback or confirmation updates top-level values.
