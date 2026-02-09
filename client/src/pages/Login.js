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

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

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
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Get API base URL - Consistent with Register.js
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
    
    if (!email.trim()) {
      errors.push({ 
        message: 'Email is required', 
        submessage: 'Please enter your email address to continue' 
      });
    } else if (!validateEmail(email)) {
      errors.push({ 
        message: 'Invalid email format', 
        submessage: 'Please enter a valid email address (e.g., user@example.com)' 
      });
    }
    
    if (!password) {
      errors.push({ 
        message: 'Password is required', 
        submessage: 'Please enter your password to continue' 
      });
    } else if (password.length < 6) {
      errors.push({ 
        message: 'Password too short', 
        submessage: 'Password must be at least 6 characters long' 
      });
    } else if (password.length > 10) {
      errors.push({ 
        message: 'Password too long', 
        submessage: 'Password cannot exceed 10 characters' 
      });
    }
    
    if (errors.length > 0) {
      errors.forEach(error => addToast(error.message, 'error', error.submessage));
      setLoading(false);
      return;
    }

    // Default Admin Credentials Check
    if (email === 'admin@tourvista.com' && password === 'Admin@123') {
      const adminUser = {
        id: 'admin-001',
        name: 'Administrator',
        email: 'admin@tourvista.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('token', 'admin-token-123456');
      localStorage.setItem('user', JSON.stringify(adminUser));
      
      const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
      if (!allUsers.find(u => u.email === 'admin@tourvista.com')) {
        allUsers.push(adminUser);
        localStorage.setItem('allUsers', JSON.stringify(allUsers));
      }

      addToast(
        'Welcome Administrator!', 
        'success', 
        'You are being redirected to the Admin Panel...'
      );
      
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
      setLoading(false);
      return;
    }

    // Regular user login
    try {
      const API_BASE_URL = getApiBaseUrl();
      
      addToast(
        'Attempting to login...', 
        'info', 
        'Please wait while we authenticate your credentials'
      );

      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
        if (!allUsers.find(u => u.id === res.data.user.id)) {
          allUsers.push(res.data.user);
          localStorage.setItem('allUsers', JSON.stringify(allUsers));
        }
        
        addToast(
          'Login Successful! 🎉', 
          'success', 
          `Welcome back, ${res.data.user.name}! Redirecting to Dashboard...`
        );
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        addToast(
          'Login Failed', 
          'error', 
          res.data.message || 'Please check your credentials and try again'
        );
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        addToast(
          'Request Timeout', 
          'error', 
          'Server is taking too long to respond. Please try again.'
        );
      } else if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          addToast(
            'Authentication Failed', 
            'error', 
            'Invalid email or password. Please try again.'
          );
        } else if (status === 404) {
          addToast(
            'Service Unavailable', 
            'error', 
            'Login service is currently unavailable. Please try again later.'
          );
        } else if (status >= 500) {
          addToast(
            'Server Error', 
            'error', 
            'Our servers are experiencing issues. Please try again later.'
          );
        } else {
          addToast(
            'Login Error', 
            'error', 
            err.response.data?.message || `Error: ${status}`
          );
        }
      } else if (err.request) {
        const fallbackUrl = 'https://tours-travels-server-6mm7.onrender.com/api/auth/login';
        if (getApiBaseUrl() !== fallbackUrl) {
          try {
            addToast(
              'Trying Backup Server...', 
              'info', 
              'Attempting to connect through backup server'
            );

            const fallbackRes = await axios.post(
              fallbackUrl,
              { email, password },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                withCredentials: false
              }
            );
            
            if (fallbackRes.data.success) {
              localStorage.setItem('token', fallbackRes.data.token);
              localStorage.setItem('user', JSON.stringify(fallbackRes.data.user));
              addToast(
                'Login Successful via Backup!', 
                'success', 
                'Welcome back! Redirecting to Dashboard...'
              );
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            }
          } catch (fallbackErr) {
            handleFallbackError(fallbackErr);
          }
        } else {
          handleFallbackError(err);
        }
      } else {
        addToast(
          'Connection Failed', 
          'error', 
          'Unable to connect to the server. Please check your internet connection.'
        );
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackError = (err) => {
    if (err.response?.status === 401) {
      addToast(
        'Invalid Credentials', 
        'error', 
        'The email or password you entered is incorrect.'
      );
    } else if (err.response?.status === 400) {
      addToast(
        'Invalid Request', 
        'error', 
        'Please check your input data and try again.'
      );
    } else {
      addToast(
        'Server Unavailable', 
        'error', 
        'All servers are currently unavailable. Please try again later.'
      );
    }
  };

  return (
    <div className="auth-page">
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
            {/* Left Section with Login Form */}
            <div className="form-section">
              <div className="auth-form">
                <h2>Welcome to TourVista India</h2>
                <p className="auth-subtitle">Login to your account</p>
                
                <form onSubmit={onSubmit}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      required
                      placeholder="Enter your email"
                      disabled={loading}
                      inputMode="email"
                      autoCapitalize="none"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={password}
                      onChange={onChange}
                      required
                      placeholder="Enter your password"
                      disabled={loading}
                      maxLength="10"
                      autoComplete="current-password"
                    />
                    <small className="form-hint">
                      Password must be 6-10 characters
                    </small>
                  </div>
                  
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner"></span> Authenticating...
                      </>
                    ) : (
                      'Login to Your Account'
                    )}
                  </button>
                </form>
                
                <div className="auth-link">
                  <p>Don't have an account? <Link to="/register">Create Account</Link></p>
                </div>
                
                <div className="auth-footer">
                  <Link to="/" className="back-home">
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Section with Illustration */}
            <div className="illustration-section">
              <div className="logo">
                <h1>TourVista India</h1>
              </div>
              
              <div className="illustration-content">
                <h2>Access Your Dashboard</h2>
                <p>Login to access your personalized dashboard with bookings, tours, and travel preferences.</p>

                <Link to="/register">
                  <button className="btn-switch">
                    Create Account →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;