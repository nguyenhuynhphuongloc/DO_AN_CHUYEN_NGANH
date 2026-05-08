# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_TIMEOUT=300
ENV PIP_RETRIES=10

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl git wget libsndfile1 \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

# Copy requirements first for better caching
COPY services/ai-chatbot/requirements.txt .

# Install Python dependencies in layers
RUN pip install --no-cache-dir --timeout=300 --retries=5 \
    fastapi uvicorn[standard] pydantic python-dotenv httpx python-multipart

# Install PyTorch CPU (avoid CUDA)
RUN pip install --no-cache-dir --timeout=600 --retries=5 \
    torch==2.1.0 --index-url https://download.pytorch.org/whl/cpu || \
    pip install --no-cache-dir --timeout=900 --retries=3 \
    torch --index-url https://download.pytorch.org/whl/cpu

# Fix huggingface_hub version for sentence-transformers compatibility
RUN pip install --no-cache-dir --timeout=300 --retries=5 \
    huggingface_hub==0.19.4

# Install ML/NLP packages
RUN pip install --no-cache-dir --timeout=600 --retries=5 \
    sentence-transformers==2.2.2 \
    transformers==4.36.2 \
    accelerate==0.25.0 \
    bitsandbytes==0.41.3 \
    underthesea==1.3.5

# Install utilities
RUN pip install --no-cache-dir --timeout=300 --retries=5 \
    pandas matplotlib tabulate python-docx

# Copy application code
COPY services/ai-chatbot/ /app/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
