import React from 'react';
import { useBehavior } from '../../contexts/BehaviorContext';
import { INCIDENT_POINTS, GRADES } from '../../utils/constants';

const TeacherView = () => {
  const {
    students,
    staff,
    formData,
    formGradeFilter,
    setFormGradeFilter,
    handleInputChange,
    handleSubmit,
    handleClear
  } = useBehavior();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit();
  };

  const handleGradeFilterChange = (e) => {
    const selectedGrade = e.target.value;
    setFormGradeFilter(selectedGrade);
    
    // Clear student selection when grade changes
    handleInputChange({ target: { name: 'studentName', value: '' } });
  };

  // Filter students based on selected grade
  const filteredStudents = formGradeFilter 
    ? students.filter(student => student.grade === formGradeFilter)
    : students;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Record Behavior Incident</h1>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level *
                </label>
                <select
                  value={formGradeFilter}
                  onChange={handleGradeFilterChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select grade first...</option>
                  {GRADES.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name *
                </label>
                <select
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  required
                  disabled={!formGradeFilter}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formGradeFilter ? 'Select student...' : 'Select grade first'}
                  </option>
                  {filteredStudents.map((student, index) => (
                    <option key={index} value={student.name}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Incident Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter location (e.g., Classroom 5A, Main hallway, etc.)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Type *
                </label>
                <select
                  name="incident"
                  value={formData.incident}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select incident type...</option>
                  {Object.entries(INCIDENT_POINTS).map(([type, points], index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level *
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['Minor', 'Major', 'Severe'].map((level) => (
                  <label
                    key={level}
                    className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.severity === level
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={level}
                      checked={formData.severity === level}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <span className="font-medium">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe the incident in detail (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reported by (Teacher) *
                </label>
                <select
                  name="staffMember"
                  value={formData.staffMember}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select reporting teacher...</option>
                  <option value="Ms. Jennifer Brown">Ms. Jennifer Brown</option>
                  <option value="Mr. Michael Davis">Mr. Michael Davis</option>
                  <option value="Mrs. Sarah Wilson">Mrs. Sarah Wilson</option>
                  <option value="Dr. Robert Johnson">Dr. Robert Johnson</option>
                  <option value="Ms. Lisa Anderson">Ms. Lisa Anderson</option>
                  <option value="Mr. David Thompson">Mr. David Thompson</option>
                  <option value="Mrs. Emily White">Mrs. Emily White</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Taken *
                </label>
                <input
                  type="text"
                  name="actionTaken"
                  value={formData.actionTaken}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Verbal warning, Parent contacted..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Incident
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherView; 