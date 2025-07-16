#!/bin/bash
set -e

# Update frontend to use environment variables
if [ ! -z "$API_URL" ]; then
    echo "Updating frontend API URL to: $API_URL"
    # Update ALL references to localhost:2448 in the frontend files
    find /app/packages/frontend/public -name "*.js" -exec sed -i "s|http://localhost:2448|$API_URL|g" {} \; 2>/dev/null || true
    find /app/packages/frontend/dist -name "*.js" -exec sed -i "s|http://localhost:2448|$API_URL|g" {} \; 2>/dev/null || true
fi

# CORS configuration is now handled via environment variable in app.ts
if [ ! -z "$CORS_ORIGINS" ]; then
    echo "CORS origins configured: $CORS_ORIGINS"
fi

# Ensure JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
    echo "WARNING: JWT_SECRET not set, using default (INSECURE!)"
    export JWT_SECRET="change-me-in-production"
fi

# Function to handle shutdown
cleanup() {
    echo "Shutting down services..."
    kill $GAMEMASTER_PID $FRONTEND_PID 2>/dev/null || true
    wait $GAMEMASTER_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Trap signals
trap cleanup SIGTERM SIGINT

# Start gamemaster in background
echo "Starting gamemaster..."
cd /app/packages/gamemaster
tsx src/index.ts &
GAMEMASTER_PID=$!

# Give gamemaster a moment to start
sleep 2

# Start frontend in background
echo "Starting frontend..."
cd /app/packages/frontend
pnpm start &
FRONTEND_PID=$!

# Wait for both processes
echo "Services started. Gamemaster PID: $GAMEMASTER_PID, Frontend PID: $FRONTEND_PID"
wait $GAMEMASTER_PID $FRONTEND_PID