import React from 'react';
import { useBehavior } from '../../contexts/BehaviorContext';

const ThankYouModal = () => {
  const { setShowThankYou } = useBehavior();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto pt-20">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-bold">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 text-lg mb-8">
            Your incident report has been submitted successfully.
          </p>
          <button
            onClick={() => setShowThankYou(false)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouModal; 