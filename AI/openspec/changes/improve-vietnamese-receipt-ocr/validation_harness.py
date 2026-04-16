from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path

import cv2
import numpy as np

from app.api import receipts as receipts_api
from app.core.auth import AuthenticatedUser
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Receipt
from app.schemas.receipt import ReceiptConfirmRequest, ReceiptFeedbackRequest
from app.services.extraction_service import extract_all
from app.services.image_preprocess import preprocess_image_with_metadata
from app.services.ocr_postprocess import normalize_vietnamese_lines
from app.services.parse_pipeline import process_parse_job
from app.services.receipt_queue import claim_next_parse_job, enqueue_parse_job

ROOT = Path("/app")
FIXTURE_ROOT = ROOT / "tmp_receipt_tests"
FIXTURE_ROOT.mkdir(parents=True, exist_ok=True)
fixtures = [
    {
        "name": "clear-simple",
        "lines": [
            "HÓA ĐƠN CITY MART",
            "03/04/2026 11:30",
            "Nước suối 12,000",
            "Tổng tiền 34,100",
        ],
    },
    {
        "name": "blurry-like-ocr-noise",
        "lines": [
            "HOA DON CITY MART",
            "Date 03:04:2026",
            "Sub t0tal 31.000",
            "T0tal 34.100",
        ],
    },
    {
        "name": "long-receipt",
        "lines": [
            "NHÀ HÀNG GIA ĐÌNH",
            "Món 1 50,000",
            "Món 2 45,000",
            "Món 3 35,000",
            "Món 4 60,000",
            "Món 5 40,000",
            "VAT 23,000",
            "Grand Total 253,000",
        ],
    },
    {
        "name": "subtotal-tax-discount",
        "lines": [
            "THE COFFEE HOUSE",
            "Subtotal 125,000",
            "VAT 12,500",
            "Discount -10,000",
            "Grand Total 127,500",
        ],
    },
]


def _generate_sample_images() -> dict[str, Path]:
    clear = np.full((1200, 700, 3), 255, dtype=np.uint8)
    cv2.putText(clear, "HOA DON", (40, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (0, 0, 0), 3)
    cv2.putText(clear, "Tong tien 34100", (40, 180), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 0, 0), 2)
    clear_path = FIXTURE_ROOT / "receipt-clear.png"
    cv2.imwrite(str(clear_path), clear)

    blurry = cv2.GaussianBlur(clear, (11, 11), 0)
    blurry_path = FIXTURE_ROOT / "receipt-blurry.png"
    cv2.imwrite(str(blurry_path), blurry)
    return {"clear": clear_path, "blurry": blurry_path}


def build_fixture_summary() -> dict:
    required = ["clear-simple", "blurry-like-ocr-noise", "long-receipt", "subtotal-tax-discount"]
    fixture_results: dict[str, dict] = {}
    for name in required:
        fixture = next(item for item in fixtures if item["name"] == name)
        parsed = extract_all(fixture["lines"], "\n".join(fixture["lines"]))
        fixture_results[name] = {
            "merchant_name": parsed.get("merchant_name"),
            "transaction_date": parsed.get("transaction_date"),
            "total_amount": parsed.get("total_amount"),
            "tax_amount": parsed.get("tax_amount"),
            "currency": parsed.get("currency"),
        }
    return fixture_results


def build_preprocess_summary() -> dict:
    generated = _generate_sample_images()
    image_inputs: dict[str, Path] = {"clear": generated["clear"], "blurry": generated["blurry"]}
    rotated_path = FIXTURE_ROOT / "receipt-clear-rotated90.png"
    long_path = FIXTURE_ROOT / "receipt-clear-long.png"

    clear_img = cv2.imread(str(image_inputs["clear"]))
    if clear_img is not None:
        cv2.imwrite(str(rotated_path), cv2.rotate(clear_img, cv2.ROTATE_90_CLOCKWISE))
        long_img = np.vstack([clear_img, clear_img, clear_img])
        cv2.imwrite(str(long_path), long_img)
        image_inputs["rotated"] = rotated_path
        image_inputs["long"] = long_path

    preprocess_results: dict[str, dict] = {}
    for label, src in image_inputs.items():
        output = FIXTURE_ROOT / f"processed-{label}.png"
        _, meta = preprocess_image_with_metadata(str(src), str(output))
        preprocess_results[label] = meta
    return preprocess_results


