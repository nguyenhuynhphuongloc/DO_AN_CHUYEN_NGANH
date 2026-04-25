from __future__ import annotations

import unittest

from app.services.receipt_parser_normalizer import normalize_veryfi_document


class VeryfiNormalizerTests(unittest.TestCase):
    def test_normalize_valid_document_maps_core_fields(self) -> None:
        document = {
            "id": 933760836,
            "document_type": "receipt",
            "date": "2024-08-15 15:56:56",
            "total": 29.53,
            "subtotal": 27.60,
            "tax": 1.93,
            "currency_code": "USD",
            "category": "Personal Care",
            "vendor": {
                "name": "Walgreens",
                "address": "191 E 3rd Ave, San Mateo, CA 94401, US",
                "phone_number": "650-555-0101",
            },
            "payment": {"type": "visa", "display_name": "Visa ***1850"},
            "document_reference_number": "INV-001",
            "line_items": [
                {"description": "Shampoo", "quantity": 1, "unit_price": 12.0, "total": 12.0},
                {"description": "Soap", "quantity": 2, "unit_price": 8.765, "total": 17.53},
            ],
        }

        result = normalize_veryfi_document(
            document,
            raw_text="Walgreens\nShampoo\nSoap\nTOTAL 29.53",
            runtime={"provider": "veryfi"},
        )

        self.assertEqual(result["merchant_name"], "Walgreens")
        self.assertEqual(result["transaction_date"], "2024-08-15")
        self.assertEqual(result["transaction_datetime"], "2024-08-15T15:56:56")
        self.assertEqual(result["total_amount"], 29.53)
        self.assertEqual(result["tax_amount"], 1.93)
        self.assertEqual(result["currency"], "USD")
        self.assertEqual(result["extracted_json"]["fields"]["transaction_datetime"], "2024-08-15T15:56:56")
        self.assertEqual(result["extracted_json"]["review_defaults"]["transaction_time"], "2024-08-15T15:56:56")
        self.assertEqual(result["extracted_json"]["receipt_summary"]["provider_category"], "Personal Care")
        self.assertEqual(result["extracted_json"]["receipt_summary"]["line_items"], result["extracted_json"]["items"])
        self.assertEqual(result["extracted_json"]["fields"]["payment_method"], "Visa ***1850")
        self.assertEqual(len(result["extracted_json"]["items"]), 2)
        self.assertEqual(
            result["extracted_json"]["description_text"],
            "Ngay 15/08/2024 chi tai Walgreens so tien 29.53 USD thuoc nhom Personal Care",
        )
        self.assertEqual(result["extracted_json"]["review_defaults"]["description"], result["extracted_json"]["description_text"])
        self.assertNotIn("merchant_name", result["extracted_json"]["needs_review_fields"])

    def test_missing_critical_fields_are_marked_for_review(self) -> None:
        document = {
            "id": 12,
            "document_type": "receipt",
            "vendor": {},
            "line_items": [],
        }

        result = normalize_veryfi_document(
            document,
            raw_text="",
            runtime={"provider": "veryfi"},
        )

        self.assertIsNone(result["merchant_name"])
        self.assertIsNone(result["transaction_date"])
        self.assertIsNone(result["total_amount"])
        self.assertEqual(
            sorted(result["extracted_json"]["needs_review_fields"]),
            ["currency", "merchant_name", "total_amount", "transaction_date"],
        )

    def test_invalid_date_and_empty_currency_are_normalized_to_nullable_review_safe_values(self) -> None:
        document = {
            "id": 44,
            "document_type": "receipt",
            "date": "15/08/2024",
            "total": 120000,
            "currency_code": "",
            "vendor": {"name": "Mini Stop"},
            "line_items": [{"description": "Drink", "quantity": 1, "total": 120000}],
        }

        result = normalize_veryfi_document(
            document,
            raw_text="Mini Stop\nDrink\nTOTAL 120000",
            runtime={"provider": "veryfi"},
        )

        self.assertEqual(result["merchant_name"], "Mini Stop")
        self.assertIsNone(result["transaction_date"])
        self.assertIsNone(result["transaction_datetime"])
        self.assertIsNone(result["currency"])
        self.assertIsNone(result["extracted_json"]["fields"]["transaction_date"])
        self.assertIsNone(result["extracted_json"]["fields"]["transaction_datetime"])
        self.assertIsNone(result["extracted_json"]["review_defaults"]["transaction_time"])
        self.assertIn("transaction_date", result["extracted_json"]["needs_review_fields"])
        self.assertIn("currency", result["extracted_json"]["needs_review_fields"])


if __name__ == "__main__":
    unittest.main()
