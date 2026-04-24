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
        self.assertEqual(result["total_amount"], 29.53)
        self.assertEqual(result["tax_amount"], 1.93)
        self.assertEqual(result["currency"], "USD")
        self.assertEqual(result["extracted_json"]["fields"]["payment_method"], "Visa ***1850")
        self.assertEqual(len(result["extracted_json"]["items"]), 2)
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


if __name__ == "__main__":
    unittest.main()
