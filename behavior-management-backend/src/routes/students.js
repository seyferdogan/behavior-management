const express = require('express');
const { getPrismaClient } = require('../utils/database');

const router = express.Router();
const prisma = getPrismaClient();

// GET /api/students - Get all students
router.get('/', async (req, res) => {
  try {
    const { grade, search } = req.query;
    
    let whereClause = {
      isActive: true
    };

    // Filter by grade if provided
    if (grade) {
      whereClause.grade = grade;
    }

    // Search by name if provided
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } }
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: [
        { grade: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    // Transform data to match frontend expectations
    const formattedStudents = students.map(student => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      isActive: student.isActive
    }));

    res.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/:id - Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        incidents: {
          include: {
            reporter: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { dateOccurred: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Format response
    const formattedStudent = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      isActive: student.isActive,
      incidents: student.incidents.map(incident => ({
        id: incident.id,
        incidentType: incident.incidentType,
        severity: incident.severity,
        location: incident.location,
        description: incident.description,
        actionTaken: incident.actionTaken,
        dateOccurred: incident.dateOccurred,
        timeOccurred: incident.timeOccurred,
        pointsAssigned: incident.pointsAssigned,
        reporterName: `${incident.reporter.firstName} ${incident.reporter.lastName}`
      }))
    };

    res.json(formattedStudent);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// POST /api/students - Create new student
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, grade, schoolId } = req.body;

    // Validation
    if (!firstName || !lastName || !grade) {
      return res.status(400).json({ 
        error: 'First name, last name, and grade are required' 
      });
    }

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName,
        grade,
        schoolId: schoolId || 'default-school-id', // TODO: Get from auth context
        isActive: true
      }
    });

    // Format response
    const formattedStudent = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      isActive: student.isActive
    };

    res.status(201).json(formattedStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, grade, isActive } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName,
        lastName,
        grade,
        isActive
      }
    });

    // Format response
    const formattedStudent = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      isActive: student.isActive
    };

    res.json(formattedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:id - Deactivate student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    await prisma.student.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Student deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating student:', error);
    res.status(500).json({ error: 'Failed to deactivate student' });
  }
});

module.exports = router; 