def run_workflow_regression() -> dict:
    Base.metadata.create_all(bind=engine)
    user_id = uuid.uuid4()
    other_user_id = uuid.uuid4()
    receipt_id: str | None = None
    workflow: dict[str, object] = {}

    class StubOCR:
        def extract_text(self, image_path: str):
            lines = [
                "HÓA DON CITY MART",
                "Giò: 03/04/2026",
                "Subtotal 31,000",
                "VAT 3,100",
                "Total 34,100",
                "cåm on",
                "hen gp lai",
            ]
            fixed_lines, meta = normalize_vietnamese_lines(lines, [0.75] * len(lines))
            return {
                "raw_text": "\n".join(fixed_lines),
                "lines": fixed_lines,
                "confidence": 0.75,
                "confidences": [0.75] * len(fixed_lines),
                "device": "cpu",
                "provider": "paddleocr",
                "ocr_language": "vi",
                "fallback_used": False,
                "low_quality_ratio": 0.0,
                "postprocess": meta,
                "raw_lines_before_postprocess": lines,
            }

    from app.services import parse_pipeline as parse_pipeline_module

    original_ocr_factory = parse_pipeline_module.get_ocr_service
    original_finance = receipts_api.create_finance_transaction
    parse_pipeline_module.get_ocr_service = lambda: StubOCR()
    receipts_api.create_finance_transaction = lambda **kwargs: {"id": "txn-validation-vi-1", "warning": None}

    try:
        with SessionLocal() as db:
            upload_src = _generate_sample_images()["clear"]
            stored = ROOT / "uploads" / f"{uuid.uuid4()}.png"
            stored.parent.mkdir(parents=True, exist_ok=True)
            stored.write_bytes(upload_src.read_bytes())

            now = datetime.now(UTC)
            receipt = Receipt(
                user_id=user_id,
                file_name="validation-receipt.png",
                original_url=str(stored),
                mime_type="image/png",
                file_size=stored.stat().st_size,
                image_hash="validation-hash",
                status="uploaded",
                uploaded_at=now,
                created_at=now,
                updated_at=now,
            )
            db.add(receipt)
            db.flush()
            receipt_id = str(receipt.id)
            enqueue_parse_job(db, receipt)
            db.commit()

        with SessionLocal() as db:
            job = claim_next_parse_job(db)
            process_parse_job(db, job.id)

        with SessionLocal() as db:
            auth_user = AuthenticatedUser(user_id=user_id, email="owner@example.com", role="USER", token="owner-token")
            owner_view = receipts_api.get_receipt(receipt_id=receipt_id, current_user=auth_user, db=db)
            workflow["status_after_parse"] = owner_view.receipt.status
            workflow["merchant_after_parse"] = owner_view.extraction_result.merchant_name if owner_view.extraction_result else None

            feedback_payload = ReceiptFeedbackRequest(
                feedback="manual check ok",
                merchant_name="CITY MART",
                transaction_date=datetime(2026, 4, 3, 11, 30, tzinfo=UTC),
                total_amount=34100,
                tax_amount=3100,
                currency="VND",
            )
            reviewed = receipts_api.save_feedback(
                receipt_id=receipt_id,
                payload=feedback_payload,
                current_user=auth_user,
                db=db,
            )
            workflow["status_after_feedback"] = reviewed.receipt.status

            confirm_payload = ReceiptConfirmRequest(
                wallet_id="wallet-validation",
                category_id="category-validation",
                type="EXPENSE",
                amount=34100,
                description="validation flow",
                merchant_name="CITY MART",
                transaction_date=datetime(2026, 4, 3, 11, 30, tzinfo=UTC),
            )
            confirmed = receipts_api.confirm_receipt(
                receipt_id=receipt_id,
                payload=confirm_payload,
                current_user=auth_user,
                db=db,
            )
            workflow["status_after_confirm"] = confirmed.receipt.status
            workflow["finance_transaction_id"] = confirmed.finance_transaction_id

            other_user = AuthenticatedUser(user_id=other_user_id, email="other@example.com", role="USER", token="other-token")
            ownership_blocked = False
            try:
                receipts_api.get_receipt(receipt_id=receipt_id, current_user=other_user, db=db)
            except Exception as exc:  # noqa: BLE001
                ownership_blocked = "403" in str(exc)
            workflow["ownership_enforced"] = ownership_blocked
    finally:
        parse_pipeline_module.get_ocr_service = original_ocr_factory
        receipts_api.create_finance_transaction = original_finance

    return workflow


def main() -> None:
    before_lines = ["HOA DON", "Giò", "cåm on", "hen gp lai", "THANH TOAN"]
    normalized_lines, postprocess_metadata = normalize_vietnamese_lines(before_lines, [0.45] * len(before_lines))

    report = {
        "fixtures": build_fixture_summary(),
        "preprocess": build_preprocess_summary(),
        "normalized_examples_before": before_lines,
        "normalized_examples_after": normalized_lines,
        "postprocess_metadata": postprocess_metadata,
        "workflow": run_workflow_regression(),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
