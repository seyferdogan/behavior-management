#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking deployment readiness...\n');

let allChecksPassed = true;

// Check 1: Environment files
console.log('1. Checking environment configuration...');
const envFiles = ['.env', '.env.production', '.env.example'];
const envExists = envFiles.some(file => fs.existsSync(path.join(__dirname, '..', file)));

if (envExists) {
    console.log('   ✅ Environment files found');
} else {
    console.log('   ❌ No environment files found');
    allChecksPassed = false;
}

// Check 2: Database schema
console.log('\n2. Checking database schema...');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
    console.log('   ✅ Prisma schema found');
} else {
    console.log('   ❌ Prisma schema not found');
    allChecksPassed = false;
}

// Check 3: Dependencies
console.log('\n3. Checking dependencies...');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
        console.log('   ✅ Dependencies defined');
    } else {
        console.log('   ❌ No dependencies found');
        allChecksPassed = false;
    }
} else {
    console.log('   ❌ package.json not found');
    allChecksPassed = false;
}

// Check 4: Main application file
console.log('\n4. Checking main application file...');
const appPath = path.join(__dirname, '..', 'src', 'app.js');
if (fs.existsSync(appPath)) {
    console.log('   ✅ Main application file found');
} else {
    console.log('   ❌ Main application file not found');
    allChecksPassed = false;
}

// Check 5: Node modules
console.log('\n5. Checking node_modules...');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✅ node_modules found');
} else {
    console.log('   ⚠️  node_modules not found (run npm install)');
    allChecksPassed = false;
}

// Check 6: Database migrations
console.log('\n6. Checking database migrations...');
const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
if (fs.existsSync(migrationsPath)) {
    const migrations = fs.readdirSync(migrationsPath).filter(dir => 
        fs.statSync(path.join(migrationsPath, dir)).isDirectory()
    );
    if (migrations.length > 0) {
        console.log(`   ✅ ${migrations.length} migration(s) found`);
    } else {
        console.log('   ⚠️  No migrations found');
    }
} else {
    console.log('   ⚠️  Migrations directory not found');
}

// Check 7: Security considerations
console.log('\n7. Checking security configuration...');
const envContent = fs.existsSync(path.join(__dirname, '..', '.env')) 
    ? fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8') 
    : '';

if (envContent.includes('JWT_SECRET') && !envContent.includes('JWT_SECRET=your-secret-key')) {
    console.log('   ✅ JWT_SECRET configured');
} else {
    console.log('   ⚠️  JWT_SECRET needs to be configured');
}

if (envContent.includes('NODE_ENV=production')) {
    console.log('   ✅ Production environment configured');
} else {
    console.log('   ⚠️  Production environment not configured');
}

// Final result
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
    console.log('🎉 All critical checks passed! Your application is ready for deployment.');
    console.log('\nNext steps:');
    console.log('1. Configure production environment variables');
    console.log('2. Set up your hosting provider');
    console.log('3. Deploy your application');
} else {
    console.log('⚠️  Some checks failed. Please fix the issues above before deploying.');
    process.exit(1);
} 