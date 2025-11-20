# 1. Build stage
FROM node:latest AS builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia o código
COPY . .

# Build do Nest
RUN npm run build

# 2. Runtime stage
FROM node:latest

WORKDIR /app

# Copia arquivos da build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 5000

CMD ["sh", "-c", "npx prisma generate && node dist/main.js"]
