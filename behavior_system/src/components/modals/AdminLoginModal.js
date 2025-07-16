import React, { useState } from 'react';
import { useBehavior } from '../../contexts/BehaviorContext';

const AdminLoginModal = () => {
  const {
    setShowAdminLogin,
    setIsAdminAuthenticated,
    setIsTeacherMode
  } = useBehavior();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleAdminLogin = () => {
    // In a real application, these would be stored securely and validated against a backend
    const validCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'principal', password: 'admin123' }
    ];

    const isValid = validCredentials.some(
      cred => cred.username === formData.username && cred.password === formData.password
    );

    if (isValid) {
      setIsAdminAuthenticated(true);
      setShowAdminLogin(false);
      setIsTeacherMode(false);
      setFormData({ username: '', password: '' });
    } else {
      setError('Invalid username or password. Please try again.');
      setFormData(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <span className="text-white font-bold text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
            <p className="text-gray-600">Please enter your admin credentials to access management features</p>
          </div>
          
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter username..."
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter password..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAdminLogin(false);
                  setFormData({ username: '', password: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminLogin}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Login
              </button>
            </div>
          </div>
          
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Demo Credentials:</strong><br/>
              Username: admin or principal<br/>
              Password: admin123<br/>
              <small>In production, these would be stored securely and validated against a backend</small>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal; 