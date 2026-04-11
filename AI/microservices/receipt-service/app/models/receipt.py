import hashlib
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_url: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    file_size: Mapped[int | None]
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

    ocr_result: Mapped["ReceiptOcrResult | None"] = relationship(
        back_populates="receipt",
        uselist=False,
        cascade="all, delete-orphan",
    )
    extraction: Mapped["ReceiptExtraction | None"] = relationship(
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


class ReceiptOcrResult(Base):
    __tablename__ = "receipt_ocr_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("receipts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    ocr_provider: Mapped[str] = mapped_column(String(100), nullable=False)
    raw_text: Mapped[str | None] = mapped_column(Text)
    raw_json: Mapped[dict | None] = mapped_column(JSONB)
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    receipt: Mapped[Receipt] = relationship(back_populates="ocr_result")


class ReceiptExtraction(Base):
    __tablename__ = "receipt_extractions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("receipts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    merchant_name: Mapped[str | None] = mapped_column(String(255))
    transaction_date: Mapped[date | None] = mapped_column(Date)
    total_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    tax_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    currency: Mapped[str | None] = mapped_column(String(10), default="VND")
    extracted_json: Mapped[dict | None] = mapped_column(JSONB)
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    review_status: Mapped[str] = mapped_column(String(30), default="needs_review", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    receipt: Mapped[Receipt] = relationship(back_populates="extraction")


class ReceiptFeedback(Base):
    __tablename__ = "receipt_feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("receipts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    original_data_json: Mapped[dict | None] = mapped_column(JSONB)
    corrected_data_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    feedback_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    receipt: Mapped[Receipt] = relationship(back_populates="feedback_items")


class ReceiptJob(Base):
    __tablename__ = "receipt_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
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


def compute_image_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()
