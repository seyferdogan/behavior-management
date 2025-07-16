const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock data from the frontend
const GRADES = [
  "Grade 7B",
  "Grade 7G", 
  "Grade 8B",
  "Grade 8G",
  "Grade 9-10B",
  "Grade 9-10G"
];

const STUDENTS = [
  { name: "Aaliyah Mohammed", grade: "Grade 7G" },
  { name: "Aaron Thompson", grade: "Grade 8B" },
  { name: "Abigail Foster", grade: "Grade 9-10G" },
  { name: "Adam Rodriguez", grade: "Grade 9-10B" },
  { name: "Aiden Clarke", grade: "Grade 7B" },
  { name: "Alexandra Putin", grade: "Grade 9-10G" },
  { name: "Alice Cooper", grade: "Grade 8G" },
  { name: "Amanda Garcia", grade: "Grade 9-10G" },
  { name: "Andrew Mitchell", grade: "Grade 9-10B" },
  { name: "Angela White", grade: "Grade 7G" },
  { name: "Anna Kowalski", grade: "Grade 8G" },
  { name: "Anthony Davis", grade: "Grade 9-10B" },
  { name: "Ashley Johnson", grade: "Grade 9-10G" },
  { name: "Austin Lee", grade: "Grade 9-10B" },
  { name: "Ava Miller", grade: "Grade 7G" },
  { name: "Benjamin Taylor", grade: "Grade 8B" },
  { name: "Brianna Wilson", grade: "Grade 9-10G" },
  { name: "Brooklyn Anderson", grade: "Grade 9-10G" },
  { name: "Caleb Jackson", grade: "Grade 7B" },
  { name: "Cameron Brown", grade: "Grade 8B" },
  { name: "Carlos Martinez", grade: "Grade 9-10B" },
  { name: "Charlotte Smith", grade: "Grade 9-10G" },
  { name: "Chloe Thompson", grade: "Grade 9-10G" },
  { name: "Christopher Jones", grade: "Grade 7B" },
  { name: "Daniel Williams", grade: "Grade 8B" },
  { name: "David Moore", grade: "Grade 9-10B" },
  { name: "Diana Prince", grade: "Grade 9-10G" },
  { name: "Dylan Thomas", grade: "Grade 9-10B" },
  { name: "Elena Vasquez", grade: "Grade 7G" },
  { name: "Elizabeth Clark", grade: "Grade 8G" },
  { name: "Emily Rodriguez", grade: "Grade 9-10G" },
  { name: "Emma Watson", grade: "Grade 9-10G" },
  { name: "Ethan Hunt", grade: "Grade 7B" },
  { name: "Eva Martinez", grade: "Grade 8G" },
  { name: "Gabriel Santos", grade: "Grade 9-10B" },
  { name: "Grace Kelly", grade: "Grade 9-10G" },
  { name: "Hannah Montana", grade: "Grade 9-10G" },
  { name: "Ian Malcolm", grade: "Grade 7B" },
  { name: "Isabella Garcia", grade: "Grade 8G" },
  { name: "Jack Sparrow", grade: "Grade 9-10B" },
  { name: "Jacob Black", grade: "Grade 9-10B" },
  { name: "James Bond", grade: "Grade 7B" },
  { name: "Jason Bourne", grade: "Grade 8B" },
  { name: "Jennifer Lopez", grade: "Grade 9-10G" },
  { name: "Jessica Alba", grade: "Grade 8G" },
  { name: "John Connor", grade: "Grade 9-10B" },
  { name: "John Smith", grade: "Grade 8B" },
  { name: "Jordan Peterson", grade: "Grade 7B" },
  { name: "Joshua Brown", grade: "Grade 9-10B" },
  { name: "Julia Roberts", grade: "Grade 9-10G" },
  { name: "Justin Time", grade: "Grade 7B" },
  { name: "Kaiden Smith", grade: "Grade 8B" },
  { name: "Katherine Pierce", grade: "Grade 9-10G" },
  { name: "Kevin Hart", grade: "Grade 7B" },
  { name: "Kimberly Possible", grade: "Grade 8G" },
  { name: "Kyle Reese", grade: "Grade 9-10B" },
  { name: "Laura Croft", grade: "Grade 9-10G" },
  { name: "Liam Neeson", grade: "Grade 9-10B" },
  { name: "Logan Paul", grade: "Grade 8B" },
  { name: "Lucas Scott", grade: "Grade 7B" },
  { name: "Luke Skywalker", grade: "Grade 9-10B" },
  { name: "Madison Beer", grade: "Grade 8G" },
  { name: "Maria Santos", grade: "Grade 7G" },
  { name: "Mark Wahlberg", grade: "Grade 9-10B" },
  { name: "Mary Jane", grade: "Grade 8G" },
  { name: "Mason Mount", grade: "Grade 7B" },
  { name: "Matthew McConaughey", grade: "Grade 9-10B" },
  { name: "Maya Angelou", grade: "Grade 8G" },
  { name: "Megan Fox", grade: "Grade 9-10G" },
  { name: "Michael Jordan", grade: "Grade 8B" },
  { name: "Michelle Obama", grade: "Grade 9-10G" },
  { name: "Morgan Freeman", grade: "Grade 7B" },
  { name: "Natalie Portman", grade: "Grade 9-10G" },
  { name: "Nathan Drake", grade: "Grade 8B" },
  { name: "Nicholas Cage", grade: "Grade 9-10B" },
  { name: "Nicole Kidman", grade: "Grade 8G" },
  { name: "Noah Williams", grade: "Grade 7B" },
  { name: "Olivia Newton", grade: "Grade 9-10G" },
  { name: "Owen Wilson", grade: "Grade 8B" },
  { name: "Parker Posey", grade: "Grade 7G" },
  { name: "Patrick Star", grade: "Grade 8B" },
  { name: "Peter Parker", grade: "Grade 7B" },
  { name: "Rachel Green", grade: "Grade 9-10G" },
  { name: "Rebecca Black", grade: "Grade 8G" },
  { name: "Robert Downey", grade: "Grade 9-10B" },
  { name: "Ryan Reynolds", grade: "Grade 8B" },
  { name: "Samantha Jones", grade: "Grade 9-10G" },
  { name: "Sarah Connor", grade: "Grade 8G" },
  { name: "Sebastian Stan", grade: "Grade 9-10B" },
  { name: "Selena Gomez", grade: "Grade 7G" },
  { name: "Sophia Loren", grade: "Grade 9-10G" },
  { name: "Taylor Swift", grade: "Grade 8G" },
  { name: "Thomas Anderson", grade: "Grade 9-10B" },
  { name: "Tyler Durden", grade: "Grade 8B" },
  { name: "Victoria Beckham", grade: "Grade 9-10G" },
  { name: "William Turner", grade: "Grade 7B" },
  { name: "Zoe Saldana", grade: "Grade 9-10G" }
];

