const path = require('path');

// Load environment variables with specific path
require('dotenv').config({ 
  path: path.resolve(process.cwd(), '.env') 
});

/**
 * Environment Configuration with Validation
 * Ensures all required environment variables are present and properly typed
 */

const requiredEnvVars = [
  'JWT_SECRET'
];

const optionalEnvVarsWithDefaults = {
  NODE_ENV: 'development',
  PORT: '5000',
  FRONTEND_URL: 'http://localhost:3000',
  DATABASE_URL: 'file:./prisma/dev.db',
  JWT_EXPIRY: '24h',
  BCRYPT_ROUNDS: '12',
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: '1000',
  MAX_FILE_SIZE: '10485760', // 10MB
  LOG_LEVEL: 'info',
  DEFAULT_SCHOOL_NAME: 'Sample School',
  DEFAULT_ACADEMIC_YEAR: '2024-2025',
  ENABLE_EMAIL_NOTIFICATIONS: 'false',
  ENABLE_ANALYTICS: 'true',
  ENABLE_BULK_UPLOAD: 'true',
  
  // PostgreSQL Configuration
  DB_TYPE: 'sqlite', // sqlite | postgresql
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'postgres',
  DB_PASSWORD: '',
  DB_NAME: 'behavior_management',
  DB_SCHEMA: 'public',
  DB_SSL: 'false',
  DB_POOL_MIN: '2',
  DB_POOL_MAX: '10',
  DB_TIMEOUT: '30000',
  DB_BACKUP_ENABLED: 'true',
  DB_BACKUP_SCHEDULE: '0 2 * * *' // Daily at 2 AM
};

/**
 * Validates and processes environment variables
 */
