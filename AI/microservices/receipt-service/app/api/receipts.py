import logging
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import get_db
from app.models.receipt import (
    Receipt,
    ReceiptExtraction,
    ReceiptFeedback,
    ReceiptJob,
    ReceiptOcrResult,
    compute_image_hash,
)
from app.schemas.receipt import (
    ParseReceiptResponse,
    ReceiptConfirmRequest,
    ReceiptDetailResponse,
    ReceiptFeedbackRequest,
    ReceiptOcrDebugResponse,
)
from app.services.extraction_service import extract_all
from app.services.finance_client import create_finance_transaction
from app.services.image_preprocess import preprocess_image
from app.services.ocr_service import get_ocr_service

router = APIRouter(prefix="/receipts", tags=["receipts"])
logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(UTC)


def _load_receipt(receipt_id: str, db: Session) -> Receipt:
    receipt = (
        db.query(Receipt)
        .options(
            joinedload(Receipt.ocr_result),
            joinedload(Receipt.extraction),
            joinedload(Receipt.feedback_items),
            joinedload(Receipt.jobs),
        )
        .filter(Receipt.id == UUID(receipt_id))
        .first()
    )
    if receipt is None:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt


def _serialize_receipt(
    receipt: Receipt,
    finance_transaction_id: str | None = None,
    finance_warning: str | None = None,
) -> ReceiptDetailResponse:
    latest_feedback = receipt.feedback_items[0] if receipt.feedback_items else None
    ocr_debug = None

    if receipt.ocr_result is not None:
        raw_json = receipt.ocr_result.raw_json or {}
        lines = raw_json.get("lines", [])
        ocr_debug = ReceiptOcrDebugResponse(
            raw_text=receipt.ocr_result.raw_text,
            lines=[str(line) for line in lines] if isinstance(lines, list) else [],
            provider=receipt.ocr_result.ocr_provider,
            confidence_score=float(receipt.ocr_result.confidence_score) if receipt.ocr_result.confidence_score is not None else None,
        )

    return ReceiptDetailResponse(
        receipt=receipt,
        ocr_result=receipt.ocr_result,
        ocr_debug=ocr_debug,
        extraction_result=receipt.extraction,
        latest_feedback=latest_feedback,
        jobs=receipt.jobs,
        finance_transaction_id=finance_transaction_id,
        finance_warning=finance_warning,
    )


def _get_or_create_job(db: Session, receipt_id: UUID, job_type: str) -> ReceiptJob:
    job = (
        db.query(ReceiptJob)
        .filter(ReceiptJob.receipt_id == receipt_id, ReceiptJob.job_type == job_type)
        .order_by(ReceiptJob.created_at.desc())
        .first()
    )
    if job is None:
        job = ReceiptJob(receipt_id=receipt_id, job_type=job_type)
        db.add(job)
        db.flush()
    return job


def _mark_parse_failed(
    db: Session,
    receipt: Receipt,
    ocr_job: ReceiptJob,
    extract_job: ReceiptJob,
    error_message: str,
) -> None:
    now = _now()
    receipt.status = "failed"
    receipt.updated_at = now
    ocr_job.status = "failed"
    ocr_job.finished_at = now
    ocr_job.error_message = error_message
    extract_job.status = "failed"
    extract_job.finished_at = now
    extract_job.error_message = error_message
    db.commit()


