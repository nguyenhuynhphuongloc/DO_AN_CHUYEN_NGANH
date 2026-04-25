from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException

try:
    from app.api import receipts as receipts_api
    from app.schemas.receipt import ReceiptConfirmRequest, ReceiptFeedbackRequest
    from app.services.session_finalize import discard_parse_session, finalize_parse_session
except ModuleNotFoundError as exc:  # pragma: no cover - environment-dependent import
    receipts_api = None  # type: ignore[assignment]
    ReceiptConfirmRequest = None  # type: ignore[assignment]
    ReceiptFeedbackRequest = None  # type: ignore[assignment]
    discard_parse_session = None  # type: ignore[assignment]
    finalize_parse_session = None  # type: ignore[assignment]
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


class _FakeDB:
    def __init__(self) -> None:
        self.added: list[object] = []
        self.deleted: list[object] = []
        self.commit_count = 0
        self.refreshed: list[object] = []

    def add(self, item: object) -> None:
        self.added.append(item)

    def delete(self, item: object) -> None:
        self.deleted.append(item)

    def commit(self) -> None:
        self.commit_count += 1

    def refresh(self, item: object) -> None:
        self.refreshed.append(item)

    def flush(self) -> None:
        for item in self.added:
            if hasattr(item, "id") and getattr(item, "id", None) in (None, 0):
                setattr(item, "id", 999)

    def get(self, _model, _key):
        return None


@unittest.skipIf(receipts_api is None, f"receipt API dependencies unavailable: {_IMPORT_ERROR}")
class ReceiptReviewAndConfirmTests(unittest.TestCase):
    def _make_receipt(self):
        parser_result = SimpleNamespace(
            normalized_json={
                "fields": {
                    "merchant_name": "Auto Merchant",
                    "transaction_date": "2026-04-20",
                    "transaction_datetime": "2026-04-20T12:00:00+00:00",
                    "total_amount": 125000.0,
                    "tax_amount": 5000.0,
                    "currency": "VND",
                },
                "receipt_summary": {
                    "merchant_name": "Auto Merchant",
                    "transaction_date": "2026-04-20",
                    "transaction_datetime": "2026-04-20T12:00:00+00:00",
                    "total_amount": 125000.0,
                    "currency": "VND",
                    "provider_category": "Meals",
                    "line_items": [],
                },
                "review_defaults": {
                    "merchant_name": "Auto Merchant",
                    "amount": 125000.0,
                    "transaction_time": "2026-04-20T12:00:00+00:00",
                    "description": "Auto description",
                },
            },
            updated_at=None,
            suggested_category_id=None,
            suggested_description=None,
        )
        return SimpleNamespace(
            id=77,
            user_id=42,
            parser_result=parser_result,
            status="ready_for_review",
            processed_at=None,
            updated_at=None,
            feedback_items=[],
            jobs=[],
            _sa_instance_state=SimpleNamespace(session=None),
        )

    def test_save_feedback_overrides_autofilled_values_without_creating_transaction(self) -> None:
        db = _FakeDB()
        receipt = self._make_receipt()
        payload = ReceiptFeedbackRequest(
            feedback="manual correction",
            merchant_name="Manual Merchant",
            transaction_date=datetime(2026, 4, 24, 9, 30, tzinfo=UTC),
            total_amount=135000.0,
            tax_amount=7000.0,
            currency="USD",
        )
        current_user = SimpleNamespace(email="user@example.com", token="token")

        with (
            patch("app.api.receipts._resolve_current_shared_user_id", return_value=42),
            patch("app.api.receipts._load_receipt", return_value=receipt),
            patch("app.api.receipts._serialize_receipt", side_effect=lambda value, **_: value),
            patch("app.services.finance_client.create_finance_transaction") as finance_mock,
        ):
            result = receipts_api.save_feedback("77", payload, current_user=current_user, db=db)

        self.assertIs(result, receipt)
        self.assertEqual(receipt.parser_result.normalized_json["fields"]["merchant_name"], "Manual Merchant")
        self.assertEqual(receipt.parser_result.normalized_json["fields"]["total_amount"], 135000.0)
        self.assertEqual(receipt.parser_result.normalized_json["fields"]["currency"], "USD")
        self.assertEqual(receipt.parser_result.normalized_json["review_status"], "reviewed")
        self.assertEqual(receipt.status, "reviewed")
        finance_mock.assert_not_called()

    def test_confirm_receipt_uses_explicit_payload_and_persists_transaction_link(self) -> None:
        db = _FakeDB()
        receipt = self._make_receipt()
        payload = ReceiptConfirmRequest(
            wallet_id="wallet-1",
            category_id="12",
            type="EXPENSE",
            amount=145000.0,
            description="User confirmed description",
            merchant_name="Confirmed Merchant",
            transaction_date=datetime(2026, 4, 25, 10, 15, tzinfo=UTC),
        )
        current_user = SimpleNamespace(email="user@example.com", token="token")

        with (
            patch("app.api.receipts._resolve_current_shared_user_id", return_value=42),
            patch("app.api.receipts._load_receipt", return_value=receipt),
            patch("app.api.receipts._serialize_receipt", side_effect=lambda value, **_: value),
            patch(
                "app.services.finance_client.create_finance_transaction",
                return_value={"id": "txn-123", "warning": None},
            ) as finance_mock,
        ):
            result = receipts_api.confirm_receipt("77", payload, current_user=current_user, db=db)

        self.assertIs(result, receipt)
        finance_mock.assert_called_once()
        self.assertEqual(receipt.parser_result.normalized_json["fields"]["merchant_name"], "Confirmed Merchant")
        self.assertEqual(receipt.parser_result.normalized_json["fields"]["transaction_date"], "2026-04-25")
        self.assertEqual(
            receipt.parser_result.normalized_json["fields"]["transaction_datetime"],
            "2026-04-25T10:15:00+00:00",
        )
        self.assertEqual(receipt.parser_result.normalized_json["fields"]["total_amount"], 145000.0)
        self.assertEqual(
            receipt.parser_result.normalized_json["review_defaults"]["description"],
            "User confirmed description",
        )
        self.assertEqual(
            receipt.parser_result.normalized_json["review_defaults"]["transaction_time"],
            "2026-04-25T10:15:00+00:00",
        )
        self.assertEqual(receipt.parser_result.normalized_json["review_defaults"]["wallet_id"], "wallet-1")
        self.assertEqual(receipt.parser_result.normalized_json["review_defaults"]["category_id"], "12")
        self.assertEqual(receipt.parser_result.normalized_json["receipt_summary"]["merchant_name"], "Confirmed Merchant")
        self.assertEqual(receipt.parser_result.normalized_json["finance_transaction_id"], "txn-123")
        self.assertEqual(receipt.parser_result.suggested_category_id, 12)
        self.assertEqual(receipt.parser_result.suggested_description, "User confirmed description")
        self.assertEqual(receipt.status, "confirmed")


