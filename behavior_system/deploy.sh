#!/bin/bash

echo "🚀 Starting automated deployment..."

# Build the React app
echo "📦 Building React app..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Aborting deployment."
    exit 1
fi

# Deploy only build files to GitHub
echo "📤 Deploying to GitHub Pages..."

# Create a temporary directory for deployment
rm -rf temp-deploy
mkdir temp-deploy
cp -r build/* temp-deploy/

# Navigate to temp directory and push to GitHub
cd temp-deploy
git init
git add .
git commit -m "Deploy: $(date)"
git branch -M main
git remote add origin https://github.com/seyferdogan/behavior-management.git
git push -f origin main

# Clean up
cd ..
rm -rf temp-deploy

echo "🎉 Deployment complete!"
echo "🌐 Your app is live at: https://seyferdogan.github.io/behavior-management" 