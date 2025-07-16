import React, { useEffect } from 'react';
import { useBehavior } from '../contexts/BehaviorContext';

// Import modals/views
import AdminLoginModal from './modals/AdminLoginModal';
import ThankYouModal from './modals/ThankYouModal';
import IncidentFormModal from './modals/IncidentFormModal';
import StudentManagerModal from './modals/StudentManagerModal';
import StaffManagerModal from './modals/StaffManagerModal';
import EmailSettingsModal from './modals/EmailSettingsModal';
import StudentProfilesModal from './modals/StudentProfilesModal';
import TeacherView from './views/TeacherView';
import AdminView from './views/AdminView';

const BehaviorManagementApp = () => {
  const {
    showForm,
    showStudentManager,
    showStaffManager,
    showEmailSettings,
    showStudentProfiles,
    showThankYou,
    showAdminLogin,
    isTeacherMode,
    isAdminAuthenticated,
    setIsTeacherMode,
    setShowAdminLogin,
    setIsAdminAuthenticated
  } = useBehavior();

  // Function to update URL parameters
  const updateURL = (mode) => {
    const url = new URL(window.location);
    url.searchParams.set('mode', mode);
    window.history.replaceState({}, '', url);
  };

  // Check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'teacher') {
      // Set to teacher mode for incident reporting
      setIsTeacherMode(true);
      setIsAdminAuthenticated(false);
      updateURL('teacher');
    } else if (mode === 'admin') {
      // Show admin login modal for admin access
      setIsTeacherMode(false);
      setShowAdminLogin(true);
      updateURL('admin');
    } else {
      // Default to teacher mode if no parameter
      setIsTeacherMode(true);
      updateURL('teacher');
    }
  }, [setIsTeacherMode, setIsAdminAuthenticated, setShowAdminLogin]);

  // Update URL when mode changes
  useEffect(() => {
    if (isTeacherMode) {
      updateURL('teacher');
    } else if (isAdminAuthenticated) {
      updateURL('admin');
    }
  }, [isTeacherMode, isAdminAuthenticated]);

  const handleModeSwitch = () => {
    if (isTeacherMode) {
      // Switching to Admin Mode requires authentication
      setShowAdminLogin(true);
      updateURL('admin');
    } else {
      // Switching back to Teacher Mode
      setIsTeacherMode(true);
      setIsAdminAuthenticated(false);
      updateURL('teacher');
    }
  };

  // Render modals
  if (showAdminLogin) return <AdminLoginModal />;
  if (showForm && !isTeacherMode) return <IncidentFormModal />;
  if (showStudentManager) return <StudentManagerModal />;
  if (showStaffManager) return <StaffManagerModal />;
  if (showEmailSettings) return <EmailSettingsModal />;
  if (showStudentProfiles) return <StudentProfilesModal />;
  if (showThankYou) return <ThankYouModal />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-gray-900">
                  Behavior Management System
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleModeSwitch}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isTeacherMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isTeacherMode ? 'Switch to Admin Mode' : 'Switch to Teacher Mode'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {isTeacherMode || !isAdminAuthenticated ? <TeacherView /> : <AdminView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Behavior Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BehaviorManagementApp; 