const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (will be restricted to admin later)
router.post('/register', async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      message: 'User registration endpoint - coming soon',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User login endpoint - coming soon',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 