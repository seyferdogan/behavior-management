#!/bin/bash

# SSL Testing Script for Behavior Management System
# This script tests SSL configuration and security

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
        echo "Usage: ./ssl-test.sh yourdomain.com"
        exit 1
    fi
    DOMAIN=$1
}

# Test basic connectivity
test_connectivity() {
    print_status "Testing basic connectivity..."
    
    # Test HTTP
    if curl -s -I "http://$DOMAIN" | grep -q "200 OK\|301\|302"; then
        print_success "HTTP access working"
    else
        print_error "HTTP access failed"
        return 1
    fi
    
    # Test HTTPS
    if curl -s -I "https://$DOMAIN" | grep -q "200 OK"; then
        print_success "HTTPS access working"
    else
        print_error "HTTPS access failed"
        return 1
    fi
}

# Test SSL certificate
test_ssl_certificate() {
    print_status "Testing SSL certificate..."
    
    # Get certificate details
    CERT_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -text)
    
    if [[ -n "$CERT_INFO" ]]; then
        print_success "SSL certificate found"
        
        # Check expiry
        EXPIRY=$(echo "$CERT_INFO" | grep "Not After" | cut -d: -f2-)
        echo "   Certificate expires: $EXPIRY"
        
        # Check if expires in next 30 days
        EXPIRY_DATE=$(echo "$EXPIRY" | xargs -I {} date -d {} +%s 2>/dev/null || echo "$EXPIRY")
        CURRENT_DATE=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_DATE - CURRENT_DATE) / 86400 ))
        
        if [[ $DAYS_LEFT -lt 30 ]]; then
            print_warning "Certificate expires in $DAYS_LEFT days"
        else
            print_success "Certificate valid for $DAYS_LEFT days"
        fi
        
        # Check issuer
        ISSUER=$(echo "$CERT_INFO" | grep "Issuer:" | head -1)
        echo "   Issuer: $ISSUER"
        
    else
        print_error "SSL certificate not found"
        return 1
    fi
}

# Test SSL protocols
test_ssl_protocols() {
    print_status "Testing SSL protocols..."
    
    # Test TLS 1.2
    if echo | openssl s_client -tls1_2 -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | grep -q "Verify return code: 0"; then
        print_success "TLS 1.2 supported"
    else
        print_warning "TLS 1.2 not supported"
    fi
    
    # Test TLS 1.3
    if echo | openssl s_client -tls1_3 -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | grep -q "Verify return code: 0"; then
        print_success "TLS 1.3 supported"
    else
        print_warning "TLS 1.3 not supported"
    fi
    
    # Test deprecated protocols (should fail)
    if echo | openssl s_client -ssl3 -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | grep -q "Verify return code: 0"; then
        print_warning "SSL 3.0 still supported (should be disabled)"
    else
        print_success "SSL 3.0 properly disabled"
    fi
}

# Test HTTP to HTTPS redirect
test_redirect() {
    print_status "Testing HTTP to HTTPS redirect..."
    
    REDIRECT_RESPONSE=$(curl -s -I "http://$DOMAIN" | grep -i "location\|301\|302")
    
    if echo "$REDIRECT_RESPONSE" | grep -q "https://"; then
        print_success "HTTP to HTTPS redirect working"
        echo "   Redirect: $REDIRECT_RESPONSE"
    else
        print_warning "HTTP to HTTPS redirect not working"
    fi
}

# Test security headers
test_security_headers() {
    print_status "Testing security headers..."
    
    HEADERS=$(curl -s -I "https://$DOMAIN")
    
    # Test HSTS
    if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
        print_success "HSTS header present"
    else
        print_warning "HSTS header missing"
    fi
    
    # Test X-Frame-Options
    if echo "$HEADERS" | grep -q "X-Frame-Options"; then
        print_success "X-Frame-Options header present"
    else
        print_warning "X-Frame-Options header missing"
    fi
    
    # Test X-Content-Type-Options
    if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
        print_success "X-Content-Type-Options header present"
    else
        print_warning "X-Content-Type-Options header missing"
    fi
    
    # Test X-XSS-Protection
    if echo "$HEADERS" | grep -q "X-XSS-Protection"; then
        print_success "X-XSS-Protection header present"
    else
        print_warning "X-XSS-Protection header missing"
    fi
}

