import React, { useState } from 'react';
import { Users, Upload, Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useBehavior } from '../../contexts/BehaviorContext';
import ConfirmationModal from './ConfirmationModal';

const StaffManagerModal = () => {
  const {
    staff,
    setStaff,
    incidents,
    newStaffName,
    setNewStaffName,
    setShowStaffManager
  } = useBehavior();

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Enhanced mass upload states
  const [uploadPreview, setUploadPreview] = useState({
    isOpen: false,
    staff: [],
    duplicates: [],
    errors: [],
    fileName: ''
  });

  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    status: ''
  });

  const handleAddStaff = () => {
    if (newStaffName.trim()) {
      setStaff([...staff, newStaffName.trim()].sort());
      setNewStaffName('');
    }
  };

  // Enhanced file upload with preview
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadProgress({ isUploading: true, progress: 25, status: 'Reading file...' });

      const reader = new FileReader();
      reader.onload = (event) => {
      try {
        const content = event.target.result;
        const parsedData = parseStaffFile(content, file.name);
        
        setUploadProgress({ isUploading: true, progress: 75, status: 'Processing staff...' });
        
        // Process the data and show preview
        const existingStaff = new Set(staff.map(s => s.toLowerCase()));
        const newStaff = [];
        const duplicates = [];
        const errors = [];

        parsedData.forEach((member, index) => {
          if (!member.trim()) {
            errors.push(`Row ${index + 1}: Empty staff name`);
            return;
          }

          if (member.trim().length < 2) {
            errors.push(`Row ${index + 1}: Staff name too short (${member.trim()})`);
            return;
          }

          if (existingStaff.has(member.toLowerCase())) {
            duplicates.push(member);
          } else {
            newStaff.push(member);
          }
        });

        setUploadProgress({ isUploading: true, progress: 100, status: 'Complete!' });
        
        setTimeout(() => {
          setUploadProgress({ isUploading: false, progress: 0, status: '' });
          setUploadPreview({
            isOpen: true,
            staff: newStaff,
            duplicates,
            errors,
            fileName: file.name
          });
        }, 500);

      } catch (error) {
        setUploadProgress({ isUploading: false, progress: 0, status: '' });
        alert('Error reading file. Please check the file format.');
      }
    };

      reader.readAsText(file);
  };

  // Parse different file formats
  const parseStaffFile = (content, fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (extension === 'csv') {
      return parseCSV(content);
    } else {
      // Plain text file - one name per line
      return content.split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    }
  };

  // Enhanced CSV parsing
  const parseCSV = (content) => {
    const lines = content.split('\n');
    const staffMembers = [];
    
    // Skip header if it exists
    const hasHeader = lines[0] && (
      lines[0].toLowerCase().includes('name') ||
      lines[0].toLowerCase().includes('staff') ||
      lines[0].toLowerCase().includes('first') ||
      lines[0].toLowerCase().includes('last') ||
      lines[0].toLowerCase().includes('teacher') ||
      lines[0].toLowerCase().includes('employee')
    );
    
    const startIndex = hasHeader ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      if (columns.length === 1) {
        // Single column - just the name
        staffMembers.push(columns[0]);
      } else if (columns.length >= 2) {
        // Multiple columns - assume first is first name, second is last name
        const firstName = columns[0];
        const lastName = columns[1];
        if (firstName && lastName) {
          staffMembers.push(`${firstName} ${lastName}`);
        } else if (firstName) {
          staffMembers.push(firstName);
        }
      }
    }
    
    return staffMembers;
  };

  // Confirm and add staff from preview
  const confirmUpload = () => {
    const newStaff = [...new Set([...staff, ...uploadPreview.staff])].sort();
    setStaff(newStaff);
    setUploadPreview({ isOpen: false, staff: [], duplicates: [], errors: [], fileName: '' });
    
    // Show success message
    const addedCount = uploadPreview.staff.length;
    alert(`Successfully added ${addedCount} staff ${addedCount === 1 ? 'member' : 'members'}!`);
  };

  // Download template file
  const downloadTemplate = () => {
    const csvContent = `Staff Name
John Smith
Jane Doe
Mike Johnson
Sarah Wilson`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRemoveStaff = (member) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Staff Member',
      message: `Are you sure you want to remove ${member}?`,
      onConfirm: () => setStaff(staff.filter(s => s !== member))
    });
  };

  const handleClearAllStaff = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Staff',
      message: 'Are you sure you want to remove all staff members? This action cannot be undone.',
      onConfirm: () => setStaff([])
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      {/* Upload Preview Modal */}
      {uploadPreview.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Preview Import</h2>
                <button
                  onClick={() => setUploadPreview({ isOpen: false, staff: [], duplicates: [], errors: [], fileName: '' })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">File: {uploadPreview.fileName}</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">New Staff</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{uploadPreview.staff.length}</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">Duplicates</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-700">{uploadPreview.duplicates.length}</div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <X className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">Errors</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700">{uploadPreview.errors.length}</div>
                </div>
              </div>

              {/* New Staff */}
              {uploadPreview.staff.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Staff to Add</h3>
                  <div className="bg-green-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {uploadPreview.staff.map((member, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {uploadPreview.duplicates.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Duplicates (Will be skipped)</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {uploadPreview.duplicates.map((member, index) => (
                        <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {uploadPreview.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Errors</h3>
                  <div className="bg-red-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                    <ul className="text-sm text-red-800 space-y-1">
                      {uploadPreview.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setUploadPreview({ isOpen: false, staff: [], duplicates: [], errors: [], fileName: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploadPreview.staff.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add {uploadPreview.staff.length} Staff Members
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Manage Staff</h1>
            <button
              onClick={() => setShowStaffManager(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Add Individual Staff Member */}
          <div className="mb-8 p-6 bg-green-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Individual Staff Member</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStaff()}
                  placeholder="Enter staff member name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                onClick={handleAddStaff}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Add Staff
              </button>
            </div>
          </div>

          {/* Enhanced File Upload Section */}
          <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Mass Upload Staff</h3>
              <p className="text-gray-600 mb-4">
                Upload a CSV or text file with staff names. Supports multiple formats.
              </p>
              
              {/* Upload Progress */}
              {uploadProgress.isUploading && (
            <div className="mb-4">
                  <div className="bg-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-blue-800">{uploadProgress.status}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.progress}%` }}
                      ></div>
                    </div>
                  </div>
            </div>
              )}
            
              <div className="flex items-center justify-center space-x-4">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="staff-upload"
                  disabled={uploadProgress.isUploading}
            />
            
            <label
              htmlFor="staff-upload"
                  className={`inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium ${
                    uploadProgress.isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
            >
                  <Upload className="w-5 h-5 mr-2" />
                  Choose File
            </label>
                
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Template
                </button>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>Supported formats: CSV, TXT (max 5MB)</p>
                <p>CSV format: "Staff Name" or "First Name, Last Name"</p>
                <p>Text format: One name per line</p>
              </div>
            </div>
          </div>

          {/* Current Staff List */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current Staff ({staff.length})
            </h2>
            
            {staff.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No staff members added yet.</p>
                <p className="text-sm">Add staff members using the form above or upload a file.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {staff.map((member, index) => {
                  const memberIncidents = incidents.filter(incident => incident.staffMember === member);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{member}</h3>
                        <p className="text-sm text-gray-600">
                          {memberIncidents.length} {memberIncidents.length === 1 ? 'report' : 'reports'} submitted
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveStaff(member)}
                        className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {staff.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total: {staff.length} staff {staff.length === 1 ? 'member' : 'members'}
                </p>
                <button
                  onClick={handleClearAllStaff}
                  className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors text-sm font-medium"
                >
                  Clear All Staff
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagerModal; 