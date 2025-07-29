#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing frontend for deployment...\n');

// Step 1: Install dependencies
console.log('1. Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('   ✅ Dependencies installed');
} catch (error) {
    console.log('   ❌ Failed to install dependencies');
    process.exit(1);
}

// Step 2: Create production environment file
console.log('\n2. Setting up production environment...');
const envProdPath = path.join(__dirname, '..', '.env.production');

const productionEnv = `# Production Environment Configuration
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=${require('../package.json').version}
GENERATE_SOURCEMAP=false`;

fs.writeFileSync(envProdPath, productionEnv);
console.log('   ✅ Production environment file created');

// Step 3: Build the application
console.log('\n3. Building application for production...');
try {
    execSync('npm run build:prod', { stdio: 'inherit' });
    console.log('   ✅ Application built successfully');
} catch (error) {
    console.log('   ❌ Build failed');
    process.exit(1);
}

// Step 4: Check build output
console.log('\n4. Checking build output...');
const buildPath = path.join(__dirname, '..', 'build');
if (fs.existsSync(buildPath)) {
    const buildFiles = fs.readdirSync(buildPath);
    if (buildFiles.includes('index.html') && buildFiles.includes('static')) {
        console.log('   ✅ Build output verified');
        
        // Check file sizes
        const staticPath = path.join(buildPath, 'static');
        if (fs.existsSync(staticPath)) {
            const staticFiles = fs.readdirSync(staticPath);
            console.log(`   📁 Build contains ${staticFiles.length} static files`);
        }
    } else {
        console.log('   ❌ Build output incomplete');
        process.exit(1);
    }
} else {
    console.log('   ❌ Build folder not found');
    process.exit(1);
}

// Step 5: Create deployment configuration
console.log('\n5. Creating deployment configuration...');
const deployConfig = {
    name: 'behavior-management-frontend',
    buildPath: './build',
    uploadPath: '/var/www/html',
    nginxConfig: {
        serverName: 'your-domain.com',
        root: '/var/www/html',
        index: 'index.html',
        tryFiles: '$uri $uri/ /index.html'
    }
};

const deployConfigPath = path.join(__dirname, '..', 'deploy-config.json');
fs.writeFileSync(deployConfigPath, JSON.stringify(deployConfig, null, 2));
console.log('   ✅ Deployment configuration created');

// Step 6: Create Nginx configuration template
console.log('\n6. Creating Nginx configuration template...');
const nginxConfig = `server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/html;
    index index.html;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}`;

const nginxPath = path.join(__dirname, '..', 'nginx.conf.template');
fs.writeFileSync(nginxPath, nginxConfig);
console.log('   ✅ Nginx configuration template created');

// Step 7: Create deployment script
console.log('\n7. Creating deployment script...');
const deployScript = `#!/bin/bash
# Deployment script for behavior management frontend

echo "🚀 Deploying frontend..."

# Build the application
npm run build:prod

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"
echo "📁 Build folder ready for upload"
echo ""
echo "Next steps:"
echo "1. Upload the 'build' folder to your server"
echo "2. Configure your web server to serve the build files"
echo "3. Update your domain DNS settings"
`;

const deployScriptPath = path.join(__dirname, '..', 'deploy.sh');
fs.writeFileSync(deployScriptPath, deployScript);
fs.chmodSync(deployScriptPath, '755');
console.log('   ✅ Deployment script created');

// Step 8: Create README for deployment
console.log('\n8. Creating deployment README...');
const deployReadme = `# Frontend Deployment Guide

## Files Created
- \`.env.production\` - Production environment variables
- \`deploy-config.json\` - Deployment configuration
- \`nginx.conf.template\` - Nginx configuration template
- \`deploy.sh\` - Deployment script
- \`build/\` - Production build files

## Quick Deployment Steps

### 1. Update Environment Variables
Edit \`.env.production\` and set your backend API URL:
\`\`\`
REACT_APP_API_URL=https://your-backend-domain.com/api
\`\`\`

### 2. Build for Production
\`\`\`bash
npm run build:prod
\`\`\`

### 3. Upload to Server
Upload the \`build\` folder to your web server.

### 4. Configure Web Server
Use the \`nginx.conf.template\` as a starting point for your web server configuration.

## Hosting Options

### Option 1: Static Hosting (Recommended)
- **Netlify**: Drag and drop the build folder
- **Vercel**: Connect your GitHub repo
- **GitHub Pages**: Push build folder to gh-pages branch

### Option 2: VPS/Server
- Upload build folder to \`/var/www/html\`
- Configure Nginx/Apache
- Set up SSL certificate

### Option 3: CDN
- Upload to AWS S3 + CloudFront
- Upload to Google Cloud Storage + CDN
- Upload to Azure Blob Storage + CDN

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | https://api.yourdomain.com |
| REACT_APP_ENVIRONMENT | Environment name | production |
| REACT_APP_VERSION | App version | 1.0.0 |

## Troubleshooting

### Build Fails
- Check Node.js version (>=16.0.0)
- Clear node_modules and reinstall
- Check for syntax errors in code

### API Connection Issues
- Verify REACT_APP_API_URL is correct
- Check CORS settings on backend
- Ensure backend is running and accessible

### Routing Issues
- Configure web server for SPA routing
- Ensure all routes redirect to index.html
- Check for 404 errors in browser console
`;

const deployReadmePath = path.join(__dirname, '..', 'DEPLOYMENT.md');
fs.writeFileSync(deployReadmePath, deployReadme);
console.log('   ✅ Deployment README created');

console.log('\n' + '='.repeat(50));
console.log('🎉 Frontend prepared for deployment!');
console.log('\nFiles created:');
console.log('- .env.production (production environment)');
console.log('- deploy-config.json (deployment configuration)');
console.log('- nginx.conf.template (web server config)');
console.log('- deploy.sh (deployment script)');
console.log('- DEPLOYMENT.md (deployment guide)');
console.log('- build/ (production build files)');
console.log('\nNext steps:');
console.log('1. Edit .env.production with your backend URL');
console.log('2. Choose your hosting provider');
console.log('3. Upload the build folder');
console.log('4. Configure your domain'); 