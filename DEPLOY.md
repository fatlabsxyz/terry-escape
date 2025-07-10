# Terry Escape - Deployment Guide

## Quick Deploy on Any VPS

### Requirements
- Ubuntu/Debian VPS (or any Linux with bash)
- Root or sudo access
- Open ports: 80, 443 (optional), 2448

### One-Command Deploy

```bash
# Clone the repository
git clone https://github.com/yourusername/terry-escape.git
cd terry-escape

# Run the deployment script
sudo ./deploy.sh
```

The script will:
- Install Docker and Docker Compose
- Generate a secure JWT secret
- Configure CORS automatically
- Set up the game with your server's IP
- Optionally configure HTTPS with your domain

### Manual Deploy with Docker

1. **Clone and enter directory:**
```bash
git clone https://github.com/yourusername/terry-escape.git
cd terry-escape
```

2. **Create .env file:**
```bash
cat > .env << EOF
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://your-server-ip
API_URL=http://your-server-ip:2448
CORS_ORIGINS=http://your-server-ip,http://localhost
EOF
```

3. **Build and run:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. **Access your game:**
- Frontend: http://your-server-ip
- API: http://your-server-ip:2448

### With Custom Domain (HTTPS)

1. **Update .env:**
```bash
FRONTEND_URL=https://yourdomain.com
API_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,http://yourdomain.com
```

2. **Update Caddyfile:**
Replace `yourdomain.com` with your actual domain

3. **Run with SSL profile:**
```bash
docker-compose -f docker-compose.prod.yml --profile with-ssl up -d
```

Caddy will automatically obtain SSL certificates from Let's Encrypt.

### Free Hosting Options

#### 1. Oracle Cloud (Always Free)
- 2 AMD VMs with 1GB RAM each
- Perfect for Terry Escape
- Sign up at: https://cloud.oracle.com/free

#### 2. Google Cloud (Free Trial)
- $300 credit for 90 days
- e2-micro instance free tier
- Sign up at: https://cloud.google.com/free

#### 3. AWS EC2 (Free Tier)
- t2.micro instance free for 12 months
- Sign up at: https://aws.amazon.com/free

#### 4. Hetzner Cloud
- Very affordable (€3.29/month)
- Great performance
- Sign up at: https://www.hetzner.com/cloud

### Useful Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop the game
docker-compose -f docker-compose.prod.yml down

# Restart the game
docker-compose -f docker-compose.prod.yml restart

# Update and rebuild
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| JWT_SECRET | Secret key for JWT tokens | auto-generated |
| FRONTEND_URL | Public URL for frontend | http://localhost |
| API_URL | Public URL for API | http://localhost:2448 |
| CORS_ORIGINS | Allowed CORS origins | http://localhost |
| NODE_ENV | Node environment | production |

### Troubleshooting

1. **CORS Issues:**
   - Make sure CORS_ORIGINS includes all domains you're accessing from
   - Separate multiple origins with commas

2. **WebSocket Connection Failed:**
   - Ensure port 2448 is open in firewall
   - Check API_URL is correct in .env

3. **Can't Connect:**
   - Check firewall: `sudo ufw allow 80 && sudo ufw allow 2448`
   - Verify Docker is running: `docker ps`

4. **SSL Issues:**
   - Make sure your domain points to your server IP
   - Caddy needs ports 80 and 443 open

### Security Notes

- Always change JWT_SECRET in production
- Use HTTPS when possible
- Keep your server updated
- Monitor logs for suspicious activity

### Support

For issues or questions:
- Create an issue on GitHub
- Check logs: `docker-compose -f docker-compose.prod.yml logs`