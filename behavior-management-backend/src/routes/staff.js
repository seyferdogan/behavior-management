const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../utils/database');

const prisma = getPrismaClient();

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
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    const normalized = staff.map(u => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role
    }));

    res.json(normalized);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staff'
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

    res.json({
      id: staff.id,
      name: `${staff.firstName} ${staff.lastName}`,
      email: staff.email,
      role: staff.role,
      createdAt: staff.createdAt
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staff member'
    });
  }
});

module.exports = router; 