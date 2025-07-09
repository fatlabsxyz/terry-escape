#!/bin/bash

# Terry Escape Docker Setup Script

echo "🎮 Setting up Terry Escape..."

# Build and run with docker-compose
docker-compose up --build -d

echo "✅ Terry Escape is running!"
echo "🌐 Frontend: http://localhost:8000"
echo "🎯 Game server: http://localhost:2448"
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"