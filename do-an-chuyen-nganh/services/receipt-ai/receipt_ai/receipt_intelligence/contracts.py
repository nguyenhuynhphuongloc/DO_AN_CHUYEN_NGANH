from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AllowedCategoryCandidate(BaseModel):
    id: str
    name: str
    type: Literal["income", "expense"]


class ReceiptOcrRequestMetadata(BaseModel):
    user_id: str
    currency_preference: str | None = None
    include_debug: bool = True
    allowed_categories: list[AllowedCategoryCandidate] = Field(default_factory=list)


class ReceiptOcrLineItem(BaseModel):
    name: str | None = None
    quantity: float | None = None
    unit_price: float | None = None
    line_total: float | None = None
    confidence: float | None = None


class ReceiptOcrReviewFields(BaseModel):
    merchant_name: str | None = None
    transaction_date: str | None = None
    total_amount: float | None = None
    total_amount_display: str | None = None
    currency: str | None = None
    category_id: str | None = None
    category_name: str | None = None
    category_reason: str | None = None
    description: str | None = None
    user_note: str = ""


class ReceiptOcrNormalizedFields(BaseModel):
    merchant_name: str | None = None
    transaction_date: str | None = None
    transaction_datetime: str | None = None
    total_amount: float | None = None
    currency: str | None = None


class ReceiptOcrReceiptSummary(BaseModel):
    merchant_name: str | None = None
    transaction_date: str | None = None
    transaction_datetime: str | None = None
    total_amount: float | None = None
    currency: str | None = None
    provider_category: str | None = None
    line_items: list[ReceiptOcrLineItem] = Field(default_factory=list)


class ReceiptOcrNormalizedReceipt(BaseModel):
    fields: ReceiptOcrNormalizedFields
    items: list[ReceiptOcrLineItem] = Field(default_factory=list)
    receipt_summary: ReceiptOcrReceiptSummary


class ReceiptOcrDebug(BaseModel):
    provider_document_id: str | int | None = None
    provider_payload_summary: dict | None = None


class ReceiptOcrError(BaseModel):
    code: str
    message: str


class ReceiptOcrSuccessResponse(BaseModel):
    success: Literal[True] = True
    provider: Literal["veryfi"] = "veryfi"
    transaction_type: Literal["expense"] = "expense"
    source_type: Literal["receipt_ai"] = "receipt_ai"
    raw_text: str
    review_fields: ReceiptOcrReviewFields
    normalized_receipt: ReceiptOcrNormalizedReceipt
    debug: ReceiptOcrDebug | None = None
    errors: list[ReceiptOcrError] = Field(default_factory=list)


class ReceiptOcrFailureResponse(BaseModel):
    success: Literal[False] = False
    provider: Literal["veryfi"] = "veryfi"
    transaction_type: Literal["expense"] = "expense"
    source_type: Literal["receipt_ai"] = "receipt_ai"
    raw_text: str | None = None
    review_fields: None = None
    normalized_receipt: None = None
    debug: None = None
    errors: list[ReceiptOcrError]
