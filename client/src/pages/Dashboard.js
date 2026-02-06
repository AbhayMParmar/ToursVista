import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './dashboard.css';

// Replace line 6:
const API_URL = process.env.REACT_APP_API_URL || 'https://toursvista.onrender.com/api';

// Constants for timeout and retry
const API_TIMEOUT = 15000; // 15 seconds timeout
const MAX_RETRIES = 2; // Maximum retry attempts
const RETRY_DELAY = 1000; // 1 second delay between retries

// Enhanced axios instance with default timeout
const apiClient = axios.create({
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Helper function for API calls with retry logic
const fetchWithRetry = async (url, config = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await apiClient({
        url,
        ...config,
        timeout: API_TIMEOUT
      });
      return response;
    } catch (error) {
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Only retry on timeout or network errors
      if (error.code === 'ECONNABORTED' || !error.response) {
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        continue;
      }
      
      // For other errors (4xx, 5xx), don't retry
      throw error;
    }
  }
};

// Save booking to database with CONFIRMED status - FIXED
const saveBooking = async (bookingData) => {
  try {
    console.log('📤 Sending booking data:', bookingData);
    
    const response = await fetchWithRetry(`${API_URL}/bookings`, {
      method: 'POST',
      data: {
        user: bookingData.user,
        tour: bookingData.tour,
        participants: bookingData.participants,
        travelers: bookingData.participants, // Send both for compatibility
        travelDate: bookingData.travelDate,
        specialRequirements: bookingData.specialRequirements || '',
        specialRequests: bookingData.specialRequirements || '', // Send both
        contactNumber: bookingData.contactNumber,
        email: bookingData.email || '', // Add email field
        status: 'confirmed'
      }
    });
    
    console.log('✅ Booking response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('🔥 Error saving booking:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Booking request timeout. Please try again.');
    }
    
    if (error.response?.data?.errors) {
      throw new Error(`Validation failed: ${error.response.data.errors.join(', ')}`);
    }
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw error;
  }
};

// Get saved tours from database for a user
const getSavedToursFromDB = async (userId) => {
  try {
    const response = await fetchWithRetry(`${API_URL}/saved/${userId}`);
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching saved tours from DB:', error);
    return [];
  }
};

// Save tour to database for a user
const saveTourToDB = async (userId, tourId) => {
  try {
    const response = await fetchWithRetry(`${API_URL}/saved`, {
      method: 'POST',
      data: { userId, tourId }
    });
    return response.data;
  } catch (error) {
    console.error('Error saving tour to DB:', error);
    throw error;
  }
};

// Remove saved tour from database for a user
const removeSavedTourFromDB = async (userId, tourId) => {
  try {
    const response = await fetchWithRetry(`${API_URL}/saved/${userId}/${tourId}`, {
      method: 'DELETE'
    });
    return response.data;
  } catch (error) {
    console.error('Error removing saved tour from DB:', error);
    throw error;
  }
};