@unittest.skipIf(finalize_parse_session is None, f"session finalization dependencies unavailable: {_IMPORT_ERROR}")
class ReceiptSessionFinalizeTests(unittest.TestCase):
    def test_finalize_parse_session_creates_transaction_only_on_confirm(self) -> None:
        db = _FakeDB()
        current_user = SimpleNamespace(email="user@example.com", token="token")
        payload = ReceiptConfirmRequest(
            wallet_id="wallet-1",
            category_id="15",
            type="EXPENSE",
            amount=215000.0,
            description="Confirmed from session",
            merchant_name="Confirmed Session Merchant",
            transaction_date=datetime(2026, 4, 26, 8, 0, tzinfo=UTC),
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir) / "receipt.jpg"
            temp_path.write_bytes(b"image-bytes")
            session = SimpleNamespace(
                id=uuid4(),
                user_id=42,
                file_name="receipt.jpg",
                temp_url=str(temp_path),
                mime_type="image/jpeg",
                file_size=1024,
                image_hash="existing-hash",
                status="ready_for_review",
                finalized_at=None,
                confirmed_receipt_id=None,
                processed_at=datetime(2026, 4, 26, 7, 0, tzinfo=UTC),
                created_at=datetime(2026, 4, 26, 7, 0, tzinfo=UTC),
                updated_at=datetime(2026, 4, 26, 7, 0, tzinfo=UTC),
                ocr_provider="veryfi",
                ocr_raw_text="Session OCR text",
                ocr_debug_json={"display_mode": "parser"},
                merchant_name="Auto Session Merchant",
                transaction_date=datetime(2026, 4, 25, 12, 0),
                total_amount=Decimal("200000.00"),
                tax_amount=Decimal("10000.00"),
                currency="VND",
                extracted_json={
                    "fields": {
                        "merchant_name": "Auto Session Merchant",
                        "transaction_date": "2026-04-25",
                        "transaction_datetime": "2026-04-25T12:00:00",
                        "total_amount": 200000.0,
                        "tax_amount": 10000.0,
                        "currency": "VND",
                    },
                    "receipt_summary": {
                        "merchant_name": "Auto Session Merchant",
                        "transaction_date": "2026-04-25",
                        "transaction_datetime": "2026-04-25T12:00:00",
                        "total_amount": 200000.0,
                        "currency": "VND",
                        "provider_category": "Meals",
                        "line_items": [],
                    },
                    "review_defaults": {
                        "merchant_name": "Auto Session Merchant",
                        "amount": 200000.0,
                        "transaction_time": "2026-04-25T12:00:00",
                        "category_id": "15",
                    },
                },
                reviewer_feedback_json=None,
                reviewer_note=None,
                review_status="reviewed",
                permanent_url=None,
                finance_transaction_id=None,
            )

            with (
                patch("app.services.session_finalize.resolve_shared_user_id", return_value=42),
                patch("app.services.session_finalize.promote_temp_upload", return_value="uploads/final/receipt.jpg"),
                patch(
                    "app.services.session_finalize.create_finance_transaction",
                    return_value={"id": "txn-session-1", "warning": None},
                ) as finance_mock,
            ):
                updated_session, receipt, finance_transaction_id, finance_warning = finalize_parse_session(
                    db,
                    session,
                    payload,
                    current_user,
                )

        finance_mock.assert_called_once()
        self.assertEqual(finance_transaction_id, "txn-session-1")
        self.assertIsNone(finance_warning)
        self.assertEqual(updated_session.finance_transaction_id, "txn-session-1")
        self.assertEqual(updated_session.status, "confirmed")
        self.assertEqual(receipt.status, "confirmed")
        self.assertEqual(receipt.parser_result.normalized_json["fields"]["merchant_name"], "Confirmed Session Merchant")
        self.assertEqual(receipt.parser_result.normalized_json["fields"]["transaction_date"], "2026-04-26")
        self.assertEqual(
            receipt.parser_result.normalized_json["fields"]["transaction_datetime"],
            "2026-04-26T08:00:00+00:00",
        )
        self.assertEqual(receipt.parser_result.normalized_json["fields"]["total_amount"], 215000.0)
        self.assertEqual(
            receipt.parser_result.normalized_json["review_defaults"]["transaction_time"],
            "2026-04-26T08:00:00+00:00",
        )
        self.assertEqual(receipt.parser_result.normalized_json["receipt_summary"]["merchant_name"], "Confirmed Session Merchant")
        self.assertEqual(receipt.parser_result.normalized_json["finance_transaction_id"], "txn-session-1")


