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
  ENABLE_BULK_UPLOAD: 'true'
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
  const numericVars = ['BCRYPT_ROUNDS', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS', 'MAX_FILE_SIZE'];
  numericVars.forEach(varName => {
    const value = process.env[varName] || optionalEnvVarsWithDefaults[varName];
    if (isNaN(parseInt(value))) {
      errors.push(`${varName} must be a valid number`);
    }
  });

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

// Log configuration in development
if (config.IS_DEVELOPMENT) {
  console.log('🔧 Environment Configuration:');
  console.log(`  - NODE_ENV: ${config.NODE_ENV}`);
  console.log(`  - PORT: ${config.PORT}`);
  console.log(`  - DATABASE_URL: ${config.DATABASE_URL}`);
  console.log(`  - JWT_SECRET: ${config.JWT_SECRET ? '***SET***' : '❌ NOT SET'}`);
  console.log(`  - FRONTEND_URL: ${config.FRONTEND_URL}`);
  console.log(`  - Feature Flags: Analytics(${config.ENABLE_ANALYTICS}), Email(${config.ENABLE_EMAIL_NOTIFICATIONS}), Upload(${config.ENABLE_BULK_UPLOAD})`);
  console.log('');
}

module.exports = config; 