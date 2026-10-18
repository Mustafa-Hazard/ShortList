# Stage 1: Build stage
FROM node:22-alpine3.24 AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig*.json vite.config.ts index.html eslint.config.js ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# Stage 2: Production runner stage
FROM node:22-alpine3.24 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy compiled frontend assets and lightweight production static server
COPY --from=builder /app/dist ./dist
COPY server.mjs ./

# Assign non-root ownership
RUN chown -R node:node /app

USER node

EXPOSE 5173

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5173/ || exit 1

CMD ["node", "server.mjs"]
