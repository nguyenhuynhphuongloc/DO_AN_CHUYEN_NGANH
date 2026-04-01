from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.receipt import Receipt, ReceiptExtraction, ReceiptJob, ReceiptOcrResult
from app.services.extraction_service import extract_all
from app.services.image_preprocess import preprocess_image

logger = logging.getLogger(__name__)

PARSE_JOB_TYPE = "parse"
STATUS_QUEUED = "queued"
STATUS_PREPROCESSING = "preprocessing"
STATUS_OCR_RUNNING = "ocr_running"
STATUS_EXTRACTING = "extracting"
STATUS_READY_FOR_REVIEW = "ready_for_review"
STATUS_FAILED = "failed"
ACTIVE_PARSE_JOB_STATUSES = {
    STATUS_QUEUED,
    STATUS_PREPROCESSING,
    STATUS_OCR_RUNNING,
    STATUS_EXTRACTING,
}
TERMINAL_PARSE_JOB_STATUSES = {STATUS_READY_FOR_REVIEW, STATUS_FAILED}


def now_utc() -> datetime:
    return datetime.now(UTC)


def merge_extracted_json(existing: dict[str, Any] | None, updates: dict[str, Any] | None = None) -> dict[str, Any]:
    merged = dict(existing or {})
    if updates:
        for key, value in updates.items():
            if value is not None:
                merged[key] = value
    return merged


def build_extraction_payload(extracted_fields: dict[str, Any]) -> dict[str, Any]:
    extracted_json = merge_extracted_json(
        extracted_fields.get("extracted_json"),
        {
            "merchant_name": extracted_fields.get("merchant_name"),
            "transaction_date": extracted_fields.get("transaction_date"),
            "total_amount": extracted_fields.get("total_amount"),
            "tax_amount": extracted_fields.get("tax_amount"),
            "currency": extracted_fields.get("currency"),
        },
    )
    return {
        "merchant_name": extracted_fields.get("merchant_name"),
        "transaction_date": extracted_fields.get("transaction_date"),
        "total_amount": extracted_fields.get("total_amount"),
        "tax_amount": extracted_fields.get("tax_amount"),
        "currency": extracted_fields.get("currency"),
        "extracted_json": extracted_json,
    }


def make_json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(key): make_json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [make_json_safe(item) for item in value]
    if hasattr(value, "tolist"):
        return make_json_safe(value.tolist())
    if isinstance(value, Path):
        return str(value)
    return value


def extracted_fields_from_receipt(receipt: Receipt) -> dict[str, Any]:
    extraction = receipt.extraction
    if extraction is None:
        return {}

    extracted_json = dict(extraction.extracted_json or {})
    extracted_json.update(
        {
            "merchant_name": extraction.merchant_name,
            "transaction_date": extraction.transaction_date.isoformat() if extraction.transaction_date else None,
            "total_amount": float(extraction.total_amount) if extraction.total_amount is not None else None,
            "tax_amount": float(extraction.tax_amount) if extraction.tax_amount is not None else None,
            "currency": extraction.currency,
        }
    )
    return {
        "merchant_name": extraction.merchant_name,
        "transaction_date": extraction.transaction_date.isoformat() if extraction.transaction_date else None,
        "total_amount": float(extraction.total_amount) if extraction.total_amount is not None else None,
        "tax_amount": float(extraction.tax_amount) if extraction.tax_amount is not None else None,
        "currency": extraction.currency,
        "extracted_json": extracted_json,
    }


def get_latest_parse_job(db: Session, receipt_id: UUID) -> ReceiptJob | None:
    return (
        db.query(ReceiptJob)
        .filter(ReceiptJob.receipt_id == receipt_id, ReceiptJob.job_type == PARSE_JOB_TYPE)
        .order_by(ReceiptJob.created_at.desc())
        .first()
    )


