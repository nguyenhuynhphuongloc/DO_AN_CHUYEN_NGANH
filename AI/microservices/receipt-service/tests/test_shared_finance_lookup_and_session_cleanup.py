from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import SimpleNamespace

try:
    from app.services.session_finalize import cleanup_expired_parse_sessions
    from app.services.shared_finance_lookup_service import get_transaction_by_receipt_id
except ModuleNotFoundError as exc:  # pragma: no cover - environment-dependent import
    cleanup_expired_parse_sessions = None  # type: ignore[assignment]
    get_transaction_by_receipt_id = None  # type: ignore[assignment]
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


class _FakeMappingsResult:
    def __init__(self, row):
        self._row = row

    def first(self):
        return self._row


class _FakeScalarResult:
    def __init__(self, sessions):
        self._sessions = sessions

    def all(self):
        return list(self._sessions)


class _FakeExecuteResult:
    def __init__(self, *, row=None, sessions=None):
        self._row = row
        self._sessions = sessions or []

    def mappings(self):
        return _FakeMappingsResult(self._row)

    def scalars(self):
        return _FakeScalarResult(self._sessions)


@unittest.skipIf(get_transaction_by_receipt_id is None, f"shared finance lookup dependencies unavailable: {_IMPORT_ERROR}")
class SharedFinanceLookupTests(unittest.TestCase):
    def test_get_transaction_by_receipt_id_returns_linked_wallet_category_and_receipt_fields(self) -> None:
        class _FakeDB:
            def execute(self, _query, _params):
                return _FakeExecuteResult(
                    row={
                        "id": 501,
                        "wallet_id": 11,
                        "category_id": 15,
                        "merchant_name": "Highlands Coffee",
                        "description": "Morning coffee",
                        "date": datetime(2026, 4, 24, 8, 30, tzinfo=UTC),
                        "source_type": "receipt_ai",
                        "source_ref_id": "session-123",
                    },
                )

        result = get_transaction_by_receipt_id(_FakeDB(), receipt_id=77)

        self.assertEqual(
            result,
            {
                "id": "501",
                "wallet_id": "11",
                "category_id": "15",
                "merchant_name": "Highlands Coffee",
                "description": "Morning coffee",
                "transaction_date": "2026-04-24T08:30:00+00:00",
                "source_type": "receipt_ai",
                "source_ref_id": "session-123",
            },
        )


@unittest.skipIf(cleanup_expired_parse_sessions is None, f"session cleanup dependencies unavailable: {_IMPORT_ERROR}")
class ReceiptSessionCleanupTests(unittest.TestCase):
    def test_cleanup_expired_parse_sessions_removes_abandoned_drafts_and_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir) / "draft.jpg"
            processed_path = Path(temp_dir) / "processed.png"
            text_path = Path(temp_dir) / "draft.txt"
            temp_path.write_bytes(b"draft")
            processed_path.write_bytes(b"processed")
            text_path.write_text("ocr", encoding="utf-8")
            session = SimpleNamespace(
                id="session-1",
                temp_url=str(temp_path),
                ocr_debug_json={
                    "processed_image_path": str(processed_path),
                    "ocr_text_file_path": str(text_path),
                },
                finalized_at=None,
                expires_at=datetime.now(UTC) - timedelta(days=2),
            )

            class _FakeDB:
                def __init__(self, session_obj):
                    self.deleted: list[object] = []
                    self.commit_count = 0
                    self.session_obj = session_obj

                def execute(self, _query):
                    return _FakeExecuteResult(sessions=[self.session_obj])

                def delete(self, item):
                    self.deleted.append(item)

                def commit(self):
                    self.commit_count += 1

            db = _FakeDB(session)
            cleaned = cleanup_expired_parse_sessions(db)

        self.assertEqual(cleaned, 1)
        self.assertEqual(db.deleted, [session])
        self.assertEqual(db.commit_count, 1)
        self.assertFalse(temp_path.exists())
        self.assertFalse(processed_path.exists())
        self.assertFalse(text_path.exists())


if __name__ == "__main__":
    unittest.main()
