#!/bin/bash

echo "🎮 Terry Escape - Simple Setup"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

echo "✅ Docker and docker-compose are installed"
echo ""
echo "🔨 Building and starting Terry Escape..."
echo ""

# Build and start the services
docker-compose up --build -d

echo ""
echo "✅ Terry Escape is running!"
echo ""
echo "🌐 Access the game at:"
echo "   - Frontend: http://localhost:8000"
echo "   - Gamemaster API: http://localhost:2448"
echo ""
echo "📝 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo ""