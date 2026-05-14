# ──────────────────────────────────────────────────────────
# Stage 1: Builder — instala dependencias y compila TypeScript
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifests primero para aprovechar caché de capas
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# ──────────────────────────────────────────────────────────
# Stage 2: Production — imagen final ligera
# ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Solo instalar dependencias de producción
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copiar el código compilado desde el builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]