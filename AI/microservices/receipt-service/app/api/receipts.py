import logging
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
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
from app.services.finance_client import create_finance_transaction
from app.services.receipt_processing import build_extraction_payload, extracted_fields_from_receipt, merge_extracted_json, queue_parse_job

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
        normalized_lines = raw_json.get("normalized_lines", [])
        confidences = raw_json.get("confidences", [])
        line_details = raw_json.get("line_details", [])
        ocr_debug = ReceiptOcrDebugResponse(
            raw_text=receipt.ocr_result.raw_text,
            normalized_text=str(raw_json.get("normalized_text")) if raw_json.get("normalized_text") else None,
            lines=[str(line) for line in lines] if isinstance(lines, list) else [],
            normalized_lines=[str(line) for line in normalized_lines] if isinstance(normalized_lines, list) else [],
            confidences=[float(score) for score in confidences] if isinstance(confidences, list) else [],
            line_details=line_details if isinstance(line_details, list) else [],
            provider=receipt.ocr_result.ocr_provider,
            confidence_score=float(receipt.ocr_result.confidence_score) if receipt.ocr_result.confidence_score is not None else None,
            model_lang=str(raw_json.get("model_lang")) if raw_json.get("model_lang") else None,
            model_device=str(raw_json.get("model_device")) if raw_json.get("model_device") else None,
            preprocessing=raw_json.get("preprocessing") if isinstance(raw_json.get("preprocessing"), dict) else None,
            doc_preprocessor=raw_json.get("doc_preprocessor") if isinstance(raw_json.get("doc_preprocessor"), dict) else None,
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
def parse_receipt(receipt_id: str, force: bool = False, db: Session = Depends(get_db)) -> ParseReceiptResponse:
    receipt = _load_receipt(receipt_id, db)
    queue_parse_job(db, receipt, force=force)
    refreshed = _load_receipt(receipt_id, db)
    return ParseReceiptResponse(receipt=_serialize_receipt(refreshed), extracted_fields=extracted_fields_from_receipt(refreshed))


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
    corrected_json = merge_extracted_json(
        receipt.extraction.extracted_json,
        {
            "merchant_name": payload.merchant_name if payload.merchant_name is not None else receipt.extraction.merchant_name,
            "transaction_date": (
                payload.transaction_date.date().isoformat()
                if payload.transaction_date is not None
                else (receipt.extraction.transaction_date.isoformat() if receipt.extraction.transaction_date else None)
            ),
            "total_amount": payload.total_amount if payload.total_amount is not None else float(receipt.extraction.total_amount) if receipt.extraction.total_amount is not None else None,
            "tax_amount": payload.tax_amount if payload.tax_amount is not None else float(receipt.extraction.tax_amount) if receipt.extraction.tax_amount is not None else None,
            "currency": payload.currency or receipt.extraction.currency,
        },
    )

    feedback = ReceiptFeedback(
        receipt_id=receipt.id,
        user_id=UUID(settings.receipt_default_user_id),
        original_data_json=original_data,
        corrected_data_json=corrected_json,
        feedback_note=payload.feedback,
        created_at=now,
    )
    db.add(feedback)

    receipt.extraction.merchant_name = corrected_json.get("merchant_name")
    receipt.extraction.transaction_date = (
        datetime.fromisoformat(str(corrected_json["transaction_date"])).date()
        if corrected_json.get("transaction_date")
        else None
    )
    receipt.extraction.total_amount = (
        Decimal(str(corrected_json["total_amount"])) if corrected_json.get("total_amount") is not None else None
    )
    receipt.extraction.tax_amount = Decimal(str(corrected_json["tax_amount"])) if corrected_json.get("tax_amount") is not None else None
    receipt.extraction.currency = str(corrected_json["currency"]) if corrected_json.get("currency") is not None else None
    receipt.extraction.extracted_json = corrected_json
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
        extracted_json = merge_extracted_json(
            receipt.extraction.extracted_json,
            {
                "merchant_name": payload.merchant_name,
                "transaction_date": payload.transaction_date.date().isoformat(),
                "total_amount": payload.amount,
                "finance_transaction_id": finance_transaction_id,
            },
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
