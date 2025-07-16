import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateStudentReport = (studentData) => {
  try {
    const {
      name,
      zone,
      points,
      incidents,
    } = studentData;

    // Create new document
    const doc = new jsPDF();

    // Basic student info
    doc.setFontSize(22);
    doc.text('Student Behavior Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Student: ${name}`, 20, 40);
    doc.text(`Current Zone: ${zone}`, 20, 50);
    doc.text(`Behavior Points: ${points}`, 20, 60);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 70);

    // Incident Summary
    if (incidents.length > 0) {
      // Create incident summary data
      const incidentData = incidents.map(incident => [
        new Date(incident.date).toLocaleDateString(),
        incident.incident,
        incident.severity,
        incident.location
      ]);

      // Add incident table
      doc.autoTable({
        startY: 80,
        head: [['Date', 'Incident', 'Severity', 'Location']],
        body: incidentData,
        margin: { top: 80 },
        headStyles: { fillColor: [66, 139, 202] }
      });

    } else {
      doc.text('No incidents recorded', 20, 80);
    }

    // Force download
    const filename = `${name.replace(/\s+/g, '_')}_behavior_report.pdf`;
    window.open(doc.output('bloburl'), '_blank');
    
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('Error generating PDF report. Please try again.');
    return false;
  }
}; 