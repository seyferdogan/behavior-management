import { useState } from 'react';
import { useBehavior } from '../contexts/BehaviorContext';

export const useIncidentForm = () => {
  const { 
    formData,
    handleInputChange,
    resetForm,
    submitIncident,
    setShowThankYou,
    setShowForm
  } = useBehavior();

  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      'studentName',
      'grade',
      'incident',
      'location',
      'staffMember',
      'actionTaken'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });

    if (formData.description && formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }

    if (formData.actionTaken && formData.actionTaken.length < 5) {
      errors.actionTaken = 'Action taken must be at least 5 characters long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return false;
    }

    const success = submitIncident();
    if (success) {
      if (setShowForm) {
        setShowForm(false);
      }
      setShowThankYou(true);
    }
    return success;
  };

  const handleClear = () => {
    resetForm();
    setValidationErrors({});
  };

  return {
    formData,
    handleInputChange,
    handleSubmit,
    handleClear,
    validationErrors,
    validateForm
  };
}; 