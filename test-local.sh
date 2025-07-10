#!/bin/bash

# Test deployment locally before pushing

echo "🧪 Testing Terry Escape deployment locally..."
echo "=========================================="

# Create a test .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating test .env file..."
    cat > .env << EOF
JWT_SECRET=test-secret-for-local-development
FRONTEND_URL=http://localhost
API_URL=http://localhost:2448
CORS_ORIGINS=http://localhost,http://localhost:8000
NODE_ENV=production
EOF
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build the image
echo "🔨 Building Docker image..."
docker build -f Dockerfile.clean -t terry-escape-test .

# Run the container
echo "🚀 Starting container..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Test endpoints
echo ""
echo "🧪 Testing endpoints..."
echo -n "Frontend (http://localhost): "
curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "Failed"

echo ""
echo -n "API Health (http://localhost:2448): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:2448 || echo "Failed"

echo ""
echo ""
echo "✅ Local test deployment complete!"
echo ""
echo "🎮 Access the game at: http://localhost"
echo ""
echo "📊 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Stop: docker-compose -f docker-compose.prod.yml down"
echo "   - Rebuild: docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "🔍 To test CORS:"
echo "   1. Open http://localhost in your browser"
echo "   2. Open Developer Console (F12)"
echo "   3. Check Network tab for any CORS errors"
echo ""