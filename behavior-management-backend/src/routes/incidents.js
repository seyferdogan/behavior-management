const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Point values for different incident types (matching frontend constants)
const INCIDENT_POINTS = {
  "Disruptive Behaviour": 2,
  "Bullying": 2,
  "Disrespectful": 2,
  "Defiant": 1,
  "Uniform Breach": 1,
  "Defaming Peers": 1,
  "Mobile Phone Usage": 1,
  "Aggression": 2,
  "Dangerous Items": 2,
  "Assault": 2,
  "Vandalism": 1,
  "Not following instructions": 2,
  "Warning": 0,
  "Late": 1,
  "Referral": 0,
  "Physical": 10,
  "Meeting": 0,
  "Other": 1
};

// GET /api/incidents - Get all incidents
router.get('/', async (req, res) => {
  try {
    const { 
      studentId, 
      severity, 
      search, 
      startDate, 
      endDate, 
      limit = 100,
      offset = 0 
    } = req.query;
    
    let whereClause = {};

    // Filter by student
    if (studentId) {
      whereClause.studentId = studentId;
    }

    // Filter by severity
    if (severity && severity !== 'All') {
      whereClause.severity = severity.toUpperCase();
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.dateOccurred = {};
      if (startDate) {
        whereClause.dateOccurred.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.dateOccurred.lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { incidentType: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    const incidents = await prisma.incident.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true
          }
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { dateOccurred: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Transform data to match frontend expectations
    const formattedIncidents = incidents.map(incident => ({
      id: incident.id,
      studentName: `${incident.student.firstName} ${incident.student.lastName}`,
      studentId: incident.student.id,
      grade: incident.student.grade,
      date: incident.dateOccurred.toISOString().split('T')[0], // YYYY-MM-DD format
      time: incident.timeOccurred,
      location: incident.location,
      incident: incident.incidentType,
      severity: incident.severity.charAt(0) + incident.severity.slice(1).toLowerCase(), // Minor, Major, Severe
      description: incident.description,
      staffMember: `${incident.reporter.firstName} ${incident.reporter.lastName}`,
      actionTaken: incident.actionTaken,
      pointsAssigned: incident.pointsAssigned,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt
    }));

    res.json(formattedIncidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// GET /api/incidents/:id - Get incident by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            grade: true
          }
        },
        reporter: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Format response to match frontend expectations
    const formattedIncident = {
      id: incident.id,
      studentName: `${incident.student.firstName} ${incident.student.lastName}`,
      grade: incident.student.grade,
      date: incident.dateOccurred.toISOString().split('T')[0],
      time: incident.timeOccurred,
      location: incident.location,
      incident: incident.incidentType,
      severity: incident.severity.charAt(0) + incident.severity.slice(1).toLowerCase(),
      description: incident.description,
      staffMember: `${incident.reporter.firstName} ${incident.reporter.lastName}`,
      actionTaken: incident.actionTaken,
      pointsAssigned: incident.pointsAssigned,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt
    };

    res.json(formattedIncident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// POST /api/incidents - Create new incident
router.post('/', async (req, res) => {
  try {
    const { 
      studentName,
      grade,
      date,
      time,
      location,
      incident: incidentType,
      severity,
      description,
      staffMember,
      actionTaken
    } = req.body;

    // Validation
    if (!studentName || !incidentType || !staffMember) {
      return res.status(400).json({ 
        error: 'Student name, incident type, and staff member are required' 
      });
    }

    // Find student by name
    const nameParts = studentName.split(' ');
    const firstName = nameParts.slice(0, -1).join(' ');
    const lastName = nameParts[nameParts.length - 1];
    
    const student = await prisma.student.findFirst({
      where: {
        AND: [
          { firstName: { contains: firstName } },
          { lastName: { contains: lastName } }
        ]
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Find staff member by name
    const staffParts = staffMember.split(' ');
    const staffFirstName = staffParts.slice(0, -1).join(' ');
    const staffLastName = staffParts[staffParts.length - 1];
    
    const reporter = await prisma.user.findFirst({
      where: {
        AND: [
          { firstName: { contains: staffFirstName } },
          { lastName: { contains: staffLastName } }
        ]
      }
    });

    if (!reporter) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Calculate points
    const pointsAssigned = INCIDENT_POINTS[incidentType] || 0;

    // Create date with time
    const incidentDate = new Date(date || new Date().toISOString().split('T')[0]);
    if (time) {
      const [timePart, meridiem] = time.split(' ');
      const [hours, minutes] = timePart.split(':');
      let hour24 = parseInt(hours);
      
      if (meridiem === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (meridiem === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      incidentDate.setHours(hour24, parseInt(minutes), 0, 0);
    }

    // Map severity to enum values
    let severityEnum = 'MINOR';
    if (severity) {
      const sev = severity.toUpperCase();
      if (sev === 'MAJOR' || sev === 'MODERATE') {
        severityEnum = 'MAJOR';
      } else if (sev === 'SEVERE') {
        severityEnum = 'SEVERE';
      }
    }

    const newIncident = await prisma.incident.create({
      data: {
        studentId: student.id,
        reporterId: reporter.id,
        incidentType,
        severity: severityEnum,
        location: location || '',
        description: description || '',
        actionTaken: actionTaken || '',
        dateOccurred: incidentDate,
        timeOccurred: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pointsAssigned,
        schoolId: student.schoolId
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            grade: true
          }
        },
        reporter: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Format response to match frontend expectations
    const formattedIncident = {
      id: newIncident.id,
      studentName: `${newIncident.student.firstName} ${newIncident.student.lastName}`,
      grade: newIncident.student.grade,
      date: newIncident.dateOccurred.toISOString().split('T')[0],
      time: newIncident.timeOccurred,
      location: newIncident.location,
      incident: newIncident.incidentType,
      severity: newIncident.severity.charAt(0) + newIncident.severity.slice(1).toLowerCase(),
      description: newIncident.description,
      staffMember: `${newIncident.reporter.firstName} ${newIncident.reporter.lastName}`,
      actionTaken: newIncident.actionTaken,
      pointsAssigned: newIncident.pointsAssigned
    };

    res.status(201).json(formattedIncident);
  } catch (error) {
    console.error('🚨 DETAILED ERROR creating incident:', error);
    console.error('🚨 Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create incident', 
      message: error.message,
      details: error.stack
    });
  }
});

// PUT /api/incidents/:id - Update incident
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      incidentType,
      severity,
      location,
      description,
      actionTaken
    } = req.body;

    // Map severity to enum values
    let severityEnum = severity;
    if (severity) {
      const sev = severity.toUpperCase();
      if (sev === 'MAJOR' || sev === 'MODERATE') {
        severityEnum = 'MAJOR';
      } else if (sev === 'SEVERE') {
        severityEnum = 'SEVERE';
      } else {
        severityEnum = 'MINOR';
      }
    }

    // Calculate points if incident type changed
    const pointsAssigned = incidentType ? (INCIDENT_POINTS[incidentType] || 0) : undefined;

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        ...(incidentType && { incidentType }),
        ...(severityEnum && { severity: severityEnum }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        ...(actionTaken !== undefined && { actionTaken }),
        ...(pointsAssigned !== undefined && { pointsAssigned })
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            grade: true
          }
        },
        reporter: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Format response
    const formattedIncident = {
      id: updatedIncident.id,
      studentName: `${updatedIncident.student.firstName} ${updatedIncident.student.lastName}`,
      grade: updatedIncident.student.grade,
      date: updatedIncident.dateOccurred.toISOString().split('T')[0],
      time: updatedIncident.timeOccurred,
      location: updatedIncident.location,
      incident: updatedIncident.incidentType,
      severity: updatedIncident.severity.charAt(0) + updatedIncident.severity.slice(1).toLowerCase(),
      description: updatedIncident.description,
      staffMember: `${updatedIncident.reporter.firstName} ${updatedIncident.reporter.lastName}`,
      actionTaken: updatedIncident.actionTaken,
      pointsAssigned: updatedIncident.pointsAssigned
    };

    res.json(formattedIncident);
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// DELETE /api/incidents/:id - Delete incident
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.incident.delete({
      where: { id }
    });

    res.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
});

module.exports = router;
