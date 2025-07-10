#!/bin/bash

echo "🎮 Terry Escape - LAN Party Mode"
echo "================================"

# Get local IP address
if command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1 | awk '{print $7;exit}')
elif command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n1)
else
    echo "❌ Cannot detect IP automatically"
    read -p "Enter your local IP address: " LOCAL_IP
fi

echo "🌐 Your local IP: $LOCAL_IP"
echo ""

# Create LAN-specific .env
cat > .env << EOF
JWT_SECRET=lan-party-$(date +%s)
FRONTEND_URL=http://$LOCAL_IP
API_URL=http://$LOCAL_IP:2448
CORS_ORIGINS=http://$LOCAL_IP,http://localhost,http://192.168.0.0/16,http://10.0.0.0/8
NODE_ENV=production
EOF

# Stop any existing containers
docker-compose -f docker-compose.lan.yml down 2>/dev/null || true

# Build and start
echo "🚀 Starting Terry Escape..."
docker-compose -f docker-compose.lan.yml up -d --build

# Wait for startup
echo "⏳ Waiting for services..."
sleep 5

# Display instructions
clear
echo "🎮 TERRY ESCAPE - LAN PARTY MODE 🎮"
echo "==================================="
echo ""
echo "✅ Game is running!"
echo ""
echo "📱 Share this with your friends:"
echo ""
echo "   🌐 http://$LOCAL_IP"
echo ""
echo "📋 Requirements for friends:"
echo "   1. Connected to same WiFi"
echo "   2. Open link in browser"
echo "   3. That's it!"
echo ""
echo "🛡️ Firewall (if friends can't connect):"
echo "   Windows: Allow through Windows Firewall"
echo "   Linux: sudo ufw allow from 192.168.0.0/16 to any port 80"
echo "   Mac: System Preferences > Security > Firewall"
echo ""
echo "📊 Commands:"
echo "   View logs: docker-compose -f docker-compose.lan.yml logs -f"
echo "   Stop game: docker-compose -f docker-compose.lan.yml down"
echo ""
echo "🎉 Have fun at your LAN party!"