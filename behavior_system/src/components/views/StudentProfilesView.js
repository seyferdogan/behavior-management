import React, { useState, useMemo, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useBehavior } from '../../contexts/BehaviorContext';
import { ZONE_STYLES } from '../../utils/constants';
import { TrendingUp, BarChart3, PieChart, Calendar, MapPin, Download, Mail, Clock } from 'lucide-react';
import { jsPDF } from 'jspdf';

ChartJS.register(ArcElement, Tooltip, Legend);

const StudentProfilesView = () => {
  const {
    students,
    incidents,
    calculateStudentZone
  } = useBehavior();

  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate analytical data for selected student
  const analyticalData = useMemo(() => {
    if (!selectedStudent) return null;

    const studentIncidents = incidents.filter(
      incident => incident.studentName === selectedStudent
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (studentIncidents.length === 0) return null;

    // Incident type distribution
    const incidentTypeCount = studentIncidents.reduce((acc, incident) => {
      const type = incident.incident || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Severity distribution
    const severityCount = studentIncidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1;
      return acc;
    }, {});

    // Location analysis
    const locationCount = studentIncidents.reduce((acc, incident) => {
      acc[incident.location] = (acc[incident.location] || 0) + 1;
      return acc;
    }, {});

    // Monthly trend (last 6 months)
    const monthlyData = {};
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      last6Months.push(monthKey);
      monthlyData[monthKey] = 0;
    }

    studentIncidents.forEach(incident => {
      const incidentDate = new Date(incident.date);
      const monthKey = incidentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    return {
      incidentTypeCount,
      severityCount,
      locationCount,
      monthlyData,
      totalIncidents: studentIncidents.length,
      studentIncidents
    };
  }, [selectedStudent, incidents]);

  // Export Report functionality
  const handleExportReport = useCallback(async () => {
    if (!selectedStudent || !analyticalData) return;
    
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      
      const { zone, points } = calculateStudentZone(selectedStudent);
      
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
      doc.text('Student Behavioral Analysis Report', pageWidth / 2, margin + 20, { align: 'center' });
      
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
      doc.text(`Name: ${selectedStudent}`, col1X, infoStartY);
      doc.text(`Current Zone: ${zone}`, col2X, infoStartY);
      doc.text(`Behavior Points: ${points}`, col1X, infoStartY + 10);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, col2X, infoStartY + 10);

      // Analytical Summary
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Behavioral Analysis Summary', margin, margin + 90);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(12);
      
      let summaryY = margin + 100;
      
      // Most common incident
      const mostCommon = Object.entries(analyticalData.incidentTypeCount)
        .sort(([,a], [,b]) => b - a)[0];
      doc.text(`Most Common Issue: ${mostCommon?.[0] || 'None'} (${mostCommon?.[1] || 0} incidents)`, margin, summaryY);
      
      // Most problematic location
      const hotspot = Object.entries(analyticalData.locationCount)
        .sort(([,a], [,b]) => b - a)[0];
      doc.text(`Hotspot Location: ${hotspot?.[0] || 'None'} (${hotspot?.[1] || 0} incidents)`, margin, summaryY + 10);
      
      doc.text(`Total Incidents: ${analyticalData.totalIncidents}`, margin, summaryY + 20);

      // Incidents Section
      if (analyticalData.studentIncidents.length > 0) {
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
        analyticalData.studentIncidents.forEach((incident, index) => {
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
      }

      // Add page number to all pages
      let totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addPageNumber(i);
      }

      // Save the PDF
      const filename = `${selectedStudent.replace(/\s+/g, '_')}_analysis_report.pdf`;
      doc.save(filename);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate the report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedStudent, analyticalData, calculateStudentZone]);

  // Pie chart configuration for incident types
  const pieChartData = useMemo(() => {
    if (!analyticalData) return null;

    const colors = [
      '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F59E0B'
    ];

    return {
      labels: Object.keys(analyticalData.incidentTypeCount),
      datasets: [
        {
          data: Object.values(analyticalData.incidentTypeCount),
          backgroundColor: colors.slice(0, Object.keys(analyticalData.incidentTypeCount).length),
          borderColor: colors.slice(0, Object.keys(analyticalData.incidentTypeCount).length),
          borderWidth: 2,
        },
      ],
    };
  }, [analyticalData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed * 100) / total).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    }
  };

  const { zone, points } = selectedStudent ? calculateStudentZone(selectedStudent) : { zone: null, points: 0 };
  const zoneStyle = zone ? ZONE_STYLES[zone] : null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Student Behavioral Analysis</h2>
      </div>

      {/* Student Selection */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Student for Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search students..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
        <select
              value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
              <option value="">Choose a student...</option>
              {filteredStudents.map((student, index) => (
                <option key={index} value={student.name}>
                  {student.name} ({student.grade})
                </option>
              ))}
        </select>
      </div>
        </div>
      </div>

      {/* Analysis Dashboard */}
      {selectedStudent && analyticalData && (
        <div className="space-y-6">
          {/* Student Overview */}
          <div className={`${zoneStyle.light} p-4 rounded-lg border-l-4 ${
            zone === 'Red' ? 'border-red-500' :
            zone === 'Orange' ? 'border-orange-500' :
            zone === 'Yellow' ? 'border-yellow-500' :
            'border-green-500'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedStudent}</h3>
                <p className={`${zoneStyle.text} font-semibold`}>Current Zone: {zone} ({points} points)</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{analyticalData.totalIncidents}</p>
                <p className="text-sm text-gray-600">Total Incidents</p>
              </div>
            </div>
          </div>

          {/* Incident Type Distribution Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">Incident Type Distribution</h4>
            </div>
            <div className="h-80">
              <Pie data={pieChartData} options={chartOptions} />
            </div>
          </div>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Common Incident */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <h5 className="font-semibold text-red-800">Most Common Issue</h5>
              </div>
              <p className="text-lg font-bold text-red-900">
                {Object.entries(analyticalData.incidentTypeCount)
                  .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
              </p>
              <p className="text-sm text-red-700">
                {Object.entries(analyticalData.incidentTypeCount)
                  .sort(([,a], [,b]) => b - a)[0]?.[1] || 0} incidents
              </p>
            </div>

            {/* Most Problematic Location */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <h5 className="font-semibold text-orange-800">Hotspot Location</h5>
              </div>
              <p className="text-lg font-bold text-orange-900">
                {Object.entries(analyticalData.locationCount)
                  .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
              </p>
              <p className="text-sm text-orange-700">
                {Object.entries(analyticalData.locationCount)
                  .sort(([,a], [,b]) => b - a)[0]?.[1] || 0} incidents
              </p>
            </div>

            {/* Severity Breakdown */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h5 className="font-semibold text-blue-800">Severity Pattern</h5>
              </div>
              <div className="space-y-1">
                {Object.entries(analyticalData.severityCount)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 2)
                  .map(([severity, count]) => (
                    <div key={severity} className="flex justify-between">
                      <span className="text-sm text-blue-700">{severity}:</span>
                      <span className="text-sm font-semibold text-blue-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Actions</h4>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleExportReport}
                disabled={isGenerating}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  isGenerating 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? (
                  <span className="inline-flex items-center">
                    Generating...
                    <svg className="animate-spin ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  'Export Analysis Report'
                )}
              </button>
              <button
                onClick={() => alert('Contact parent functionality would be implemented here')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Parent
              </button>
            </div>
          </div>

          {/* Detailed Incident History */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <h4 className="text-lg font-semibold text-gray-900">
                  Detailed Incident History ({analyticalData.totalIncidents} incidents)
                </h4>
              </div>
            </div>
            <div className="p-6">
              {analyticalData.studentIncidents.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No incidents recorded</p>
              ) : (
                <div className="space-y-4">
                  {analyticalData.studentIncidents.map((incident, index) => (
                    <div key={index} className={`border-l-4 pl-4 py-3 ${
                      incident.severity === 'High' ? 'border-red-500 bg-red-50' :
                      incident.severity === 'Medium' ? 'border-orange-500 bg-orange-50' :
                      'border-yellow-500 bg-yellow-50'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{incident.incident}</h5>
                          {incident.description && (
                            <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(incident.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">{incident.staffMember}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          incident.severity === 'High' ? 'bg-red-100 text-red-800' :
                          incident.severity === 'Medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {incident.severity} Severity
                        </span>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {incident.location}
                        </span>
                        {incident.pointsAssigned && (
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
                            +{incident.pointsAssigned} points
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Student Selected */}
      {!selectedStudent && (
        <div className="text-center py-12">
          <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Student to Begin Analysis</h3>
          <p className="text-gray-600">Choose a student from the dropdown above to view detailed behavioral patterns and insights.</p>
        </div>
      )}

      {/* No Data Available */}
      {selectedStudent && !analyticalData && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Incident Data Available</h3>
          <p className="text-gray-600">{selectedStudent} has no recorded incidents to analyze.</p>
        </div>
      )}
    </div>
  );
};

export default StudentProfilesView; 