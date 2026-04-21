FROM node:20-bookworm-slim

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5002

CMD ["node", "./microservices/auth-service/src/server.js"]
