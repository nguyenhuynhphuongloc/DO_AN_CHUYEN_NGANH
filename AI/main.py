import json
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="FinTrack AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NLPRequest(BaseModel):
    text: str


class TransactionExtract(BaseModel):
    amount: float
    category: Optional[str] = None
    type: str = "expense"
    date: Optional[str] = None
    description: Optional[str] = None


@app.get("/")
async def root():
    return {"message": "FinTrack AI Service is running"}


@app.post("/api/nlp/parse", response_model=TransactionExtract)
async def parse_natural_language(req: NLPRequest):
    from services.nlp_service import extract_transaction_info

    result = extract_transaction_info(req.text)
    return result


@app.post("/api/nlp/query")
async def query_natural_language(req: NLPRequest):
    return {"query": req.text, "answer": "Tinh nang dang duoc phat trien"}


@app.post("/api/ai/predict")
async def predict_spending(data: List[dict]):
    from services.prediction_service import predict_future_spending

    result = predict_future_spending(data)
    return result


@app.post("/api/ai/anomaly")
async def detect_anomalies(data: List[dict]):
    from services.prediction_service import detect_anomalies_in_data

    result = detect_anomalies_in_data(data)
    return result


@app.post("/api/ai/advisor")
async def get_financial_advisor_advice(req: Request):
    from services.advisor_service import get_financial_advice

    data = await req.json()
    query = data.get("text", "")
    context = data.get("context", {})
    result = get_financial_advice(query, context)
    return result


@app.post("/api/ocr/receipt")
async def scan_receipt(
    file: UploadFile = File(...),
    metadata: str = Form("{}"),
):
    from services.ocr_service import process_receipt_image
    from services.receipt_intelligence import ReceiptOcrRequestMetadata

    try:
        request_metadata = ReceiptOcrRequestMetadata.model_validate(json.loads(metadata or "{}"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid OCR metadata payload: {exc}") from exc

    body = await file.read()
    result = process_receipt_image(
        body,
        file_name=file.filename or "receipt.jpg",
        mime_type=file.content_type or "application/octet-stream",
        metadata=request_metadata,
    )
    return result


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
