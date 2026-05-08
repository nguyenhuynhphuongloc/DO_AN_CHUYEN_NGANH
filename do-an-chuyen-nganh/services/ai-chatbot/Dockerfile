# syntax=docker/dockerfile:1
# Lightweight Dockerfile for FinTrack AI Chatbot using Groq API
# No local ML models needed - all inference via Groq cloud API

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_TIMEOUT=300
ENV PIP_RETRIES=10

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

# Copy requirements first for better caching
COPY services/ai-chatbot/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --timeout=300 --retries=5 \
    -r requirements.txt

# Copy application code
COPY services/ai-chatbot/ /app/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