# Test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    # Test health endpoint
    if curl -s "https://$DOMAIN/api/health" | grep -q "status\|ok"; then
        print_success "API health endpoint working"
    else
        print_warning "API health endpoint not responding"
    fi
    
    # Test CORS headers
    CORS_HEADERS=$(curl -s -I -H "Origin: https://example.com" "https://$DOMAIN/api/health" | grep -i "access-control")
    
    if [[ -n "$CORS_HEADERS" ]]; then
        print_success "CORS headers present"
        echo "   CORS: $CORS_HEADERS"
    else
        print_warning "CORS headers missing"
    fi
}

# Test SSL Labs grade (if available)
test_ssl_labs() {
    print_status "Testing SSL Labs grade..."
    
    print_status "Visit https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    print_status "This will give you a detailed SSL security grade (A+ to F)"
}

# Generate SSL report
generate_report() {
    print_status "Generating SSL security report..."
    
    cat > ssl-security-report.md << EOF
# SSL Security Report for $DOMAIN

Generated on: $(date)

## Summary
- Domain: $DOMAIN
- SSL Certificate: $(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -issuer | cut -d= -f2-)
- Expiry: $(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)

## Test Results

### Connectivity
- HTTP Access: $(curl -s -I "http://$DOMAIN" | grep -q "200 OK\|301\|302" && echo "✅ Working" || echo "❌ Failed")
- HTTPS Access: $(curl -s -I "https://$DOMAIN" | grep -q "200 OK" && echo "✅ Working" || echo "❌ Failed")

### SSL Certificate
- Certificate Found: $(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -text >/dev/null 2>&1 && echo "✅ Yes" || echo "❌ No")
- Days Until Expiry: $(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2 | xargs -I {} date -d {} +%s | xargs -I {} echo $(( ({} - $(date +%s)) / 86400 )))

### Security Headers
- HSTS: $(curl -s -I "https://$DOMAIN" | grep -q "Strict-Transport-Security" && echo "✅ Present" || echo "❌ Missing")
- X-Frame-Options: $(curl -s -I "https://$DOMAIN" | grep -q "X-Frame-Options" && echo "✅ Present" || echo "❌ Missing")
- X-Content-Type-Options: $(curl -s -I "https://$DOMAIN" | grep -q "X-Content-Type-Options" && echo "✅ Present" || echo "❌ Missing")
- X-XSS-Protection: $(curl -s -I "https://$DOMAIN" | grep -q "X-XSS-Protection" && echo "✅ Present" || echo "❌ Missing")

### API Endpoints
- Health Check: $(curl -s "https://$DOMAIN/api/health" | grep -q "status\|ok" && echo "✅ Working" || echo "❌ Failed")
- CORS Headers: $(curl -s -I -H "Origin: https://example.com" "https://$DOMAIN/api/health" | grep -q "Access-Control" && echo "✅ Present" || echo "❌ Missing")

## Recommendations

1. **SSL Labs Test**: Visit https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN for detailed analysis
2. **Security Headers**: Ensure all security headers are properly configured
3. **Certificate Renewal**: Set up automatic renewal for Let's Encrypt certificates
4. **Monitoring**: Set up alerts for certificate expiry

## Next Steps

1. Review the SSL Labs report
2. Fix any security issues identified
3. Set up monitoring and alerts
4. Regular security audits
EOF
    
    print_success "SSL security report generated: ssl-security-report.md"
}

# Main execution
main() {
    echo "🔒 SSL Security Test for Behavior Management System"
    echo "================================================="
    
    check_domain "$1"
    
    print_status "Testing SSL configuration for domain: $DOMAIN"
    
    test_connectivity
    test_ssl_certificate
    test_ssl_protocols
    test_redirect
    test_security_headers
    test_api_endpoints
    test_ssl_labs
    generate_report
    
    echo ""
    echo "🎉 SSL Security Test Complete!"
    echo "============================="
    echo "Domain: $DOMAIN"
    echo "Report: ssl-security-report.md"
    echo ""
    echo "Next steps:"
    echo "1. Review the SSL security report"
    echo "2. Visit SSL Labs for detailed analysis"
    echo "3. Fix any security issues"
    echo "4. Set up monitoring and alerts"
}

# Run main function with all arguments
main "$@" 