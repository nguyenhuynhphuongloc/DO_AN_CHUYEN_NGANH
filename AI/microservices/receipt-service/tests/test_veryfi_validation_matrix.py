from __future__ import annotations

import unittest

try:
    from app.services.receipt_parser_normalizer import normalize_veryfi_document
except ModuleNotFoundError as exc:  # pragma: no cover - environment-dependent import
    normalize_veryfi_document = None  # type: ignore[assignment]
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


@unittest.skipIf(normalize_veryfi_document is None, f"normalizer dependencies unavailable: {_IMPORT_ERROR}")
class VeryfiValidationMatrixTests(unittest.TestCase):
    def test_representative_receipt_payloads(self) -> None:
        cases = [
            {
                "name": "clean_receipt",
                "document": {
                    "id": 1,
                    "document_type": "receipt",
                    "date": "2026-04-20 08:15:00",
                    "total": 65000,
                    "subtotal": 59091,
                    "tax": 5909,
                    "currency_code": "VND",
                    "category": "An uong",
                    "vendor": {"name": "Highlands Coffee"},
                    "line_items": [{"description": "Tra sen vang", "quantity": 1, "total": 65000}],
                },
                "raw_text": "Highlands Coffee\nTRA SEN VANG\nTOTAL 65.000",
                "expected_missing": set(),
                "min_items": 1,
            },
            {
                "name": "long_receipt",
                "document": {
                    "id": 2,
                    "document_type": "receipt",
                    "date": "2026-04-21 19:20:00",
                    "total": 425000,
                    "subtotal": 386364,
                    "tax": 38636,
                    "currency_code": "VND",
                    "category": "An uong",
                    "vendor": {"name": "Lau Buffet Center"},
                    "line_items": [
                        {"description": f"Item {index}", "quantity": 1, "total": 25000 + index}
                        for index in range(8)
                    ],
                },
                "raw_text": "\n".join(["Lau Buffet Center"] + [f"ITEM {index}" for index in range(1, 15)] + ["TOTAL 425.000"]),
                "expected_missing": set(),
                "min_items": 8,
            },
            {
                "name": "noisy_receipt",
                "document": {
                    "id": 3,
                    "document_type": "receipt",
                    "date": "2026-04-22T07:30:15",
                    "total": "159000",
                    "currency_code": "VND",
                    "category": "Mua sam",
                    "vendor": {"name": "CO.OPMART !!!"},
                    "line_items": [{"description": "Khăn giấy???", "quantity": 2, "total": "159000"}],
                },
                "raw_text": "CO.OPMART !!!\nKhan giay???\nT0TAL 159.000",
                "expected_missing": set(),
                "min_items": 1,
            },
            {
                "name": "missing_fields_receipt",
                "document": {
                    "id": 4,
                    "document_type": "receipt",
                    "vendor": {},
                    "line_items": [],
                },
                "raw_text": "",
                "expected_missing": {"merchant_name", "transaction_date", "total_amount", "currency"},
                "min_items": 0,
            },
        ]

        for case in cases:
            with self.subTest(case=case["name"]):
                result = normalize_veryfi_document(case["document"], raw_text=case["raw_text"], runtime={"provider": "veryfi"})
                extracted_json = result["extracted_json"]
                missing = set(extracted_json["needs_review_fields"])

                self.assertTrue(case["expected_missing"].issubset(missing))
                self.assertGreaterEqual(len(extracted_json["items"]), case["min_items"])
                self.assertEqual(extracted_json["normalized_text"]["raw_text"], case["raw_text"] or None)
                self.assertEqual(extracted_json["receipt_summary"]["line_items"], extracted_json["items"])
                if not case["expected_missing"]:
                    self.assertEqual(result["currency"], "VND")
                    self.assertIsNotNone(result["merchant_name"])
                    self.assertIsNotNone(result["total_amount"])
                    self.assertIsNotNone(extracted_json["receipt_summary"]["provider_category"])


if __name__ == "__main__":
    unittest.main()
