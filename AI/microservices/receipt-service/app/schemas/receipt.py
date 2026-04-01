from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ReceiptOcrResultResponse(BaseModel):
    id: UUID
    receipt_id: UUID
    ocr_provider: str
    raw_text: str | None
    raw_json: dict | None
    confidence_score: float | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptExtractionResponse(BaseModel):
    id: UUID
    receipt_id: UUID
    merchant_name: str | None
    transaction_date: date | None
    total_amount: float | None
    tax_amount: float | None
    currency: str | None
    extracted_json: dict | None
    confidence_score: float | None
    review_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptFeedbackResponse(BaseModel):
    id: UUID
    receipt_id: UUID
    user_id: UUID
    original_data_json: dict | None
    corrected_data_json: dict
    feedback_note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptJobResponse(BaseModel):
    id: UUID
    receipt_id: UUID
    job_type: str
    status: str
    error_message: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptMetadataResponse(BaseModel):
    id: UUID
    user_id: UUID
    file_name: str
    original_url: str
    mime_type: str | None
    file_size: int | None
    image_hash: str | None
    status: str
    uploaded_at: datetime
    processed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptOcrLineDebugResponse(BaseModel):
    text: str
    normalized_text: str | None = None
    confidence: float | None = None
    box: list[int] | list[list[int]] | None = None
    angle: float | None = None


class ReceiptOcrDebugResponse(BaseModel):
    raw_text: str | None
    normalized_text: str | None = None
    lines: list[str]
    normalized_lines: list[str] = []
    confidences: list[float] = []
    line_details: list[ReceiptOcrLineDebugResponse] = []
    provider: str | None
    confidence_score: float | None
    model_lang: str | None = None
    model_device: str | None = None
    preprocessing: dict[str, Any] | None = None
    doc_preprocessor: dict[str, Any] | None = None


class ReceiptDetailResponse(BaseModel):
    receipt: ReceiptMetadataResponse
    ocr_result: ReceiptOcrResultResponse | None
    ocr_debug: ReceiptOcrDebugResponse | None = None
    extraction_result: ReceiptExtractionResponse | None
    latest_feedback: ReceiptFeedbackResponse | None = None
    jobs: list[ReceiptJobResponse] = []
    finance_transaction_id: str | None = None
    finance_warning: str | None = None


class ParseReceiptResponse(BaseModel):
    receipt: ReceiptDetailResponse
    extracted_fields: dict[str, Any]


class ReceiptFeedbackRequest(BaseModel):
    feedback: str | None = None
    merchant_name: str | None = None
    transaction_date: datetime | None = None
    total_amount: float | None = None
    tax_amount: float | None = None
    currency: str | None = "VND"


class ReceiptConfirmRequest(BaseModel):
    wallet_id: str
    category_id: str
    type: str
    amount: float
    description: str | None = None
    merchant_name: str | None = None
    transaction_date: datetime
