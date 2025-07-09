# Single stage build
FROM node:22-alpine

# Install runtime dependencies
RUN apk add --no-cache bash supervisor
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install || true

# Try to build everything
RUN pnpm build || true

# Install tsx globally for running TypeScript directly
RUN npm install -g tsx

# Create supervisor config
RUN printf '[supervisord]\n\
nodaemon=true\n\
user=root\n\
loglevel=info\n\
\n\
[program:gamemaster]\n\
command=bash -c "if [ -f dist/index.js ]; then node dist/index.js; else tsx src/index.ts; fi"\n\
directory=/app/packages/gamemaster\n\
autostart=true\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
environment=PORT=2448\n\
\n\
[program:frontend]\n\
command=node build.js --start\n\
directory=/app/packages/frontend\n\
autostart=true\n\
autorestart=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
stderr_logfile=/dev/stderr\n\
stderr_logfile_maxbytes=0\n\
environment=PORT=8000\n' > /etc/supervisord.conf

EXPOSE 2448 8000

CMD ["supervisord", "-c", "/etc/supervisord.conf"]