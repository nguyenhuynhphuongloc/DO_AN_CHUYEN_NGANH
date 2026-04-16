# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS dev
COPY . .
RUN npx prisma generate
EXPOSE 8001
CMD ["npm", "run", "start:dev"]

FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS prod
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

CMD ["sh", "-c", "if [ \"$RUN_DB_PUSH\" = \"true\" ]; then npx prisma db push; fi && if [ \"$RUN_SEED\" = \"true\" ]; then npm run seed; fi && node dist/src/main.js"]
