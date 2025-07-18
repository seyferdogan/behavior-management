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

const app = express();

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
const corsOrigins = [
  config.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  ...config.ALLOWED_ORIGINS
].filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Behavior Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

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