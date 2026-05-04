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

@app.post("/api/predict")
async def predict_spending(data: List[dict]):
    from services.prediction_service import predict_future_spending
    result = predict_future_spending(data)
    return result

@app.post("/api/anomaly")
async def detect_anomalies(data: List[dict]):
    from services.prediction_service import detect_anomalies_in_data
    result = detect_anomalies_in_data(data)
    return result

@app.post("/api/advisor")
async def get_financial_advisor_advice(req: Request):
    from services.advisor_service import get_financial_advice
    data = await req.json()
    query = data.get("text", "")
    context = data.get("context", {})
    result = get_financial_advice(query, context)
    return result

class LearnRequest(BaseModel):
    text: str
    category: str

@app.post("/api/learn")
async def learn_new_category(req: LearnRequest):
    import json
    import re
    from services.embedding_service import get_embedding_service
    from services.nlp_service import clean_text_for_ai

    seed_path = get_embedding_service().seed_file
    print(f"AI Learning Request: '{req.text}' -> Category: '{req.category}'")


    try:
        with open(seed_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        target_category = None
        for cat_key in data.keys():
            if cat_key.lower().strip() == req.category.lower().strip():
                target_category = cat_key
                break

        if target_category:
            # Làm sạch nội dung trước khi lưu
            clean_text = clean_text_for_ai(req.text)
            
            if not clean_text:
                return {"status": "skipped", "message": "Nội dung sau khi làm sạch trống, không thể lưu."}

            # KIỂM TRA: Nếu AI hiện tại đã dự đoán đúng rồi thì KHÔNG lưu nữa
            current_ai_category, score = get_embedding_service().classify(clean_text)
            if current_ai_category and current_ai_category.lower() == target_category.lower():
                print(f"✨ AI already correctly predicts '{target_category}' for '{clean_text}' (score: {score:.2f}). No need to save.")
                return {"status": "skipped", "message": "AI đã nhận diện đúng danh mục này rồi, không cần lưu thêm."}

            if clean_text not in data[target_category]:
                data[target_category].append(clean_text)
                with open(seed_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                print(f"✅ Successfully saved cleaned text '{clean_text}' to '{target_category}'")
                get_embedding_service().reload()
                return {"status": "success", "message": f"AI đã học được: '{clean_text}' vào mục {target_category}"}
            else:
                print(f"ℹ️ Cleaned text '{clean_text}' already exists in '{target_category}', skipping.")
                return {"status": "skipped", "message": "Câu này đã tồn tại trong bộ mẫu"}

        else:
            return {"status": "error", "message": f"Danh mục '{req.category}' không tồn tại"}
    except Exception as e:
        print(f"❌ Error during AI learning: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/api/ocr/receipt")
async def scan_receipt(request: Request):
    from services.ocr_service import process_receipt_image
    body = await request.body()
    result = process_receipt_image(body)
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
