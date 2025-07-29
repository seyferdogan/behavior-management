#!/bin/bash

echo "🔒 Starting Behavior Management System with SSL..."

# Check if certificates exist
if [ ! -f "certificates/localhost.crt" ] || [ ! -f "certificates/localhost.key" ]; then
    echo "❌ SSL certificates not found. Run ./scripts/local-ssl-setup.sh first."
    exit 1
fi

# Install serve globally if not installed
if ! command -v serve &> /dev/null; then
    echo "📦 Installing serve package..."
    npm install -g serve
fi

# Build frontend
echo "🏗️  Building frontend..."
cd behavior_system
npm run build
cd ..

# Start backend with PM2
echo "🚀 Starting backend..."
cd behavior-management-backend
pm2 start ../ecosystem-ssl.config.js --only behavior-management-backend-ssl

# Start frontend with PM2
echo "🌐 Starting frontend..."
cd ../behavior_system
pm2 start ../ecosystem-ssl.config.js --only behavior-management-frontend-ssl

echo ""
echo "🎉 Behavior Management System started with SSL!"
echo "=============================================="
echo "Frontend: https://localhost:3000"
echo "Backend API: https://localhost:5000"
echo "Health Check: https://localhost:5000/health"
echo ""
echo "Note: You may see a security warning because this is a self-signed certificate."
echo "Click 'Advanced' and 'Proceed to localhost' to continue."
echo ""
echo "To stop the services: pm2 stop all"
echo "To view logs: pm2 logs"
echo "To monitor: pm2 monit"
