from __future__ import annotations

import logging
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.receipt import Receipt, ReceiptExtraction, ReceiptJob, ReceiptOcrResult
from app.services.extraction_service import extract_all
from app.services.image_preprocess import preprocess_image
from app.services.ocr_service import get_ocr_service

logger = logging.getLogger(__name__)


def _load_parse_job(db: Session, job_id: UUID) -> ReceiptJob:
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
        raise ValueError(f"Receipt parse job {job_id} was not found")
    return job


def _set_phase(job: ReceiptJob, phase: str, *, error_message: str | None = None, finished: bool = False) -> None:
    now = datetime.now(job.created_at.tzinfo) if job.created_at.tzinfo else datetime.utcnow()
    job.status = phase
    job.error_message = error_message
    job.receipt.updated_at = now
    if phase == "failed":
        job.receipt.status = "failed"
    elif phase == "ready_for_review":
        job.receipt.status = "ready_for_review"
        job.receipt.processed_at = now
    else:
        job.receipt.status = "processing"
    if finished:
        job.finished_at = now


def _persist_results(job: ReceiptJob, processed_path: Path, ocr_payload: dict, extracted_fields: dict) -> None:
    now = datetime.now(job.created_at.tzinfo) if job.created_at.tzinfo else datetime.utcnow()
    receipt = job.receipt
    raw_text = str(ocr_payload.get("raw_text", ""))
    lines = list(ocr_payload.get("lines", []))
    confidences = [float(value) for value in list(ocr_payload.get("confidences", []))]
    confidence = min(max(float(ocr_payload.get("confidence", 0.0)), 0.0), 1.0)
    confidence_decimal = Decimal(f"{confidence:.4f}")

    raw_json = {
        "lines": lines,
        "confidences": confidences,
        "processed_image_path": str(processed_path),
        "device": ocr_payload.get("device"),
    }

    if receipt.ocr_result is None:
        receipt.ocr_result = ReceiptOcrResult(
            receipt_id=receipt.id,
            ocr_provider=str(ocr_payload.get("provider", "paddleocr")),
            raw_text=raw_text,
            raw_json=raw_json,
            confidence_score=confidence_decimal,
            created_at=now,
        )
    else:
        receipt.ocr_result.ocr_provider = str(ocr_payload.get("provider", "paddleocr"))
        receipt.ocr_result.raw_text = raw_text
        receipt.ocr_result.raw_json = raw_json
        receipt.ocr_result.confidence_score = confidence_decimal

    merchant_name = extracted_fields.get("merchant_name")
    transaction_date = (
        datetime.fromisoformat(str(extracted_fields["transaction_date"])).date()
        if extracted_fields.get("transaction_date")
        else None
    )
    total_amount = Decimal(str(extracted_fields["total_amount"])) if extracted_fields.get("total_amount") is not None else None
    tax_amount = Decimal(str(extracted_fields["tax_amount"])) if extracted_fields.get("tax_amount") is not None else None
    extraction_payload = extracted_fields.get("extracted_json") or {
        "fields": {
            "merchant_name": merchant_name,
            "transaction_date": transaction_date.isoformat() if transaction_date else None,
            "total_amount": float(total_amount) if total_amount is not None else None,
            "tax_amount": float(tax_amount) if tax_amount is not None else None,
            "currency": extracted_fields.get("currency"),
        }
    }
    confidence_decimal = Decimal(f"{float(extracted_fields.get('confidence_score') or confidence):.4f}")

    if receipt.extraction is None:
        receipt.extraction = ReceiptExtraction(
            receipt_id=receipt.id,
            merchant_name=merchant_name,
            transaction_date=transaction_date,
            total_amount=total_amount,
            tax_amount=tax_amount,
            currency=str(extracted_fields.get("currency")) if extracted_fields.get("currency") else None,
            extracted_json=extraction_payload,
            confidence_score=confidence_decimal,
            review_status="needs_review",
            created_at=now,
            updated_at=now,
        )
    else:
        receipt.extraction.merchant_name = merchant_name
        receipt.extraction.transaction_date = transaction_date
        receipt.extraction.total_amount = total_amount
        receipt.extraction.tax_amount = tax_amount
        receipt.extraction.currency = str(extracted_fields.get("currency")) if extracted_fields.get("currency") else None
        receipt.extraction.extracted_json = extraction_payload
        receipt.extraction.confidence_score = confidence_decimal
        receipt.extraction.review_status = "needs_review"
        receipt.extraction.updated_at = now


def process_parse_job(db: Session, job_id: UUID) -> None:
    job = _load_parse_job(db, job_id)
    source_path = Path(job.receipt.original_url)
    processed_dir = source_path.parent / "processed"
    processed_path = processed_dir / f"{source_path.stem}-processed.png"

    try:
        if not source_path.exists():
            raise FileNotFoundError("Stored receipt image is missing from the uploads folder")

        _set_phase(job, "preprocessing")
        db.commit()

        preprocess_image(str(source_path), str(processed_path))

        _set_phase(job, "ocr_running")
        db.commit()

        ocr_payload = get_ocr_service().extract_text(str(processed_path))

        _set_phase(job, "extracting")
        db.commit()

        extracted_fields = extract_all(
            lines=list(ocr_payload.get("lines", [])),
            raw_text=str(ocr_payload.get("raw_text", "")),
        )
        _persist_results(job, processed_path, ocr_payload, extracted_fields)
        _set_phase(job, "ready_for_review", finished=True)
        db.commit()
    except Exception as exc:
        logger.exception("Receipt parse failed for job %s", job_id)
        db.rollback()
        failed_job = _load_parse_job(db, job_id)
        _set_phase(failed_job, "failed", error_message=str(exc) or "Receipt OCR failed", finished=True)
        db.commit()
