# SETUP
FROM node:22-alpine AS base

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages

RUN npm install -g pnpm
RUN apk add --no-cache bash

# BUILD
FROM base AS builder

WORKDIR /app
RUN pnpm install
RUN pnpm build

# run gamemaster (server)
FROM node:22-alpine AS gamemaster

COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

WORKDIR /packages
COPY --from=builder /app/packages/client/dist ./client/dist
COPY --from=builder /app/packages/client/package.json ./client/
COPY --from=builder /app/packages/gamemaster/dist ./gamemaster/dist
COPY --from=builder /app/packages/gamemaster/package.json ./gamemaster/

WORKDIR /packages/gamemaster
RUN npm install -g pnpm && pnpm install --prod
CMD ["node", "./dist/index.js"]

# run frontend
FROM node:22-alpine AS frontend

COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

WORKDIR /packages
COPY --from=builder /app/packages/client/dist ./client/dist
COPY --from=builder /app/packages/client/package.json ./client/
COPY --from=builder /app/packages/frontend/dist ./frontend/dist
COPY --from=builder /app/packages/frontend/build.js ./frontend/
COPY --from=builder /app/packages/frontend/package.json ./frontend/
COPY --from=builder /app/packages/frontend/public ./frontend/public
WORKDIR /packages/frontend
RUN npm install -g pnpm && pnpm install --prod
CMD ["node", "build.js", "--start"]
