import React, { useState } from 'react';
import { useBehavior } from '../../contexts/BehaviorContext';

const EmailSettingsView = () => {
  const {
    emailNotifications,
    setEmailNotifications
  } = useBehavior();

  const [newEmail, setNewEmail] = useState('');

  const handleToggleEnabled = () => {
    setEmailNotifications(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (newEmail.trim() && !emailNotifications.adminEmails.includes(newEmail.trim())) {
      setEmailNotifications(prev => ({
        ...prev,
        adminEmails: [...prev.adminEmails, newEmail.trim()]
      }));
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmailNotifications(prev => ({
      ...prev,
      adminEmails: prev.adminEmails.filter(email => email !== emailToRemove)
    }));
  };

  const handleToggleZoneChange = (zoneChange) => {
    setEmailNotifications(prev => {
      const notifyOnZoneChanges = prev.notifyOnZoneChanges.includes(zoneChange)
        ? prev.notifyOnZoneChanges.filter(change => change !== zoneChange)
        : [...prev.notifyOnZoneChanges, zoneChange];

      return {
        ...prev,
        notifyOnZoneChanges
      };
    });
  };

  const handleTestEmail = () => {
    if (emailNotifications.enabled && emailNotifications.adminEmails.length > 0) {
      alert(`📧 TEST EMAIL NOTIFICATION\n\n` +
            `Subject: [DEMO] Student Zone Change Alert - Taqwa School\n\n` +
            `Dear Administrator,\n\n` +
            `This is a test notification from the Taqwa School Behavior Management System.\n\n` +
            `Student: Test Student\n` +
            `Zone Change: Green → Yellow\n` +
            `Points: 25\n` +
            `Date: ${new Date().toLocaleDateString()}\n` +
            `Time: ${new Date().toLocaleTimeString()}\n\n` +
            `Please review the student's recent incidents in the dashboard.\n\n` +
            `Best regards,\n` +
            `Taqwa School Behavior Management System\n\n` +
            `Recipients: ${emailNotifications.adminEmails.join(', ')}`);
    } else {
      alert('Please enable notifications and add at least one email address first.');
    }
  };

  const zoneChanges = [
    'Green to Yellow',
    'Yellow to Orange',
    'Orange to Red',
    'Red to Orange',
    'Orange to Yellow',
    'Yellow to Green'
  ];

  return (
    <div className="space-y-6">
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Email Settings</h2>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            All Features Available
          </div>
        </div>

      {/* Enable/Disable Notifications */}
      <div className="mb-8">
        <label className="flex items-center space-x-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={emailNotifications.enabled}
              onChange={handleToggleEnabled}
              className="sr-only"
            />
            <div className={`block w-14 h-8 rounded-full transition-colors ${
              emailNotifications.enabled ? 'bg-purple-600' : 'bg-gray-300'
            }`}>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${
                emailNotifications.enabled ? 'translate-x-6' : ''
              }`} />
            </div>
          </div>
          <span className="font-medium text-gray-900">
            {emailNotifications.enabled ? 'Notifications Enabled' : 'Notifications Disabled'}
          </span>
        </label>
      </div>

      {/* Email Service Selection */}
      <div className="mb-8">
        <h3 className="text-md font-medium text-gray-900 mb-3">Email Service</h3>
        <select
          value={emailNotifications.emailService}
          onChange={(e) => setEmailNotifications(prev => ({
            ...prev,
            emailService: e.target.value
          }))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="demo">Demo Mode (Alert)</option>
          <option value="smtp">SMTP Server</option>
          <option value="api">Email API</option>
        </select>
          
          {/* Service Mode Information */}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              {emailNotifications.emailService === 'demo' ? (
                <div>
                  <span className="font-medium text-gray-700">Demo Mode:</span> Shows email content on screen - perfect for testing and demos.
                </div>
              ) : (
                <div>
                  <span className="font-medium text-gray-700">Production Mode:</span> Requires EmailJS setup or SMTP configuration.
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Admin Emails */}
      <div className="mb-8">
        <h3 className="text-md font-medium text-gray-900 mb-3">Admin Email Addresses</h3>
        <form onSubmit={handleAddEmail} className="mb-4">
          <div className="flex space-x-4">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter admin email..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Add Email
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {emailNotifications.adminEmails.length === 0 ? (
            <p className="text-gray-600">No admin emails added yet</p>
          ) : (
            emailNotifications.adminEmails.map((email, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <span className="text-gray-900">{email}</span>
                <button
                  onClick={() => handleRemoveEmail(email)}
                  className="text-red-600 hover:text-red-700 focus:outline-none"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zone Change Notifications */}
        <div className="mb-8">
        <h3 className="text-md font-medium text-gray-900 mb-3">Zone Change Notifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zoneChanges.map((change, index) => (
            <label key={index} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications.notifyOnZoneChanges.includes(change)}
                onChange={() => handleToggleZoneChange(change)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-gray-900">{change}</span>
            </label>
          ))}
          </div>
        </div>

        {/* Test Email Section */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-2">Test Email Notification</h3>
          <p className="text-sm text-gray-600 mb-4">Send a test notification to verify your email settings</p>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleTestEmail}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Send Test Email
            </button>
            <span className="text-sm text-gray-600">This will show a sample notification using your current settings</span>
          </div>
        </div>
      </div>

      {/* EmailJS Integration Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">EmailJS Integration</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-yellow-600 mr-2">💡</span>
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">For Real Email Sending:</h4>
                <p className="text-yellow-700 mb-2">To send actual emails, you'll need to:</p>
                <ol className="text-yellow-700 text-sm space-y-1 ml-4">
                  <li>1. Copy this code to your own development environment</li>
                  <li>2. Set up EmailJS account at <span className="font-mono bg-yellow-100 px-1 rounded">emailjs.com</span></li>
                  <li>3. Configure your email service (Gmail, Outlook, etc.)</li>
                  <li>4. Create an email template</li>
                  <li>5. Add your EmailJS credentials to the code</li>
                </ol>
                <p className="text-yellow-700 mt-3 font-medium">
                  For now, Demo Mode will show you exactly what emails would be sent!
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">🔧</span>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Current Setup:</h4>
                <div className="text-blue-700 text-sm space-y-1">
                  <div>Service: <span className="font-mono bg-blue-100 px-1 rounded">{emailNotifications.emailService}</span></div>
                  <div>Status: <span className="font-semibold">{emailNotifications.enabled ? 'Enabled' : 'Disabled'}</span></div>
                  <div>Admin Emails: <span className="font-mono bg-blue-100 px-1 rounded">{emailNotifications.adminEmails.join(', ') || 'None'}</span></div>
                  <div>Zone Changes: <span className="font-mono bg-blue-100 px-1 rounded">{emailNotifications.notifyOnZoneChanges.length} configured</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettingsView; 