@router.post("/upload", response_model=ReceiptDetailResponse)
async def upload_receipt(file: UploadFile = File(...), db: Session = Depends(get_db)) -> ReceiptDetailResponse:
    if not settings.receipt_default_user_id:
        raise HTTPException(status_code=500, detail="RECEIPT_DEFAULT_USER_ID is required")

    upload_dir = Path(settings.receipt_upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    extension = Path(file.filename or "").suffix or ".bin"
    stored_file_name = f"{uuid4()}{extension}"
    destination = upload_dir / stored_file_name
    destination.write_bytes(file_bytes)

    timestamp = _now()
    receipt = Receipt(
        user_id=UUID(settings.receipt_default_user_id),
        file_name=file.filename or stored_file_name,
        original_url=str(destination),
        mime_type=file.content_type,
        file_size=len(file_bytes),
        image_hash=compute_image_hash(file_bytes),
        status="uploaded",
        uploaded_at=timestamp,
        created_at=timestamp,
        updated_at=timestamp,
    )
    db.add(receipt)
    db.commit()

    return _serialize_receipt(_load_receipt(str(receipt.id), db))


@router.get("/{receipt_id}", response_model=ReceiptDetailResponse)
def get_receipt(receipt_id: str, db: Session = Depends(get_db)) -> ReceiptDetailResponse:
    return _serialize_receipt(_load_receipt(receipt_id, db))


@router.post("/{receipt_id}/parse", response_model=ParseReceiptResponse)
def parse_receipt(receipt_id: str, db: Session = Depends(get_db)) -> ParseReceiptResponse:
    receipt = _load_receipt(receipt_id, db)
    now = _now()

    ocr_job = _get_or_create_job(db, receipt.id, "ocr")
    extract_job = _get_or_create_job(db, receipt.id, "extract")
    ocr_job.status = "running"
    ocr_job.started_at = now
    extract_job.status = "running"
    extract_job.started_at = now
    receipt.status = "processing"
    receipt.updated_at = now
    db.commit()
    db.refresh(receipt)
    db.refresh(ocr_job)
    db.refresh(extract_job)

    source_path = Path(receipt.original_url)
    if not source_path.exists():
        error_message = "Stored receipt image is missing from the uploads folder"
        _mark_parse_failed(db, receipt, ocr_job, extract_job, error_message)
        raise HTTPException(status_code=404, detail=error_message)

    processed_dir = source_path.parent / "processed"
    processed_path = processed_dir / f"{source_path.stem}-processed.png"

    try:
        preprocess_image(str(source_path), str(processed_path))
        ocr_payload = get_ocr_service().extract_text(str(processed_path))
        extracted_fields = extract_all(
            lines=list(ocr_payload.get("lines", [])),
            raw_text=str(ocr_payload.get("raw_text", "")),
        )
    except Exception as exc:
        logger.exception("Receipt parse failed for receipt %s", receipt.id)
        error_message = str(exc) or "Receipt OCR failed"
        _mark_parse_failed(db, receipt, ocr_job, extract_job, error_message)
        raise HTTPException(status_code=422, detail="Unable to parse receipt image") from exc

    merchant_name = extracted_fields["merchant_name"]
    transaction_date = (
        datetime.fromisoformat(str(extracted_fields["transaction_date"])).date()
        if extracted_fields["transaction_date"]
        else None
    )
    total_amount = Decimal(str(extracted_fields["total_amount"])) if extracted_fields["total_amount"] is not None else None
    confidence = min(max(float(ocr_payload.get("confidence", 0.0)), 0.0), 1.0)
    confidence_decimal = Decimal(f"{confidence:.4f}")

    raw_json = {
        "lines": list(ocr_payload.get("lines", [])),
        "confidences": list(ocr_payload.get("confidences", [])),
        "processed_image_path": str(processed_path),
    }

    if receipt.ocr_result is None:
        receipt.ocr_result = ReceiptOcrResult(
            receipt_id=receipt.id,
            ocr_provider="paddleocr",
            raw_text=str(ocr_payload.get("raw_text", "")),
            raw_json=raw_json,
            confidence_score=confidence_decimal,
            created_at=now,
        )
    else:
        receipt.ocr_result.ocr_provider = "paddleocr"
        receipt.ocr_result.raw_text = str(ocr_payload.get("raw_text", ""))
        receipt.ocr_result.raw_json = raw_json
        receipt.ocr_result.confidence_score = confidence_decimal

    extraction_payload = {
        "merchant_name": merchant_name,
        "transaction_date": transaction_date.isoformat() if transaction_date else None,
        "total_amount": float(total_amount) if total_amount is not None else None,
        "tax_amount": 0.0 if total_amount is not None else None,
        "currency": str(extracted_fields.get("currency") or "VND"),
    }

    if receipt.extraction is None:
        receipt.extraction = ReceiptExtraction(
            receipt_id=receipt.id,
            merchant_name=merchant_name,
            transaction_date=transaction_date,
            total_amount=total_amount,
            tax_amount=Decimal("0") if total_amount is not None else None,
            currency=extraction_payload["currency"],
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
        receipt.extraction.tax_amount = Decimal("0") if total_amount is not None else None
        receipt.extraction.currency = extraction_payload["currency"]
        receipt.extraction.extracted_json = extraction_payload
        receipt.extraction.confidence_score = confidence_decimal
        receipt.extraction.review_status = "needs_review"
        receipt.extraction.updated_at = now

    ocr_job.status = "success"
    ocr_job.finished_at = now
    ocr_job.error_message = None
    extract_job.status = "success"
    extract_job.finished_at = now
    extract_job.error_message = None
    receipt.status = "parsed"
    receipt.processed_at = now
    receipt.updated_at = now
    db.commit()

    refreshed = _load_receipt(receipt_id, db)
    return ParseReceiptResponse(receipt=_serialize_receipt(refreshed), extracted_fields=extraction_payload)


@router.post("/{receipt_id}/feedback", response_model=ReceiptDetailResponse)
def save_feedback(
    receipt_id: str,
    payload: ReceiptFeedbackRequest,
    db: Session = Depends(get_db),
) -> ReceiptDetailResponse:
    if not settings.receipt_default_user_id:
        raise HTTPException(status_code=500, detail="RECEIPT_DEFAULT_USER_ID is required")

    receipt = _load_receipt(receipt_id, db)
    now = _now()

    if receipt.extraction is None:
        raise HTTPException(status_code=400, detail="Receipt must be parsed before feedback")

    original_data = receipt.extraction.extracted_json or {}
    corrected_data = {
        "merchant_name": payload.merchant_name if payload.merchant_name is not None else receipt.extraction.merchant_name,
        "transaction_date": (
            payload.transaction_date.date().isoformat()
            if payload.transaction_date is not None
            else (receipt.extraction.transaction_date.isoformat() if receipt.extraction.transaction_date else None)
        ),
        "total_amount": payload.total_amount if payload.total_amount is not None else float(receipt.extraction.total_amount or 0),
        "tax_amount": payload.tax_amount if payload.tax_amount is not None else float(receipt.extraction.tax_amount or 0),
        "currency": payload.currency or receipt.extraction.currency or "VND",
    }

    feedback = ReceiptFeedback(
        receipt_id=receipt.id,
        user_id=UUID(settings.receipt_default_user_id),
        original_data_json=original_data,
        corrected_data_json=corrected_data,
        feedback_note=payload.feedback,
        created_at=now,
    )
    db.add(feedback)

    receipt.extraction.merchant_name = corrected_data["merchant_name"]
    receipt.extraction.transaction_date = (
        datetime.fromisoformat(corrected_data["transaction_date"]).date()
        if corrected_data["transaction_date"]
        else None
    )
    receipt.extraction.total_amount = Decimal(str(corrected_data["total_amount"])) if corrected_data["total_amount"] is not None else None
    receipt.extraction.tax_amount = Decimal(str(corrected_data["tax_amount"])) if corrected_data["tax_amount"] is not None else None
    receipt.extraction.currency = corrected_data["currency"]
    receipt.extraction.extracted_json = corrected_data
    receipt.extraction.review_status = "reviewed"
    receipt.extraction.updated_at = now
    receipt.status = "reviewed"
    receipt.updated_at = now

    db.commit()
    return _serialize_receipt(_load_receipt(receipt_id, db))


@router.post("/{receipt_id}/confirm", response_model=ReceiptDetailResponse)
def confirm_receipt(
    receipt_id: str,
    payload: ReceiptConfirmRequest,
    db: Session = Depends(get_db),
) -> ReceiptDetailResponse:
    receipt = _load_receipt(receipt_id, db)
    now = _now()

    finance_result = create_finance_transaction(
        wallet_id=payload.wallet_id,
        category_id=payload.category_id,
        transaction_type=payload.type,
        amount=payload.amount,
        description=payload.description,
        merchant_name=payload.merchant_name,
        transaction_date=payload.transaction_date,
    )
    finance_transaction_id = finance_result["id"]
    finance_warning = finance_result["warning"]

    if receipt.extraction is not None:
        receipt.extraction.merchant_name = payload.merchant_name
        receipt.extraction.transaction_date = payload.transaction_date.date()
        receipt.extraction.total_amount = Decimal(str(payload.amount))
        receipt.extraction.review_status = "confirmed"
        extracted_json = receipt.extraction.extracted_json or {}
        extracted_json.update(
            {
                "merchant_name": payload.merchant_name,
                "transaction_date": payload.transaction_date.date().isoformat(),
                "total_amount": payload.amount,
                "finance_transaction_id": finance_transaction_id,
            }
        )
        receipt.extraction.extracted_json = extracted_json
        receipt.extraction.updated_at = now

    receipt.status = "confirmed"
    receipt.processed_at = now
    receipt.updated_at = now
    db.commit()

    return _serialize_receipt(
        _load_receipt(receipt_id, db),
        finance_transaction_id=finance_transaction_id,
        finance_warning=finance_warning,
    )
