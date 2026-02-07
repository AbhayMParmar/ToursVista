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
    
    if (!email.trim()) errors.push('Email is required');
    if (!validateEmail(email)) errors.push('Please enter a valid email address');
    if (!password) errors.push('Password is required');
    if (password.length < 6) errors.push('Password must be at least 6 characters');
    if (password.length > 10) errors.push('Password cannot exceed 10 characters');
    
    if (errors.length > 0) {
      errors.forEach(error => addToast(error, 'error'));
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

      addToast('Welcome Administrator! Redirecting to Admin Panel...', 'success');
      
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
      setLoading(false);
      return;
    }

    // Regular user login
    try {
      const API_BASE_URL = getApiBaseUrl();
      
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
        
        addToast('Login successful! Redirecting to Dashboard...', 'success');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        addToast(res.data.message || 'Login failed', 'error');
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        addToast('Request timeout. Please try again.', 'error');
      } else if (err.response) {
        addToast(err.response.data?.message || `Error: ${err.response.status}`, 'error');
      } else if (err.request) {
        const fallbackUrl = 'https://tours-travels-server-6mm7.onrender.com/api/auth/login';
        if (getApiBaseUrl() !== fallbackUrl) {
          try {
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
              addToast('Login successful! Redirecting to Dashboard...', 'success');
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            }
          } catch (fallbackErr) {
            handleFallbackError(fallbackErr);
          }
        } else {
          handleFallbackError(err);
        }
      } else {
        addToast('Login failed. Please check your credentials and try again.', 'error');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackError = (err) => {
    if (err.response?.status === 401) {
      addToast('Invalid email or password', 'error');
    } else if (err.response?.status === 400) {
      addToast('Please check your input data', 'error');
    } else {
      addToast('Login failed. Please try again.', 'error');
    }
  };

  return (
    <div className="auth-page">
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
                        <span className="spinner"></span> Logging in...
                      </>
                    ) : (
                      'Login'
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