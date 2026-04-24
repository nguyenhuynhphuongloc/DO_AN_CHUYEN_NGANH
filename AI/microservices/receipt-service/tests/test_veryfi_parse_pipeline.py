from __future__ import annotations

import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

try:
    from app.services.parse_pipeline import process_session_parse_job
except ModuleNotFoundError as exc:  # pragma: no cover - environment-dependent test import
    process_session_parse_job = None  # type: ignore[assignment]
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


class _FakeDB:
    def __init__(self) -> None:
        self.commit_count = 0
        self.rollback_count = 0

    def commit(self) -> None:
        self.commit_count += 1

    def rollback(self) -> None:
        self.rollback_count += 1


def _make_job(temp_path: str):
    session = SimpleNamespace(
        id=uuid4(),
        temp_url=temp_path,
        updated_at=datetime.utcnow(),
        status="queued",
        processed_at=None,
        ocr_provider=None,
        ocr_raw_text=None,
        ocr_debug_json=None,
        ocr_confidence_score=None,
        merchant_name=None,
        transaction_date=None,
        total_amount=None,
        tax_amount=None,
        currency=None,
        extracted_json=None,
        extraction_confidence_score=None,
        review_status="needs_review",
    )
    job = SimpleNamespace(
        id=uuid4(),
        session=session,
        session_id=session.id,
        created_at=datetime.utcnow(),
        started_at=datetime.utcnow(),
        finished_at=None,
        status="queued",
        error_message=None,
    )
    return job


@unittest.skipIf(process_session_parse_job is None, f"parse pipeline dependencies unavailable: {_IMPORT_ERROR}")
class ParsePipelineSessionTests(unittest.TestCase):
    def test_process_session_parse_job_persists_veryfi_result(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir) / "receipt.jpg"
            temp_path.write_bytes(b"fake-image")
            job = _make_job(str(temp_path))
            db = _FakeDB()
            parser_result = SimpleNamespace(
                provider="veryfi",
                raw_text="Store\nTOTAL 25.50",
                document={"id": 101, "document_type": "receipt", "category": "Meals"},
                runtime={"provider": "veryfi", "parser_seconds": 0.2},
            )
            extracted_fields = {
                "merchant_name": "Store",
                "transaction_date": "2024-08-15",
                "total_amount": 25.50,
                "tax_amount": 1.5,
                "currency": "USD",
                "confidence_score": 0.88,
                "extracted_json": {
                    "fields": {
                        "merchant_name": "Store",
                        "transaction_date": "2024-08-15",
                        "total_amount": 25.50,
                        "currency": "USD",
                    },
                    "needs_review_fields": [],
                },
            }

            with (
                patch("app.services.parse_pipeline._load_session_parse_job", return_value=job),
                patch(
                    "app.services.parse_pipeline._prepare_processed_source",
                    return_value=(temp_path, {"profile": "disabled"}, 0.0),
                ),
                patch(
                    "app.services.parse_pipeline._run_primary_parse",
                    return_value=(parser_result, extracted_fields, 0.2, 0.05),
                ),
            ):
                process_session_parse_job(db, job.id)

            self.assertEqual(job.status, "ready_for_review")
            self.assertEqual(job.session.status, "ready_for_review")
            self.assertEqual(job.session.ocr_provider, "veryfi")
            self.assertEqual(job.session.merchant_name, "Store")
            self.assertEqual(job.session.extracted_json["fields"]["total_amount"], 25.50)
            self.assertGreaterEqual(db.commit_count, 4)

    def test_process_session_parse_job_marks_job_failed_on_parser_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir) / "receipt.jpg"
            temp_path.write_bytes(b"fake-image")
            job = _make_job(str(temp_path))
            db = _FakeDB()

            with (
                patch("app.services.parse_pipeline._load_session_parse_job", return_value=job),
                patch(
                    "app.services.parse_pipeline._prepare_processed_source",
                    return_value=(temp_path, {"profile": "disabled"}, 0.0),
                ),
                patch(
                    "app.services.parse_pipeline._run_primary_parse",
                    side_effect=RuntimeError("veryfi unavailable"),
                ),
            ):
                process_session_parse_job(db, job.id)

            self.assertEqual(job.status, "failed")
            self.assertEqual(job.session.status, "failed")
            self.assertEqual(job.error_message, "veryfi unavailable")
            self.assertEqual(db.rollback_count, 1)


if __name__ == "__main__":
    unittest.main()
