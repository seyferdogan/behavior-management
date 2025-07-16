import React from 'react';
import { useBehavior } from '../../contexts/BehaviorContext';

const EmailSettingsModal = () => {
  const {
    emailNotifications,
    setEmailNotifications,
    setShowEmailSettings
  } = useBehavior();

  const handleAddEmail = (e) => {
    const input = e.target.parentElement.querySelector('input');
    if (input.value.trim()) {
      setEmailNotifications({
        ...emailNotifications,
        adminEmails: [...emailNotifications.adminEmails, input.value.trim()]
      });
      input.value = '';
    }
  };

  const handleRemoveEmail = (index) => {
    setEmailNotifications({
      ...emailNotifications,
      adminEmails: emailNotifications.adminEmails.filter((_, i) => i !== index)
    });
  };

  const handleZoneChangeToggle = (zoneChange) => {
    if (emailNotifications.notifyOnZoneChanges.includes(zoneChange)) {
      setEmailNotifications({
        ...emailNotifications,
        notifyOnZoneChanges: emailNotifications.notifyOnZoneChanges.filter(c => c !== zoneChange)
      });
    } else {
      setEmailNotifications({
        ...emailNotifications,
        notifyOnZoneChanges: [...emailNotifications.notifyOnZoneChanges, zoneChange]
      });
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Email Notification Settings</h1>
            <button
              onClick={() => setShowEmailSettings(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="space-y-8">
            {/* Email Notifications Toggle */}
            <div className="p-6 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Email Notifications</h2>
                  <p className="text-gray-600">Automatically notify administrators when students change behavior zones</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications.enabled}
                      onChange={(e) => setEmailNotifications({
                        ...emailNotifications,
                        enabled: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Administrator Email Addresses */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Administrator Email Addresses</h2>
              <div className="space-y-3">
                {emailNotifications.adminEmails.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center space-x-3">
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setEmailNotifications({
                          ...emailNotifications,
                          adminEmails: [...emailNotifications.adminEmails, e.target.value.trim()]
                        });
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddEmail}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Email Address
                  </button>
                </div>
              </div>
            </div>

            {/* Send Notifications For */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Notifications For</h2>
              <div className="space-y-3">
                {[
                  { key: 'Green to Yellow', label: 'Green to Yellow' },
                  { key: 'Yellow to Orange', label: 'Yellow to Orange' },
                  { key: 'Orange to Red', label: 'Orange to Red' }
                ].map((option) => (
                  <div key={option.key} className="flex items-center p-4 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      id={option.key}
                      checked={emailNotifications.notifyOnZoneChanges.includes(option.key)}
                      onChange={() => handleZoneChangeToggle(option.key)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={option.key} className="ml-3 text-gray-900 font-medium">
                      {option.label}
                    </label>
                  </div>
                ))}
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded mr-3"></div>
                    <span className="text-gray-600">Get notified when students move to higher risk zones requiring intervention</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Service Mode */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Service Mode</h2>
              <div className="space-y-4">
                <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      id="demo-mode"
                      name="emailMode"
                      checked={emailNotifications.emailService === 'demo'}
                      onChange={() => setEmailNotifications({
                        ...emailNotifications,
                        emailService: 'demo'
                      })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="demo-mode" className="ml-3 font-semibold text-gray-900">
                      Demo Mode (Recommended)
                    </label>
                  </div>
                  <p className="text-gray-600 ml-7">Show email content on screen - perfect for testing and demos</p>
                </div>

                <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg opacity-75">
                  <div className="flex items-center mb-2">
                    <input
                      type="radio"
                      id="emailjs-mode"
                      name="emailMode"
                      checked={false}
                      disabled
                      className="w-4 h-4 text-gray-400 bg-gray-100 border-gray-300 rounded"
                    />
                    <label htmlFor="emailjs-mode" className="ml-3 font-semibold text-gray-500">
                      EmailJS (Currently Unavailable)
                    </label>
                  </div>
                  <p className="text-gray-500 ml-7">External scripts are restricted in this environment</p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <span className="text-yellow-600 mr-2">💡</span>
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-2">For Real Email Sending:</h3>
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
              </div>
            </div>

            {/* Test Email Notification */}
            <div className="p-6 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Test Email Notification</h2>
              <p className="text-gray-600 mb-4">Send a test notification to verify your email settings</p>
              
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={handleTestEmail}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Send Test Email
                </button>
                <span className="text-gray-600">This will send a sample notification using your current settings</span>
              </div>

              <div className="p-3 bg-white border border-gray-200 rounded text-sm">
                <div className="font-medium text-gray-700 mb-1">Debug Info:</div>
                <div className="text-gray-600 space-y-1">
                  <div>Service: {emailNotifications.emailService}</div>
                  <div>Enabled: {emailNotifications.enabled ? 'Yes' : 'No'}</div>
                  <div>Admin Emails: {emailNotifications.adminEmails.join(', ') || 'None'}</div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  alert('Email settings saved successfully!');
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettingsModal; 