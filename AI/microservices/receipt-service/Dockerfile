# syntax=docker/dockerfile:1.7
FROM python:3.11-slim AS base

WORKDIR /app

ARG PADDLE_INSTALL_COMMAND="python -m pip install paddlepaddle==3.2.0"
ARG VIETOCR_INSTALL_COMMAND="python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu"

ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True \
    PIP_DEFAULT_TIMEOUT=300 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends \
        libgomp1 \
        libglib2.0-0 \
        libsm6 \
        libxrender1 \
        libxext6 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY requirements.txt ./
# `python-docx` is installed via requirements.txt for repo-local document generation workflows.
RUN --mount=type=cache,target=/root/.cache/pip \
    sh -lc "${VIETOCR_INSTALL_COMMAND}"
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    sh -lc "${PADDLE_INSTALL_COMMAND}"

FROM deps AS runtime
COPY . .

FROM runtime AS dev

EXPOSE 8003

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]

FROM runtime AS prod
EXPOSE 8003

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
