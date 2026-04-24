from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.receipts import router as receipts_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import Receipt, ReceiptFeedback, ReceiptJob, ReceiptParserResult, ReceiptParseJob, ReceiptParseSession  # noqa: F401
from app.services.receipt_parser_service import get_receipt_parser_service

Base.metadata.create_all(bind=engine)

app = FastAPI(title="receipt-service", version="0.1.0")

allowed_origins = {
    settings.frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(receipts_router)


@app.on_event("startup")
def validate_layout_runtime() -> None:
    get_receipt_parser_service().validate_runtime()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
