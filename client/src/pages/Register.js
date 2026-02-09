import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './auth.css';

// Advanced Toast component
const Toast = ({ message, type, submessage, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'info': return 'i';
      default: return '!';
    }
  };

  const getTitle = () => {
    switch(type) {
      case 'success': return 'Success!';
      case 'error': return 'Oops!';
      case 'info': return 'Info';
      default: return 'Notification';
    }
  };

  return (
    <div className={`auth-toast ${type} ${isClosing ? 'hiding' : ''}`}>
      <div className="auth-toast-icon-container">
        <span className="auth-toast-icon">{getIcon()}</span>
      </div>
      
      <div className="auth-toast-content">
        <div className="auth-toast-title">
          {getTitle()}
        </div>
        <div className="auth-toast-message">{message}</div>
        {submessage && (
          <div className="auth-toast-submessage">{submessage}</div>
        )}
        <div className="auth-toast-progress">
          <div className="auth-toast-progress-bar"></div>
        </div>
      </div>
      
      <button className="auth-toast-close" onClick={handleClose}>×</button>
    </div>
  );
};

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const addToast = (message, type, submessage = '') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, submessage }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        
        // Password validation - allow 6 to 10 characters
        if (name === 'password') {
            if (value.length <= 10) {
                const newData = { ...formData, [name]: value };
                setFormData(newData);
                checkPasswordStrength(value);
                
                // Show password strength toast
                const strength = checkPasswordStrength(value);
                if (value.length >= 6) {
                  if (strength === 'strong') {
                    addToast(
                      'Strong Password!', 
                      'success', 
                      'Your password meets all security requirements'
                    );
                  } else if (strength === 'medium') {
                    addToast(
                      'Medium Password Strength', 
                      'info', 
                      'Consider adding numbers or special characters for better security'
                    );
                  } else if (strength === 'weak') {
                    addToast(
                      'Weak Password', 
                      'error', 
                      'Your password is weak. Add uppercase, numbers, or special characters'
                    );
                  }
                }
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const checkPasswordStrength = (password) => {
        let strength = 0;
        
        if (password.length >= 6) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        
        if (password.length === 0) {
            setPasswordStrength('');
            return '';
        } else if (strength < 2) {
            setPasswordStrength('weak');
            return 'weak';
        } else if (strength < 4) {
            setPasswordStrength('medium');
            return 'medium';
        } else {
            setPasswordStrength('strong');
            return 'strong';
        }
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePhone = (phone) => {
        const re = /^[0-9]{10}$/;
        return re.test(phone);
    };

    const getApiBaseUrl = () => {
        return process.env.REACT_APP_API_URL || 'https://toursvista.onrender.com/api';
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // On mobile, blur active element to hide keyboard
        if (isMobile) {
            document.activeElement.blur();
        }

        // Validation
        const errors = [];
        
        if (!formData.name.trim()) {
          errors.push({ 
            message: 'Full name is required', 
            submessage: 'Please enter your full name to continue' 
          });
        }
        
        if (!formData.email.trim()) {
          errors.push({ 
            message: 'Email is required', 
            submessage: 'Please enter your email address' 
          });
        } else if (!validateEmail(formData.email)) {
          errors.push({ 
            message: 'Invalid email format', 
            submessage: 'Please enter a valid email address (e.g., user@example.com)' 
          });
        }
        
        if (!formData.phone.trim()) {
          errors.push({ 
            message: 'Phone number is required', 
            submessage: 'Please enter your phone number' 
          });
        }
        
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (!validatePhone(cleanPhone)) {
          errors.push({ 
            message: 'Invalid phone number', 
            submessage: 'Please enter a valid 10-digit phone number' 
          });
        }
        
        if (!formData.password) {
          errors.push({ 
            message: 'Password is required', 
            submessage: 'Please create a password for your account' 
          });
        } else if (formData.password.length < 6) {
          errors.push({ 
            message: 'Password too short', 
            submessage: 'Password must be at least 6 characters long' 
          });
        } else if (formData.password.length > 10) {
          errors.push({ 
            message: 'Password too long', 
            submessage: 'Password cannot exceed 10 characters' 
          });
        }
        
        if (formData.password !== formData.confirmPassword) {
          errors.push({ 
            message: 'Passwords do not match', 
            submessage: 'Please make sure both passwords are identical' 
          });
        }
        
        if (errors.length > 0) {
            errors.forEach(error => addToast(error.message, 'error', error.submessage));
            setLoading(false);
            return;
        }

        // Show processing toast
        addToast(
          'Creating your account...', 
          'info', 
          'Please wait while we set up your account'
        );

        try {
            const API_BASE_URL = getApiBaseUrl();
            
            const res = await axios.post(`${API_BASE_URL}/auth/register`, {
                name: formData.name,
                email: formData.email,
                phone: cleanPhone,
                password: formData.password
            });

            if (res.data.success) {
                // Clear any existing toasts
                setToasts([]);
                
                addToast(
                  'Account Created Successfully! 🎉', 
                  'success', 
                  `Welcome to TourVista India, ${formData.name}! Redirecting to login...`
                );
                
                setTimeout(() => {
                    navigate('/login');
                }, 2500);
            } else {
                addToast(
                  'Registration Failed', 
                  'error', 
                  res.data.message || 'Please try again with different details'
                );
            }
        } catch (err) {
            if (err.response?.status === 409) {
              addToast(
                'Email Already Registered', 
                'error', 
                'This email is already associated with an account. Please use a different email or try logging in.'
              );
            } else if (err.response?.status === 400) {
              addToast(
                'Invalid Registration Data', 
                'error', 
                'Please check all your information and try again'
              );
            } else if (err.code === 'ECONNABORTED') {
              addToast(
                'Request Timeout', 
                'error', 
                'Server is taking too long to respond. Please try again.'
              );
            } else {
              addToast(
                'Registration Failed', 
                'error', 
                err.response?.data?.message || err.message || 'Unable to create account. Please try again.'
              );
            }
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page register-page">
            {/* Advanced Toast Container at Top Center */}
            <div className="auth-toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        submessage={toast.submessage}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            <div className="auth-container">
                <div className="auth-card-wrapper">
                    <div className="split-card">
                        {/* Left Section with Illustration */}
                        <div className="illustration-section">
                            <div className="logo">
                                <h1>TourVista India</h1>
                            </div>
                            
                            <div className="illustration-content">
                                <h2>Join Our Community</h2>
                                <p>Become a member and unlock exclusive travel deals and personalized experiences.</p>

                                <Link to="/login">
                                    <button className="btn-switch">
                                        ← Back to Login
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* Right Section with Register Form */}
                        <div className="form-section">
                            <div className="auth-form">
                                <h2>Create Account</h2>
                                <p className="auth-subtitle">Join TourVista India and start your journey today</p>
                                
                                <form onSubmit={onSubmit}>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={onChange}
                                            required
                                            placeholder="Enter your full name"
                                            disabled={loading}
                                            inputMode="text"
                                            autoCapitalize="words"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={onChange}
                                            required
                                            placeholder="Enter your email"
                                            disabled={loading}
                                            inputMode="email"
                                            autoCapitalize="none"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={onChange}
                                            required
                                            placeholder="Enter 10-digit phone number"
                                            maxLength="10"
                                            disabled={loading}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={onChange}
                                            required
                                            placeholder="Create password"
                                            disabled={loading}
                                            maxLength="10"
                                            autoComplete="new-password"
                                        />
                                        <small className="form-hint">
                                            Password must be 6-10 characters (letters, numbers, or special characters)
                                        </small>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={onChange}
                                            required
                                            placeholder="Confirm your password"
                                            disabled={loading}
                                            maxLength="10"
                                            autoComplete="new-password"
                                        />
                                        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                            <small className="form-hint" style={{color: 'var(--danger-color)'}}>
                                                Passwords do not match
                                            </small>
                                        )}
                                    </div>
                                    
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? (
                                            <>
                                                <span className="spinner"></span> Creating Your Account...
                                            </>
                                        ) : (
                                            'Join TourVista India'
                                        )}
                                    </button>
                                </form>
                                
                                <div className="auth-link">
                                    <p>Already have an account? <Link to="/login">Sign In Here</Link></p>
                                </div>
                                
                                <div className="auth-footer">
                                    <Link to="/" className="back-home">
                                        ← Back to Home
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;