def queue_parse_job(db: Session, receipt: Receipt, force: bool = False) -> ReceiptJob | None:
    latest_job = get_latest_parse_job(db, receipt.id)
    if latest_job is not None and latest_job.status in ACTIVE_PARSE_JOB_STATUSES:
        return latest_job

    if not force and receipt.extraction is not None and receipt.status in {STATUS_READY_FOR_REVIEW, "reviewed", "confirmed"}:
        return latest_job

    job = latest_job
    timestamp = now_utc()
    if job is None:
        job = ReceiptJob(
            receipt_id=receipt.id,
            job_type=PARSE_JOB_TYPE,
            status=STATUS_QUEUED,
            created_at=timestamp,
        )
        db.add(job)
    else:
        job.status = STATUS_QUEUED
        job.error_message = None
        job.started_at = None
        job.finished_at = None

    receipt.status = STATUS_QUEUED
    receipt.updated_at = timestamp
    db.commit()
    db.refresh(job)
    return job


def claim_next_parse_job(db: Session) -> ReceiptJob | None:
    stmt = (
        select(ReceiptJob)
        .where(ReceiptJob.job_type == PARSE_JOB_TYPE, ReceiptJob.status == STATUS_QUEUED)
        .order_by(ReceiptJob.created_at.asc())
        .with_for_update(skip_locked=True)
    )
    job = db.execute(stmt).scalars().first()
    if job is None:
        return None

    receipt = db.get(Receipt, job.receipt_id)
    timestamp = now_utc()
    job.status = STATUS_PREPROCESSING
    job.started_at = timestamp
    job.finished_at = None
    job.error_message = None
    if receipt is not None:
        receipt.status = STATUS_PREPROCESSING
        receipt.updated_at = timestamp
    db.commit()
    db.refresh(job)
    return job


def mark_stale_parse_jobs(db: Session, stale_after_seconds: int) -> int:
    cutoff = now_utc() - timedelta(seconds=stale_after_seconds)
    jobs = (
        db.query(ReceiptJob)
        .filter(
            ReceiptJob.job_type == PARSE_JOB_TYPE,
            ReceiptJob.status.in_({STATUS_PREPROCESSING, STATUS_OCR_RUNNING, STATUS_EXTRACTING}),
            ReceiptJob.started_at.isnot(None),
            ReceiptJob.started_at < cutoff,
        )
        .all()
    )
    if not jobs:
        return 0

    timestamp = now_utc()
    for job in jobs:
        job.status = STATUS_FAILED
        job.finished_at = timestamp
        job.error_message = "Receipt parse job marked failed after worker timeout"
        receipt = db.get(Receipt, job.receipt_id)
        if receipt is not None:
            receipt.status = STATUS_FAILED
            receipt.updated_at = timestamp
    db.commit()
    return len(jobs)


def mark_parse_job_failed(db: Session, job_id: UUID, error_message: str) -> None:
    job = db.get(ReceiptJob, job_id)
    if job is None:
        return

    timestamp = now_utc()
    job.status = STATUS_FAILED
    job.finished_at = timestamp
    job.error_message = error_message
    receipt = db.get(Receipt, job.receipt_id)
    if receipt is not None:
        receipt.status = STATUS_FAILED
        receipt.updated_at = timestamp
    db.commit()


def _update_job_phase(db: Session, receipt: Receipt, job: ReceiptJob, status: str) -> None:
    timestamp = now_utc()
    job.status = status
    job.error_message = None
    receipt.status = status
    receipt.updated_at = timestamp
    db.commit()


def _load_job_with_receipt(db: Session, job_id: UUID) -> tuple[ReceiptJob, Receipt]:
    job = (
        db.query(ReceiptJob)
        .options(
            joinedload(ReceiptJob.receipt).joinedload(Receipt.ocr_result),
            joinedload(ReceiptJob.receipt).joinedload(Receipt.extraction),
        )
        .filter(ReceiptJob.id == job_id)
        .first()
    )
    if job is None or job.receipt is None:
        raise ValueError("Queued receipt job was not found")
    return job, job.receipt


