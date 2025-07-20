const config = require('../config/env');

/**
 * Monitoring and Health Check Middleware
 * Provides application metrics, performance tracking, and health monitoring
 */

// In-memory metrics storage (in production, use Redis or external service)
const metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byEndpoint: {},
    byStatus: {}
  },
  performance: {
    responseTimes: [],
    errors: []
  },
  system: {
    startTime: Date.now(),
    uptime: 0,
    memory: {},
    cpu: {}
  }
};

/**
 * Update system metrics
 */
function updateSystemMetrics() {
  const memUsage = process.memoryUsage();
  metrics.system.uptime = process.uptime();
  metrics.system.memory = {
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024) // MB
  };
}

/**
 * Request tracking middleware
 */
function requestTracker(req, res, next) {
  const startTime = Date.now();
  
  // Track request
  metrics.requests.total++;
  
  // Track by method
  const method = req.method;
  metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;
  
  // Track by endpoint
  const endpoint = req.route ? req.route.path : req.path;
  metrics.requests.byEndpoint[endpoint] = (metrics.requests.byEndpoint[endpoint] || 0) + 1;
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    
    // Track by status
    metrics.requests.byStatus[status] = (metrics.requests.byStatus[status] || 0) + 1;
    
    // Track response time
    metrics.performance.responseTimes.push(duration);
    
    // Keep only last 1000 response times
    if (metrics.performance.responseTimes.length > 1000) {
      metrics.performance.responseTimes.shift();
    }
    
    // Track errors
    if (status >= 400) {
      metrics.performance.errors.push({
        timestamp: new Date().toISOString(),
        method,
        endpoint,
        status,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      
      // Keep only last 100 errors
      if (metrics.performance.errors.length > 100) {
        metrics.performance.errors.shift();
      }
    }
  });
  
  next();
}

/**
 * Health check endpoint
 */
function healthCheck(req, res) {
  updateSystemMetrics();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: metrics.system.uptime,
    memory: metrics.system.memory,
    database: {
      type: config.DB_TYPE,
      connected: true // This would be checked against actual DB connection
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: config.NODE_ENV
  };
  
  res.status(200).json(health);
}

/**
 * Detailed health check with database connectivity
 */
