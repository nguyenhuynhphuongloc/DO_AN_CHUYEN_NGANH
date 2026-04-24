from __future__ import annotations

import json
import unittest
from unittest.mock import Mock, patch

try:
    from app.services.receipt_category_resolution_service import (
        ReceiptCategoryResolutionError,
        ReceiptCategoryResolutionService,
    )
    from app.services.receipt_description_service import build_receipt_description
except ModuleNotFoundError as exc:  # pragma: no cover - environment-dependent import
    ReceiptCategoryResolutionError = RuntimeError  # type: ignore[assignment]
    ReceiptCategoryResolutionService = None  # type: ignore[assignment]
    build_receipt_description = None  # type: ignore[assignment]
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


@unittest.skipIf(build_receipt_description is None, f"description service dependencies unavailable: {_IMPORT_ERROR}")
class ReceiptDescriptionServiceTests(unittest.TestCase):
    def test_build_receipt_description_uses_date_merchant_amount_and_category(self) -> None:
        description = build_receipt_description(
            merchant_name="Highlands Coffee",
            category_name="An uong",
            transaction_date="2026-04-24",
            total_amount=65000,
            currency="VND",
        )

        self.assertEqual(
            description,
            "Ngay 24/04/2026 chi tai Highlands Coffee so tien 65.000 VND thuoc nhom An uong",
        )

    def test_build_receipt_description_falls_back_when_merchant_missing(self) -> None:
        description = build_receipt_description(
            merchant_name=None,
            category_name="Mua sam",
            transaction_date="2026-04-24",
            total_amount=500000,
            currency="VND",
        )

        self.assertEqual(description, "Ngay 24/04/2026 chi cho Mua sam so tien 500.000 VND")


@unittest.skipIf(ReceiptCategoryResolutionService is None, f"category resolver dependencies unavailable: {_IMPORT_ERROR}")
class ReceiptCategoryResolutionServiceTests(unittest.TestCase):
    def test_returns_none_when_groq_resolution_disabled(self) -> None:
        service = ReceiptCategoryResolutionService()

        with patch("app.services.receipt_category_resolution_service.settings.groq_category_resolution_enabled", False):
            result = service.resolve_category(
                normalized_receipt={"merchant_name": "Highlands Coffee"},
                categories=[{"id": "1", "name": "An uong", "type": "EXPENSE"}],
            )

        self.assertIsNone(result)

    def test_rejects_category_outside_allowed_set(self) -> None:
        service = ReceiptCategoryResolutionService()
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {
                                "category_id": "999",
                                "category_name": "Khac",
                                "reason": "forced",
                            }
                        )
                    }
                }
            ]
        }

        with (
            patch("app.services.receipt_category_resolution_service.settings.groq_category_resolution_enabled", True),
            patch("app.services.receipt_category_resolution_service.settings.groq_api_key", "test-key"),
            patch("app.services.receipt_category_resolution_service.requests.post", return_value=mock_response),
        ):
            with self.assertRaises(ReceiptCategoryResolutionError):
                service.resolve_category(
                    normalized_receipt={"merchant_name": "Highlands Coffee"},
                    categories=[{"id": "1", "name": "An uong", "type": "EXPENSE"}],
                )


if __name__ == "__main__":
    unittest.main()
