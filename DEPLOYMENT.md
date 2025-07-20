# 🚀 Behavior Management System - Deployment Guide

This guide covers deploying the Behavior Management System to various environments and cloud providers.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Tools
- **Docker & Docker Compose** - For containerized deployment
- **Node.js 18+** - For local development and testing
- **Git** - For version control

### Optional Tools (for cloud deployment)
- **AWS CLI** - For AWS deployment
- **Terraform** - For infrastructure as code
- **kubectl** - For Kubernetes deployment

### System Requirements
- **Minimum**: 4GB RAM, 2 CPU cores
- **Recommended**: 8GB RAM, 4 CPU cores
- **Storage**: 20GB available space

## ⚡ Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd behavior-management-system
```

### 2. Environment Setup
```bash
# Copy environment templates
cp behavior-management-backend/.env.example behavior-management-backend/.env
cp behavior_system/.env.example behavior_system/.env

# Edit configuration files
nano behavior-management-backend/.env
nano behavior_system/.env
```

### 3. Database Setup
```bash
cd behavior-management-backend
npm install
npm run db:setup
npm run db:migrate
npm run db:seed
```

### 4. Deploy with Docker
```bash
# From project root
./scripts/deploy.sh -e development -p docker -b
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Metrics**: http://localhost:3001/metrics

## 🌍 Environment Configuration

### Development Environment
```bash
# Use SQLite for development
DB_TYPE=sqlite
DATABASE_URL=file:./prisma/dev.db
NODE_ENV=development
PORT=3001
```

### Production Environment
```bash
# Use PostgreSQL for production
DB_TYPE=postgresql
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=behavior_management
NODE_ENV=production
PORT=3001
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | Server port | `3001` | Yes |
| `DB_TYPE` | Database type | `sqlite` | Yes |
| `DATABASE_URL` | Database connection URL | `file:./dev.db` | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` | Yes |

## 🐳 Docker Deployment

### Local Development with Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Deployment
```bash
# Build and deploy
./scripts/deploy.sh -e production -p docker -b -t

# Or manually
docker-compose -f docker-compose.yml --profile production up -d
```

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3000 | React application |
| `backend` | 3001 | Node.js API |
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis cache |
| `nginx` | 80/443 | Reverse proxy (production) |

## ☁️ AWS Deployment

### Prerequisites
1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Terraform** installed
4. **Domain name** and SSL certificate

### 1. AWS Setup
```bash
# Configure AWS CLI
aws configure

# Create S3 bucket for Terraform state
aws s3 mb s3://behavior-management-terraform-state
```

### 2. Domain and SSL Setup
```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name your-domain.com \
  --validation-method DNS
```

### 3. Deploy Infrastructure
```bash
# Navigate to Terraform directory
cd terraform/aws

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="environments/production.tfvars"

# Apply deployment
terraform apply -var-file="environments/production.tfvars"
```

### 4. Deploy Application
```bash
# Build and push Docker images
./scripts/deploy.sh -e production -p aws -b -t
```

### AWS Architecture

```
Internet Gateway
    ↓
Application Load Balancer (HTTPS)
    ↓
ECS Fargate Cluster
├── Frontend Service (React)
└── Backend Service (Node.js)
    ↓
VPC with Private Subnets
├── RDS PostgreSQL
└── ElastiCache Redis
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- **Basic Health**: `GET /health`
- **Detailed Health**: `GET /health/detailed`
- **Metrics**: `GET /metrics`
- **Prometheus**: `GET /metrics/prometheus`

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 128,
    "heapUsed": 64,
    "heapTotal": 128
  },
  "database": {
    "type": "postgresql",
    "connected": true
  },
  "version": "1.0.0",
  "environment": "production"
}
```

### Metrics Dashboard
Access metrics at `/metrics` to view:
- Request counts by method and endpoint
- Response time statistics (avg, p95, p99)
- Error rates and recent errors
- System resource usage

### CloudWatch Integration (AWS)
- **Logs**: Automatic log aggregation
- **Metrics**: Custom application metrics
- **Alarms**: Automated alerting
- **Dashboards**: Real-time monitoring

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
npm run db:status

# Reset database
npm run db:reset

# Check logs
docker-compose logs postgres
```

#### 2. Port Conflicts
```bash
# Check what's using the port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

#### 3. Docker Issues
```bash
# Clean up Docker
docker system prune -a

# Rebuild images
docker-compose build --no-cache

# Check container logs
docker-compose logs <service-name>
```

#### 4. AWS Deployment Issues
```bash
# Check Terraform state
terraform show

# Destroy and recreate
terraform destroy
terraform apply

# Check ECS service logs
aws logs describe-log-groups
aws logs tail /ecs/behavior-management-backend
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_incidents_date ON incidents(created_at);
CREATE INDEX idx_incidents_student ON incidents(student_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
```

#### 2. Caching Strategy
```javascript
// Redis caching for frequently accessed data
const cacheKey = `student:${studentId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

#### 3. Load Balancing
- **Horizontal scaling** with multiple instances
- **Health checks** for automatic failover
- **Session management** with Redis

### Security Best Practices

#### 1. Environment Variables
```bash
# Use secrets management
aws secretsmanager create-secret --name jwt-secret --secret-string "your-secret"
```

#### 2. Network Security
```bash
# Restrict database access
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 5432 \
  --source-group sg-87654321
```

#### 3. SSL/TLS
```bash
# Force HTTPS redirect
# Configured in nginx.conf and ALB
```

## 📚 Additional Resources

### Documentation
- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- [Frontend Guide](./FRONTEND.md)

### Tools
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Container management
- [AWS Console](https://console.aws.amazon.com) - Cloud management

### Support
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

---

**Need Help?** Check the [Troubleshooting](#troubleshooting) section or create an issue on GitHub. 