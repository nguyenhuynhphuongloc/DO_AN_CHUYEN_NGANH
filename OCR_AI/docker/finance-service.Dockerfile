FROM node:20-bookworm-slim

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5003

CMD ["node", "./microservices/finance-service/src/server.js"]
