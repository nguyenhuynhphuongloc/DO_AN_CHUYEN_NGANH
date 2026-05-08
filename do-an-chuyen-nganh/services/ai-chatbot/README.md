# FinTrack AI Chatbot Service

Trợ lý AI chatbot cho FinTrack - bao gồm NLP parsing, tư vấn tài chính (Qwen 3B), và embedding-based category classification.

## Cấu trúc

```
services/ai-chatbot/
├── main.py                 # FastAPI entry point
├── advisor_service.py       # Qwen 3B AI advisor
├── nlp_service.py         # NLP transaction parsing với embedding matching
├── embedding_service.py     # Sentence transformer classification
├── prediction_service.py    # Spending prediction
├── categories_seed.json     # Training data cho category classification
├── requirements.txt
├── .env.example
├── .env
├── Dockerfile
└── README.md
```

## API Endpoints

- `POST /api/nlp/parse` - Parse natural language transaction
- `POST /api/ai/advisor` - Get financial advice from AI
- `POST /api/predict` - Predict future spending
- `POST /api/anomaly` - Detect anomalous transactions
- `POST /api/learn` - Teach AI new category mappings

## Docker Setup

Service này chạy trong `docker-compose.yml` cùng với `receipt-ai` và `web`:

```yaml
services:
  ai-chatbot:
    build:
      context: .
      dockerfile: services/ai-chatbot/Dockerfile
    ports:
      - '8000:8000'
```

### Ports

| Service | Port | Container Port |
|---------|------|----------------|
| ai-chatbot | 8000 | 8000 |
| receipt-ai | 8001 | 8001 |
| web | 3000 | 3000 |

## Chạy Local

```bash
# 1. Install dependencies
cd services/ai-chatbot
pip install -r requirements.txt

# 2. Setup environment
cp .env.example .env
# Edit .env and add your HuggingFace token

# 3. Run service
python main.py
```

## Models

- **Qwen/Qwen2.5-3B-Instruct** - Financial advisor LLM (HuggingFace)
- **paraphrase-multilingual-MiniLM-L12-v2** - Sentence embeddings for category matching

## Category Classification

Sử dụng 2 layers để phân loại danh mục:
1. **Embedding Matching** - Sentence Transformer với cosine similarity
2. **Keyword Fallback** - Map keywords trực tiếp khi embedding không match

Các keywords được hỗ trợ:
- "quần áo", "ao quan" → "Mua sắm"
- "ăn", "cafe", "nha hang" → "Ăn uống"
- "xe", "xang", "grab" → "Di chuyển"
- ... và nhiều hơn nữa
