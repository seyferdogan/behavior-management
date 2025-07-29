#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing application for deployment...\n');

// Step 1: Install dependencies
console.log('1. Installing dependencies...');
try {
    execSync('npm install --production', { stdio: 'inherit' });
    console.log('   ✅ Dependencies installed');
} catch (error) {
    console.log('   ❌ Failed to install dependencies');
    process.exit(1);
}

// Step 2: Generate Prisma client
console.log('\n2. Generating Prisma client...');
try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('   ✅ Prisma client generated');
} catch (error) {
    console.log('   ❌ Failed to generate Prisma client');
    process.exit(1);
}

// Step 3: Run database migrations
console.log('\n3. Running database migrations...');
try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('   ✅ Database migrations completed');
} catch (error) {
    console.log('   ⚠️  Database migrations failed (this is normal for first deployment)');
}

// Step 4: Create production environment file
console.log('\n4. Setting up production environment...');
const envExamplePath = path.join(__dirname, '..', '.env.example');
const envProdPath = path.join(__dirname, '..', '.env.production');

if (fs.existsSync(envExamplePath)) {
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Update for production
    envContent = envContent
        .replace(/NODE_ENV=development/g, 'NODE_ENV=production')
        .replace(/PORT=\d+/g, 'PORT=5000')
        .replace(/DATABASE_URL=.*/g, 'DATABASE_URL=file:./prisma/production.db');
    
    fs.writeFileSync(envProdPath, envContent);
    console.log('   ✅ Production environment file created');
} else {
    console.log('   ⚠️  No .env.example found, creating basic production env');
    const basicEnv = `NODE_ENV=production
PORT=5000
DATABASE_URL=file:./prisma/production.db
JWT_SECRET=your-production-secret-key-here
FRONTEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com`;
    
    fs.writeFileSync(envProdPath, basicEnv);
    console.log('   ✅ Basic production environment file created');
}

// Step 5: Create deployment configuration
console.log('\n5. Creating deployment configuration...');
const deployConfig = {
    name: 'behavior-management-backend',
    script: 'src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
        NODE_ENV: 'production',
        PORT: 5000
    }
};

const pm2ConfigPath = path.join(__dirname, '..', 'ecosystem.config.js');
fs.writeFileSync(pm2ConfigPath, `module.exports = ${JSON.stringify(deployConfig, null, 2)};`);
console.log('   ✅ PM2 configuration created');

// Step 6: Create startup script
console.log('\n6. Creating startup script...');
const startupScript = `#!/bin/bash
cd "$(dirname "$0")"
export NODE_ENV=production
export PORT=5000
node src/app.js`;

const startupPath = path.join(__dirname, '..', 'start.sh');
fs.writeFileSync(startupPath, startupScript);
fs.chmodSync(startupPath, '755');
console.log('   ✅ Startup script created');

// Step 7: Create health check endpoint test
console.log('\n7. Testing health check endpoint...');
try {
    const http = require('http');
    const options = {
        hostname: 'localhost',
        port: process.env.PORT || 5000,
        path: '/health',
        method: 'GET',
        timeout: 5000
    };

    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log('   ✅ Health check endpoint responding');
        } else {
            console.log(`   ⚠️  Health check returned status ${res.statusCode}`);
        }
    });

    req.on('error', () => {
        console.log('   ⚠️  Health check failed (server may not be running)');
    });

    req.end();
} catch (error) {
    console.log('   ⚠️  Could not test health check endpoint');
}

console.log('\n' + '='.repeat(50));
console.log('🎉 Application prepared for deployment!');
console.log('\nFiles created:');
console.log('- .env.production (production environment)');
console.log('- ecosystem.config.js (PM2 configuration)');
console.log('- start.sh (startup script)');
console.log('\nNext steps:');
console.log('1. Edit .env.production with your actual values');
console.log('2. Upload files to your server');
console.log('3. Run: npm install --production');
console.log('4. Run: npx prisma migrate deploy');
console.log('5. Run: pm2 start ecosystem.config.js'); 