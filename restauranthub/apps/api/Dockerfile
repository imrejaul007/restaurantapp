# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/*/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/*/

RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build the application
RUN npm run build --workspace=@restauranthub/api

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=deps /app/node_modules ./node_modules

# Set correct permissions
USER nestjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]