# Stage 1: Build stage
FROM node:22-alpine3.24 AS builder
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies including devDependencies needed to build
RUN npm ci

# Copy configuration and source files
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Production runner stage
FROM node:22-alpine3.24 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled application code
COPY --from=builder /app/dist ./dist

# Create uploads directory and grant ownership to non-root node user (UID 1000)
RUN mkdir -p /app/uploads/cvs && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "dist/main.js"]
