#!/bin/bash

# SSL Certificate Setup Script for Behavior Management System
# This script automates SSL certificate setup using Let's Encrypt

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check if domain is provided
check_domain() {
    if [[ -z "$1" ]]; then
        print_error "Please provide a domain name"
        echo "Usage: sudo ./ssl-setup.sh yourdomain.com"
        exit 1
    fi
    DOMAIN=$1
}

# Detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS"
        exit 1
    fi
}

# Install Certbot based on OS
install_certbot() {
    print_status "Installing Certbot..."
    
    case $OS in
        "Ubuntu"|"Debian GNU/Linux")
            apt update
            apt install -y certbot python3-certbot-nginx
            ;;
        "CentOS Linux"|"Red Hat Enterprise Linux")
            yum install -y epel-release
            yum install -y certbot python3-certbot-nginx
            ;;
        *)
            print_error "Unsupported OS: $OS"
            print_status "Please install Certbot manually: https://certbot.eff.org/"
            exit 1
            ;;
    esac
    
    print_success "Certbot installed successfully"
}

# Check if domain resolves to this server
check_dns() {
    print_status "Checking DNS configuration..."
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me)
    
    # Get domain IP
    DOMAIN_IP=$(dig +short $DOMAIN | head -1)
    
    if [[ "$SERVER_IP" != "$DOMAIN_IP" ]]; then
        print_warning "Domain $DOMAIN does not resolve to this server's IP ($SERVER_IP)"
        print_warning "Current IP: $DOMAIN_IP"
        print_warning "Please update your DNS settings and wait for propagation"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "DNS configuration looks good"
    fi
}

# Create Nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Temporary location for SSL verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS (after SSL is set up)
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    
    # Test configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    print_success "Nginx configuration created"
}

# Obtain SSL certificate
obtain_certificate() {
    print_status "Obtaining SSL certificate for $DOMAIN..."
    
    # Stop any application using port 80
    systemctl stop nginx 2>/dev/null || true
    
    # Obtain certificate
    certbot certonly --standalone \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    print_success "SSL certificate obtained successfully"
}

# Update Nginx configuration with SSL
update_nginx_ssl() {
    print_status "Updating Nginx configuration with SSL..."
    
    cat > /etc/nginx/sites-available/$DOMAIN << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
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
    
    # Test configuration
    nginx -t
    
    # Start Nginx
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx SSL configuration updated"
}

# Set up auto-renewal
setup_auto_renewal() {
    print_status "Setting up auto-renewal..."
    
    # Create renewal script
    cat > /etc/cron.daily/ssl-renew << EOF
#!/bin/bash
certbot renew --quiet --post-hook "systemctl reload nginx"
EOF
    
    chmod +x /etc/cron.daily/ssl-renew
    
    # Test renewal
    certbot renew --dry-run
    
    print_success "Auto-renewal configured"
}

# Test SSL configuration
test_ssl() {
    print_status "Testing SSL configuration..."
    
    # Test certificate
    if certbot certificates | grep -q "$DOMAIN"; then
        print_success "Certificate found and valid"
    else
        print_error "Certificate not found"
        exit 1
    fi
    
    # Test HTTPS access
    if curl -s -I "https://$DOMAIN" | grep -q "200 OK"; then
        print_success "HTTPS access working"
    else
        print_warning "HTTPS access test failed"
    fi
    
    # Test redirect
    if curl -s -I "http://$DOMAIN" | grep -q "301"; then
        print_success "HTTP to HTTPS redirect working"
    else
        print_warning "HTTP to HTTPS redirect test failed"
    fi
}

# Create SSL status monitoring script
create_monitoring_script() {
    print_status "Creating SSL monitoring script..."
    
    cat > /usr/local/bin/ssl-status << EOF
#!/bin/bash
# SSL Certificate Status Checker

DOMAIN="$DOMAIN"
CERT_FILE="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [[ ! -f "\$CERT_FILE" ]]; then
    echo "❌ Certificate file not found"
    exit 1
fi

EXPIRY=\$(openssl x509 -in "\$CERT_FILE" -text -noout | grep "Not After" | cut -d: -f2-)
echo "📅 Certificate expires: \$EXPIRY"

# Check if certificate expires in next 30 days
DAYS_LEFT=\$(echo \$EXPIRY | xargs -I {} date -d {} +%s | xargs -I {} echo \$(( ({} - \$(date +%s)) / 86400 )))

if [[ \$DAYS_LEFT -lt 30 ]]; then
    echo "⚠️  Certificate expires in \$DAYS_LEFT days"
    exit 1
else
    echo "✅ Certificate valid for \$DAYS_LEFT days"
fi
EOF
    
    chmod +x /usr/local/bin/ssl-status
    
    print_success "SSL monitoring script created"
}

# Main execution
main() {
    echo "🔒 SSL Certificate Setup for Behavior Management System"
    echo "=================================================="
    
    check_root
    check_domain "$1"
    detect_os
    
    print_status "Setting up SSL for domain: $DOMAIN"
    print_status "Operating System: $OS"
    
    install_certbot
    check_dns
    create_nginx_config
    obtain_certificate
    update_nginx_ssl
    setup_auto_renewal
    test_ssl
    create_monitoring_script
    
    echo ""
    echo "🎉 SSL Setup Complete!"
    echo "======================"
    echo "Domain: https://$DOMAIN"
    echo "Certificate: Let's Encrypt (auto-renewing)"
    echo "Next steps:"
    echo "1. Update your application environment variables"
    echo "2. Test all functionality"
    echo "3. Set up monitoring alerts"
    echo ""
    echo "Useful commands:"
    echo "- Check SSL status: ssl-status"
    echo "- Test renewal: certbot renew --dry-run"
    echo "- View certificates: certbot certificates"
}

# Run main function with all arguments
main "$@" 