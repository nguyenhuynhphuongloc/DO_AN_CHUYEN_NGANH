import json
import os
import re
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="FinTrack AI Chatbot Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _log(prefix: str, data: any) -> None:
    """Debug logger — shows structured info at each AI step."""
    try:
        print(f"[{prefix}] {json.dumps(data, ensure_ascii=False, indent=None)}")
    except Exception:
        print(f"[{prefix}] {data}")


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
    return {"message": "FinTrack AI Chatbot Service is running"}


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/nlp/parse", response_model=TransactionExtract)
async def parse_natural_language(req: NLPRequest):
    _log("NLP_INPUT", {"text": req.text})

    from nlp_service import extract_transaction_info
    result = extract_transaction_info(req.text)

    _log("NLP_OUTPUT", {
        "text": req.text,
        "parsed": result,
        "category_confidence": "keyword" if result.get("category") and result.get("category") != "Khác" else "default",
    })
    return result


@app.post("/api/ai/advisor")
async def get_financial_advisor_advice(req: Request):
    data = await req.json()
    query = data.get("text", "")
    context = data.get("context", {})

    _log("ADVISOR_INPUT", {
        "query": query,
        "has_context": bool(context),
        "context_keys": list(context.keys()),
    })

    from advisor_service import get_financial_advice
    result = get_financial_advice(query, context)

    _log("ADVISOR_OUTPUT", {
        "query": query,
        "advice_length": len(result.get("advice", "")),
        "has_targeted_category": "breakdown" in str(context)[:500],
    })
    return result


@app.post("/api/predict")
async def predict_spending(data: List[dict]):
    from prediction_service import predict_future_spending
    result = predict_future_spending(data)
    return result


@app.post("/api/anomaly")
async def detect_anomalies(data: List[dict]):
    from prediction_service import detect_anomalies_in_data
    result = detect_anomalies_in_data(data)
    return result


class LearnRequest(BaseModel):
    text: str
    category: str


@app.post("/api/learn")
async def learn_new_category(req: LearnRequest):
    seed_path = os.path.join(os.path.dirname(__file__), 'categories_seed.json')
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
            from embedding_service import get_embedding_service
            from nlp_service import clean_text_for_ai

            clean_text = clean_text_for_ai(req.text)

            if not clean_text:
                return {"status": "skipped", "message": "Nội dung sau khi làm sạch trống, không thể lưu."}

            current_ai_category, score = get_embedding_service().classify(clean_text)
            if current_ai_category and current_ai_category.lower() == target_category.lower():
                print(f"AI already correctly predicts '{target_category}' for '{clean_text}' (score: {score:.2f}). No need to save.")
                return {"status": "skipped", "message": "AI đã nhận diện đúng danh mục này rồi, không cần lưu thêm."}

            if clean_text not in data[target_category]:
                data[target_category].append(clean_text)
                with open(seed_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                print(f"Successfully saved cleaned text '{clean_text}' to '{target_category}'")
                get_embedding_service().reload()
                return {"status": "success", "message": f"AI đã học được: '{clean_text}' vào mục {target_category}"}
            else:
                print(f"Cleaned text '{clean_text}' already exists in '{target_category}', skipping.")
                return {"status": "skipped", "message": "Câu này đã tồn tại trong bộ mẫu"}

        else:
            return {"status": "error", "message": f"Danh mục '{req.category}' không tồn tại"}
    except Exception as e:
        print(f"Error during AI learning: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
