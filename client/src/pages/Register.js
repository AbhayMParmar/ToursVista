import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './auth.css';

// Toast component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`auth-toast ${type}`}>
      <div className="auth-toast-icon">
        {type === 'success' ? '✓' : '✕'}
      </div>
      <div className="auth-toast-content">
        <div className="auth-toast-title">
          {type === 'success' ? 'Success' : 'Error'}
        </div>
        <div className="auth-toast-message">{message}</div>
      </div>
      <button className="auth-toast-close" onClick={onClose}>×</button>
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

    const addToast = (message, type) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
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
        } else if (strength < 2) {
            setPasswordStrength('weak');
        } else if (strength < 4) {
            setPasswordStrength('medium');
        } else {
            setPasswordStrength('strong');
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
        
        if (!formData.name.trim()) errors.push('Full name is required');
        if (!formData.email.trim()) errors.push('Email is required');
        if (!validateEmail(formData.email)) errors.push('Please enter a valid email address');
        if (!formData.phone.trim()) errors.push('Phone number is required');
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (!validatePhone(cleanPhone)) errors.push('Please enter a valid 10-digit phone number');
        if (!formData.password) errors.push('Password is required');
        if (formData.password.length < 6) errors.push('Password must be at least 6 characters');
        if (formData.password.length > 10) errors.push('Password cannot exceed 10 characters');
        if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
        
        if (errors.length > 0) {
            errors.forEach(error => addToast(error, 'error'));
            setLoading(false);
            return;
        }

        try {
            const API_BASE_URL = getApiBaseUrl();
            
            const res = await axios.post(`${API_BASE_URL}/auth/register`, {
                name: formData.name,
                email: formData.email,
                phone: cleanPhone,
                password: formData.password
            });

            if (res.data.success) {
                addToast('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            addToast(err.response?.data?.message || err.message || 'Registration failed. Please try again.', 'error');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page register-page">
            {/* Toast Container */}
            <div className="auth-toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
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
                                                <span className="spinner"></span> Creating Account...
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