def process_parse_job(db: Session, job_id: UUID, ocr_service: Any) -> None:
    job, receipt = _load_job_with_receipt(db, job_id)
    source_path = Path(receipt.original_url)
    if not source_path.exists():
        raise FileNotFoundError("Stored receipt image is missing from the uploads folder")

    processed_dir = source_path.parent / "processed"
    processed_path = processed_dir / f"{source_path.stem}-processed.png"

    preprocess_result = preprocess_image(str(source_path), str(processed_path))
    _update_job_phase(db, receipt, job, STATUS_OCR_RUNNING)

    ocr_payload = ocr_service.extract_text(str(preprocess_result["output_path"]))
    _update_job_phase(db, receipt, job, STATUS_EXTRACTING)

    extracted_fields = extract_all(
        lines=[str(line) for line in ocr_payload.get("normalized_lines", ocr_payload.get("lines", []))],
        raw_text=str(ocr_payload.get("normalized_text", ocr_payload.get("raw_text", ""))),
    )

    merchant_name = extracted_fields.get("merchant_name")
    transaction_date = (
        datetime.fromisoformat(str(extracted_fields["transaction_date"])).date()
        if extracted_fields.get("transaction_date")
        else None
    )
    total_amount = Decimal(str(extracted_fields["total_amount"])) if extracted_fields.get("total_amount") is not None else None
    tax_amount = Decimal(str(extracted_fields["tax_amount"])) if extracted_fields.get("tax_amount") is not None else None
    confidence = min(max(float(ocr_payload.get("confidence", 0.0)), 0.0), 1.0)
    confidence_decimal = Decimal(f"{confidence:.4f}")
    extraction_payload = build_extraction_payload(extracted_fields)
    raw_json = {
        "lines": make_json_safe(list(ocr_payload.get("lines", []))),
        "normalized_lines": make_json_safe(list(ocr_payload.get("normalized_lines", []))),
        "confidences": make_json_safe(list(ocr_payload.get("confidences", []))),
        "line_details": make_json_safe(list(ocr_payload.get("line_details", []))),
        "normalized_text": make_json_safe(ocr_payload.get("normalized_text")),
        "processed_image_path": str(preprocess_result["output_path"]),
        "preprocessing": make_json_safe(preprocess_result.get("metadata", {})),
        "doc_preprocessor": make_json_safe(ocr_payload.get("doc_preprocessor")),
        "model_lang": make_json_safe(ocr_payload.get("model_lang")),
        "model_device": make_json_safe(ocr_payload.get("model_device")),
    }

    timestamp = now_utc()
    if receipt.ocr_result is None:
        receipt.ocr_result = ReceiptOcrResult(
            receipt_id=receipt.id,
            ocr_provider="paddleocr",
            raw_text=str(ocr_payload.get("raw_text", "")),
            raw_json=raw_json,
            confidence_score=confidence_decimal,
            created_at=timestamp,
        )
    else:
        receipt.ocr_result.ocr_provider = "paddleocr"
        receipt.ocr_result.raw_text = str(ocr_payload.get("raw_text", ""))
        receipt.ocr_result.raw_json = raw_json
        receipt.ocr_result.confidence_score = confidence_decimal

    if receipt.extraction is None:
        receipt.extraction = ReceiptExtraction(
            receipt_id=receipt.id,
            merchant_name=str(merchant_name) if merchant_name is not None else None,
            transaction_date=transaction_date,
            total_amount=total_amount,
            tax_amount=tax_amount,
            currency=str(extraction_payload["currency"]) if extraction_payload["currency"] is not None else None,
            extracted_json=extraction_payload["extracted_json"],
            confidence_score=confidence_decimal,
            review_status="needs_review",
            created_at=timestamp,
            updated_at=timestamp,
        )
    else:
        receipt.extraction.merchant_name = str(merchant_name) if merchant_name is not None else None
        receipt.extraction.transaction_date = transaction_date
        receipt.extraction.total_amount = total_amount
        receipt.extraction.tax_amount = tax_amount
        receipt.extraction.currency = str(extraction_payload["currency"]) if extraction_payload["currency"] is not None else None
        receipt.extraction.extracted_json = extraction_payload["extracted_json"]
        receipt.extraction.confidence_score = confidence_decimal
        receipt.extraction.review_status = "needs_review"
        receipt.extraction.updated_at = timestamp

    job.status = STATUS_READY_FOR_REVIEW
    job.finished_at = timestamp
    job.error_message = None
    receipt.status = STATUS_READY_FOR_REVIEW
    receipt.processed_at = timestamp
    receipt.updated_at = timestamp
    db.commit()
    logger.info("Receipt %s finished background parse job %s", receipt.id, job.id)