const STAFF = [
  "Ms. Jennifer Brown",
  "Mr. Michael Davis",
  "Mrs. Sarah Wilson",
  "Dr. Robert Johnson",
  "Ms. Lisa Anderson",
  "Mr. David Thompson",
  "Mrs. Emily White"
];

const INITIAL_INCIDENTS = [
  {
    studentName: "John Smith",
    grade: "Grade 8B",
    date: "2025-01-15",
    time: "10:30 AM",
    location: "Classroom A",
    incident: "Disruptive Behaviour",
    severity: "Minor",
    description: "Talking out of turn repeatedly during math lesson",
    staffMember: "Ms. Jennifer Brown",
    actionTaken: "Verbal warning given"
  },
  {
    studentName: "Emily Rodriguez",
    grade: "Grade 9-10G",
    date: "2025-01-14",
    time: "2:15 PM",
    location: "Library",
    incident: "Mobile Phone Usage",
    severity: "Minor",
    description: "Using phone during study period",
    staffMember: "Mr. Michael Davis",
    actionTaken: "Phone confiscated until end of day"
  },
  {
    studentName: "David Moore",
    grade: "Grade 9-10B",
    date: "2025-01-13",
    time: "11:45 AM",
    location: "Playground",
    incident: "Bullying",
    severity: "Major",
    description: "Verbal harassment of younger student",
    staffMember: "Mrs. Sarah Wilson",
    actionTaken: "Parent meeting scheduled"
  },
  {
    studentName: "Jessica Alba",
    grade: "Grade 8G",
    date: "2025-01-12",
    time: "9:20 AM",
    location: "Hallway",
    incident: "Uniform Breach",
    severity: "Minor",
    description: "Wearing non-uniform shoes",
    staffMember: "Dr. Robert Johnson",
    actionTaken: "Reminded of uniform policy"
  },
  {
    studentName: "Michael Jordan",
    grade: "Grade 8B",
    date: "2025-01-11",
    time: "1:30 PM",
    location: "Gymnasium",
    incident: "Defiant",
    severity: "Moderate",
    description: "Refused to follow PE instructor directions",
    staffMember: "Ms. Lisa Anderson",
    actionTaken: "Detention assigned"
  },
  {
    studentName: "Emma Watson",
    grade: "Grade 9-10G",
    date: "2025-01-10",
    time: "3:45 PM",
    location: "Classroom C",
    incident: "Late",
    severity: "Minor",
    description: "Arrived 15 minutes late to science class",
    staffMember: "Mr. David Thompson",
    actionTaken: "Late slip issued"
  },
  {
    studentName: "Christopher Jones",
    grade: "Grade 7B",
    date: "2025-01-09",
    time: "10:15 AM",
    location: "Cafeteria",
    incident: "Disrespectful",
    severity: "Moderate",
    description: "Made inappropriate comments to cafeteria staff",
    staffMember: "Mrs. Emily White",
    actionTaken: "Apology letter required"
  },
  {
    studentName: "Olivia Newton",
    grade: "Grade 9-10G",
    date: "2025-01-08",
    time: "12:00 PM",
    location: "Office",
    incident: "Vandalism",
    severity: "Major",
    description: "Drew on desk with permanent marker",
    staffMember: "Ms. Jennifer Brown",
    actionTaken: "Clean-up duty and parent contact"
  },
  {
    studentName: "Tyler Durden",
    grade: "Grade 8B",
    date: "2025-01-07",
    time: "8:30 AM",
    location: "Classroom B",
    incident: "Aggression",
    severity: "Major",
    description: "Pushed another student during group work",
    staffMember: "Mr. Michael Davis",
    actionTaken: "Suspension consideration"
  },
  {
    studentName: "Sophia Loren",
    grade: "Grade 9-10G",
    date: "2025-01-06",
    time: "2:30 PM",
    location: "Library",
    incident: "Not following instructions",
    severity: "Moderate",
    description: "Continued talking after being asked to be quiet multiple times",
    staffMember: "Mrs. Sarah Wilson",
    actionTaken: "Removed from library for remainder of period"
  }
];

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Create a default school
    const school = await prisma.school.create({
      data: {
        name: 'Demo School',
        domain: 'demo.school.edu'
      }
    });

    console.log('✅ School created:', school.name);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@demo.school.edu',
        firstName: 'School',
        lastName: 'Administrator',
        role: 'ADMIN',
        schoolId: school.id,
        password: '$2a$10$dummy.hash.for.demo' // In real app, hash the password
      }
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create staff users
    for (const staffName of STAFF) {
      const email = staffName.toLowerCase().replace(/[^a-z]/g, '.') + '@demo.school.edu';
      const nameParts = staffName.split(' ');
      const firstName = nameParts.slice(0, -1).join(' '); // Everything except last word
      const lastName = nameParts[nameParts.length - 1]; // Last word
      
      await prisma.user.create({
        data: {
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: 'TEACHER',
          schoolId: school.id,
          password: '$2a$10$dummy.hash.for.demo'
        }
      });
    }

    console.log('✅ Staff users created:', STAFF.length);

    // Create students
    for (const student of STUDENTS) {
      const nameParts = student.name.split(' ');
      const firstName = nameParts.slice(0, -1).join(' '); // Everything except last word
      const lastName = nameParts[nameParts.length - 1]; // Last word
      
      await prisma.student.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          grade: student.grade,
          schoolId: school.id,
          isActive: true
        }
      });
    }

    console.log('✅ Students created:', STUDENTS.length);

    // Create incidents
    for (const incident of INITIAL_INCIDENTS) {
      // Find the student by reconstructing full name
      const student = await prisma.student.findFirst({
        where: { 
          AND: [
            { firstName: { contains: incident.studentName.split(' ')[0] } },
            { lastName: { contains: incident.studentName.split(' ').slice(-1)[0] } }
          ]
        }
      });

      // Find the staff member by reconstructing full name
      const staffFirstName = incident.staffMember.split(' ').slice(0, -1).join(' ');
      const staffLastName = incident.staffMember.split(' ').slice(-1)[0];
      
      const staffMember = await prisma.user.findFirst({
        where: { 
          AND: [
            { firstName: { contains: staffFirstName } },
            { lastName: { contains: staffLastName } }
          ]
        }
      });

      if (student && staffMember) {
        // Map severity values to match enum
        let severity = incident.severity.toUpperCase();
        if (severity === 'MODERATE') {
          severity = 'MAJOR'; // Map Moderate to Major
        }
        
        await prisma.incident.create({
          data: {
            studentId: student.id,
            reporterId: staffMember.id,
            incidentType: incident.incident,
            description: incident.description,
            location: incident.location,
            severity: severity,
            actionTaken: incident.actionTaken,
            dateOccurred: new Date(incident.date + 'T' + convertTo24Hour(incident.time)),
            timeOccurred: incident.time,
            pointsAssigned: 0, // Will be calculated based on incident type
            schoolId: school.id
          }
        });
      }
    }

    console.log('✅ Incidents created:', INITIAL_INCIDENTS.length);
    console.log('🎉 Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Helper function to convert 12-hour time to 24-hour format
function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  hours = parseInt(hours, 10);
  
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  } else if (modifier === 'PM' && hours !== 12) {
    hours = hours + 12;
  }
  
  // Pad with zeros
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.padStart(2, '0');
  
  return `${hoursStr}:${minutesStr}:00`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 