#!/bin/bash

# Behavior Management System Deployment Script
# Supports multiple environments and cloud providers

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEFAULT_ENVIRONMENT="development"
DEFAULT_PROVIDER="docker"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Behavior Management System Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    Deployment environment (development, staging, production)
    -p, --provider PROVIDER  Cloud provider (docker, aws, gcp, azure)
    -b, --build              Build Docker images before deployment
    -t, --test               Run tests before deployment
    -c, --clean              Clean up resources after deployment
    -h, --help               Show this help message

Examples:
    $0 -e development -p docker -b
    $0 -e staging -p aws -t
    $0 -e production -p aws -b -t

EOF
}

# Parse command line arguments
ENVIRONMENT=$DEFAULT_ENVIRONMENT
PROVIDER=$DEFAULT_PROVIDER
BUILD_IMAGES=false
RUN_TESTS=false
CLEAN_UP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--provider)
            PROVIDER="$2"
            shift 2
            ;;
        -b|--build)
            BUILD_IMAGES=true
            shift
            ;;
        -t|--test)
            RUN_TESTS=true
            shift
            ;;
        -c|--clean)
            CLEAN_UP=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
case $ENVIRONMENT in
    development|dev)
        ENVIRONMENT="development"
        ;;
    staging|stage)
        ENVIRONMENT="staging"
        ;;
    production|prod)
        ENVIRONMENT="production"
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Validate provider
case $PROVIDER in
    docker|aws|gcp|azure)
        ;;
    *)
        log_error "Invalid provider: $PROVIDER"
        exit 1
        ;;
esac

log_info "Starting deployment..."
log_info "Environment: $ENVIRONMENT"
log_info "Provider: $PROVIDER"
log_info "Build images: $BUILD_IMAGES"
log_info "Run tests: $RUN_TESTS"

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if required files exist
    if [[ ! -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found in project root"
        exit 1
    fi
    
    if [[ ! -f "$PROJECT_ROOT/behavior-management-backend/Dockerfile" ]]; then
        log_error "Backend Dockerfile not found"
        exit 1
    fi
    
    if [[ ! -f "$PROJECT_ROOT/behavior_system/Dockerfile" ]]; then
        log_error "Frontend Dockerfile not found"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Run tests
run_tests() {
    if [[ "$RUN_TESTS" == "true" ]]; then
        log_info "Running tests..."
        
        # Backend tests
        log_info "Running backend tests..."
        cd "$PROJECT_ROOT/behavior-management-backend"
        npm test || {
            log_error "Backend tests failed"
            exit 1
        }
        
        # Frontend tests
        log_info "Running frontend tests..."
        cd "$PROJECT_ROOT/behavior_system"
        npm test -- --watchAll=false || {
            log_error "Frontend tests failed"
            exit 1
        }
        
        log_success "All tests passed"
    fi
}

# Build Docker images
build_images() {
    if [[ "$BUILD_IMAGES" == "true" ]]; then
        log_info "Building Docker images..."
        
        # Build backend image
        log_info "Building backend image..."
        cd "$PROJECT_ROOT/behavior-management-backend"
        docker build -t behavior-management-backend:latest . || {
            log_error "Failed to build backend image"
            exit 1
        }
        
        # Build frontend image
        log_info "Building frontend image..."
        cd "$PROJECT_ROOT/behavior_system"
        docker build -t behavior-management-frontend:latest . || {
            log_error "Failed to build frontend image"
            exit 1
        }
        
        log_success "Docker images built successfully"
    fi
}

# Deploy to Docker
deploy_docker() {
    log_info "Deploying to Docker..."
    
    cd "$PROJECT_ROOT"
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose down || true
    
    # Start services
    log_info "Starting services..."
    if [[ "$ENVIRONMENT" == "development" ]]; then
        docker-compose up -d --profile development
    else
        docker-compose up -d --profile production
    fi
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    log_info "Checking service health..."
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_success "Docker deployment completed successfully"
}

# Deploy to AWS
deploy_aws() {
    log_info "Deploying to AWS..."
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Terraform is available
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed or not in PATH"
        exit 1
    fi
    
    cd "$PROJECT_ROOT/terraform/aws"
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init || {
        log_error "Terraform initialization failed"
        exit 1
    }
    
    # Plan deployment
    log_info "Planning deployment..."
    terraform plan -var-file="environments/$ENVIRONMENT.tfvars" || {
        log_error "Terraform plan failed"
        exit 1
    }
    
    # Apply deployment
    log_info "Applying deployment..."
    terraform apply -var-file="environments/$ENVIRONMENT.tfvars" -auto-approve || {
        log_error "Terraform apply failed"
        exit 1
    }
    
    log_success "AWS deployment completed successfully"
}

# Deploy to GCP
deploy_gcp() {
    log_info "Deploying to GCP..."
    log_warning "GCP deployment not yet implemented"
    # TODO: Implement GCP deployment
}

# Deploy to Azure
deploy_azure() {
    log_info "Deploying to Azure..."
    log_warning "Azure deployment not yet implemented"
    # TODO: Implement Azure deployment
}

# Clean up resources
cleanup() {
    if [[ "$CLEAN_UP" == "true" ]]; then
        log_info "Cleaning up resources..."
        
        case $PROVIDER in
            docker)
                cd "$PROJECT_ROOT"
                docker-compose down -v --remove-orphans
                docker system prune -f
                ;;
            aws)
                cd "$PROJECT_ROOT/terraform/aws"
                terraform destroy -var-file="environments/$ENVIRONMENT.tfvars" -auto-approve
                ;;
            *)
                log_warning "Cleanup not implemented for provider: $PROVIDER"
                ;;
        esac
        
        log_success "Cleanup completed"
    fi
}

# Main deployment function
main() {
    pre_deployment_checks
    run_tests
    build_images
    
    case $PROVIDER in
        docker)
            deploy_docker
            ;;
        aws)
            deploy_aws
            ;;
        gcp)
            deploy_gcp
            ;;
        azure)
            deploy_azure
            ;;
    esac
    
    cleanup
    
    log_success "Deployment completed successfully!"
    
    # Show service URLs
    case $PROVIDER in
        docker)
            echo ""
            log_info "Service URLs:"
            echo "  Frontend: http://localhost:3000"
            echo "  Backend API: http://localhost:3001"
            echo "  Health Check: http://localhost:3001/health"
            echo "  Metrics: http://localhost:3001/metrics"
            ;;
        aws)
            echo ""
            log_info "Service URLs:"
            echo "  Application: https://$(terraform output -raw domain_name)"
            echo "  Health Check: https://$(terraform output -raw domain_name)/health"
            echo "  Metrics: https://$(terraform output -raw domain_name)/metrics"
            ;;
    esac
}

# Run main function
main "$@" 