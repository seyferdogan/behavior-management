#!/bin/bash

echo "🛑 Stopping Behavior Management System with SSL..."

# Stop all PM2 processes
echo "📦 Stopping PM2 processes..."
pm2 stop all
pm2 delete all

# Kill any processes on port 3000 (frontend)
echo "🌐 Stopping frontend server..."
FRONTEND_PID=$(lsof -ti:3000)
if [ ! -z "$FRONTEND_PID" ]; then
    echo "Killing frontend process on port 3000 (PID: $FRONTEND_PID)"
    kill -9 $FRONTEND_PID
else
    echo "No frontend process found on port 3000"
fi

# Kill any processes on port 5000 (backend)
echo "🚀 Stopping backend server..."
BACKEND_PID=$(lsof -ti:5000)
if [ ! -z "$BACKEND_PID" ]; then
    echo "Killing backend process on port 5000 (PID: $BACKEND_PID)"
    kill -9 $BACKEND_PID
else
    echo "No backend process found on port 5000"
fi

# Check if any processes are still running
echo ""
echo "🔍 Checking for remaining processes..."
REMAINING_FRONTEND=$(lsof -ti:3000)
REMAINING_BACKEND=$(lsof -ti:5000)

if [ -z "$REMAINING_FRONTEND" ] && [ -z "$REMAINING_BACKEND" ]; then
    echo "✅ All services stopped successfully!"
    echo "💾 Memory freed up"
else
    echo "⚠️  Some processes may still be running:"
    [ ! -z "$REMAINING_FRONTEND" ] && echo "Frontend: $REMAINING_FRONTEND"
    [ ! -z "$REMAINING_BACKEND" ] && echo "Backend: $REMAINING_BACKEND"
fi

echo ""
echo "📊 Current PM2 status:"
pm2 status

echo ""
echo "🎯 To start again: ./start-ssl.sh"
echo "💡 To check memory usage: pm2 monit" 