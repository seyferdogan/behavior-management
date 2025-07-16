import React from 'react';
import { Users, Settings, FileText, BarChart } from 'lucide-react';
import { useBehavior } from '../../contexts/BehaviorContext';

// Import view components
import DashboardView from '../views/DashboardView';
import StudentManagerView from '../views/StudentManagerView';
import StaffManagerView from '../views/StaffManagerView';
import EmailSettingsView from '../views/EmailSettingsView';
import StudentProfilesView from '../views/StudentProfilesView';

const AdminLayout = () => {
  const {
    students,
    staff,
    incidents,
    activeView,
    setActiveView
  } = useBehavior();

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'students':
        return <StudentManagerView />;
      case 'profiles':
        return <StudentProfilesView />;
      case 'staff':
        return <StaffManagerView />;
      case 'email':
        return <EmailSettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Sidebar */}
      <div className="w-64 bg-white shadow-sm p-4 flex flex-col space-y-2">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`w-full p-3 text-left rounded-lg transition-colors group ${
            activeView === 'dashboard' ? 'bg-indigo-50' : 'hover:bg-indigo-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              activeView === 'dashboard' ? 'bg-indigo-200' : 'bg-indigo-100 group-hover:bg-indigo-200'
            }`}>
              <BarChart className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Dashboard</div>
              <div className="text-sm text-gray-600">{incidents.length} total incidents</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveView('students')}
          className={`w-full p-3 text-left rounded-lg transition-colors group ${
            activeView === 'students' ? 'bg-blue-50' : 'hover:bg-blue-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              activeView === 'students' ? 'bg-blue-200' : 'bg-blue-100 group-hover:bg-blue-200'
            }`}>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Manage Students</div>
              <div className="text-sm text-gray-600">{students.length} enrolled</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveView('profiles')}
          className={`w-full p-3 text-left rounded-lg transition-colors group ${
            activeView === 'profiles' ? 'bg-yellow-50' : 'hover:bg-yellow-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              activeView === 'profiles' ? 'bg-yellow-200' : 'bg-yellow-100 group-hover:bg-yellow-200'
            }`}>
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Student Profiles</div>
              <div className="text-sm text-gray-600">View detailed info</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveView('staff')}
          className={`w-full p-3 text-left rounded-lg transition-colors group ${
            activeView === 'staff' ? 'bg-green-50' : 'hover:bg-green-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              activeView === 'staff' ? 'bg-green-200' : 'bg-green-100 group-hover:bg-green-200'
            }`}>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Manage Staff</div>
              <div className="text-sm text-gray-600">{staff.length} members</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveView('email')}
          className={`w-full p-3 text-left rounded-lg transition-colors group ${
            activeView === 'email' ? 'bg-purple-50' : 'hover:bg-purple-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              activeView === 'email' ? 'bg-purple-200' : 'bg-purple-100 group-hover:bg-purple-200'
            }`}>
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Email Settings</div>
              <div className="text-sm text-gray-600">Configure alerts</div>
            </div>
          </div>
        </button>

        <div className="w-full p-3 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Total Reports</div>
              <div className="text-sm text-gray-600">{incidents.length} total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default AdminLayout; 