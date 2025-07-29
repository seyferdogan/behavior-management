#!/bin/bash

# Local SSL Setup Script for Development
# This script sets up SSL for local development without needing a domain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Generate self-signed certificate
generate_ssl_certificate() {
    print_status "Generating self-signed SSL certificate..."
    
    # Create certificates directory
    mkdir -p certificates
    
    # Generate private key
    openssl genrsa -out certificates/localhost.key 2048
    
    # Generate certificate signing request
    cat > certificates/localhost.conf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Organization
OU = IT Department
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
    
    # Generate certificate
    openssl req -new -x509 -key certificates/localhost.key -out certificates/localhost.crt -days 365 -config certificates/localhost.conf
    
    print_success "SSL certificate generated"
}

# Install certificate on macOS
install_certificate_macos() {
    print_status "Installing certificate on macOS..."
    
    # Copy certificate to system
    sudo cp certificates/localhost.crt /usr/local/share/ca-certificates/
    
    # Add to keychain
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certificates/localhost.crt
    
    print_success "Certificate installed on macOS"
}

# Install certificate on Linux
install_certificate_linux() {
    print_status "Installing certificate on Linux..."
    
    # Copy certificate to system
    sudo cp certificates/localhost.crt /usr/local/share/ca-certificates/
    sudo update-ca-certificates
    
    print_success "Certificate installed on Linux"
}

# Create Nginx configuration for local SSL
create_nginx_config() {
    print_status "Creating Nginx configuration for local SSL..."
    
    cat > nginx-local.conf << EOF
server {
    listen 80;
    server_name localhost;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name localhost;
    
    # SSL Configuration
    ssl_certificate certificates/localhost.crt;
    ssl_certificate_key certificates/localhost.key;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend files
    location / {
        root /var/www/html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    print_success "Nginx configuration created"
}

# Create PM2 configuration for SSL
create_pm2_config() {
    print_status "Creating PM2 configuration for SSL..."
    
    cat > ecosystem-ssl.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'behavior-management-backend-ssl',
      script: 'src/app.js',
      cwd: './behavior-management-backend',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        SSL_ENABLED: 'true',
        SSL_CERT_PATH: './certificates/localhost.crt',
        SSL_KEY_PATH: './certificates/localhost.key'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'behavior-management-frontend-ssl',
      script: 'serve',
      cwd: './behavior_system',
      args: '-s build -l 3000 --ssl-cert ../certificates/localhost.crt --ssl-key ../certificates/localhost.key',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
EOF
    
    print_success "PM2 configuration created"
}

# Update backend for SSL support
update_backend_ssl() {
    print_status "Updating backend for SSL support..."
    
    # Create SSL configuration file
    cat > behavior-management-backend/src/ssl-config.js << EOF
const fs = require('fs');
const path = require('path');

const sslConfig = {
    key: fs.readFileSync(path.join(__dirname, '../../certificates/localhost.key')),
    cert: fs.readFileSync(path.join(__dirname, '../../certificates/localhost.crt'))
};

module.exports = sslConfig;
EOF
    
    print_success "Backend SSL configuration created"
}

# Create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    cat > start-ssl.sh << 'EOF'
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
EOF
    
    chmod +x start-ssl.sh
    print_success "Startup script created"
}

# Create instructions
create_instructions() {
    print_status "Creating setup instructions..."
    
    cat > LOCAL_SSL_SETUP.md << EOF
# 🔒 Local SSL Setup Instructions

## What This Does
This sets up SSL (HTTPS) for your local development environment without needing a domain or internet hosting.

## Files Created
- \`certificates/localhost.crt\` - SSL certificate
- \`certificates/localhost.key\` - Private key
- \`nginx-local.conf\` - Nginx configuration
- \`ecosystem-ssl.config.js\` - PM2 configuration
- \`start-ssl.sh\` - Startup script

## How to Use

### 1. Start the Application with SSL
\`\`\`bash
./start-ssl.sh
\`\`\`

### 2. Access Your Application
- **Frontend**: https://localhost:3000
- **Backend API**: https://localhost:5000
- **Health Check**: https://localhost:5000/health

### 3. Handle Security Warning
When you first visit https://localhost:3000, you'll see a security warning because this is a self-signed certificate:
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"
3. Your application will load normally

### 4. Stop the Application
\`\`\`bash
pm2 stop all
\`\`\`

## Benefits of Local SSL
- ✅ Test HTTPS functionality
- ✅ Verify security headers
- ✅ Test API calls over HTTPS
- ✅ Prepare for production deployment
- ✅ No internet hosting required

## Next Steps
When you're ready to deploy to the internet:
1. Get a domain name (\$12/year)
2. Set up a VPS (\$12/month)
3. Use the Cloudflare SSL script for production SSL

## Troubleshooting

### Certificate Not Trusted
This is normal for self-signed certificates. Click "Advanced" and "Proceed" in your browser.

### Port Already in Use
\`\`\`bash
# Check what's using the port
lsof -i :3000
lsof -i :5000

# Kill the process
kill -9 <PID>
\`\`\`

### PM2 Not Found
\`\`\`bash
npm install -g pm2
\`\`\`

### Serve Not Found
\`\`\`bash
npm install -g serve
\`\`\`
EOF
    
    print_success "Instructions created: LOCAL_SSL_SETUP.md"
}

# Main execution
main() {
    echo "🔒 Local SSL Setup for Behavior Management System"
    echo "================================================"
    
    print_status "Setting up SSL for local development..."
    
    generate_ssl_certificate
    create_nginx_config
    create_pm2_config
    update_backend_ssl
    create_startup_script
    create_instructions
    
    # Install certificate based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        install_certificate_macos
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        install_certificate_linux
    else
        print_warning "Certificate installation not automated for this OS"
        print_status "Please install the certificate manually"
    fi
    
    echo ""
    echo "🎉 Local SSL Setup Complete!"
    echo "============================"
    echo "Next steps:"
    echo "1. Run: ./start-ssl.sh"
    echo "2. Visit: https://localhost:3000"
    echo "3. Click 'Advanced' and 'Proceed' for security warning"
    echo ""
    echo "Your application will now run with HTTPS locally!"
    echo "No domain or internet hosting required."
}

# Run main function
main "$@" 