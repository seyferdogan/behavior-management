const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const config = require('../config/env');

const prisma = new PrismaClient();

/**
 * Authentication Utilities
 */

/**
 * Generate JWT token for user
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    firstName: user.firstName,
    lastName: user.lastName
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRY,
    issuer: 'behavior-management-system',
    audience: 'behavior-management-client'
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'behavior-management-system',
      audience: 'behavior-management-client'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  return await bcrypt.hash(password, config.BCRYPT_ROUNDS);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate secure random token for password reset
 */
function generateResetToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if user account is locked due to failed login attempts
 */
async function isAccountLocked(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockoutUntil: true }
  });
  
  return user?.lockoutUntil && user.lockoutUntil > new Date();
}

/**
 * Handle failed login attempt - increment counter and potentially lock account
 */
async function handleFailedLogin(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginAttempts: true, lockoutUntil: true }
  });
  
  if (!user) return;
  
  const maxAttempts = 5;
  const lockoutDuration = 30 * 60 * 1000; // 30 minutes
  
  const newAttempts = user.loginAttempts + 1;
  const updateData = { loginAttempts: newAttempts };
  
  // If reached max attempts, lock the account
  if (newAttempts >= maxAttempts) {
    updateData.lockoutUntil = new Date(Date.now() + lockoutDuration);
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: updateData
  });
}

/**
 * Reset login attempts after successful login
 */
async function resetLoginAttempts(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date()
    }
  });
}

/**
 * Get user by email with security info
 */
async function getUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          domain: true,
          isActive: true
        }
      }
    }
  });
}

/**
 * Get user by ID (for token validation)
 */
async function getUserById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      schoolId: true,
      isActive: true,
      emailVerified: true,
      lastLogin: true,
      school: {
        select: {
          id: true,
          name: true,
          domain: true,
          isActive: true
        }
      }
    }
  });
}

/**
 * Create new user (admin only)
 */
async function createUser(userData) {
  const { email, password, firstName, lastName, role, schoolId } = userData;
  
  // Validate input
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join(', '));
  }
  
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role,
      schoolId,
      emailVerified: true // Auto-verify for admin created accounts
    },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          domain: true
        }
      }
    }
  });
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY = {
  ADMIN: 4,
  PRINCIPAL: 3,
  TEACHER: 2,
  STAFF: 1
};

/**
 * Check if user has required role or higher
 */
function hasRole(userRole, requiredRole) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user can access resource (same school or higher role)
 */
function canAccessSchoolResource(user, resourceSchoolId, requiredRole = 'STAFF') {
  // Admins can access any school
  if (user.role === 'ADMIN') {
    return true;
  }
  
  // Must be same school and have required role
  return user.schoolId === resourceSchoolId && hasRole(user.role, requiredRole);
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateResetToken,
  validatePassword,
  validateEmail,
  isAccountLocked,
  handleFailedLogin,
  resetLoginAttempts,
  getUserByEmail,
  getUserById,
  createUser,
  hasRole,
  canAccessSchoolResource,
  ROLE_HIERARCHY
}; 