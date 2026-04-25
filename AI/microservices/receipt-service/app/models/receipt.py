import hashlib
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    file_size: Mapped[Decimal | None] = mapped_column(Numeric)
    image_hash: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(30), default="uploaded", nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    parser_result: Mapped["ReceiptParserResult | None"] = relationship(
        back_populates="receipt",
        uselist=False,
        cascade="all, delete-orphan",
    )
    feedback_items: Mapped[list["ReceiptFeedback"]] = relationship(
        back_populates="receipt",
        cascade="all, delete-orphan",
        order_by="ReceiptFeedback.created_at.desc()",
    )
    jobs: Mapped[list["ReceiptJob"]] = relationship(
        back_populates="receipt",
        cascade="all, delete-orphan",
        order_by="ReceiptJob.created_at.desc()",
    )
    parse_sessions: Mapped[list["ReceiptParseSession"]] = relationship(
        back_populates="confirmed_receipt",
        cascade="save-update, merge",
    )


class ReceiptParserResult(Base):
    __tablename__ = "receipt_parser_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    receipt_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("receipts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    provider: Mapped[str] = mapped_column(String(100), nullable=False)
    raw_text: Mapped[str | None] = mapped_column(Text)
    provider_json: Mapped[dict | None] = mapped_column(JSONB)
    normalized_json: Mapped[dict | None] = mapped_column(JSONB)
    suggested_category_id: Mapped[int | None] = mapped_column(Integer)
    suggested_description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    receipt: Mapped[Receipt] = relationship(back_populates="parser_result")


class ReceiptFeedback(Base):
    __tablename__ = "receipt_feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("receipts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    original_data_json: Mapped[dict | None] = mapped_column(JSONB)
    corrected_data_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    feedback_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    receipt: Mapped[Receipt] = relationship(back_populates="feedback_items")


class ReceiptJob(Base):
    __tablename__ = "receipt_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("receipts.id", ondelete="CASCADE"),
        nullable=False,
    )
    job_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="queued", nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    receipt: Mapped[Receipt] = relationship(back_populates="jobs")


class ReceiptParseSession(Base):
    __tablename__ = "receipt_parse_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    temp_url: Mapped[str] = mapped_column(Text, nullable=False)
    permanent_url: Mapped[str | None] = mapped_column(Text)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    file_size: Mapped[int | None]
    image_hash: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(30), default="uploaded", nullable=False)
    ocr_provider: Mapped[str | None] = mapped_column(String(100))
    ocr_raw_text: Mapped[str | None] = mapped_column(Text)
    ocr_debug_json: Mapped[dict | None] = mapped_column(JSONB)
    ocr_confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    merchant_name: Mapped[str | None] = mapped_column(String(255))
    transaction_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=False))
    total_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    tax_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    currency: Mapped[str | None] = mapped_column(String(10), default="VND")
    extracted_json: Mapped[dict | None] = mapped_column(JSONB)
    extraction_confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    review_status: Mapped[str] = mapped_column(String(30), default="needs_review", nullable=False)
    reviewer_feedback_json: Mapped[dict | None] = mapped_column(JSONB)
    reviewer_note: Mapped[str | None] = mapped_column(Text)
    finance_transaction_id: Mapped[str | None] = mapped_column(String(255))
    confirmed_receipt_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("receipts.id", ondelete="SET NULL"),
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    confirmed_receipt: Mapped[Receipt | None] = relationship(back_populates="parse_sessions")
    jobs: Mapped[list["ReceiptParseJob"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ReceiptParseJob.created_at.desc()",
    )


class ReceiptParseJob(Base):
    __tablename__ = "receipt_parse_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("receipt_parse_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    job_type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="queued", nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    session: Mapped[ReceiptParseSession] = relationship(back_populates="jobs")


def compute_image_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()
