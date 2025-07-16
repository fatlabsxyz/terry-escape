# Base stage with dependencies
FROM node:22-alpine AS base
RUN apk add --no-cache bash python3 py3-pip
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/keypairs/package.json ./packages/keypairs/
COPY packages/noir/package.json ./packages/noir/
COPY packages/noir/utils ./packages/noir/utils/
COPY packages/noir/circuits ./packages/noir/circuits/
COPY packages/zklib/package.json ./packages/zklib/
COPY packages/client/package.json ./packages/client/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/gamemaster/package.json ./packages/gamemaster/

# Install all dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Builder stage - builds everything in correct order
FROM base AS builder
WORKDIR /app

# Copy all source code
COPY packages ./packages

# Build in correct order for frontend dependencies
RUN pnpm --filter keypairs build
# Run noir prepare script first, then build
RUN cd packages/noir && pnpm prepare || true
RUN pnpm --filter noir build
RUN pnpm --filter zklib build
RUN pnpm --filter zklib build:web  # Frontend needs this
RUN pnpm --filter client build
RUN pnpm --filter frontend build
RUN cp packages/frontend/dist/bundle.js packages/frontend/public/out.js

# Try to build gamemaster (might fail but that's ok)
RUN pnpm --filter gamemaster build || true

# Gamemaster runtime stage
FROM node:22-alpine AS gamemaster
RUN apk add --no-cache bash
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
RUN npm install -g tsx

WORKDIR /app

# Copy built application
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages

# Install production dependencies only
WORKDIR /app/packages/gamemaster
RUN pnpm install --prod || pnpm install

EXPOSE 2448
CMD ["tsx", "src/index.ts"]

# Frontend runtime stage
FROM node:22-alpine AS frontend
RUN apk add --no-cache bash
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy built application
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages

# Install production dependencies only
WORKDIR /app/packages/frontend
RUN pnpm install --prod || pnpm install

EXPOSE 8000
CMD ["pnpm", "start"]

# Combined runtime stage (default)
FROM node:22-alpine AS runtime
RUN apk add --no-cache bash
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
RUN npm install -g tsx

WORKDIR /app

# Copy built application
COPY --from=builder /app ./

# Add environment variable support
ENV NODE_ENV=production
ENV JWT_SECRET=change-me-in-production
ENV FRONTEND_URL=http://localhost:8000
ENV API_URL=http://localhost:2448
ENV GAMEMASTER_PORT=2448
ENV FRONTEND_PORT=8000

# Prepare startup script
RUN mkdir -p /app/scripts

EXPOSE 2448 8000

# Copy and use entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]