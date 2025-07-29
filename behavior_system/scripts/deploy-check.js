#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking frontend deployment readiness...\n');

let allChecksPassed = true;

// Check 1: Package.json
console.log('1. Checking package.json...');
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

// Check 2: Main App component
console.log('\n2. Checking main App component...');
const appPath = path.join(__dirname, '..', 'src', 'App.js');
if (fs.existsSync(appPath)) {
    console.log('   ✅ Main App component found');
} else {
    console.log('   ❌ Main App component not found');
    allChecksPassed = false;
}

// Check 3: Node modules
console.log('\n3. Checking node_modules...');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✅ node_modules found');
} else {
    console.log('   ⚠️  node_modules not found (run npm install)');
    allChecksPassed = false;
}

// Check 4: Environment configuration
console.log('\n4. Checking environment configuration...');
const envFiles = ['.env', '.env.production', '.env.local'];
const envExists = envFiles.some(file => fs.existsSync(path.join(__dirname, '..', file)));

if (envExists) {
    console.log('   ✅ Environment files found');
} else {
    console.log('   ⚠️  No environment files found (will use defaults)');
}

// Check 5: API configuration
console.log('\n5. Checking API configuration...');
const apiPath = path.join(__dirname, '..', 'src', 'utils', 'api.js');
if (fs.existsSync(apiPath)) {
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    if (apiContent.includes('process.env.REACT_APP_API_URL') || apiContent.includes('localhost')) {
        console.log('   ✅ API configuration found');
    } else {
        console.log('   ⚠️  API configuration may need updating');
    }
} else {
    console.log('   ❌ API configuration not found');
    allChecksPassed = false;
}

// Check 6: Build script
console.log('\n6. Checking build configuration...');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
if (packageJson.scripts && packageJson.scripts.build) {
    console.log('   ✅ Build script found');
} else {
    console.log('   ❌ Build script not found');
    allChecksPassed = false;
}

// Check 7: Public folder
console.log('\n7. Checking public folder...');
const publicPath = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicPath)) {
    const publicFiles = fs.readdirSync(publicPath);
    if (publicFiles.includes('index.html')) {
        console.log('   ✅ Public folder with index.html found');
    } else {
        console.log('   ❌ index.html not found in public folder');
        allChecksPassed = false;
    }
} else {
    console.log('   ❌ Public folder not found');
    allChecksPassed = false;
}

// Check 8: Source files
console.log('\n8. Checking source files...');
const srcPath = path.join(__dirname, '..', 'src');
if (fs.existsSync(srcPath)) {
    const srcFiles = fs.readdirSync(srcPath);
    if (srcFiles.includes('index.js') && srcFiles.includes('App.js')) {
        console.log('   ✅ Source files found');
    } else {
        console.log('   ❌ Required source files missing');
        allChecksPassed = false;
    }
} else {
    console.log('   ❌ Source folder not found');
    allChecksPassed = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
    console.log('🎉 All critical checks passed! Your frontend is ready for deployment.');
    console.log('\nNext steps:');
    console.log('1. Run: npm run build');
    console.log('2. Upload the build folder to your hosting provider');
    console.log('3. Configure your domain to point to the build files');
} else {
    console.log('⚠️  Some checks failed. Please fix the issues above before deploying.');
    process.exit(1);
} 