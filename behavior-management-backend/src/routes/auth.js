const express = require('express');
const router = express.Router();
const { 
  generateToken, 
  comparePassword, 
  getUserByEmail, 
  createUser,
  isAccountLocked,
  handleFailedLogin,
  resetLoginAttempts,
  validateEmail,
  validatePassword,
  generateResetToken
} = require('../utils/auth');
const { authenticate, requireAdmin, auditLog } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', auditLog('user_login'), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid email format'
      });
    }
    
    // Get user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is locked
    const isLocked = await isAccountLocked(user.id);
    if (isLocked) {
      return res.status(423).json({
        error: 'Account locked',
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Account is deactivated'
      });
    }
    
    // Check if school is active
    if (!user.school.isActive) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'School account is inactive'
      });
    }
    
    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      // Handle failed login attempt
      await handleFailedLogin(user.id);
      
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }
    
    // Reset login attempts on successful login
    await resetLoginAttempts(user.id);
    
    // Generate token
    const token = generateToken(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
});

/**
 * POST /api/auth/register
 * Create new user (admin only)
 */
router.post('/register', authenticate, requireAdmin, auditLog('user_register'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, schoolId } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, password, firstName, lastName, and role are required'
      });
    }
    
    // Use requesting user's school if not specified (non-admins)
    const targetSchoolId = schoolId || req.user.schoolId;
    
    // Create user
    const newUser = await createUser({
      email,
      password,
      firstName,
      lastName,
      role,
      schoolId: targetSchoolId
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }
    
    if (error.message.includes('Password') || error.message.includes('email')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during registration'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while fetching user information'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (optional - mainly for audit logging)
 */
router.post('/logout', authenticate, auditLog('user_logout'), async (req, res) => {
  try {
    // In a more advanced implementation, you might want to:
    // - Add the token to a blacklist
    // - Update last logout time in database
    // - Clear any server-side sessions
    
    res.json({
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticate, auditLog('password_change'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Current password and new password are required'
      });
    }
    
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, password: true }
    });
    
    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Current password is incorrect'
      });
    }
    
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Validation error',
        message: passwordValidation.errors.join(', ')
      });
    }
    
    // Hash and update password
    const { hashPassword } = require('../utils/auth');
    const hashedNewPassword = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });
    
    res.json({
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while changing password'
    });
  }
});

/**
 * POST /api/auth/request-password-reset
 * Request password reset (for future implementation)
 */
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Valid email is required'
      });
    }
    
    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent'
    });
    
    // TODO: Implement email sending logic
    // For now, just log the reset token
    const user = await getUserByEmail(email);
    if (user && user.isActive) {
      const resetToken = generateResetToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires
        }
      });
      
      console.log(`🔑 Password reset token for ${email}: ${resetToken}`);
    }
    
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while processing password reset request'
    });
  }
});

/**
 * GET /api/auth/verify-token
 * Verify if token is valid (for frontend token validation)
 */
router.get('/verify-token', authenticate, async (req, res) => {
  try {
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        schoolId: req.user.schoolId
      }
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Token validation failed'
    });
  }
});

module.exports = router; 