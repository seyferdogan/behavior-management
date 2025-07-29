#!/bin/bash

# Cloudflare SSL Setup Script for Behavior Management System
# This script helps set up SSL using Cloudflare (free and quick)

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

# Check if domain is provided
check_domain() {
    if [[ -z "$1" ]]; then
        print_error "Please provide a domain name"
        echo "Usage: ./cloudflare-ssl-setup.sh yourdomain.com"
        exit 1
    fi
    DOMAIN=$1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install Nginx if not installed
install_nginx() {
    print_status "Installing Nginx..."
    
    if ! command -v nginx &> /dev/null; then
        if [[ -f /etc/os-release ]]; then
            . /etc/os-release
            case $NAME in
                "Ubuntu"|"Debian GNU/Linux")
                    apt update
                    apt install -y nginx
                    ;;
                "CentOS Linux"|"Red Hat Enterprise Linux")
                    yum install -y epel-release
                    yum install -y nginx
                    ;;
                *)
                    print_error "Unsupported OS. Please install Nginx manually."
                    exit 1
                    ;;
            esac
        fi
    else
        print_success "Nginx already installed"
    fi
}

# Create Nginx configuration for Cloudflare
create_nginx_config() {
    print_status "Creating Nginx configuration for Cloudflare SSL..."
    
    cat > /etc/nginx/sites-available/$DOMAIN << EOF
# HTTP server (will be handled by Cloudflare)
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
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
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
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

# Rate limiting configuration
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx configuration created"
}

# Get server IP
get_server_ip() {
    print_status "Getting server IP address..."
    SERVER_IP=$(curl -s ifconfig.me)
    print_success "Server IP: $SERVER_IP"
}

# Create Cloudflare setup instructions
create_cloudflare_instructions() {
    print_status "Creating Cloudflare setup instructions..."
    
    cat > cloudflare-setup-instructions.md << EOF
# Cloudflare SSL Setup Instructions

## Step 1: Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com)
2. Click "Sign Up" and create an account
3. Add your domain: $DOMAIN

## Step 2: Update Nameservers
Cloudflare will provide you with 2 nameservers. Update your domain registrar with these nameservers:

**Example nameservers (yours will be different):**
- ns1.cloudflare.com
- ns2.cloudflare.com

**Wait 24-48 hours for DNS propagation.**

## Step 3: Configure DNS Records
In Cloudflare dashboard, add these DNS records:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | $DOMAIN | $SERVER_IP | Proxied (Orange Cloud) |
| A | www.$DOMAIN | $SERVER_IP | Proxied (Orange Cloud) |

## Step 4: Configure SSL/TLS
1. Go to SSL/TLS settings in Cloudflare
2. Set SSL mode to "Full" or "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"

## Step 5: Security Settings
1. Go to Security settings
2. Set Security Level to "Medium"
3. Enable "Browser Integrity Check"
4. Enable "Challenge Passage" (optional)

## Step 6: Performance Settings
1. Go to Speed settings
2. Enable "Auto Minify" for JavaScript, CSS, and HTML
3. Enable "Brotli" compression
4. Enable "Rocket Loader" (optional)

## Step 7: Test Your Setup
1. Wait for DNS propagation (check with: nslookup $DOMAIN)
2. Test HTTPS: https://$DOMAIN
3. Test redirect: http://$DOMAIN (should redirect to HTTPS)

## Troubleshooting
- If HTTPS doesn't work, check SSL/TLS mode is set to "Full"
- If redirect doesn't work, ensure "Always Use HTTPS" is enabled
- If DNS doesn't resolve, wait longer for propagation

## Next Steps
1. Update your application environment variables:
   - FRONTEND_URL=https://$DOMAIN
   - CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

2. Test your application functionality
3. Set up monitoring and alerts
EOF
    
    print_success "Cloudflare setup instructions created: cloudflare-setup-instructions.md"
}

# Test basic connectivity
test_connectivity() {
    print_status "Testing basic connectivity..."
    
    if curl -s -I "http://$DOMAIN" | grep -q "200 OK"; then
        print_success "HTTP access working"
    else
        print_warning "HTTP access test failed (may be normal if Cloudflare not configured yet)"
    fi
}

# Main execution
main() {
    echo "☁️  Cloudflare SSL Setup for Behavior Management System"
    echo "====================================================="
    
    check_root
    check_domain "$1"
    
    print_status "Setting up Cloudflare SSL for domain: $DOMAIN"
    
    install_nginx
    create_nginx_config
    get_server_ip
    create_cloudflare_instructions
    test_connectivity
    
    echo ""
    echo "🎉 Cloudflare SSL Setup Complete!"
    echo "================================"
    echo "Domain: $DOMAIN"
    echo "Server IP: $SERVER_IP"
    echo ""
    echo "Next steps:"
    echo "1. Follow the instructions in cloudflare-setup-instructions.md"
    echo "2. Update your domain's nameservers to Cloudflare"
    echo "3. Configure DNS records in Cloudflare dashboard"
    echo "4. Enable SSL/TLS settings"
    echo "5. Test HTTPS access"
    echo ""
    echo "Estimated time to complete: 30 minutes + DNS propagation (24-48 hours)"
}

# Run main function with all arguments
main "$@" 