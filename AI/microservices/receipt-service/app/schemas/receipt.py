from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReceiptOcrResultResponse(BaseModel):
    id: int
    receipt_id: int
    ocr_provider: str
    raw_text: str | None
    raw_json: dict | None
    confidence_score: float | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptExtractionResponse(BaseModel):
    id: int
    receipt_id: int
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
    receipt_id: int
    user_id: int
    original_data_json: dict | None
    corrected_data_json: dict
    feedback_note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptJobResponse(BaseModel):
    id: UUID
    receipt_id: int
    job_type: str
    status: str
    error_message: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptMetadataResponse(BaseModel):
    id: int
    user_id: int
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


class ReceiptParseSessionMetadataResponse(BaseModel):
    id: UUID
    user_id: int
    file_name: str
    temp_url: str
    permanent_url: str | None
    mime_type: str | None
    file_size: int | None
    image_hash: str | None
    status: str
    processed_at: datetime | None
    expires_at: datetime
    finalized_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptParseJobResponse(BaseModel):
    id: UUID
    session_id: UUID
    job_type: str
    status: str
    error_message: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptOcrDebugResponse(BaseModel):
    raw_text: str | None
    lines: list[str]
    provider: str | None
    confidence_score: float | None
    display_mode: str | None = None
    boxed_image_url: str | None = None
    layout_image_url: str | None = None
    text_file_url: str | None = None
    device: str | None = None
    ocr_language: str | None = None
    fallback_used: bool | None = None
    low_quality_ratio: float | None = None
    profile: str | None = None
    selected_path: str | None = None
    timings: dict | None = None
    preprocess: dict | None = None
    line_count: int | None = None
    detected_box_count: int | None = None
    short_line_ratio: float | None = None
    runtime: dict | None = None
    engine_config: dict | None = None
    ordering: dict | None = None
    layout: dict | None = None
    structured_json: dict | None = None
    provider_document_id: str | int | None = None
    provider_payload_summary: dict | None = None
    provider_payload: dict | None = None


class SessionFeedbackResponse(BaseModel):
    corrected_data_json: dict
    feedback_note: str | None = None


class ReceiptWorkflowResponse(BaseModel):
    receipt: ReceiptMetadataResponse | None = None
    session: ReceiptParseSessionMetadataResponse | None = None
    confirmed_receipt: ReceiptMetadataResponse | None = None
    ocr_result: ReceiptOcrResultResponse | None
    ocr_debug: ReceiptOcrDebugResponse | None = None
    extraction_result: ReceiptExtractionResponse | None
    latest_feedback: ReceiptFeedbackResponse | SessionFeedbackResponse | None = None
    jobs: list[ReceiptJobResponse] = Field(default_factory=list)
    session_jobs: list[ReceiptParseJobResponse] = Field(default_factory=list)
    active_job: ReceiptJobResponse | ReceiptParseJobResponse | None = None
    finance_transaction_id: str | None = None
    finance_warning: str | None = None


class ParseReceiptResponse(BaseModel):
    receipt: ReceiptWorkflowResponse
    extracted_fields: dict | None


class ReceiptDiscardResponse(BaseModel):
    session_id: UUID
    status: str


class ReceiptFeedbackRequest(BaseModel):
    feedback: str | None = None
    merchant_name: str | None = None
    transaction_date: datetime | None = None
    total_amount: float | None = None
    tax_amount: float | None = None
    currency: str | None = None


class ReceiptConfirmRequest(BaseModel):
    wallet_id: str
    category_id: str
    type: str
    amount: float
    description: str | None = None
    merchant_name: str | None = None
    transaction_date: datetime
