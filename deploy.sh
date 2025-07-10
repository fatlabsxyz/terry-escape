#!/bin/bash

# Terry Escape - Easy VPS Deployment Script
# This script helps you deploy Terry Escape on any VPS

set -e

echo "🎮 Terry Escape Deployment Script"
echo "================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root (use sudo)"
   exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Generate secure JWT secret if not exists
if [ ! -f .env ]; then
    echo "🔐 Generating secure JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    cat > .env << EOF
# Auto-generated configuration
JWT_SECRET=$JWT_SECRET
FRONTEND_URL=http://$(curl -s ifconfig.me)
API_URL=http://$(curl -s ifconfig.me):2448
CORS_ORIGINS=http://$(curl -s ifconfig.me),http://localhost
EOF
    echo "✅ Created .env file with secure JWT secret"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "🌐 Your server IP: $SERVER_IP"
echo ""

# Ask about domain
read -p "Do you have a domain name? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your domain name: " DOMAIN
    
    # Update .env with domain
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|" .env
    sed -i "s|API_URL=.*|API_URL=https://$DOMAIN:2448|" .env
    sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=https://$DOMAIN,http://$DOMAIN|" .env
    
    # Update Caddyfile
    sed -i "s|yourdomain.com|$DOMAIN|" Caddyfile
    
    echo "🔒 Using Docker Compose with SSL (Caddy)"
    docker-compose -f docker-compose.prod.yml --profile with-ssl up -d
else
    echo "🚀 Using Docker Compose without SSL"
    docker-compose -f docker-compose.prod.yml up -d
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Access your game at:"
if [[ ! -z "$DOMAIN" ]]; then
    echo "   🌐 https://$DOMAIN"
else
    echo "   🌐 http://$SERVER_IP"
fi
echo ""
echo "📊 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Stop: docker-compose -f docker-compose.prod.yml down"
echo "   - Restart: docker-compose -f docker-compose.prod.yml restart"
echo "   - Update: git pull && docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "🔧 Configuration:"
echo "   - Edit .env file to change settings"
echo "   - JWT_SECRET is auto-generated and secure"
echo ""

# Open firewall ports if ufw is installed
if command -v ufw &> /dev/null; then
    echo "🔥 Configuring firewall..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 2448/tcp
    echo "✅ Firewall configured"
fi

echo "🎮 Enjoy Terry Escape!"