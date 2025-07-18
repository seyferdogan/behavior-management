import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useBehavior } from '../../contexts/BehaviorContext';

const StaffManagerView = () => {
  const {
    staff,
    setStaff,
    newStaffName,
    setNewStaffName,
    incidents,
    setShowStaffManager
  } = useBehavior();

  const [searchTerm, setSearchTerm] = useState('');

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (newStaffName.trim() && !staff.find(member => member.name === newStaffName.trim())) {
      setStaff([...staff, { name: newStaffName.trim() }]);
      setNewStaffName('');
    }
  };

  const handleRemoveStaff = (staffToRemove) => {
    setStaff(staff.filter(member => member.name !== staffToRemove.name));
  };

  const getStaffReportCount = (staffMember) => {
    return incidents.filter(incident => incident.staffMember === staffMember.name).length;
  };

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Manage Staff</h2>
        <button
          onClick={() => setShowStaffManager(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Upload className="w-4 h-4 mr-2" />
          Mass Upload
        </button>
      </div>

      {/* Add Staff Form */}
      <form onSubmit={handleAddStaff} className="mb-8">
        <div className="flex space-x-4">
          <input
            type="text"
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            placeholder="Enter staff name..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Add Staff
          </button>
        </div>
      </form>

      {/* Mass Upload Info */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <div className="flex items-center">
          <Upload className="w-5 h-5 text-green-600 mr-3" />
          <div>
            <p className="text-sm font-medium text-green-900">Need to add multiple staff members?</p>
            <p className="text-sm text-green-700">
              Use the Mass Upload feature to import staff from CSV or text files with preview and validation.
            </p>
          </div>
        </div>
      </div>

      {/* Search Staff */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search staff..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Staff List */}
      <div className="space-y-4">
        {filteredStaff.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {searchTerm ? 'No staff found matching your search' : 'No staff members added yet'}
            </p>
          </div>
        ) : (
          filteredStaff.map((member, index) => {
            const reportCount = getStaffReportCount(member);

            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-900">{member.name}</span>
                  <span className="text-sm text-gray-600">
                    {reportCount} {reportCount === 1 ? 'report' : 'reports'} submitted
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveStaff(member)}
                  className="text-red-600 hover:text-red-700 focus:outline-none"
                >
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StaffManagerView; 