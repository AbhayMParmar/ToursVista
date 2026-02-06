import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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
        
        setError('');
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
        setError('');
        setSuccess('');

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
            setError(errors.join('. '));
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
                setSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page register-page">
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
                                
                                {error && <div className="alert alert-danger">{error}</div>}
                                {success && <div className="alert alert-success">{success}</div>}
                                
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
