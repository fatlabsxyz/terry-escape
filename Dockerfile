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
RUN npm install -g pnpm

COPY --from=builder /app ./

WORKDIR /packages/gamemaster
# RUN pnpm install
# CMD ["node", "./dist/index.js"]
CMD ["pnpm", "start"]

# run frontend
FROM node:22-alpine AS frontend
RUN npm install -g pnpm

# COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

COPY --from=builder /app ./

# WORKDIR /packages
# COPY --from=builder /app/packages/client/dist ./client/dist
# COPY --from=builder /app/packages/client/node_modules ./client/node_modules
# COPY --from=builder /app/packages/client/package.json ./client/
# COPY --from=builder /app/packages/frontend/dist ./frontend/dist
# COPY --from=builder /app/packages/frontend/node_modules ./frontend/node_modules
# COPY --from=builder /app/packages/frontend/build.js ./frontend/
# COPY --from=builder /app/packages/frontend/package.json ./frontend/
# COPY --from=builder /app/packages/frontend/public ./frontend/public
WORKDIR /packages/frontend
# RUN npm install -g pnpm && pnpm install # --prod
# CMD ["node", "build.js", "--start"]
CMD ["pnpm", "start"]
