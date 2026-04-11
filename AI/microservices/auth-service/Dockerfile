FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 8001

CMD ["sh", "-c", "if [ \"$RUN_DB_PUSH\" = \"true\" ]; then npx prisma db push; fi && if [ \"$RUN_SEED\" = \"true\" ]; then npm run seed; fi && node dist/src/main.js"]
