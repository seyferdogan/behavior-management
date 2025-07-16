const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/staff - Get all staff members
router.get('/', async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ['TEACHER', 'ADMIN']
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staff', 
      message: error.message 
    });
  }
});

// GET /api/staff/:id - Get specific staff member
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await prisma.user.findUnique({
      where: {
        id: parseInt(id)
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staff member', 
      message: error.message 
    });
  }
});

module.exports = router; 