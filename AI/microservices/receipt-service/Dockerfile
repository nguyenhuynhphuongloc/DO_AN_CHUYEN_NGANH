FROM python:3.11-slim

WORKDIR /app

ARG PADDLE_PACKAGE="paddlepaddle==3.3.1"

ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgomp1 \
        libglib2.0-0 \
        libsm6 \
        libxrender1 \
        libxext6 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir "${PADDLE_PACKAGE}"

COPY . .

EXPOSE 8003

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
