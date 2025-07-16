import React from 'react';
import { useBehavior } from '../../contexts/BehaviorContext';
import { X } from 'lucide-react';
import { ZONE_STYLES } from '../../utils/constants';

const ZoneStudentsModal = ({ zone, onClose }) => {
  const { students, calculateStudentZone } = useBehavior();

  // Get all students in this zone
  const studentsInZone = students.filter(student => calculateStudentZone(student.name).zone === zone);

  const zoneStyle = ZONE_STYLES[zone];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" style={{ maxHeight: '80vh', height: '80vh' }}>
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">
                Students in {zone} Zone
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${zoneStyle.light} ${zoneStyle.text}`}>
                {studentsInZone.length} students
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6" style={{ height: 'calc(80vh - 120px)', overflowY: 'auto' }}>
          {studentsInZone.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 text-center">
                No students currently in {zone} Zone
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentsInZone.map((student, index) => {
                const { points } = calculateStudentZone(student.name);
                
                return (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">Current Points: {points}</p>
                        <p className="text-sm text-gray-500">{student.grade}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${zoneStyle.light} ${zoneStyle.text}`}>
                        {zone}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoneStudentsModal; 