async function detailedHealthCheck(req, res) {
  try {
    updateSystemMetrics();
    
    // Test database connection
    const { testConnection } = require('../utils/database');
    const dbHealth = await testConnection();
    
    const health = {
      status: dbHealth.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.system.uptime,
      memory: metrics.system.memory,
      database: {
        type: config.DB_TYPE,
        connected: dbHealth.success,
        error: dbHealth.error || null
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: config.NODE_ENV,
      features: {
        analytics: config.ENABLE_ANALYTICS,
        email: config.ENABLE_EMAIL_NOTIFICATIONS,
        upload: config.ENABLE_BULK_UPLOAD
      }
    };
    
    const statusCode = dbHealth.success ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

/**
 * Metrics endpoint
 */
function getMetrics(req, res) {
  updateSystemMetrics();
  
  // Calculate response time statistics
  const responseTimes = metrics.performance.responseTimes;
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;
  
  const sortedTimes = [...responseTimes].sort((a, b) => a - b);
  const p95ResponseTime = sortedTimes.length > 0 
    ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] 
    : 0;
  
  const p99ResponseTime = sortedTimes.length > 0 
    ? sortedTimes[Math.floor(sortedTimes.length * 0.99)] 
    : 0;
  
  const metricsData = {
    requests: {
      total: metrics.requests.total,
      byMethod: metrics.requests.byMethod,
      byEndpoint: metrics.requests.byEndpoint,
      byStatus: metrics.requests.byStatus
    },
    performance: {
      responseTimes: {
        average: Math.round(avgResponseTime),
        p95: Math.round(p95ResponseTime),
        p99: Math.round(p99ResponseTime),
        min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        count: responseTimes.length
      },
      errors: {
        count: metrics.performance.errors.length,
        recent: metrics.performance.errors.slice(-10)
      }
    },
    system: metrics.system
  };
  
  res.json(metricsData);
}

/**
 * Prometheus metrics format
 */
function getPrometheusMetrics(req, res) {
  updateSystemMetrics();
  
  let prometheusMetrics = '';
  
  // System metrics
  prometheusMetrics += `# HELP behavior_management_uptime_seconds Application uptime in seconds\n`;
  prometheusMetrics += `# TYPE behavior_management_uptime_seconds gauge\n`;
  prometheusMetrics += `behavior_management_uptime_seconds ${metrics.system.uptime}\n\n`;
  
  prometheusMetrics += `# HELP behavior_management_memory_rss_bytes Resident set size in bytes\n`;
  prometheusMetrics += `# TYPE behavior_management_memory_rss_bytes gauge\n`;
  prometheusMetrics += `behavior_management_memory_rss_bytes ${metrics.system.memory.rss * 1024 * 1024}\n\n`;
  
  prometheusMetrics += `# HELP behavior_management_memory_heap_used_bytes Heap memory used in bytes\n`;
  prometheusMetrics += `# TYPE behavior_management_memory_heap_used_bytes gauge\n`;
  prometheusMetrics += `behavior_management_memory_heap_used_bytes ${metrics.system.memory.heapUsed * 1024 * 1024}\n\n`;
  
  // Request metrics
  prometheusMetrics += `# HELP behavior_management_requests_total Total number of requests\n`;
  prometheusMetrics += `# TYPE behavior_management_requests_total counter\n`;
  prometheusMetrics += `behavior_management_requests_total ${metrics.requests.total}\n\n`;
  
  // Method metrics
  Object.entries(metrics.requests.byMethod).forEach(([method, count]) => {
    prometheusMetrics += `# HELP behavior_management_requests_by_method_total Total requests by HTTP method\n`;
    prometheusMetrics += `# TYPE behavior_management_requests_by_method_total counter\n`;
    prometheusMetrics += `behavior_management_requests_by_method_total{method="${method}"} ${count}\n\n`;
  });
  
  // Status metrics
  Object.entries(metrics.requests.byStatus).forEach(([status, count]) => {
    prometheusMetrics += `# HELP behavior_management_requests_by_status_total Total requests by HTTP status\n`;
    prometheusMetrics += `# TYPE behavior_management_requests_by_status_total counter\n`;
    prometheusMetrics += `behavior_management_requests_by_status_total{status="${status}"} ${count}\n\n`;
  });
  
  // Response time metrics
  if (metrics.performance.responseTimes.length > 0) {
    const avgResponseTime = metrics.performance.responseTimes.reduce((a, b) => a + b, 0) / metrics.performance.responseTimes.length;
    prometheusMetrics += `# HELP behavior_management_response_time_average_ms Average response time in milliseconds\n`;
    prometheusMetrics += `# TYPE behavior_management_response_time_average_ms gauge\n`;
    prometheusMetrics += `behavior_management_response_time_average_ms ${Math.round(avgResponseTime)}\n\n`;
  }
  
  // Error metrics
  prometheusMetrics += `# HELP behavior_management_errors_total Total number of errors\n`;
  prometheusMetrics += `# TYPE behavior_management_errors_total counter\n`;
  prometheusMetrics += `behavior_management_errors_total ${metrics.performance.errors.length}\n\n`;
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
}

/**
 * Reset metrics (for testing)
 */
function resetMetrics(req, res) {
  if (config.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Metrics reset not allowed in production' });
  }
  
  metrics.requests = {
    total: 0,
    byMethod: {},
    byEndpoint: {},
    byStatus: {}
  };
  
  metrics.performance = {
    responseTimes: [],
    errors: []
  };
  
  res.json({ message: 'Metrics reset successfully' });
}

module.exports = {
  requestTracker,
  healthCheck,
  detailedHealthCheck,
  getMetrics,
  getPrometheusMetrics,
  resetMetrics,
  metrics
}; 