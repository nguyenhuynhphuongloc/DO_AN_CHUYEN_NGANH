# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base

WORKDIR /app

ARG NEXT_PUBLIC_AUTH_API_URL=http://auth-service:8001
ARG NEXT_PUBLIC_FINANCE_API_URL=http://finance-service:8002
ARG NEXT_PUBLIC_RECEIPT_API_URL=http://receipt-service:8003
ARG INTERNAL_AUTH_API_URL=http://auth-service:8001
ARG INTERNAL_FINANCE_API_URL=http://finance-service:8002
ARG INTERNAL_RECEIPT_API_URL=http://receipt-service:8003

ENV NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL
ENV NEXT_PUBLIC_FINANCE_API_URL=$NEXT_PUBLIC_FINANCE_API_URL
ENV NEXT_PUBLIC_RECEIPT_API_URL=$NEXT_PUBLIC_RECEIPT_API_URL
ENV INTERNAL_AUTH_API_URL=$INTERNAL_AUTH_API_URL
ENV INTERNAL_FINANCE_API_URL=$INTERNAL_FINANCE_API_URL
ENV INTERNAL_RECEIPT_API_URL=$INTERNAL_RECEIPT_API_URL

FROM base AS deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci

FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]

FROM deps AS build
COPY next.config.* ./
COPY next-env.d.ts ./
COPY tsconfig.json ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY public ./public
COPY app ./app
COPY components ./components
COPY lib ./lib
RUN npm run build
RUN npm prune --omit=dev

FROM base AS prod
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.* ./

EXPOSE 3000
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
