FROM node:20-bookworm-slim AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_AUTH_SERVICE_URL=http://localhost:5002
ARG VITE_FINANCE_SERVICE_URL=http://localhost:5003
ARG VITE_OCR_ENDPOINT=http://localhost:5001/webhook/receipt-ocr

ENV VITE_AUTH_SERVICE_URL=${VITE_AUTH_SERVICE_URL}
ENV VITE_FINANCE_SERVICE_URL=${VITE_FINANCE_SERVICE_URL}
ENV VITE_OCR_ENDPOINT=${VITE_OCR_ENDPOINT}

RUN npm run build

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

RUN npm install --global serve

COPY --from=build /workspace/dist ./dist

EXPOSE 5000

CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${FRONTEND_PORT:-5000}"]
