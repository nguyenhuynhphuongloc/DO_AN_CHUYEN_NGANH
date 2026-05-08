# FinTrack AI Chatbot Service

Trợ lý AI chatbot cho FinTrack - bao gồm NLP parsing, tư vấn tài chính (Groq gpt-oss-120b), và embedding-based category classification.

## Cấu trúc

```
services/ai-chatbot/
├── main.py                 # FastAPI entry point
├── groq_client.py           # Groq API client
├── advisor_service.py       # Financial advisor (Groq gpt-oss-120b)
├── nlp_service.py          # NLP transaction parsing với keyword matching
├── embedding_service.py     # Sentence transformer classification (optional)
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
    env_file:
      - .env
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
# Edit .env and add your Groq API key (https://console.groq.com/keys)

# 3. Run service
python main.py
# or
uvicorn main:app --reload
```

## AI Models

### Primary: Groq gpt-oss-120b
- **Model**: `openai/gpt-oss-120b` via Groq API
- **Speed**: ~500 tokens/second
- **Context window**: 131,072 tokens
- **No local model files needed** - all inference via Groq cloud API

### Optional: Sentence Transformers
- **Model**: `paraphrase-multilingual-MiniLM-L12-v2` (HuggingFace)
- **Purpose**: Embedding-based category classification fallback
- **Installation**: Set `AI_CHATBOT_ENABLE_EMBEDDINGS=1` and install sentence-transformers
- **Note**: Requires HuggingFace token if enabled

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | **Required.** Get at https://console.groq.com/keys |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Groq model to use |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Groq API endpoint |
| `GROQ_TIMEOUT_SECONDS` | `60` | Request timeout |
| `GROQ_MAX_TOKENS` | `2048` | Max response tokens |
| `AI_CHATBOT_SERVICE_URL` | `http://localhost:8000` | Service URL |
| `AI_CHATBOT_ENABLE_EMBEDDINGS` | `0` | Enable sentence-transformer classification |

## Category Classification

Sử dụng 2 layers để phân loại danh mục:
1. **Keyword Matching** - Map keywords trực tiếp (mặc định, không cần AI)
2. **Embedding Matching** (optional) - Sentence Transformer với cosine similarity

Các keywords được hỗ trợ:
- "quần áo", "ao quan" → "Mua sắm"
- "ăn", "cafe", "nha hang" → "Ăn uống"
- "xe", "xang", "grab" → "Di chuyển"
- ... và nhiều hơn nữa
