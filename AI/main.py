from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from pydantic import BaseModel
from typing import List, Optional

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
    return {"query": req.text, "answer": "Tính năng đang được phát triển"}

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
async def scan_receipt(request: Request):
    from services.ocr_service import process_receipt_image
    body = await request.body()
    result = process_receipt_image(body)
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
