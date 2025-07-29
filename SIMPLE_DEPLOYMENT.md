# Simple Deployment for Single School (200 Students)

## Overview
This guide is for deploying the behavior management system for a single school with ~200 students. No complex cloud infrastructure needed!

## Option 1: Simple VPS Deployment (Recommended)

### 1. Get a VPS
- **DigitalOcean Droplet** ($5-10/month)
- **Linode** ($5/month)
- **Vultr** ($5/month)

### 2. Server Setup (Ubuntu 20.04+)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install SQLite (usually pre-installed)
sudo apt install sqlite3 -y
```

### 3. Deploy Your App
```bash
# Clone your project
git clone <your-repo>
cd behavior-management-system

# Install dependencies
cd behavior-management-backend && npm install
cd ../behavior_system && npm install

# Build frontend
npm run build

# Set up environment
cp .env.example .env
# Edit .env with your settings
```

### 4. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/behavior-system
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your IP address

    # Frontend
    location / {
        root /path/to/your/behavior_system/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Start Services
```bash
# Start backend with PM2
cd behavior-management-backend
pm2 start src/app.js --name "behavior-backend"

# Enable Nginx
sudo ln -s /etc/nginx/sites-available/behavior-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Save PM2 configuration
pm2 save
pm2 startup
```

## Option 2: Shared Hosting (Even Simpler)

### 1. Choose Hosting
- **Netlify** (free tier) - for frontend
- **Railway** (free tier) - for backend
- **Render** (free tier) - for both

### 2. Deploy Frontend to Netlify
```bash
# Build your React app
cd behavior_system
npm run build

# Deploy to Netlify (drag and drop build folder)
```

### 3. Deploy Backend to Railway
```bash
# Connect your GitHub repo to Railway
# Railway will auto-deploy when you push changes
```

## Option 3: Local Network (Simplest)

### 1. Run on School's Server
```bash
# Install on school's computer/server
# Run with PM2 for auto-restart
pm2 start src/app.js --name "behavior-system"
```

### 2. Access via Local Network
- Frontend: `http://school-server-ip:3000`
- Backend: `http://school-server-ip:5000`

## Database Setup

### SQLite (Recommended for single school)
```bash
# Initialize database
cd behavior-management-backend
npx prisma migrate dev
npx prisma db seed
```

### Backup Strategy
```bash
# Simple backup script
#!/bin/bash
cp prisma/dev.db backup/$(date +%Y%m%d_%H%M%S).db
```

## Security (Basic)

### 1. Environment Variables
```bash
# .env file
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./prisma/production.db
JWT_SECRET=your-super-secret-key-here
FRONTEND_URL=http://your-domain.com
```

### 2. Basic Security Headers
```nginx
# Add to Nginx config
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

## Monitoring (Simple)

### 1. PM2 Monitoring
```bash
pm2 monit
pm2 logs
```

### 2. Basic Health Check
```bash
curl http://localhost:5000/health
```

## Maintenance

### 1. Updates
```bash
# Pull latest changes
git pull origin main

# Restart services
pm2 restart all
```

### 2. Backups
```bash
# Daily backup script
0 2 * * * /path/to/backup-script.sh
```

## Cost Breakdown

### VPS Option:
- VPS: $5-10/month
- Domain: $10-15/year
- **Total: ~$70-135/year**

### Shared Hosting Option:
- Netlify: Free
- Railway: Free (with limits)
- Domain: $10-15/year
- **Total: ~$10-15/year**

### Local Network Option:
- Existing school server/computer
- **Total: $0**

## Next Steps

1. **Choose your deployment option**
2. **Set up basic monitoring**
3. **Create backup strategy**
4. **Train school staff**
5. **Go live!**

## Support

For a single school, you can:
- Handle issues directly
- Make quick fixes
- Provide personal support
- No need for complex scaling

This approach is much more manageable and cost-effective for your use case! 