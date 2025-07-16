import React, { useState } from 'react';
import { Upload, Filter, AlertTriangle, Users, ChevronRight } from 'lucide-react';
import { useBehavior } from '../../contexts/BehaviorContext';
import { ZONE_STYLES, GRADES } from '../../utils/constants';
import StudentProfilesModal from '../modals/StudentProfilesModal';

const StudentManagerView = () => {
  const {
    students,
    setStudents,
    newStudentName,
    setNewStudentName,
    calculateStudentZone,
    setShowStudentManager
  } = useBehavior();

  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStudentGrade, setNewStudentGrade] = useState('');

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (newStudentName.trim() && newStudentGrade && !students.find(s => s.name === newStudentName.trim())) {
      const newStudent = {
        name: newStudentName.trim(),
        grade: newStudentGrade
      };
      setStudents([...students, newStudent].sort((a, b) => a.name.localeCompare(b.name)));
      setNewStudentName('');
      setNewStudentGrade('');
    }
  };

  const handleRemoveStudent = (studentToRemove, e) => {
    e.stopPropagation(); // Prevent opening profile when clicking remove
    setStudents(students.filter(student => student.name !== studentToRemove.name));
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student.name);
  };

  const closeStudentProfile = () => {
    setSelectedStudent(null);
  };

  // Get unique grades from students
  const getAvailableGrades = () => {
    const grades = [...new Set(students.map(student => student.grade))];
    return grades.sort();
  };

  // Get students filtered by grade
  const getStudentsByGrade = (grade) => {
    if (grade === 'All') return students;
    return students.filter(student => student.grade === grade);
  };

  // Get zone distribution for display (filtered by grade)
  const getZoneDistribution = () => {
    const distribution = { Green: 0, Yellow: 0, Orange: 0, Red: 0 };
    const gradeFilteredStudents = getStudentsByGrade(gradeFilter);
    
    gradeFilteredStudents.forEach(student => {
      const zone = calculateStudentZone(student.name).zone;
      distribution[zone]++;
    });
    return distribution;
  };

  const zoneDistribution = getZoneDistribution();
  const availableGrades = getAvailableGrades();
  const gradeFilteredStudents = getStudentsByGrade(gradeFilter);

  const filteredStudents = gradeFilteredStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const { zone } = calculateStudentZone(student.name);
    
    let matchesZone = true;
    if (zoneFilter === 'High Risk') {
      matchesZone = zone === 'Orange' || zone === 'Red';
    } else if (zoneFilter !== 'All') {
      matchesZone = zone === zoneFilter;
    }
    
    return matchesSearch && matchesZone;
  });

  // Sort filtered students by points (highest first) for better visibility of problem students
  const sortedStudents = filteredStudents.sort((a, b) => {
    const aPoints = calculateStudentZone(a.name).points;
    const bPoints = calculateStudentZone(b.name).points;
    return bPoints - aPoints;
  });

  const zoneFilterOptions = [
    { value: 'All', label: 'All Students', icon: Users, color: 'text-gray-600' },
    { value: 'High Risk', label: 'High Risk (Orange + Red)', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'Red', label: 'Red Zone', icon: null, color: 'text-red-600' },
    { value: 'Orange', label: 'Orange Zone', icon: null, color: 'text-orange-600' },
    { value: 'Yellow', label: 'Yellow Zone', icon: null, color: 'text-yellow-600' },
    { value: 'Green', label: 'Green Zone', icon: null, color: 'text-green-600' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Manage Students</h2>
        <button
          onClick={() => setShowStudentManager(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Upload className="w-4 h-4 mr-2" />
          Mass Upload
        </button>
      </div>

      {/* Grade Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Grade:</span>
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Grades</option>
            {availableGrades.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          {gradeFilter !== 'All' && (
            <span className="text-sm text-gray-600">
              Showing {gradeFilteredStudents.length} students in {gradeFilter}
            </span>
          )}
        </div>
      </div>

      {/* Zone Distribution Summary */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {Object.entries(zoneDistribution).map(([zone, count]) => {
          const zoneStyle = ZONE_STYLES[zone];
          return (
            <div
              key={zone}
              className={`p-3 rounded-lg border-2 ${zoneStyle.light} border-transparent hover:border-gray-300 transition-colors cursor-pointer`}
              onClick={() => setZoneFilter(zone)}
            >
              <div className={`text-center ${zoneStyle.text}`}>
                <div className="text-xl font-bold">{count}</div>
                <div className="text-xs font-medium">{zone}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Student Form */}
      <form onSubmit={handleAddStudent} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            placeholder="Enter student name..."
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={newStudentGrade}
            onChange={(e) => setNewStudentGrade(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select grade...</option>
            {GRADES.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Student
          </button>
        </div>
      </form>

      {/* Mass Upload Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <Upload className="w-5 h-5 text-blue-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-blue-900">Need to add multiple students?</p>
            <p className="text-sm text-blue-700">
              Use the Mass Upload feature to import students from CSV or text files with preview and validation.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search students..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

        {/* Zone Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2 mr-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Zone:</span>
          </div>
          {zoneFilterOptions.map((option) => {
            const Icon = option.icon;
            const isActive = zoneFilter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setZoneFilter(option.value)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {Icon && <Icon className="w-3 h-3 mr-1" />}
                {option.label}
                {option.value !== 'All' && option.value !== 'High Risk' && (
                  <span className="ml-1 text-xs">({zoneDistribution[option.value] || 0})</span>
                )}
                {option.value === 'High Risk' && (
                  <span className="ml-1 text-xs">({(zoneDistribution.Orange + zoneDistribution.Red)})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Filter Display */}
      {(zoneFilter !== 'All' || gradeFilter !== 'All') && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                Showing {sortedStudents.length} student{sortedStudents.length !== 1 ? 's' : ''} 
                {gradeFilter !== 'All' && ` in ${gradeFilter}`}
                {zoneFilter !== 'All' && (
                  <span className="ml-1">
                    in {zoneFilter === 'High Risk' ? 'Orange and Red Zones' : `${zoneFilter} Zone`}
                  </span>
                )}
              </span>
              {zoneFilter === 'High Risk' && (
                <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
              )}
            </div>
            <div className="flex space-x-2">
              {gradeFilter !== 'All' && (
                <button
                  onClick={() => setGradeFilter('All')}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear Grade Filter
                </button>
              )}
              {zoneFilter !== 'All' && (
                <button
                  onClick={() => setZoneFilter('All')}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear Zone Filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="space-y-4">
        {sortedStudents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {searchTerm || zoneFilter !== 'All' || gradeFilter !== 'All'
                ? 'No students found matching your criteria' 
                : 'No students added yet'}
            </p>
            {zoneFilter === 'High Risk' && (
              <p className="text-sm text-gray-500 mt-2">
                Great! No students currently require high-risk intervention.
              </p>
            )}
          </div>
        ) : (
          sortedStudents.map((student, index) => {
            const { zone, points } = calculateStudentZone(student.name);
            const zoneStyle = ZONE_STYLES[zone];

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all cursor-pointer group ${
                  zone === 'Red' ? 'border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300' :
                  zone === 'Orange' ? 'border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300' :
                  'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                }`}
                onClick={() => handleStudentClick(student)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div>
                    <span className="font-medium text-gray-900">{student.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({student.grade})</span>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${zoneStyle.light} ${zoneStyle.text}`}>
                    {zone} Zone ({points} pts)
                  </span>
                  {(zone === 'Orange' || zone === 'Red') && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to view detailed profile
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <button
                    onClick={(e) => handleRemoveStudent(student, e)}
                    className="text-red-600 hover:text-red-700 focus:outline-none px-2 py-1 rounded hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedStudent && (
        <StudentProfilesModal
          student={selectedStudent}
          onClose={closeStudentProfile}
        />
      )}
    </div>
  );
};

export default StudentManagerView; 