// Submit rating for a tour
const submitTourRating = async (userId, tourId, rating, review = '') => {
  try {
    const response = await fetchWithRetry(`${API_URL}/tours/${tourId}/rate`, {
      method: 'POST',
      data: {
        userId,
        rating,
        review
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
};

// Get tour ratings
const getTourRatings = async (tourId) => {
  try {
    const response = await fetchWithRetry(`${API_URL}/tours/${tourId}/ratings`);
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching tour ratings:', error);
    return [];
  }
};

// Check if user has already rated a tour
const checkUserRating = async (userId, tourId) => {
  try {
    const response = await fetchWithRetry(`${API_URL}/tours/${tourId}/rating/${userId}`);
    if (response.data.success) {
      return response.data.data || null;
    }
    return null;
  } catch (error) {
    console.error('Error checking user rating:', error);
    return null;
  }
};

// Toast Notification Component
const ToastNotification = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icon = type === 'success' ? '✓' : '⚠️';
  const title = type === 'success' ? 'Success!' : 'Error!';

  return (
    <div className="booking-toast">
      <div className="toast-icon">{icon}</div>
      <div className="toast-content">
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

// Rating Modal Component
const RatingModal = ({ tour, user, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState(null);

  useEffect(() => {
    const checkExistingRating = async () => {
      if (user && tour) {
        const existingRating = await checkUserRating(user._id, tour._id);
        if (existingRating) {
          setRating(existingRating.rating);
          setReview(existingRating.review || '');
          setUserRating(existingRating);
        }
      }
    };
    checkExistingRating();
  }, [user, tour]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await submitTourRating(user._id, tour._id, rating, review);
      
      if (response.success) {
        setIsSubmitting(false);
        onSubmit(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setIsSubmitting(false);
      alert(error.code === 'ECONNABORTED' 
        ? 'Request timeout. Please try again.' 
        : 'Error submitting rating. Please try again.'
      );
    }
  };

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleStarHover = (value) => {
    setHoverRating(value);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rate {tour.title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <form onSubmit={handleSubmit} className="booking-form">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⭐</div>
              <h4 style={{ marginBottom: '1rem', color: '#333' }}>
                {userRating ? 'Update Your Rating' : 'How was your experience?'}
              </h4>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Share your thoughts about this tour to help other travelers
              </p>
            </div>
            
            {/* Star Rating */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '2.5rem',
                      cursor: 'pointer',
                      padding: '0',
                      lineHeight: 1,
                      color: (hoverRating || rating) >= star ? '#FF9966' : '#ddd',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                {rating === 0 ? 'Select a rating' : 
                 rating === 1 ? 'Poor' :
                 rating === 2 ? 'Fair' :
                 rating === 3 ? 'Good' :
                 rating === 4 ? 'Very Good' : 'Excellent'}
              </div>
            </div>
            
            {/* Review Textarea */}
            <div className="booking-form-group">
              <label>Your Review (Optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience, what you liked, suggestions for improvement..."
                rows="4"
                style={{ fontSize: '1rem' }}
              />
              <span className="validation-hint">
                Max 500 characters. {500 - review.length} remaining
              </span>
            </div>
            
            {/* Summary */}
            <div className="booking-summary" style={{ background: '#FFF9F0', borderColor: '#FFE5CC' }}>
              <h4 style={{ color: '#FF9966' }}>Rating Summary</h4>
              <div className="booking-summary-item">
                <span>Tour:</span>
                <span>{tour.title}</span>
              </div>
              <div className="booking-summary-item">
                <span>Your Rating:</span>
                <span>
                  {rating > 0 ? (
                    <>
                      <span style={{ color: '#FF9966' }}>
                        {'★'.repeat(rating)}
                        {'☆'.repeat(5 - rating)}
                      </span>
                      <span style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>
                        {rating}.0
                      </span>
                    </>
                  ) : 'Not rated yet'}
                </span>
              </div>
              {userRating && (
                <div className="booking-summary-item">
                  <span>Previous Rating:</span>
                  <span>
                    <span style={{ color: '#FF9966' }}>
                      {'★'.repeat(userRating.rating)}
                      {'☆'.repeat(5 - userRating.rating)}
                    </span>
                    <span style={{ marginLeft: '0.5rem' }}>
                      {userRating.rating}.0
                    </span>
                  </span>
                </div>
              )}
            </div>
          </form>
        </div>
        
        <div className="modal-buttons">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-confirm" 
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? 'Submitting...' : userRating ? 'Update Rating' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Star Rating Display Component - ENHANCED with proper star rendering
const StarRating = ({ rating, size = 'medium', showNumber = true, showCount = false, totalRatings = 0 }) => {
  const starSize = size === 'small' ? '1rem' : size === 'medium' ? '1.5rem' : '2rem';
  
  // Calculate full stars and partial stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {/* Full stars */}
        {Array(fullStars).fill().map((_, i) => (
          <span
            key={`full-${i}`}
            style={{
              fontSize: starSize,
              color: '#FF9966',
              lineHeight: 1
            }}
          >
            ★
          </span>
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <span
            style={{
              fontSize: starSize,
              color: '#FF9966',
              lineHeight: 1,
              position: 'relative'
            }}
          >
            ★
            <span style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '50%',
              overflow: 'hidden',
              color: '#ddd'
            }}>
              ★
            </span>
          </span>
        )}
        
        {/* Empty stars */}
        {Array(emptyStars).fill().map((_, i) => (
          <span
            key={`empty-${i}`}
            style={{
              fontSize: starSize,
              color: '#ddd',
              lineHeight: 1
            }}
          >
            ★
          </span>
        ))}
      </div>
      {showNumber && (
        <span style={{ 
          fontWeight: 'bold', 
          color: '#333',
          fontSize: size === 'small' ? '0.9rem' : '1.1rem'
        }}>
          {rating.toFixed(1)}
        </span>
      )}
      {showCount && totalRatings > 0 && (
        <span style={{ 
          fontSize: '0.9rem', 
          color: '#666',
          marginLeft: size === 'small' ? '0.25rem' : '0.5rem'
        }}>
          ({totalRatings})
        </span>
      )}
    </div>
  );
};

// Edit Profile Modal Component
const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          address: formData.address || ''
        }
      });
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setIsSubmitting(false);
        onUpdate(updatedUser);
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsSubmitting(false);
      alert(error.code === 'ECONNABORTED' 
        ? 'Request timeout. Please try again.' 
        : 'Error updating profile. Please try again.'
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="edit-profile-modal-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <form onSubmit={handleSubmit} className="edit-profile-form">
            <div className={`profile-form-group ${errors.name ? 'error' : ''}`}>
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            
            <div className={`profile-form-group ${errors.email ? 'error' : ''}`}>
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="profile-form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="profile-form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your address"
              />
            </div>
          </form>
        </div>
        
        <div className="modal-buttons">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-confirm" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Get tours from database with retry
const getTours = async () => {
  try {
    const response = await fetchWithRetry(`${API_URL}/tours`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching tours:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Server is taking too long to respond. Please try again.');
    }
    return [];
  }
};

// Get user bookings from database with retry
const getUserBookings = async (userId) => {
  try {
    const response = await fetchWithRetry(`${API_URL}/bookings/user/${userId}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Unable to load bookings. Please try again.');
    }
    return [];
  }
};

// Update booking status in database
const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await fetchWithRetry(`${API_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      data: { status }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating booking:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }
    throw error;
  }
};

// Booking Modal Component - FIXED to create confirmed booking
const BookingModal = ({ tour, user, onClose, onConfirm }) => {
  const [bookingData, setBookingData] = useState({
    travelers: 1,
    travelDate: '',
    specialRequests: '',
    contactNumber: '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  // Mobile-friendly increment/decrement functions
  const increaseTravelers = () => {
    if (bookingData.travelers < 10) {
      setBookingData(prev => ({
        ...prev,
        travelers: prev.travelers + 1
      }));
    }
  };

  const decreaseTravelers = () => {
    if (bookingData.travelers > 1) {
      setBookingData(prev => ({
        ...prev,
        travelers: prev.travelers - 1
      }));
    }
  };

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'travelers':
        if (value < 1) return 'Number of travelers must be at least 1';
        if (value > 10) return 'Maximum 10 travelers allowed';
        return '';
      
      case 'travelDate':
        if (!value) return 'Travel date is required';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) return 'Travel date cannot be in the past';
        return '';
      
      case 'contactNumber':
        if (!value) return 'Contact number is required';
        if (!/^\d{10}$/.test(value)) return 'Contact number must be 10 digits';
        return '';
      
      case 'email':
        if (!value) return 'Email address is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
        return '';
      
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(bookingData).forEach(key => {
      if (key !== 'specialRequests') {
        const error = validateField(key, bookingData[key]);
        if (error) newErrors[key] = error;
      }
    });
    return newErrors;
  };

  // Calculate total price
  const calculatePrice = (price, travelers) => {
    return price * travelers;
  };

  const totalPrice = calculatePrice(tour.price, bookingData.travelers);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(bookingData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const booking = {
        user: user._id,
        tour: tour._id,
        participants: bookingData.travelers,
        travelDate: bookingData.travelDate,
        specialRequirements: bookingData.specialRequests,
        contactNumber: bookingData.contactNumber,
        email: bookingData.email || user.email // Use form email or user email
      };
      
      console.log('📝 Submitting booking:', booking);
      
      const response = await saveBooking(booking);
      
      if (response.success) {
        const bookingWithDetails = {
          _id: response.data._id,
          bookingId: response.data.bookingId || `TV${response.data._id.toString().slice(-8)}`,
          tourId: response.data.tourId,
          tourTitle: response.data.tourTitle,
          tour: {
            _id: tour._id,
            title: tour.title,
            price: tour.price,
            duration: tour.duration,
            image: response.data.tourImage || tour.image
          },
          userId: response.data.userId,
          userName: response.data.userName,
          userEmail: response.data.userEmail,
          participants: response.data.participants,
          travelers: response.data.participants,
          travelDate: response.data.travelDate,
          bookingDate: response.data.bookingDate,
          totalPrice: response.data.totalPrice,
          totalAmount: response.data.totalPrice,
          status: 'confirmed',
          specialRequirements: response.data.specialRequirements,
          contactNumber: response.data.contactNumber,
          createdAt: response.data.createdAt
        };
        
        console.log('✅ Booking created:', bookingWithDetails);
        setIsSubmitting(false);
        onConfirm(bookingWithDetails);
        onClose();
      }
    } catch (error) {
      console.error('🔥 Error creating booking:', error);
      setIsSubmitting(false);
      alert(error.message || 'Error creating booking. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Phone number validation - only allow digits and limit to 10
    if (name === 'contactNumber') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    // Travelers validation - ensure it's a number between 1-10
    if (name === 'travelers') {
      const numValue = parseInt(value) || 1;
      processedValue = Math.min(10, Math.max(1, numValue));
    }
    
    setBookingData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
    
    const error = validateField(fieldName, bookingData[fieldName]);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  };

  const isFormValid = () => {
    return Object.keys(validateForm()).length === 0;
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Book {tour.title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <form onSubmit={handleSubmit} className="booking-form" noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={`booking-form-group ${touched.travelers && errors.travelers ? 'error' : ''}`}>
                <label>Number of Travelers *</label>
                <div className="number-input-wrapper">
                  <input
                    type="number"
                    name="travelers"
                    min="1"
                    max="10"
                    value={bookingData.travelers}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('travelers')}
                    required
                  />
                  <div className="number-input-controls">
                    <button 
                      type="button" 
                      className="number-input-btn increase"
                      onClick={increaseTravelers}
                      aria-label="Increase travelers"
                    >
                      +
                    </button>
                    <button 
                      type="button" 
                      className="number-input-btn decrease"
                      onClick={decreaseTravelers}
                      aria-label="Decrease travelers"
                    >
                      −
                    </button>
                  </div>
                </div>
                {touched.travelers && errors.travelers && (
                  <span className="error-message">{errors.travelers}</span>
                )}
                <span className="validation-hint">Min: 1, Max: 10</span>
              </div>
              
              <div className={`booking-form-group ${touched.travelDate && errors.travelDate ? 'error' : ''}`}>
                <label>Travel Date *</label>
                <input
                  type="date"
                  name="travelDate"
                  value={bookingData.travelDate}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('travelDate')}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                {touched.travelDate && errors.travelDate && (
                  <span className="error-message">{errors.travelDate}</span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={`booking-form-group ${touched.contactNumber && errors.contactNumber ? 'error' : ''}`}>
                <label>Contact Number *</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={bookingData.contactNumber}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('contactNumber')}
                  placeholder="Enter 10-digit number"
                  maxLength="10"
                  required
                />
                {touched.contactNumber && errors.contactNumber && (
                  <span className="error-message">{errors.contactNumber}</span>
                )}
                <span className="validation-hint">10 digits only</span>
              </div>
              
              <div className={`booking-form-group ${touched.email && errors.email ? 'error' : ''}`}>
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={bookingData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="Enter your email"
                  required
                />
                {touched.email && errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>
            </div>
            
            <div className="booking-form-group">
              <label>Special Requests (Optional)</label>
              <textarea
                name="specialRequests"
                value={bookingData.specialRequests}
                onChange={handleInputChange}
                placeholder="Any special requirements or preferences..."
                rows="3"
              />
            </div>
            
            <div className="booking-summary">
              <h4>Booking Summary</h4>
              <div className="booking-summary-item">
                <span>Tour:</span>
                <span>{tour.title}</span>
              </div>
              <div className="booking-summary-item">
                <span>Price per person:</span>
                <span>₹{tour.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="booking-summary-item">
                <span>Number of travelers:</span>
                <span>{bookingData.travelers}</span>
              </div>
              <div className="booking-summary-item">
                <span>Total Amount:</span>
                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </form>
        </div>
        
        <div className="modal-buttons">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-confirm" 
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid()}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Tour Card Component with CLICK FUNCTIONALITY - NO VIEW DETAILS BUTTON
const TourCard = ({ tour, onBook, isSaved, onSave, onRate, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(tour._id);
  };

  const handleRateClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRate(tour);
  };

  const handleBookClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onBook(tour);
  };

  const handleCardClick = (e) => {
    // Don't trigger if clicking on action buttons or links
    if (e.target.closest('.btn-book-now') || 
        e.target.closest('.btn-save') || 
        e.target.closest('.tour-price')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    onViewDetails(tour._id);
  };

  // Calculate rating display
  const rating = tour.averageRating || 0;
  const totalRatings = tour.totalRatings || 0;

  return (
    <div 
      className="tour-card"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        cursor: 'pointer',
        position: 'relative',
        transform: isHovered ? 'translateY(-10px)' : 'translateY(0)'
      }}
    >
      <div className="tour-image">
        <img src={tour.image} alt={tour.title} />
        <div className="tour-price">₹{tour.price?.toLocaleString('en-IN')}</div>
        {/* Rating badge on image */}
        <div className="tour-rating-badge">
          <span style={{ fontSize: '1rem', color: '#FF9966' }}>★</span>
          <span style={{ 
            fontWeight: 'bold', 
            fontSize: '0.9rem',
            marginLeft: '2px'
          }}>
            {rating.toFixed(1)}
          </span>
          <span style={{ 
            fontSize: '0.7rem',
            color: '#fff',
            marginLeft: '2px',
            opacity: 0.8
          }}>
            ({totalRatings})
          </span>
        </div>
      </div>
      <div className="tour-content">
        <h3>{tour.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <StarRating 
            rating={rating} 
            size="small" 
            showNumber={true}
            showCount={true}
            totalRatings={totalRatings}
          />
        </div>
        <p>{tour.description}</p>
        <div className="tour-meta">
          <span className="duration">⏱️ {tour.duration}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="tour-type">{tour.category}</span>
            <span className="tour-region">{tour.region}</span>
          </div>
        </div>
        <div className="tour-booking-actions">
          <button className="btn-book-now" onClick={handleBookClick}>
            Book Now
          </button>
          <button 
            className={`btn-save ${isSaved ? 'saved' : ''}`} 
            onClick={handleSaveClick}
          >
            {isSaved ? '✓ Saved' : '💾 Save'}
          </button>
          <button 
            className="btn-save" 
            onClick={handleRateClick}
            style={{ background: '#FFFAF5', color: '#FF9966', borderColor: '#FF9966' }}
          >
            ⭐ Rate
          </button>
        </div>
        {/* Mobile Click Hint */}
        <div className="mobile-click-hint">
          Tap anywhere on card to view details
        </div>
      </div>
    </div>
  );
};

// Dashboard Home Component
const DashboardHome = ({ user, tours, savedTours, userBookings, onBookTour, onSaveTour, onRateTour, onViewTourDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTours = tours.filter(tour => {
    const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tour.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate confirmed bookings count
  const confirmedBookingsCount = userBookings.filter(booking => booking.status === 'confirmed').length;

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Explore Incredible India</h1>
          <p>Discover the diversity of Indian culture, heritage, and landscapes. Plan your perfect journey with TourVista.</p>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="number">{tours.length}+</span>
              <span className="label">Tour Packages</span>
            </div>
            <div className="hero-stat">
              <span className="number">{savedTours.length}</span>
              <span className="label">Saved Tours</span>
            </div>
            <div className="hero-stat">
              <span className="number">{confirmedBookingsCount}</span>
              <span className="label">Active Bookings</span>
            </div>
            <div className="hero-stat">
              <span className="number">24/7</span>
              <span className="label">Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* WELCOME SECTION */}
      <section className="welcome-section">
        <div className="welcome-card">
          <h2>Namaste, {user?.name}!</h2>
          <p>Welcome to your personal travel dashboard. Explore the wonders of India, manage your bookings, and discover new destinations tailored just for you.</p>
          <Link to="/dashboard/tours" className="btn-explore">
            Start Exploring
          </Link>
        </div>
      </section>

      {/* SAVED TOURS SECTION */}
      {savedTours.length > 0 && (
        <section className="saved-tours-section">
          <div className="section-header">
            <h2>Your Saved Tours</h2>
            <p>Tours you've saved for later</p>
          </div>
          
          <div className="saved-tours-grid">
            {savedTours.map(tour => (
              <TourCard 
                key={tour._id} 
                tour={tour} 
                onBook={onBookTour}
                isSaved={true}
                onSave={onSaveTour}
                onRate={onRateTour}
                onViewDetails={onViewTourDetails}
              />
            ))}
          </div>
        </section>
      )}

      {/* FEATURED TOURS WITH SEARCH */}
      <section className="featured-tours">
        <div className="section-header">
          <h2>Featured Indian Tours</h2>
          <p>Handpicked tours for an authentic Indian experience</p>
          
          <div style={{ marginTop: '2rem', maxWidth: '500px', margin: '2rem auto 0' }}>
            <input
              type="text"
              placeholder="🔍 Search tours by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid #FFE5CC',
                borderRadius: '10px',
                fontSize: '1rem',
                background: 'white'
              }}
            />
          </div>
        </div>
        
        <div className="tours-grid">
          {filteredTours.map(tour => (
            <TourCard 
              key={tour._id} 
              tour={tour} 
              onBook={onBookTour}
              isSaved={savedTours.some(t => t._id === tour._id)}
              onSave={onSaveTour}
              onRate={onRateTour}
              onViewDetails={onViewTourDetails}
            />
          ))}
        </div>
      </section>

      {/* USER STATS */}
      <section className="user-stats">
        <div className="stats-card">
          <h3>Your Travel Dashboard</h3>
          <p>Track your travel milestones and explore new opportunities across India</p>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{savedTours.length}</span>
              <span className="stat-label">Saved Tours</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{confirmedBookingsCount}</span>
              <span className="stat-label">Active Bookings</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{user ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}</span>
              <span className="stat-label">Member Since</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                ₹{userBookings
                  .filter(booking => booking.status === 'confirmed')
                  .reduce((sum, booking) => sum + (booking.totalPrice || booking.totalAmount || 0), 0)
                  .toLocaleString('en-IN')}
              </span>
              <span className="stat-label">Total Spent</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

// My Bookings Page Component - FIXED to show confirmed bookings with WORKING FILTER BUTTONS
const BookingsPage = ({ user, userBookings, onCancelBooking }) => {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'confirmed', 'cancelled'
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const response = await updateBookingStatus(bookingId, 'cancelled');
        if (response.success) {
          onCancelBooking(bookingId);
        }
      } catch (error) {
        alert(error.message || 'Error cancelling booking');
      }
    }
  };

  // Filter bookings based on active filter
  const filteredBookings = userBookings.filter(booking => {
    if (activeFilter === 'all') return true;
    return booking.status === activeFilter;
  });

  // Calculate counts for each filter
  const allCount = userBookings.length;
  const confirmedCount = userBookings.filter(booking => booking.status === 'confirmed').length;
  const cancelledCount = userBookings.filter(booking => booking.status === 'cancelled').length;

  if (userBookings.length === 0) {
    return (
      <div className="page-content">
        <h2>My Bookings</h2>
        <div className="empty-bookings">
          <div className="empty-bookings-icon">📋</div>
          <h3 style={{ color: '#333', marginBottom: '1rem' }}>No Bookings Yet</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Start your Indian adventure by booking your first tour!</p>
          <Link to="/dashboard/tours" className="btn-details">Browse Tours</Link>
        </div>
        <Link to="/dashboard" className="btn-back" style={{ marginTop: '2rem' }}>← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2>My Bookings</h2>
      <p>Manage your upcoming trips and view booking history</p>
      
      {/* Status Tabs */}
      <div className="status-tabs">
        <button 
          className={`status-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All <span className="tab-count">{allCount}</span>
        </button>
        <button 
          className={`status-tab ${activeFilter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setActiveFilter('confirmed')}
        >
          Confirmed <span className="tab-count">{confirmedCount}</span>
        </button>
        <button 
          className={`status-tab ${activeFilter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveFilter('cancelled')}
        >
          Cancelled <span className="tab-count">{cancelledCount}</span>
        </button>
      </div>
      
      {/* Filter status message */}
      {activeFilter !== 'all' && (
        <div style={{ 
          margin: '1rem 0', 
          padding: '1rem', 
          background: '#FFFAF5', 
          border: '1px solid #FFE5CC',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, color: '#333' }}>
            Showing {activeFilter} bookings: {filteredBookings.length} found
            <button 
              onClick={() => setActiveFilter('all')}
              style={{
                marginLeft: '1rem',
                background: 'transparent',
                border: '1px solid #2E8B57',
                color: '#2E8B57',
                padding: '0.3rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Show All
            </button>
          </p>
        </div>
      )}
      
      <div className="bookings-container">
        {filteredBookings.length === 0 ? (
          <div className="empty-filter-results">
            <div className="empty-filter-icon">🔍</div>
            <h3 style={{ color: '#333', marginBottom: '1rem' }}>No {activeFilter} bookings found</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              {activeFilter === 'confirmed' 
                ? 'You have no confirmed bookings. Book a tour to get started!'
                : 'You have no cancelled bookings.'}
            </p>
            {activeFilter === 'confirmed' && (
              <Link to="/dashboard/tours" className="btn-details">Browse Tours</Link>
            )}
          </div>
        ) : (
          filteredBookings.map(booking => (
            <div key={booking._id} className="booking-card-item">
              <div className="booking-header">
                <h3>{booking.tour?.title || booking.tourTitle}</h3>
                <span className={`booking-status ${booking.status}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              
              <div className="booking-details">
                <div className="booking-detail">
                  <strong>Booking ID:</strong>
                  <span>TV{booking._id.toString().slice(-8)}</span>
                </div>
                <div className="booking-detail">
                  <strong>Booking Date:</strong>
                  <span>{formatDate(booking.bookingDate || booking.createdAt)}</span>
                </div>
                <div className="booking-detail">
                  <strong>Travel Date:</strong>
                  <span>{formatDate(booking.travelDate)}</span>
                </div>
                <div className="booking-detail">
                  <strong>Travelers:</strong>
                  <span>{booking.participants || booking.travelers} person(s)</span>
                </div>
                <div className="booking-detail">
                  <strong>Total Amount:</strong>
                  <span style={{ color: '#2E8B57', fontWeight: '600' }}>
                    {formatCurrency(booking.totalPrice || booking.totalAmount)}
                  </span>
                </div>
                {booking.contactNumber && (
                  <div className="booking-detail">
                    <strong>Contact:</strong>
                    <span>{booking.contactNumber}</span>
                  </div>
                )}
              </div>
              
              <div className="booking-actions">
                <Link to={`/dashboard/tour/${booking.tour?._id || booking.tourId}`} className="btn-view-details">View Tour</Link>
                {booking.status === 'confirmed' && (
                  <button 
                    className="btn-cancel-booking"
                    onClick={() => handleCancelBooking(booking._id)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <Link to="/dashboard" className="btn-back" style={{ marginTop: '2rem' }}>← Back to Dashboard</Link>
    </div>
  );
};

// Tours Page Component
const ToursPage = ({ tours, savedTours, onBookTour, onSaveTour, onRateTour, onViewTourDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50000]);

  const filteredTours = tours.filter(tour => {
    const price = tour.price || 0;
    const matchesSearch = tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tour.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesType = selectedType === 'all' || tour.category === selectedType || tour.type === selectedType;
    return matchesSearch && matchesPrice && matchesType;
  });

  const tourTypes = [
    { id: 'all', label: 'All Tours' },
    { id: 'heritage', label: '🏰 Heritage' },
    { id: 'adventure', label: '⛰️ Adventure' },
    { id: 'beach', label: '🏖️ Beach' },
    { id: 'wellness', label: '🧘 Wellness' },
    { id: 'cultural', label: '🎭 Cultural' },
    { id: 'spiritual', label: '🕉️ Spiritual' }
  ];

  return (
    <div className="page-content">
      <h2>Browse All Indian Tours</h2>
      <p>Discover amazing destinations across India. From the snow-capped Himalayas to tropical beaches, find your perfect Indian adventure.</p>
      
      {/* Filters */}
      <div style={{ marginTop: '2rem', padding: '2rem', background: '#FFFAF5', borderRadius: '10px', border: '1px solid #FFE5CC' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {tourTypes.map(type => (
            <button 
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              style={{ 
                padding: '1rem', 
                background: selectedType === type.id ? '#2E8B57' : 'white', 
                color: selectedType === type.id ? 'white' : '#333',
                border: '1px solid #FFE5CC', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
            Price Range: ₹{priceRange[0].toLocaleString('en-IN')} - ₹{priceRange[1].toLocaleString('en-IN')}
          </label>
          <input
            type="range"
            min="0"
            max="100000"
            step="5000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
            style={{ width: '100%' }}
          />
        </div>
        
        <input
          type="text"
          placeholder="🔍 Search tours..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '1rem',
            border: '1px solid #FFE5CC',
            borderRadius: '10px',
            fontSize: '1rem',
            background: 'white'
          }}
        />
      </div>
      
      {/* Tours Grid */}
      <div className="tours-grid" style={{ marginTop: '2rem' }}>
        {filteredTours.map(tour => (
          <TourCard 
            key={tour._id} 
            tour={tour} 
            onBook={onBookTour}
            isSaved={savedTours.some(t => t._id === tour._id)}
            onSave={onSaveTour}
            onRate={onRateTour}
            onViewDetails={onViewTourDetails}
          />
        ))}
      </div>
      
      {filteredTours.length === 0 && (
        <div className="saved-tours-empty">
          <div className="saved-tours-empty-icon">🔍</div>
          <h3 style={{ color: '#333', marginBottom: '1rem' }}>No tours found</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Try adjusting your filters or search terms.</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setPriceRange([0, 50000]);
            }}
            className="btn-details"
          >
            Clear Filters
          </button>
        </div>
      )}
      
      <Link to="/dashboard" className="btn-back" style={{ marginTop: '2rem' }}>← Back to Dashboard</Link>
    </div>
  );
};

// Profile Page Component
const ProfilePage = ({ user, userBookings, savedTours, onEditProfile }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  // Calculate stats
  const confirmedBookingsCount = userBookings.filter(booking => booking.status === 'confirmed').length;
  const cancelledBookingsCount = userBookings.filter(booking => booking.status === 'cancelled').length;
  const totalSpent = userBookings
    .filter(booking => booking.status === 'confirmed')
    .reduce((sum, booking) => sum + (booking.totalPrice || booking.totalAmount || 0), 0);

  return (
    <div className="page-content">
      <h2>My Profile</h2>
      {user && (
        <>
          <div className="profile-info">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> {user.address || 'Not provided'}</p>
            <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Account Status:</strong> <span style={{ color: '#2E8B57' }}>Active</span></p>
            <p><strong>Total Bookings:</strong> {userBookings.length}</p>
            <p><strong>Confirmed Bookings:</strong> {confirmedBookingsCount}</p>
            <p><strong>Cancelled Bookings:</strong> {cancelledBookingsCount}</p>
            <p><strong>Saved Tours:</strong> {savedTours.length}</p>
            <p><strong>Total Spent:</strong> ₹{totalSpent.toLocaleString('en-IN')}</p>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-details" onClick={() => setShowEditModal(true)}>Edit Profile</button>
            <button className="btn-details" style={{ background: 'white', borderColor: '#2E8B57', color: '#2E8B57' }}>Travel Preferences</button>
            <Link to="/dashboard/bookings" className="btn-details">View Bookings</Link>
            <Link to="/dashboard/saved" className="btn-details">View Saved Tours</Link>
          </div>
        </>
      )}
      
      <Link to="/dashboard" className="btn-back" style={{ marginTop: '2rem' }}>← Back to Dashboard</Link>

      {showEditModal && user && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdate={(updatedUser) => {
            onEditProfile(updatedUser);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
};

// Tour Detail Page Component - ENHANCED MOBILE RESPONSIVE DESIGN
const TourDetailPage = ({ tours, savedTours, onBookTour, onSaveTour, onRateTour }) => {
  const location = useLocation();
  const tourId = location.pathname.split('/').pop();
  const tour = tours.find(t => t._id === tourId);
  const isSaved = savedTours.some(t => t._id === tourId);
  const [ratings, setRatings] = useState([]);
  const [showAllRatings, setShowAllRatings] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      if (tour) {
        const tourRatings = await getTourRatings(tour._id);
        setRatings(tourRatings);
      }
    };
    fetchRatings();
  }, [tour]);

  if (!tour) {
    return (
      <div className="page-content">
        <h2>Tour Not Found</h2>
        <p>The tour you're looking for doesn't exist.</p>
        <Link to="/dashboard/tours" className="btn-back">← Back to Tours</Link>
      </div>
    );
  }

  // Function to render itinerary
  const renderItinerary = () => {
    if (!tour.itinerary || tour.itinerary.length === 0) {
      return (
        <div className="itinerary-day">
          <div className="itinerary-day-header">
            <h4>Day 1: Arrival & Orientation</h4>
            <div className="itinerary-day-number">1</div>
          </div>
          <ul className="itinerary-activities">
            <li>Arrival at destination airport</li>
            <li>Hotel check-in and refresh</li>
            <li>Welcome dinner with traditional cuisine</li>
            <li>Briefing about the tour itinerary</li>
          </ul>
        </div>
      );
    }

    return tour.itinerary.map((day) => (
      <div key={day.day} className="itinerary-day">
        <div className="itinerary-day-header">
          <h4>Day {day.day}: {day.title || `Day ${day.day}`}</h4>
          <div className="itinerary-day-number">{day.day}</div>
        </div>
        <p style={{ color: '#666', marginBottom: '1rem' }}>{day.description}</p>
        <ul className="itinerary-activities">
          {day.activities?.map((activity, index) => (
            <li key={index}>{activity}</li>
          ))}
        </ul>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #FFE5CC',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <span><strong>Meals:</strong> {day.meals || 'Breakfast'}</span>
          <span><strong>Accommodation:</strong> {day.accommodation || 'Hotel'}</span>
        </div>
      </div>
    ));
  };

  // Function to render ratings section
  const renderRatingsSection = () => {
    const visibleRatings = showAllRatings ? ratings : ratings.slice(0, 3);
    
    return (
      <div className="tour-detail-section">
        <h3 className="section-title">⭐ Customer Reviews</h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem' 
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <StarRating 
                rating={tour.averageRating || 0} 
                size="large" 
                showNumber={true}
                showCount={true}
                totalRatings={tour.totalRatings || 0}
              />
            </div>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              Based on {tour.totalRatings || 0} reviews
            </p>
          </div>
          <button 
            className="btn-details"
            onClick={() => onRateTour(tour)}
          >
            ⭐ Write a Review
          </button>
        </div>
        
        {ratings.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            background: '#FFFAF5', 
            borderRadius: '10px',
            color: '#666'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {visibleRatings.map((rating, index) => (
                <div key={index} style={{ 
                  background: '#FFFAF5', 
                  padding: '1.5rem', 
                  borderRadius: '10px',
                  border: '1px solid #FFE5CC'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <strong style={{ color: '#333' }}>
                        {rating.userId?.name || 'Anonymous User'}
                      </strong>
                      <div style={{ marginTop: '0.25rem' }}>
                        <StarRating 
                          rating={rating.rating} 
                          size="small" 
                          showNumber={false}
                        />
                      </div>
                    </div>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                      {new Date(rating.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {rating.review && (
                    <p style={{ color: '#666', lineHeight: 1.6, margin: 0 }}>
                      {rating.review}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {ratings.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => setShowAllRatings(!showAllRatings)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#FFFAF5',
                    color: '#333',
                    border: '2px solid #FFE5CC',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  {showAllRatings ? 'Show Less' : `Show All ${ratings.length} Reviews`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="page-content tour-detail-page">
      <div className="tour-detail-header">
        <div className="tour-detail-hero">
          <img 
            src={tour.image} 
            alt={tour.title}
            className="tour-detail-image"
          />
          <div className="tour-detail-overlay">
            <h2 className="tour-detail-title">{tour.title}</h2>
            <p className="tour-detail-subtitle">Discover the beauty and culture of this amazing destination</p>
          </div>
          <div className="tour-detail-price">
            ₹{tour.price?.toLocaleString('en-IN')}
          </div>
          {/* Rating badge on tour detail hero */}
          <div className="tour-detail-rating-badge">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <StarRating 
                rating={tour.averageRating || 0} 
                size="small" 
                showNumber={true}
                showCount={true}
                totalRatings={tour.totalRatings || 0}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="tour-detail-content">
        <div className="tour-detail-main">
          <div className="tour-detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="section-title">🏔️ Tour Overview</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StarRating 
                  rating={tour.averageRating || 0} 
                  size="medium" 
                  showNumber={true}
                  showCount={true}
                  totalRatings={tour.totalRatings || 0}
                />
              </div>
            </div>
            <p className="tour-description" style={{ whiteSpace: 'pre-line' }}>
              {tour.detailedDescription || tour.description}
            </p>
            
            <div className="tour-meta-grid">
              <div className="tour-meta-item">
                <div className="tour-meta-icon">⏱️</div>
                <div>
                  <div className="tour-meta-label">Duration</div>
                  <div className="tour-meta-value">{tour.duration}</div>
                </div>
              </div>
              
              <div className="tour-meta-item">
                <div className="tour-meta-icon">📍</div>
                <div>
                  <div className="tour-meta-label">Category</div>
                  <div className="tour-meta-value">{tour.category || 'Cultural'}</div>
                </div>
              </div>
              
              <div className="tour-meta-item">
                <div className="tour-meta-icon">👥</div>
                <div>
                  <div className="tour-meta-label">Group Size</div>
                  <div className="tour-meta-value">{tour.overview?.groupSize || '2-10 People'}</div>
                </div>
              </div>
              
              <div className="tour-meta-item">
                <div className="tour-meta-icon">📅</div>
                <div>
                  <div className="tour-meta-label">Best Season</div>
                  <div className="tour-meta-value">{tour.overview?.bestSeason || 'October to March'}</div>
                </div>
              </div>
              
              <div className="tour-meta-item">
                <div className="tour-meta-icon">🎯</div>
                <div>
                  <div className="tour-meta-label">Difficulty</div>
                  <div className="tour-meta-value" style={{ 
                    color: tour.overview?.difficulty === 'easy' ? '#2E8B57' :
                           tour.overview?.difficulty === 'moderate' ? '#FF9966' : '#FF6B6B',
                    fontWeight: '600'
                  }}>
                    {tour.overview?.difficulty?.toUpperCase() || 'EASY'}
                  </div>
                </div>
              </div>
              
              <div className="tour-meta-item">
                <div className="tour-meta-icon">🗣️</div>
                <div>
                  <div className="tour-meta-label">Languages</div>
                  <div className="tour-meta-value">
                    {tour.overview?.languages?.join(', ') || 'English, Hindi'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tour Highlights */}
          {tour.overview?.highlights && tour.overview.highlights.length > 0 && (
            <div className="tour-detail-section">
              <h3 className="section-title">✨ Tour Highlights</h3>
              <div className="tour-highlights">
                {tour.overview.highlights.map((highlight, index) => (
                  <div key={index} className="tour-highlight">
                    <div className="tour-highlight-icon">✨</div>
                    <div className="tour-highlight-content">
                      <p style={{ margin: 0, color: '#666' }}>{highlight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tour-detail-section">
            <h3 className="section-title">📅 Itinerary</h3>
            <div className="tour-itinerary">
              {renderItinerary()}
            </div>
          </div>

          {/* Requirements & Important Info */}
          <div className="tour-detail-section">
            <h3 className="section-title">📋 Important Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <h4 style={{ color: '#333', marginBottom: '1rem' }}>Requirements</h4>
                <div style={{ background: '#FFFAF5', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Physical Level:</strong> {tour.requirements?.physicalLevel || 'Moderate'}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Fitness Level:</strong> {tour.requirements?.fitnessLevel || 'Average'}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Documents:</strong> {tour.requirements?.documents?.join(', ') || 'Valid ID Proof'}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 style={{ color: '#333', marginBottom: '1rem' }}>Policies</h4>
                <div style={{ background: '#FFFAF5', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Cancellation:</strong> {tour.pricing?.cancellationPolicy || 'Free cancellation 7 days before'}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Payment:</strong> {tour.pricing?.paymentPolicy || '30% advance required'}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Booking Cutoff:</strong> {tour.importantInfo?.bookingCutoff || '7 days before tour'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews */}
          {renderRatingsSection()}
        </div>

        <div className="tour-detail-sidebar">
          <div className="tour-detail-section">
            <h3 className="section-title">✅ Inclusions</h3>
            <div className="tour-inclusion-card">
              <h4>What's Included</h4>
              <ul className="inclusion-list">
                {tour.included && tour.included.length > 0 ? (
                  tour.included.map((item, index) => (
                    <li key={index} className="included">{item}</li>
                  ))
                ) : (
                  <>
                    <li className="included">Accommodation for all nights</li>
                    <li className="included">Daily breakfast and 3 dinners</li>
                    <li className="included">All transportation during tour</li>
                    <li className="included">Professional tour guide</li>
                    <li className="included">Entrance fees to all attractions</li>
                  </>
                )}
                {tour.excluded && tour.excluded.length > 0 && tour.excluded.map((item, index) => (
                  <li key={`ex-${index}`} className="not-included">{item}</li>
                ))}
                {(!tour.excluded || tour.excluded.length === 0) && (
                  <>
                    <li className="not-included">International flights</li>
                    <li className="not-included">Travel insurance</li>
                    <li className="not-included">Personal expenses</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="tour-detail-section">
            <h3 className="section-title">📦 Packing List</h3>
            <div className="important-info-card">
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                {tour.requirements?.packingList && tour.requirements.packingList.length > 0 ? (
                  tour.requirements.packingList.map((item, index) => (
                    <li key={index} style={{ marginBottom: '0.5rem' }}>{item}</li>
                  ))
                ) : (
                  <>
                    <li style={{ marginBottom: '0.5rem' }}>Comfortable walking shoes</li>
                    <li style={{ marginBottom: '0.5rem' }}>Lightweight clothing</li>
                    <li style={{ marginBottom: '0.5rem' }}>Sun protection (hat, sunscreen)</li>
                    <li style={{ marginBottom: '0.5rem' }}>Water bottle</li>
                    <li style={{ marginBottom: '0.5rem' }}>Camera & charger</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="tour-detail-section">
            <h3 className="section-title">ℹ️ Quick Info</h3>
            <div className="important-info-card">
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>📍 Region:</strong> {tour.region?.toUpperCase()} India
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>🎯 Category:</strong> {tour.category}
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>👥 Max Group:</strong> {tour.maxParticipants} people
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>💰 Price:</strong> ₹{tour.price?.toLocaleString('en-IN')}/person
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>⏱️ Duration:</strong> {tour.duration}
              </p>
              <p style={{ margin: '0' }}>
                <strong>⭐ Rating:</strong> {tour.averageRating?.toFixed(1) || '0.0'} ({tour.totalRatings || 0} reviews)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="tour-detail-actions">
        <button 
          className="btn-book-tour"
          onClick={() => onBookTour(tour)}
        >
          <span>✈️</span> Book This Tour
        </button>
        
        <button 
          className={`btn-save-tour ${isSaved ? 'saved' : ''}`}
          onClick={() => onSaveTour(tour._id)}
        >
          {isSaved ? '✓ Saved to List' : '💾 Save for Later'}
        </button>
        
        <button 
          className="btn-save-tour"
          onClick={() => onRateTour(tour)}
          style={{ background: '#FFFAF5', color: '#FF9966', borderColor: '#FF9966' }}
        >
          ⭐ Rate This Tour
        </button>
        
        <Link to="/dashboard/tours" className="btn-back-to-tours">
          ← Back to Tours
        </Link>
      </div>
    </div>
  );
};

// Offers Page Component
const OffersPage = () => (
  <div className="page-content">
    <h2>Special Offers</h2>
    <p>Exclusive deals and discounts for TourVista India members</p>
    
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '2rem',
      marginTop: '2rem'
    }}>
      <div style={{ 
        background: '#2E8B57', 
        padding: '2rem', 
        borderRadius: '8px',
        color: 'white'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>🎉 Early Bird Discount</h3>
        <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>Book 60 days in advance and get 15% off on all Indian tours!</p>
        <button style={{ 
          background: 'white', 
          color: '#2E8B57', 
          border: 'none', 
          padding: '0.8rem 1.5rem', 
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          View Tours
        </button>
      </div>
      
      <div style={{ 
        background: '#FF9966', 
        padding: '2rem', 
        borderRadius: '8px',
        color: 'white'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>👨‍👩‍👧‍👦 Group Discount</h3>
        <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>Travel with 4+ people and get 20% discount on total package!</p>
        <button style={{ 
          background: 'white', 
          color: '#FF9966', 
          border: 'none', 
          padding: '0.8rem 1.5rem', 
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          Book Now
        </button>
      </div>
    </div>
    
    <Link to="/dashboard" className="btn-back" style={{ marginTop: '2rem' }}>← Back to Dashboard</Link>
  </div>
);

// Saved Tours Page Component
const SavedToursPage = ({ savedTours, onBookTour, onSaveTour, onRateTour, onViewTourDetails }) => {
  if (savedTours.length === 0) {
    return (
      <div className="page-content">
        <h2>Saved Tours</h2>
        <div className="saved-tours-empty">
          <div className="saved-tours-empty-icon">💾</div>
          <h3 style={{ color: '#333', marginBottom: '1rem' }}>No Saved Tours</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Save tours you're interested in by clicking the Save button on any tour.</p>
          <Link to="/dashboard/tours" className="btn-details">Browse Tours</Link>
        </div>
        <Link to="/dashboard" className="btn-back" style={{ marginTop: '2rem' }}>← Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2>Saved Tours</h2>
      <p>Your collection of tours saved for later</p>
      
      <div className="tours-grid" style={{ marginTop: '2rem' }}>
        {savedTours.map(tour => (
          <TourCard 
            key={tour._id} 
            tour={tour} 
            onBook={onBookTour}
            isSaved={true}
            onSave={onSaveTour}
            onRate={onRateTour}
            onViewDetails={onViewTourDetails}
          />
        ))}
      </div>
      
      <Link to="/dashboard" className="btn-back" style={{ marginTop: '2rem' }}>← Back to Dashboard</Link>
    </div>
  );
};

// Main Dashboard Component - UPDATED with enhanced click functionality
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [savedTours, setSavedTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const navigate = useNavigate();
  const location = useLocation();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      showNotification('Back online!', 'success');
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      showNotification('You are offline. Some features may be limited.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Load saved tours from database
  const loadSavedToursFromDB = async (userId) => {
    try {
      const savedTourIdsResponse = await getSavedToursFromDB(userId);
      return savedTourIdsResponse;
    } catch (error) {
      console.error('Error loading saved tours from DB:', error);
      return [];
    }
  };

  // Update the fetchUserProfile function to handle errors better:
  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch user profile
      try {
        const response = await fetchWithRetry(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Fetch user bookings
          try {
            const bookingsResponse = await fetchWithRetry(`${API_URL}/bookings/user/${userData._id}`);
            if (bookingsResponse.data.success) {
              setUserBookings(bookingsResponse.data.data || []);
            }
          } catch (bookingError) {
            console.error('Error fetching bookings:', bookingError);
            // Continue without bookings
          }
          
          // Fetch tours with ratings
          try {
            const toursResponse = await fetchWithRetry(`${API_URL}/tours`);
            if (toursResponse.data.success) {
              const allTours = toursResponse.data.data || [];
              // Ensure all tours have rating properties
              const toursWithRatings = allTours.map(tour => ({
                ...tour,
                averageRating: tour.averageRating || 0,
                totalRatings: tour.totalRatings || 0
              }));
              setTours(toursWithRatings);
              localStorage.setItem('cachedTours', JSON.stringify(toursWithRatings));
              
              // Load saved tours from MongoDB database
              try {
                const savedToursFromDB = await loadSavedToursFromDB(userData._id);
                setSavedTours(savedToursFromDB);
              } catch (savedToursError) {
                console.error('Error loading saved tours from DB:', savedToursError);
                setSavedTours([]);
              }
            }
          } catch (tourError) {
            console.error('Error fetching tours:', tourError);
            // Load cached tours
            const cachedTours = localStorage.getItem('cachedTours');
            if (cachedTours) {
              try {
                setTours(JSON.parse(cachedTours));
              } catch (e) {
                console.error('Error parsing cached tours:', e);
              }
            }
          }
        }
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
        
        // Use stored user if available
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          showNotification('Using cached profile data', 'warning');
        } else {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showNotification('Error loading dashboard. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Update tours and bookings when user changes
    const fetchData = async () => {
      if (user && connectionStatus === 'online') {
        try {
          const allTours = await getTours();
          // Ensure all tours have rating properties
          const toursWithRatings = allTours.map(tour => ({
            ...tour,
            averageRating: tour.averageRating || 0,
            totalRatings: tour.totalRatings || 0
          }));
          setTours(toursWithRatings);
          
          const bookings = await getUserBookings(user._id);
          setUserBookings(bookings);
          
          // Load saved tours from MongoDB database
          const savedToursFromDB = await loadSavedToursFromDB(user._id);
          setSavedTours(savedToursFromDB);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };
    
    fetchData();
  }, [user, connectionStatus]);

  const handleBookTour = (tour) => {
    setSelectedTour(tour);
    setShowBookingModal(true);
  };

  const handleRateTour = (tour) => {
    if (!user) {
      showNotification('Please login to rate tours', 'error');
      return;
    }
    setSelectedTour(tour);
    setShowRatingModal(true);
  };

  // NEW FUNCTION: Handle viewing tour details when clicking anywhere on the tour card
  const handleViewTourDetails = (tourId) => {
    navigate(`/dashboard/tour/${tourId}`);
  };

  const handleConfirmBooking = (booking) => {
    // Update local state with CONFIRMED booking
    const updatedBookings = [booking, ...userBookings];
    setUserBookings(updatedBookings);
    
    setShowBookingModal(false);
    setSelectedTour(null);
    showNotification(`Booking confirmed for ${booking.tourTitle}! Total: ₹${(booking.totalPrice || booking.totalAmount).toLocaleString('en-IN')}`);
  };

  const handleSubmitRating = (ratingData) => {
    // Update tour rating in local state
    setTours(prev => prev.map(tour => {
      if (tour._id === selectedTour._id) {
        return {
          ...tour,
          averageRating: ratingData.averageRating,
          totalRatings: ratingData.totalRatings
        };
      }
      return tour;
    }));
    
    setShowRatingModal(false);
    setSelectedTour(null);
    showNotification('Thank you for your rating!', 'success');
  };

  const handleCancelBooking = (bookingId) => {
    setUserBookings(prev => 
      prev.map(booking => 
        booking._id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      )
    );
    
    showNotification('Booking cancelled successfully!', 'success');
  };

  const handleSaveTour = async (tourId) => {
    if (!user) {
      showNotification('Please login to save tours', 'error');
      return;
    }
    
    const isCurrentlySaved = savedTours.some(tour => tour._id === tourId);
    
    try {
      if (isCurrentlySaved) {
        // Remove from saved in database
        await removeSavedTourFromDB(user._id, tourId);
        
        // Update local state
        setSavedTours(prev => prev.filter(tour => tour._id !== tourId));
        showNotification('Tour removed from saved list!', 'success');
      } else {
        // Add to saved in database
        await saveTourToDB(user._id, tourId);
        
        // Update local state - find the tour and add it
        const tourToSave = tours.find(t => t._id === tourId);
        if (tourToSave) {
          setSavedTours(prev => [...prev, tourToSave]);
          showNotification('Tour saved successfully!', 'success');
        }
      }
    } catch (error) {
      console.error('Error saving/removing tour:', error);
      showNotification('Error updating saved tours. Please try again.', 'error');
    }
  };

  const handleEditProfile = (updatedUser) => {
    setUser(updatedUser);
    showNotification('Profile updated successfully!', 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setSavedTours([]); // Clear saved tours from state
    setShowMobileMenu(false);
    navigate('/');
  };

  const handleDashboardClick = (e) => {
    e.preventDefault();
    setShowMobileMenu(false);
    navigate('/dashboard');
  };

  const handleHomeRedirect = () => {
    setShowMobileMenu(false);
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const handleMobileLinkClick = (path) => {
    setShowMobileMenu(false);
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Calculate confirmed bookings count
  const confirmedBookingsCount = userBookings.filter(booking => booking.status === 'confirmed').length;

  const refreshDashboard = () => {
    setLoading(true);
    fetchUserProfile();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
        {connectionStatus === 'offline' && (
          <p style={{ color: '#FF9966', marginTop: '1rem' }}>
            You are offline. Using cached data where available.
          </p>
        )}
        <button 
          onClick={refreshDashboard}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#2E8B57',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* FIXED NAVBAR WITH HAMBURGER MENU */}
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <div 
            onClick={handleDashboardClick}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <h1>TourVista India</h1>
            {connectionStatus === 'offline' && (
              <span style={{
                fontSize: '0.7rem',
                background: '#FF9966',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 'bold'
              }}>
                OFFLINE
              </span>
            )}
          </div>
        </div>
        
        {/* Desktop Menu */}
        <div className="navbar-menu">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') && location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/dashboard/tours" 
            className={`nav-link ${isActive('/dashboard/tours') ? 'active' : ''}`}
          >
            Browse Tours
          </Link>
          <Link 
            to="/dashboard/saved" 
            className={`nav-link ${isActive('/dashboard/saved') ? 'active' : ''}`}
          >
            Saved ({savedTours.length})
          </Link>
          <Link 
            to="/dashboard/bookings" 
            className={`nav-link ${isActive('/dashboard/bookings') ? 'active' : ''}`}
          >
            Bookings ({confirmedBookingsCount})
          </Link>
          <Link 
            to="/dashboard/profile" 
            className={`nav-link ${isActive('/dashboard/profile') ? 'active' : ''}`}
          >
            Profile
          </Link>
        </div>
        
        <div className="navbar-user">
          {user && (
            <>
              <span className="welcome-text">
                <span style={{ marginRight: '8px' }}>👋</span>
                Hi, {user.name.split(' ')[0]}!
              </span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          )}
        </div>
        
        {/* Mobile Hamburger Menu Button */}
        <button 
          className={`mobile-menu-btn ${showMobileMenu ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <>
          <div className={`mobile-menu-overlay ${showMobileMenu ? 'active' : ''}`} onClick={closeMobileMenu}></div>
          
          {/* Mobile Menu Sidebar */}
          <div className={`mobile-menu-sidebar ${showMobileMenu ? 'active' : ''}`}>
            <div className="mobile-menu-header">
              <h3>TourVista Menu</h3>
              <button className="mobile-menu-close" onClick={closeMobileMenu}>×</button>
            </div>
            
            <div className="mobile-menu-content">
              {/* Welcome Message */}
              {user && (
                <div className="mobile-welcome-message">
                  <p>
                    <span style={{ marginRight: '8px' }}>👋</span>
                    Welcome, <span>{user.name.split(' ')[0]}!</span>
                  </p>
                  {connectionStatus === 'offline' && (
                    <p style={{ fontSize: '0.8rem', color: '#FF9966', marginTop: '5px' }}>
                      Offline Mode
                    </p>
                  )}
                </div>
              )}
              
              {/* Mobile Navigation Links */}
              <div className="navbar-menu">
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${isActive('/dashboard') && location.pathname === '/dashboard' ? 'active' : ''}`}
                  onClick={() => handleMobileLinkClick('/dashboard')}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/dashboard/tours" 
                  className={`nav-link ${isActive('/dashboard/tours') ? 'active' : ''}`}
                  onClick={() => handleMobileLinkClick('/dashboard/tours')}
                >
                  Browse Tours
                </Link>
                <Link 
                  to="/dashboard/saved" 
                  className={`nav-link ${isActive('/dashboard/saved') ? 'active' : ''}`}
                  onClick={() => handleMobileLinkClick('/dashboard/saved')}
                >
                  Saved <span className="badge">{savedTours.length}</span>
                </Link>
                <Link 
                  to="/dashboard/bookings" 
                  className={`nav-link ${isActive('/dashboard/bookings') ? 'active' : ''}`}
                  onClick={() => handleMobileLinkClick('/dashboard/bookings')}
                >
                  Bookings <span className="badge">{confirmedBookingsCount}</span>
                </Link>
                <Link 
                  to="/dashboard/profile" 
                  className={`nav-link ${isActive('/dashboard/profile') ? 'active' : ''}`}
                  onClick={() => handleMobileLinkClick('/dashboard/profile')}
                >
                  Profile
                </Link>
              </div>
              
              {/* Refresh Button for Mobile */}
              <div style={{ padding: '1rem', marginBottom: '1rem' }}>
                <button 
                  onClick={() => {
                    refreshDashboard();
                    closeMobileMenu();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: '#2E8B57',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>🔄</span> Refresh Data
                </button>
              </div>
              
              {/* Mobile User Section (only logout button now) */}
              {user && (
                <div className="mobile-user-section">
                  <button 
                    onClick={handleLogout} 
                    className="mobile-logout-btn"
                  >
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Connection Status Banner */}
      {connectionStatus === 'offline' && (
        <div style={{
          background: '#FF9966',
          color: 'white',
          padding: '0.5rem',
          textAlign: 'center',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          ⚠️ You are offline. Some features may be limited.
        </div>
      )}

      {/* Main Content with Nested Routes */}
      <main className="dashboard-main">
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardHome 
                user={user} 
                tours={tours} 
                savedTours={savedTours}
                userBookings={userBookings}
                onBookTour={handleBookTour}
                onSaveTour={handleSaveTour}
                onRateTour={handleRateTour}
                onViewTourDetails={handleViewTourDetails}
              /> 
            } 
          />
          <Route 
            path="/tours" 
            element={
              <ToursPage 
                tours={tours} 
                savedTours={savedTours}
                onBookTour={handleBookTour}
                onSaveTour={handleSaveTour}
                onRateTour={handleRateTour}
                onViewTourDetails={handleViewTourDetails}
              /> 
            } 
          />
          <Route 
            path="/saved" 
            element={
              <SavedToursPage 
                savedTours={savedTours}
                onBookTour={handleBookTour}
                onSaveTour={handleSaveTour}
                onRateTour={handleRateTour}
                onViewTourDetails={handleViewTourDetails}
              /> 
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <BookingsPage 
                user={user}
                userBookings={userBookings} 
                onCancelBooking={handleCancelBooking} 
              /> 
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                user={user} 
                userBookings={userBookings} 
                savedTours={savedTours}
                onEditProfile={handleEditProfile}
              /> 
            } 
          />
          <Route 
            path="/tour/:id" 
            element={
              <TourDetailPage 
                tours={tours} 
                savedTours={savedTours}
                onBookTour={handleBookTour}
                onSaveTour={handleSaveTour}
                onRateTour={handleRateTour}
              /> 
            } 
          />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedTour && user && (
        <BookingModal
          tour={selectedTour}
          user={user}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTour(null);
          }}
          onConfirm={handleConfirmBooking}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedTour && user && (
        <RatingModal
          tour={selectedTour}
          user={user}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedTour(null);
          }}
          onSubmit={handleSubmitRating}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <ToastNotification
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>TourVista India</h3>
            <p>Your gateway to authentic Indian travel experiences. Discover, plan, and book your perfect Indian journey.</p>
          </div>
          <div className="footer-section">
            <h4>Dashboard Links</h4>
            <Link to="/dashboard" className="footer-link">Dashboard Home</Link>
            <Link to="/dashboard/tours" className="footer-link">Browse Indian Tours</Link>
            <Link to="/dashboard/saved" className="footer-link">Saved Tours ({savedTours.length})</Link>
            <Link to="/dashboard/bookings" className="footer-link">My Bookings ({confirmedBookingsCount})</Link>
            <Link to="/dashboard/profile" className="footer-link">My Profile</Link>
          </div>
          <div className="footer-section">
            <h4>Quick Actions</h4>
            <button onClick={() => navigate('/dashboard/tours')} className="footer-btn">✈️ Find Tours</button>
            <button onClick={() => navigate('/dashboard/saved')} className="footer-btn">💾 Saved Tours</button>
            <button onClick={() => navigate('/dashboard/bookings')} className="footer-btn">📋 My Bookings</button>
            <button onClick={handleHomeRedirect} className="footer-btn">🏠 Home Page</button>
            <button onClick={handleLogout} className="footer-btn logout">🚪 Logout</button>
            <button onClick={refreshDashboard} className="footer-btn" style={{ background: 'rgba(46, 139, 87, 0.1)', color: '#2E8B57' }}>
              🔄 Refresh Data
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} TourVista India Dashboard. Experience the diversity of India.</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
            <button 
              onClick={handleHomeRedirect}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#2E8B57', 
                cursor: 'pointer', 
                textDecoration: 'none',
                padding: '0',
                font: 'inherit'
              }}
            >
              ← Return to Home Page
            </button>
          </p>
          {connectionStatus === 'offline' && (
            <p style={{ fontSize: '0.8rem', color: '#FF9966', marginTop: '0.5rem' }}>
              ⚠️ Currently in offline mode
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;