# ── Etapa 1: build (compila TypeScript → dist/) ───────────────
FROM node:20-slim AS build
WORKDIR /app

# Prisma necesita openssl en Debian slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Etapa 2: runtime (solo lo necesario para correr) ──────────
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/dist ./dist
RUN mkdir -p uploads

EXPOSE 3000

# Aplica migraciones pendientes y arranca la API
CMD ["npm", "run", "start:prod"]