@unittest.skipIf(receipts_api is None or discard_parse_session is None, f"discard flow dependencies unavailable: {_IMPORT_ERROR}")
class ReceiptSessionDiscardTests(unittest.TestCase):
    def test_discard_receipt_session_removes_draft_files_and_session(self) -> None:
        db = _FakeDB()
        current_user = SimpleNamespace(email="user@example.com", token="token")

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir) / "draft.jpg"
            processed_path = Path(temp_dir) / "processed.png"
            text_path = Path(temp_dir) / "draft.txt"
            temp_path.write_bytes(b"draft")
            processed_path.write_bytes(b"processed")
            text_path.write_text("ocr", encoding="utf-8")
            session = SimpleNamespace(
                id=uuid4(),
                user_id=42,
                finalized_at=None,
                confirmed_receipt_id=None,
                temp_url=str(temp_path),
                ocr_debug_json={
                    "processed_image_path": str(processed_path),
                    "ocr_text_file_path": str(text_path),
                },
            )

            with (
                patch("app.api.receipts._resolve_current_shared_user_id", return_value=42),
                patch("app.api.receipts._load_session", return_value=session),
                patch("app.services.session_finalize.resolve_shared_user_id", return_value=42),
            ):
                result = receipts_api.discard_receipt_session(str(session.id), current_user=current_user, db=db)

        self.assertEqual(result.status, "discarded")
        self.assertEqual(result.session_id, session.id)
        self.assertIn(session, db.deleted)
        self.assertFalse(temp_path.exists())
        self.assertFalse(processed_path.exists())
        self.assertFalse(text_path.exists())

    def test_discard_parse_session_rejects_confirmed_session(self) -> None:
        db = _FakeDB()
        current_user = SimpleNamespace(email="user@example.com", token="token")
        session = SimpleNamespace(
            id=uuid4(),
            user_id=42,
            finalized_at=datetime(2026, 4, 26, 8, 0, tzinfo=UTC),
            confirmed_receipt_id=88,
            temp_url="unused",
            ocr_debug_json=None,
        )

        with patch("app.services.session_finalize.resolve_shared_user_id", return_value=42):
            with self.assertRaises(HTTPException) as exc:
                discard_parse_session(db, session, current_user)

        self.assertIn("cannot be discarded", str(exc.exception.detail))


if __name__ == "__main__":
    unittest.main()
