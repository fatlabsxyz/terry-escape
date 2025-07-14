# 🎮 Terry Escape - LAN Party Mode

Host Terry Escape on your local network for friends to join without internet!

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd terry-demo
   ./setup.sh
   ```

2. **Run LAN Party Mode**
   ```bash
   ./lan-party.sh
   ```

3. **Share with Friends**
   - The script will display your local IP (e.g., `http://192.168.1.5`)
   - Friends on the same WiFi can open this URL in their browser
   - No installation needed for players!

## Features

- ✅ **Automatic IP Detection**: Finds your local network IP
- ✅ **Zero Config**: Everything is pre-configured for LAN play
- ✅ **Deployment Timer**: 60 seconds to deploy agents after all 4 players join
- ✅ **Turn Timer**: 5 minutes per turn
- ✅ **Deployment Lock**: Can't deploy until all 4 players connect
- ✅ **Better Timeouts**: All network operations have 5+ minute timeouts

## Troubleshooting

### Friends Can't Connect?

**Windows Firewall**
- Allow Docker Desktop through Windows Firewall
- Or temporarily disable firewall (not recommended)

**Linux Firewall**
```bash
sudo ufw allow from 192.168.0.0/16 to any port 80
sudo ufw allow from 192.168.0.0/16 to any port 2448
```

**macOS Firewall**
- System Preferences → Security & Privacy → Firewall → Allow Docker

### Check Logs
```bash
docker-compose -f docker-compose.lan.yml logs -f
```

### Stop the Game
```bash
docker-compose -f docker-compose.lan.yml down
```

## Manual Configuration

If the automatic script doesn't work, you can manually configure:

1. **Find Your IP**
   ```bash
   # Linux/Mac
   ip addr show | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr /i "ipv4"
   ```

2. **Create .env File**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   JWT_SECRET=your-secret-key-here
   FRONTEND_URL=http://YOUR_IP_HERE
   API_URL=http://YOUR_IP_HERE:2448
   CORS_ORIGINS=http://YOUR_IP_HERE,http://localhost
   NODE_ENV=production
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.lan.yml up -d --build
   ```

## Game Rules

1. **4 Players Required**: Game starts when 4 players join
2. **Deployment Phase**: 60 seconds to place your 4 agents
3. **Turn-Based**: Each player has 5 minutes per turn
4. **Objective**: Be the last player with agents alive

## Technical Details

- Frontend: Port 80
- Backend API: Port 2448
- WebSocket: Automatic reconnection
- CORS: Configured for LAN access
- JWT: Session-based authentication

Enjoy your LAN party! 🎉