function validateEnvironment() {
  const errors = [];
  
  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Validate NODE_ENV
  const validNodeEnvs = ['development', 'production', 'test'];
  const nodeEnv = process.env.NODE_ENV || optionalEnvVarsWithDefaults.NODE_ENV;
  if (!validNodeEnvs.includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of: ${validNodeEnvs.join(', ')}`);
  }

  // Validate PORT
  const port = parseInt(process.env.PORT || optionalEnvVarsWithDefaults.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid number between 1 and 65535');
  }

  // Validate JWT_SECRET strength in production
  if (nodeEnv === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long in production');
    }
  }

  // Validate numeric values
  const numericVars = ['BCRYPT_ROUNDS', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS', 'MAX_FILE_SIZE', 'DB_PORT', 'DB_POOL_MIN', 'DB_POOL_MAX', 'DB_TIMEOUT'];
  numericVars.forEach(varName => {
    const value = process.env[varName] || optionalEnvVarsWithDefaults[varName];
    if (isNaN(parseInt(value))) {
      errors.push(`${varName} must be a valid number`);
    }
  });

  // Validate DB_TYPE
  const dbType = getEnvVar('DB_TYPE');
  if (!['sqlite', 'postgresql'].includes(dbType)) {
    errors.push('DB_TYPE must be either "sqlite" or "postgresql"');
  }

  // Validate PostgreSQL requirements in production
  if (nodeEnv === 'production' && dbType === 'postgresql') {
    const requiredPostgresVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    requiredPostgresVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`${varName} is required for PostgreSQL in production`);
      }
    });
  }

  // Validate pool settings
  const poolMin = parseInt(getEnvVar('DB_POOL_MIN'));
  const poolMax = parseInt(getEnvVar('DB_POOL_MAX'));
  if (poolMin >= poolMax) {
    errors.push('DB_POOL_MIN must be less than DB_POOL_MAX');
  }

  if (errors.length > 0) {
    console.error('❌ Environment configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    
    // In production, exit immediately. In development, show warnings but continue
    if (nodeEnv === 'production') {
      console.error('\n🚨 Cannot start application with invalid environment configuration in production mode.');
      process.exit(1);
    } else {
      console.warn('\n⚠️  Continuing in development mode with warnings...\n');
    }
  }
}

/**
 * Get environment variable with default fallback
 */
function getEnvVar(name, defaultValue = undefined) {
  return process.env[name] || optionalEnvVarsWithDefaults[name] || defaultValue;
}

/**
 * Get boolean environment variable
 */
function getBooleanEnvVar(name, defaultValue = false) {
  const value = getEnvVar(name, defaultValue.toString());
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Get numeric environment variable
 */
function getNumericEnvVar(name, defaultValue = 0) {
  const value = getEnvVar(name, defaultValue.toString());
  return parseInt(value) || defaultValue;
}

// Validate environment on module load
validateEnvironment();

/**
 * Environment Configuration Object
 */
const config = {
  // Environment
  NODE_ENV: getEnvVar('NODE_ENV'),
  IS_PRODUCTION: getEnvVar('NODE_ENV') === 'production',
  IS_DEVELOPMENT: getEnvVar('NODE_ENV') === 'development',
  IS_TEST: getEnvVar('NODE_ENV') === 'test',

  // Server
  PORT: getNumericEnvVar('PORT'),
  FRONTEND_URL: getEnvVar('FRONTEND_URL'),
  
  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  DB_TYPE: getEnvVar('DB_TYPE'),
  DB_HOST: getEnvVar('DB_HOST'),
  DB_PORT: getNumericEnvVar('DB_PORT'),
  DB_USER: getEnvVar('DB_USER'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD'),
  DB_NAME: getEnvVar('DB_NAME'),
  DB_SCHEMA: getEnvVar('DB_SCHEMA'),
  DB_SSL: getBooleanEnvVar('DB_SSL'),
  DB_POOL_MIN: getNumericEnvVar('DB_POOL_MIN'),
  DB_POOL_MAX: getNumericEnvVar('DB_POOL_MAX'),
  DB_TIMEOUT: getNumericEnvVar('DB_TIMEOUT'),
  DB_BACKUP_ENABLED: getBooleanEnvVar('DB_BACKUP_ENABLED'),
  DB_BACKUP_SCHEDULE: getEnvVar('DB_BACKUP_SCHEDULE'),
  
  // Authentication & Security
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRY: getEnvVar('JWT_EXPIRY'),
  BCRYPT_ROUNDS: getNumericEnvVar('BCRYPT_ROUNDS'),
  
  // CORS
  ALLOWED_ORIGINS: getEnvVar('ALLOWED_ORIGINS', '').split(',').filter(Boolean),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: getNumericEnvVar('RATE_LIMIT_WINDOW_MS'),
  RATE_LIMIT_MAX_REQUESTS: getNumericEnvVar('RATE_LIMIT_MAX_REQUESTS'),
  
  // File Upload
  MAX_FILE_SIZE: getNumericEnvVar('MAX_FILE_SIZE'),
  UPLOAD_PATH: getEnvVar('UPLOAD_PATH', './uploads'),
  
  // Logging
  LOG_LEVEL: getEnvVar('LOG_LEVEL'),
  LOG_FILE: getEnvVar('LOG_FILE', './logs/app.log'),
  
  // School Configuration
  DEFAULT_SCHOOL_NAME: getEnvVar('DEFAULT_SCHOOL_NAME'),
  DEFAULT_ACADEMIC_YEAR: getEnvVar('DEFAULT_ACADEMIC_YEAR'),
  
  // Feature Flags
  ENABLE_EMAIL_NOTIFICATIONS: getBooleanEnvVar('ENABLE_EMAIL_NOTIFICATIONS'),
  ENABLE_ANALYTICS: getBooleanEnvVar('ENABLE_ANALYTICS'),
  ENABLE_BULK_UPLOAD: getBooleanEnvVar('ENABLE_BULK_UPLOAD'),
  
  // Email (when enabled)
  SMTP: {
    HOST: getEnvVar('SMTP_HOST'),
    PORT: getNumericEnvVar('SMTP_PORT', 587),
    SECURE: getBooleanEnvVar('SMTP_SECURE'),
    USER: getEnvVar('SMTP_USER'),
    PASS: getEnvVar('SMTP_PASS')
  }
};

/**
 * Generate PostgreSQL connection URL from individual components
 */
function generatePostgreSQLUrl() {
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, DB_SSL, DB_SCHEMA } = config;
  
  let url = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  
  const params = [];
  if (DB_SSL) {
    params.push('sslmode=require');
  }
  if (DB_SCHEMA && DB_SCHEMA !== 'public') {
    params.push(`schema=${DB_SCHEMA}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  return url;
}

/**
 * Get the appropriate database URL based on DB_TYPE
 */
function getDatabaseUrl() {
  if (config.DB_TYPE === 'postgresql') {
    return generatePostgreSQLUrl();
  }
  return config.DATABASE_URL; // SQLite fallback
}

// Override DATABASE_URL with generated PostgreSQL URL if needed
if (config.DB_TYPE === 'postgresql') {
  config.DATABASE_URL = getDatabaseUrl();
}

// Log configuration in development
if (config.IS_DEVELOPMENT) {
  console.log('🔧 Environment Configuration:');
  console.log(`  - NODE_ENV: ${config.NODE_ENV}`);
  console.log(`  - PORT: ${config.PORT}`);
  console.log(`  - DB_TYPE: ${config.DB_TYPE}`);
  
  if (config.DB_TYPE === 'postgresql') {
    console.log(`  - DB_HOST: ${config.DB_HOST}:${config.DB_PORT}`);
    console.log(`  - DB_NAME: ${config.DB_NAME}`);
    console.log(`  - DB_USER: ${config.DB_USER}`);
    console.log(`  - DB_PASSWORD: ${config.DB_PASSWORD ? '***SET***' : '❌ NOT SET'}`);
    console.log(`  - DB_POOL: ${config.DB_POOL_MIN}-${config.DB_POOL_MAX} connections`);
    console.log(`  - DB_SSL: ${config.DB_SSL}`);
  } else {
    console.log(`  - DATABASE_URL: ${config.DATABASE_URL}`);
  }
  
  console.log(`  - JWT_SECRET: ${config.JWT_SECRET ? '***SET***' : '❌ NOT SET'}`);
  console.log(`  - FRONTEND_URL: ${config.FRONTEND_URL}`);
  console.log(`  - Feature Flags: Analytics(${config.ENABLE_ANALYTICS}), Email(${config.ENABLE_EMAIL_NOTIFICATIONS}), Upload(${config.ENABLE_BULK_UPLOAD})`);
  console.log('');
}

module.exports = config; 