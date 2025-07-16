import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INCIDENT_POINTS, 
  INITIAL_EMAIL_SETTINGS,
  INITIAL_FORM_DATA,
  ZONE_THRESHOLDS
} from '../utils/constants';
import apiService from '../utils/api';

const BehaviorContext = createContext();

export const useBehavior = () => {
  const context = useContext(BehaviorContext);
  if (!context) {
    throw new Error('useBehavior must be used within a BehaviorProvider');
  }
  return context;
};

export const BehaviorProvider = ({ children }) => {
  // Core data states
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [emailNotifications, setEmailNotifications] = useState(INITIAL_EMAIL_SETTINGS);
  
  // Loading states
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [apiError, setApiError] = useState(null);

  // View state
  const [activeView, setActiveView] = useState('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Modal states
  const [showStudentManager, setShowStudentManager] = useState(false);
  const [showStaffManager, setShowStaffManager] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showStudentProfiles, setShowStudentProfiles] = useState(false);

  // Form data states
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [formGradeFilter, setFormGradeFilter] = useState('');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Authentication states
  const [isTeacherMode, setIsTeacherMode] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  // Debug state
  const [debugMessage, setDebugMessage] = useState('');

  // Load initial data from API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setApiError(null);
        
        // Load students
        setIsLoadingStudents(true);
        const studentsData = await apiService.getStudents();
        setStudents(studentsData);
        setIsLoadingStudents(false);
        
        // Load incidents
        setIsLoadingIncidents(true);
        const incidentsData = await apiService.getIncidents();
        setIncidents(incidentsData);
        setIsLoadingIncidents(false);
        
        // Load staff
        setIsLoadingStaff(true);
        const staffData = await apiService.getStaff();
        setStaff(staffData);
        setIsLoadingStaff(false);
        
        console.log('✅ API Data loaded successfully:', {
          students: studentsData.length,
          incidents: incidentsData.length,
          staff: staffData.length
        });
        
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
        setApiError(error.message);
        setIsLoadingStudents(false);
        setIsLoadingIncidents(false);
        setIsLoadingStaff(false);
        
        // Fallback to empty arrays instead of mock data
        setStudents([]);
        setIncidents([]);
        setStaff([]);
      }
    };

    loadInitialData();
  }, []);

  // Utility functions
  const calculateStudentZone = (studentName) => {
    const studentIncidents = incidents.filter(incident => incident.studentName === studentName);
    const totalPoints = studentIncidents.reduce((sum, incident) => {
      return sum + (INCIDENT_POINTS[incident.incident] || 0);
    }, 0);

    let zone = 'Green';
    if (totalPoints >= ZONE_THRESHOLDS.Red) {
      zone = 'Red';
    } else if (totalPoints >= ZONE_THRESHOLDS.Orange) {
      zone = 'Orange';
    } else if (totalPoints >= ZONE_THRESHOLDS.Yellow) {
      zone = 'Yellow';
    }

    return { zone, points: totalPoints };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If selecting a student, also auto-populate the grade
    if (name === 'studentName' && value) {
      const selectedStudent = students.find(student => student.name === value);
      if (selectedStudent) {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          grade: selectedStudent.grade 
        }));
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const newIncidentData = {
        ...formData,
        date: formData.date || new Date().toISOString().split('T')[0],
        time: formData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Create incident via API
      const newIncident = await apiService.createIncident(newIncidentData);
      
      // Update local state with the new incident
      setIncidents(prev => [newIncident, ...prev]);
      
      setFormData(INITIAL_FORM_DATA);
      setShowThankYou(true);

      console.log('✅ Incident created successfully:', newIncident);

      // Check for zone changes and send notifications
      if (emailNotifications.enabled) {
        const prevZone = calculateStudentZone(newIncident.studentName).zone;
        const newZone = calculateStudentZone(newIncident.studentName).zone;
        
        if (prevZone !== newZone) {
          const zoneChange = `${prevZone} to ${newZone}`;
          if (emailNotifications.notifyOnZoneChanges.includes(zoneChange)) {
            // In demo mode, show alert instead of sending email
            if (emailNotifications.emailService === 'demo') {
              alert(`📧 ZONE CHANGE NOTIFICATION\n\n` +
                    `Student: ${newIncident.studentName}\n` +
                    `Zone Change: ${zoneChange}\n` +
                    `Date: ${new Date().toLocaleDateString()}\n` +
                    `Time: ${new Date().toLocaleTimeString()}\n\n` +
                    `Recipients: ${emailNotifications.adminEmails.join(', ')}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error creating incident:', error);
      setApiError(error.message);
      
      // Show error to user
      alert(`Error creating incident: ${error.message}`);
    }
  };

  const handleClear = () => {
    setFormData(INITIAL_FORM_DATA);
    setFormGradeFilter('');
  };

  // Function to reload data from API
  const reloadData = async (type = 'all') => {
    try {
      setApiError(null);
      
      if (type === 'all' || type === 'students') {
        setIsLoadingStudents(true);
        const studentsData = await apiService.getStudents();
        setStudents(studentsData);
        setIsLoadingStudents(false);
      }
      
      if (type === 'all' || type === 'incidents') {
        setIsLoadingIncidents(true);
        const incidentsData = await apiService.getIncidents();
        setIncidents(incidentsData);
        setIsLoadingIncidents(false);
      }
      
      if (type === 'all' || type === 'staff') {
        setIsLoadingStaff(true);
        const staffData = await apiService.getStaff();
        setStaff(staffData);
        setIsLoadingStaff(false);
      }
      
      console.log(`✅ ${type} data reloaded successfully`);
    } catch (error) {
      console.error(`❌ Error reloading ${type} data:`, error);
      setApiError(error.message);
    }
  };

  const value = {
    // Core data
    students,
    setStudents,
    staff,
    setStaff,
    incidents,
    setIncidents,
    emailNotifications,
    setEmailNotifications,

    // Loading states
    isLoadingStudents,
    isLoadingIncidents,
    isLoadingStaff,
    apiError,
    setApiError,

    // View state
    activeView,
    setActiveView,
    showForm,
    setShowForm,
    showThankYou,
    setShowThankYou,
    showAdminLogin,
    setShowAdminLogin,

    // Modal states
    showStudentManager,
    setShowStudentManager,
    showStaffManager,
    setShowStaffManager,
    showEmailSettings,
    setShowEmailSettings,
    showStudentProfiles,
    setShowStudentProfiles,

    // Form data
    formData,
    setFormData,
    newStudentName,
    setNewStudentName,
    newStudentGrade,
    setNewStudentGrade,
    newStaffName,
    setNewStaffName,
    formGradeFilter,
    setFormGradeFilter,

    // Search and filter
    searchTerm,
    setSearchTerm,
    filterSeverity,
    setFilterSeverity,
    selectedStudent,
    setSelectedStudent,

    // Authentication
    isTeacherMode,
    setIsTeacherMode,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    adminPassword,
    setAdminPassword,

    // Debug state
    debugMessage,
    setDebugMessage,

    // Utility functions
    calculateStudentZone,
    handleInputChange,
    handleSubmit,
    handleClear,
    reloadData
  };

  return (
    <BehaviorContext.Provider value={value}>
      {children}
    </BehaviorContext.Provider>
  );
};

export default BehaviorContext; 