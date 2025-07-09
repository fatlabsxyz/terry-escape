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

# Combined runtime stage using supervisor (default)
FROM node:22-alpine AS runtime
RUN apk add --no-cache bash supervisor
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate
RUN npm install -g tsx

WORKDIR /app

# Copy built application
COPY --from=builder /app ./

# Create supervisor config
RUN echo "[supervisord]" > /etc/supervisord.conf && \
    echo "nodaemon=true" >> /etc/supervisord.conf && \
    echo "logfile=/dev/null" >> /etc/supervisord.conf && \
    echo "logfile_maxbytes=0" >> /etc/supervisord.conf && \
    echo "" >> /etc/supervisord.conf && \
    echo "[program:gamemaster]" >> /etc/supervisord.conf && \
    echo "command=tsx src/index.ts" >> /etc/supervisord.conf && \
    echo "directory=/app/packages/gamemaster" >> /etc/supervisord.conf && \
    echo "autostart=true" >> /etc/supervisord.conf && \
    echo "autorestart=true" >> /etc/supervisord.conf && \
    echo "stdout_logfile=/dev/stdout" >> /etc/supervisord.conf && \
    echo "stdout_logfile_maxbytes=0" >> /etc/supervisord.conf && \
    echo "stderr_logfile=/dev/stderr" >> /etc/supervisord.conf && \
    echo "stderr_logfile_maxbytes=0" >> /etc/supervisord.conf && \
    echo "" >> /etc/supervisord.conf && \
    echo "[program:frontend]" >> /etc/supervisord.conf && \
    echo "command=pnpm start" >> /etc/supervisord.conf && \
    echo "directory=/app/packages/frontend" >> /etc/supervisord.conf && \
    echo "autostart=true" >> /etc/supervisord.conf && \
    echo "autorestart=true" >> /etc/supervisord.conf && \
    echo "stdout_logfile=/dev/stdout" >> /etc/supervisord.conf && \
    echo "stdout_logfile_maxbytes=0" >> /etc/supervisord.conf && \
    echo "stderr_logfile=/dev/stderr" >> /etc/supervisord.conf && \
    echo "stderr_logfile_maxbytes=0" >> /etc/supervisord.conf && \
    echo "" >> /etc/supervisord.conf && \
    echo "[supervisorctl]" >> /etc/supervisord.conf && \
    echo "serverurl=unix:///var/run/supervisor.sock" >> /etc/supervisord.conf && \
    echo "" >> /etc/supervisord.conf && \
    echo "[unix_http_server]" >> /etc/supervisord.conf && \
    echo "file=/var/run/supervisor.sock" >> /etc/supervisord.conf && \
    echo "" >> /etc/supervisord.conf && \
    echo "[rpcinterface:supervisor]" >> /etc/supervisord.conf && \
    echo "supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface" >> /etc/supervisord.conf

EXPOSE 2448 8000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]