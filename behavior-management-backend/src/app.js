const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import environment configuration (handles dotenv internally)
const config = require('./config/env');

// Import routes (we'll create these next)
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const incidentRoutes = require('./routes/incidents');
const analyticsRoutes = require('./routes/analytics');
const staffRoutes = require('./routes/staff');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { 
  requestTracker, 
  healthCheck, 
  detailedHealthCheck, 
  getMetrics, 
  getPrometheusMetrics 
} = require('./middleware/monitoring');

const app = express();

// Trust proxy when behind reverse proxy (Nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting - configuration from environment
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
  }
});
app.use(limiter);

// CORS configuration - dynamic origins from environment
const corsOriginsRaw = [
  config.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  ...config.ALLOWED_ORIGINS
].filter(Boolean);
const corsOrigins = Array.from(new Set(corsOriginsRaw));

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Request tracking middleware
app.use(requestTracker);

// Logging middleware
app.use(morgan('combined'));

// Health check endpoints
app.get('/health', healthCheck);
app.get('/health/detailed', detailedHealthCheck);

// Metrics endpoints
app.get('/metrics', getMetrics);
app.get('/metrics/prometheus', getPrometheusMetrics);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/staff', staffRoutes);

// 404 handler - handles all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
  console.log(`📊 Health check: http://localhost:${config.PORT}/health`);
  console.log(`🔗 Frontend URL: ${config.FRONTEND_URL}`);
  console.log(`🌍 Environment: ${config.NODE_ENV}`);
  console.log(`🗄️  Database: ${config.DATABASE_URL}`);
  
  if (config.IS_DEVELOPMENT) {
    console.log(`🎯 CORS Origins: ${corsOrigins.join(', ')}`);
  }
});

module.exports = app; 