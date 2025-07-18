# Environment Configuration Setup

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file** with your specific values:
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Required Configuration:**
   - Set a strong `JWT_SECRET` (especially for production)
   - Configure `DATABASE_URL` for your database
   - Set `FRONTEND_URL` to match your frontend

## Environment Variables Reference

### 🚀 Server Configuration
- `NODE_ENV` - Environment mode (development/production/test)
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - URL of your React frontend

### 🗄️ Database Configuration
- `DATABASE_URL` - Database connection string
  - Development: `file:./prisma/dev.db` (SQLite)
  - Production: `postgresql://user:pass@host:5432/db` (PostgreSQL)

### 🔐 Security Configuration
- `JWT_SECRET` - **REQUIRED** - Secret key for JWT tokens (min 32 chars in production)
- `JWT_EXPIRY` - Token expiration time (default: 24h)
- `BCRYPT_ROUNDS` - Password hashing strength (default: 12)

### 🌐 CORS Configuration
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

### ⚡ Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Time window in milliseconds (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 1000)

### 📧 Email Configuration (Optional)
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_SECURE` - Use SSL/TLS (true/false)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

### 🏫 School Configuration
- `DEFAULT_SCHOOL_NAME` - Default school name
- `DEFAULT_ACADEMIC_YEAR` - Current academic year

### 🎛️ Feature Flags
- `ENABLE_EMAIL_NOTIFICATIONS` - Enable email notifications (true/false)
- `ENABLE_ANALYTICS` - Enable analytics features (true/false)
- `ENABLE_BULK_UPLOAD` - Enable bulk upload features (true/false)

## Environment Validation

The system automatically validates your environment configuration on startup:

- ✅ **Development Mode**: Shows warnings but continues running
- ❌ **Production Mode**: Exits immediately if configuration is invalid

### Validation Rules

1. **JWT_SECRET** is required
2. **PORT** must be a valid number (1-65535)
3. In production, **JWT_SECRET** must be at least 32 characters
4. Numeric values must be valid numbers
5. **NODE_ENV** must be one of: development, production, test

## Example Configurations

### Development (SQLite)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=dev-secret-key-replace-in-production
FRONTEND_URL=http://localhost:3000
```

### Production (PostgreSQL)
```env
NODE_ENV=production
PORT=8000
DATABASE_URL="postgresql://user:password@db.example.com:5432/behavior_management"
JWT_SECRET=your-very-secure-32-character-plus-secret-key
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ENABLE_EMAIL_NOTIFICATIONS=true
SMTP_HOST=smtp.yourprovider.com
SMTP_USER=notifications@yourdomain.com
SMTP_PASS=your-smtp-password
```

## Testing Your Configuration

Run the server to test your configuration:

```bash
npm run dev
```

Look for the environment validation output:
- ✅ Green checkmarks indicate successful configuration
- ⚠️ Yellow warnings indicate non-critical issues
- ❌ Red errors indicate configuration problems

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (32+ characters) in production
3. **Rotate secrets regularly** in production environments
4. **Use environment-specific databases** (don't use dev DB in production)
5. **Enable HTTPS** in production
6. **Set restrictive CORS origins** in production
7. **Use environment variables** for all sensitive data

## Troubleshooting

### Common Issues

**JWT_SECRET not set:**
```
❌ Missing required environment variable: JWT_SECRET
```
**Solution:** Add `JWT_SECRET=your-secret-key` to your .env file

**Invalid PORT:**
```
❌ PORT must be a valid number between 1 and 65535
```
**Solution:** Set `PORT=5000` (or another valid port number)

**Weak JWT_SECRET in production:**
```
❌ JWT_SECRET must be at least 32 characters long in production
```
**Solution:** Use a stronger secret key with at least 32 characters 