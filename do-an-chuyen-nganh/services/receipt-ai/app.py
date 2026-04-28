from __future__ import annotations

import json
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from receipt_ai.advisor_service import get_financial_advice
from receipt_ai.nlp_service import extract_transaction_info
from receipt_ai.ocr_service import process_receipt_image
from receipt_ai.receipt_intelligence import ReceiptOcrRequestMetadata

app = FastAPI(title="FinTrack Embedded AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NLPRequest(BaseModel):
    text: str


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "FinTrack embedded AI service is running"}


@app.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/api/nlp/parse")
async def parse_natural_language(req: NLPRequest) -> dict[str, Any]:
    return extract_transaction_info(req.text)


@app.post("/api/ai/advisor")
async def get_advice(req: Request) -> dict[str, str]:
    data = await req.json()
    return get_financial_advice(data.get("text", ""), data.get("context", {}))


@app.post("/api/ocr/receipt")
async def scan_receipt(
    file: UploadFile = File(...),
    metadata: str = Form("{}"),
) -> dict[str, Any]:
    try:
        request_metadata = ReceiptOcrRequestMetadata.model_validate(json.loads(metadata or "{}"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid OCR metadata payload: {exc}") from exc

    body = await file.read()
    return process_receipt_image(
        body,
        file_name=file.filename or "receipt.jpg",
        mime_type=file.content_type or "application/octet-stream",
        metadata=request_metadata,
    )
