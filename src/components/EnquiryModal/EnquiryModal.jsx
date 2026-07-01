import React, { useState } from 'react';
import { apiService } from '../../services/api';
import './EnquiryModal.css';

export default function EnquiryModal({ isOpen, onClose, type = 'company', productName = '', companyName = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const enquiryData = {
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim() || null,
        description: formData.description.trim() || null,
        type,
        ...(type === 'product' && { productName }),
        companyName
      };

      await apiService.leads.create(enquiryData);

      alert('Enquiry submitted successfully!');
      setFormData({
        name: '',
        mobileNumber: '',
        email: '',
        description: ''
      });
      onClose();
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      alert('Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="enquiry-modal-overlay">
      <div className="enquiry-modal-container">
        <div className="enquiry-modal-header">
          <h2 className="enquiry-modal-title">
            {type === 'product' ? 'Product Enquiry' : 'Company Enquiry'}
          </h2>
          <button 
            className="enquiry-modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form className="enquiry-modal-form" onSubmit={handleSubmit}>
          {type === 'product' && (
            <div className="enquiry-form-group">
              <label htmlFor="productName" className="enquiry-form-label">
                Product Name
              </label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={productName}
                readOnly
                className="enquiry-form-input enquiry-form-readonly"
              />
            </div>
          )}

          <div className="enquiry-form-group">
            <label htmlFor="name" className="enquiry-form-label">
              Name <span className="enquiry-required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`enquiry-form-input ${errors.name ? 'enquiry-form-error' : ''}`}
              placeholder="Enter your name"
            />
            {errors.name && <span className="enquiry-error-message">{errors.name}</span>}
          </div>

          <div className="enquiry-form-group">
            <label htmlFor="mobileNumber" className="enquiry-form-label">
              Mobile Number <span className="enquiry-required">*</span>
            </label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              className={`enquiry-form-input ${errors.mobileNumber ? 'enquiry-form-error' : ''}`}
              placeholder="Enter your mobile number"
              maxLength={10}
            />
            {errors.mobileNumber && <span className="enquiry-error-message">{errors.mobileNumber}</span>}
          </div>

          <div className="enquiry-form-group">
            <label htmlFor="email" className="enquiry-form-label">
              Email ID <span className="enquiry-optional">(Optional)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`enquiry-form-input ${errors.email ? 'enquiry-form-error' : ''}`}
              placeholder="Enter your email"
            />
            {errors.email && <span className="enquiry-error-message">{errors.email}</span>}
          </div>

          <div className="enquiry-form-group">
            <label htmlFor="description" className="enquiry-form-label">
              Description <span className="enquiry-optional">(Optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="enquiry-form-textarea"
              placeholder="Enter your enquiry details"
              rows={4}
            />
          </div>

          <div className="enquiry-modal-actions">
            <button
              type="button"
              className="enquiry-btn enquiry-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="enquiry-btn enquiry-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
