FROM python:3.11-slim

WORKDIR /app

ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True

ARG PADDLE_PIP_PACKAGE=""

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
    && if [ -n "$PADDLE_PIP_PACKAGE" ]; then \
        pip uninstall -y paddlepaddle || true; \
        pip install --no-cache-dir "$PADDLE_PIP_PACKAGE"; \
    fi

COPY . .

EXPOSE 8003

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
