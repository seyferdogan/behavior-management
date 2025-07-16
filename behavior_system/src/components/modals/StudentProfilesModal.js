import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { useBehavior } from '../../contexts/BehaviorContext';
import { ZONE_STYLES } from '../../utils/constants';
import { jsPDF } from 'jspdf';

const StudentProfilesModal = ({ student, onClose }) => {
  const { incidents, calculateStudentZone } = useBehavior();
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Get student-specific incidents
  const studentIncidents = incidents.filter(
    incident => incident.studentName === student
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const { zone, points } = calculateStudentZone(student);
  const zoneStyle = ZONE_STYLES[zone];

  const handleExportReport = useCallback(async () => {
    console.log('Export button clicked');
    setIsGenerating(true);

    try {
      // Create new document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      
      // Helper function to add page number
      const addPageNumber = (pageNum) => {
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      // Header with school name
      doc.setFontSize(24);
      doc.setTextColor(66, 139, 202);
      doc.text('Behavior Management System', pageWidth / 2, margin, { align: 'center' });
      
      // Decorative line under header
      doc.setDrawColor(66, 139, 202);
      doc.setLineWidth(0.5);
      doc.line(margin, margin + 5, pageWidth - margin, margin + 5);

      // Report title
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      doc.text('Student Behavior Report', pageWidth / 2, margin + 20, { align: 'center' });
      
      // Student Info Box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, margin + 30, pageWidth - (2 * margin), 45, 3, 3, 'F');
      
      // Student Info Content
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Student Information', margin + 5, margin + 40);
      doc.setFont(undefined, 'normal');
      
      // Two-column layout for student info
      const col1X = margin + 5;
      const col2X = pageWidth / 2;
      const infoStartY = margin + 55;
      
      doc.setFontSize(12);
      doc.text(`Name: ${student}`, col1X, infoStartY);
      doc.text(`Current Zone: ${zone}`, col2X, infoStartY);
      doc.text(`Behavior Points: ${points}`, col1X, infoStartY + 10);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, col2X, infoStartY + 10);

      // Summary Statistics
      const severityCounts = studentIncidents.reduce((acc, inc) => {
        acc[inc.severity] = (acc[inc.severity] || 0) + 1;
        return acc;
      }, {});

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Incident Summary', margin, margin + 90);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(12);
      
      let summaryY = margin + 100;
      Object.entries(severityCounts).forEach(([severity, count], index) => {
        doc.text(`${severity}: ${count} incident${count !== 1 ? 's' : ''}`, margin, summaryY + (index * 10));
      });

      // Incidents Section
      if (studentIncidents.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Detailed Incident History', margin, margin + 140);
        
        // Table settings
        const startY = margin + 150;
        const lineHeight = 12;
        const colWidths = [35, pageWidth - 145, 35, 35];
        const cols = ['Date', 'Description', 'Severity', 'Location'];
        let currentY = startY;

        // Table headers
        doc.setFillColor(66, 139, 202);
        doc.setTextColor(255, 255, 255);
        doc.rect(margin, currentY - 5, pageWidth - (2 * margin), 10, 'F');
        
        let currentX = margin;
        cols.forEach((col, i) => {
          doc.text(col, currentX + 2, currentY);
          currentX += colWidths[i];
        });

        // Reset text color for data
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        currentY += lineHeight;

        // Table data
        studentIncidents.forEach((incident, index) => {
          // Check if we need a new page
          if (currentY > pageHeight - margin) {
            doc.addPage();
            currentY = margin + 20;
            // Repeat headers on new page
            doc.setFillColor(66, 139, 202);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.rect(margin, currentY - 5, pageWidth - (2 * margin), 10, 'F');
            
            currentX = margin;
            cols.forEach((col, i) => {
              doc.text(col, currentX + 2, currentY);
              currentX += colWidths[i];
            });
            
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            currentY += lineHeight;
          }

          // Add zebra striping
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, currentY - 5, pageWidth - (2 * margin), lineHeight, 'F');
          }

          // Add row data
          currentX = margin;
          const date = new Date(incident.date).toLocaleDateString();
          const rowData = [
            date,
            incident.description || incident.incident,
            incident.severity,
            incident.location
          ];

          rowData.forEach((text, i) => {
            // Ensure text fits in column
            const maxWidth = colWidths[i] - 4;
            if (doc.getStringUnitWidth(text) * doc.internal.getFontSize() > maxWidth) {
              text = text.substring(0, 20) + '...';
            }
            doc.text(text, currentX + 2, currentY);
            currentX += colWidths[i];
          });

          currentY += lineHeight;
        });
      } else {
        doc.setFontSize(12);
        doc.text('No incidents recorded', margin, margin + 150);
      }

      // Add page number to all pages
      let totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addPageNumber(i);
      }

      // Save the PDF
      const filename = `${student.replace(/\s+/g, '_')}_behavior_report.pdf`;
      doc.save(filename);
      console.log('PDF saved successfully');

    } catch (error) {
      console.error('Error in export handler:', error);
      alert('Failed to generate the report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [student, zone, points, studentIncidents]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{student} - Profile Details</h2>
        <button
          onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
              <X className="w-6 h-6" />
        </button>
          </div>
      </div>

        <div className="p-6">
      {/* Current Status */}
      <div className={`${zoneStyle.light} p-4 rounded-lg mb-6`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`${zoneStyle.text} text-lg font-semibold`}>Current Zone</h3>
            <p className={`${zoneStyle.text} text-2xl font-bold`}>{zone}</p>
          </div>
          <div>
            <h3 className={`${zoneStyle.text} text-lg font-semibold`}>Behavior Points</h3>
            <p className={`${zoneStyle.text} text-2xl font-bold`}>{points}</p>
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Incidents</h3>
        {studentIncidents.length === 0 ? (
          <p className="text-gray-600">No incidents recorded</p>
        ) : (
          <div className="space-y-4">
            {studentIncidents.map((incident, index) => (
              <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{incident.incident}</p>
                    <p className="text-sm text-gray-600">{incident.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(incident.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">{incident.staffMember}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    {incident.severity}
                  </span>
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded ml-2">
                    {incident.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          className={`px-4 py-2 ${
            isGenerating 
              ? 'bg-gray-100 text-gray-500' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          } rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleExportReport}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <span className="inline-flex items-center">
              Generating...
              <svg className="animate-spin ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          ) : (
            'Export Report'
          )}
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => {/* TODO: Implement contact parent functionality */}}
        >
          Contact Parent
        </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilesModal; 