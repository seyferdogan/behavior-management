#!/bin/bash

echo "�� Starting Behavior Management System..."

# Check if virtual environment is activated
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "📦 Activating Python virtual environment..."
    source venv/bin/activate
fi

# Start React frontend
echo "🌐 Starting React frontend..."
cd behavior_system
npm start

