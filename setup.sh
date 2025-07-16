#!/bin/bash

# Terry Escape Docker Setup Script

echo "Setting up Terry Escape with Game Lobby..."

# Stop any existing containers
echo "Stopping existing containers..."
docker compose down 2>/dev/null || docker-compose down 2>/dev/null

# Clear Docker build cache
echo "Clearing Docker build cache..."
docker builder prune -f 2>/dev/null || true
docker system prune -f 2>/dev/null || true

# Remove the specific image to force rebuild
docker rmi terry-demo-terry-escape 2>/dev/null || true

# Build and run with docker compose (no-cache for fresh build)
echo "Building fresh containers..."
# Use localhost binding for local development
export BIND_ADDRESS=127.0.0.1
export FRONTEND_PORT=8000

docker compose build --no-cache || docker-compose build --no-cache

echo "Starting containers..."
docker compose up -d || docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 5

# Check if services are running
if docker compose ps | grep -q "terry-escape.*running" || docker-compose ps | grep -q "terry-escape.*Up"; then
    echo "Terry Escape is running!"
    echo ""
    echo "GAME LOBBY SYSTEM:"
    echo "1. Open http://localhost:8000 in 4 different browsers/tabs"
    echo "2. Enter different usernames in each"
    echo "3. Click 'ENTER LOBBY'"
    echo "4. First player: CREATE ROOM"
    echo "5. Other players: JOIN that room"
    echo "6. Game starts when 4 players join!"
    echo ""
    echo "Frontend: http://localhost:8000"
    echo "Game server: http://localhost:2448"
    echo ""
    echo "Commands:"
    echo "  Stop: docker compose down"
    echo "  Logs: docker compose logs -f terry-escape"
else
    echo "Failed to start Terry Escape"
    echo "Check logs with: docker compose logs terry-escape"
fi