const { verifyToken, getUserById, hasRole, canAccessSchoolResource } = require('../utils/auth');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No authorization header provided'
      });
    }
    
    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7)
      : authHeader;
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get current user info from database
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is deactivated'
      });
    }
    
    if (!user.school?.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'School account is inactive'
      });
    }
    
    // Attach user info to request
    req.user = user;
    req.token = token;
    
    next();
    
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Handle specific JWT errors
    if (error.message.includes('expired')) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    if (error.message.includes('invalid') || error.message.includes('malformed')) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please log in again'
      });
    }
    
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Please log in again'
    });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in first'
      });
    }
    
    if (!hasRole(req.user.role, requiredRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `${requiredRole} role or higher required`
      });
    }
    
    next();
  };
};

/**
 * School resource access middleware
 * Ensures user can only access resources from their school (unless admin)
 */
const requireSchoolAccess = (requiredRole = 'STAFF') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in first'
      });
    }
    
    // Get school ID from request (params, body, or query)
    const resourceSchoolId = req.params.schoolId || 
                           req.body.schoolId || 
                           req.query.schoolId ||
                           req.user.schoolId; // Default to user's school
    
    if (!canAccessSchoolResource(req.user, resourceSchoolId, requiredRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Cannot access resources from this school'
      });
    }
    
    // Attach school ID to request for convenience
    req.schoolId = resourceSchoolId;
    
    next();
  };
};

/**
 * Admin only middleware
 */
const requireAdmin = requireRole('ADMIN');

/**
 * Principal or higher middleware
 */
const requirePrincipal = requireRole('PRINCIPAL');

/**
 * Teacher or higher middleware
 */
const requireTeacher = requireRole('TEACHER');

/**
 * Optional authentication middleware
 * Attaches user info if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7)
      : authHeader;
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    const user = await getUserById(decoded.userId);
    
    if (user && user.isActive && user.school?.isActive) {
      req.user = user;
      req.token = token;
    }
    
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }
  
  next();
};

/**
 * Rate limiting based on user role
 */
const roleBasedRateLimit = (req, res, next) => {
  // Add role info to rate limiter key for different limits per role
  if (req.user) {
    req.rateLimitKey = `${req.ip}-${req.user.role}`;
  } else {
    req.rateLimitKey = `${req.ip}-guest`;
  }
  
  next();
};

/**
 * Audit logging middleware
 * Logs important actions for security auditing
 */
const auditLog = (action) => {
  return (req, res, next) => {
    // Store audit info in request for later logging
    req.auditLog = {
      action,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      schoolId: req.user?.schoolId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    // Log after response is sent
    const originalSend = res.send;
    res.send = function(data) {
      // Log the audit entry
      console.log('🔍 Audit Log:', {
        ...req.auditLog,
        statusCode: res.statusCode,
        success: res.statusCode < 400
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
  requireSchoolAccess,
  requireAdmin,
  requirePrincipal,
  requireTeacher,
  optionalAuth,
  roleBasedRateLimit,
  auditLog
}; 