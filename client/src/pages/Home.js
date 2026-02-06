import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './landing.css';

const Home = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleSignupClick = () => {
    navigate('/login'); // Redirect to login page as requested
  };

  return (
    <div className="landing-container">
      {/* Navbar - Clean and Minimal */}
      <nav className="navbar">
        <div className="nav-brand">
          <h2>TourVista India</h2>
        </div>
        
        {/* Desktop Navigation Buttons */}
        <div className="nav-buttons">
          <button className="nav-btn login-btn" onClick={handleLoginClick}>
            Login
          </button>
          <button className="nav-btn register-btn" onClick={handleRegisterClick}>
            Register
          </button>
        </div>
        
        {/* Mobile Signup Button - Replaces Hamburger Menu */}
        <button className="mobile-signup-btn" onClick={handleSignupClick}>
          Sign Up
        </button>
      </nav>

      {/* Hero Section - EXACT SAME AS IMAGE */}
      <header className="hero-section-exact">
        <div className="hero-overlay-exact">
          <div className="hero-content-exact">
            <h1 className="hero-title-exact">Explore Incredible India</h1>
            <p className="hero-subtitle-exact">
              Discover the diversity of Indian culture, heritage, and landscapes. Plan your perfect journey with TourVista.
            </p>
            
            {/* Hero Stats Grid - EXACT SAME AS IMAGE */}
            <div className="hero-stats-exact">
              <div className="hero-stat-item-exact">
                <div className="stat-number-exact">6+</div>
                <div className="stat-label-exact">Tour Packages</div>
              </div>
              <div className="hero-stat-item-exact">
                <div className="stat-number-exact">0</div>
                <div className="stat-label-exact">Saved Tours</div>
              </div>
              <div className="hero-stat-item-exact">
                <div className="stat-number-exact">50K+</div>
                <div className="stat-label-exact">Happy Travelers</div>
              </div>
              <div className="hero-stat-item-exact">
                <div className="stat-number-exact">24/7</div>
                <div className="stat-label-exact">Support</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Indian Destinations Section */}
      <section className="destinations-new">
        <h2 className="section-title-new">Popular Indian Destinations</h2>
        <div className="dest-grid-new">
          <div className="dest-card-new">
            <img 
              src="https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
              alt="Taj Mahal, Agra"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
              }}
            />
            <h3>Taj Mahal, Agra</h3>
            <p>Iconic marble mausoleum and UNESCO World Heritage Site</p>
          </div>
          <div className="dest-card-new">
            <img 
              src="https://tripgourmets.com/wp-content/uploads/2018/04/Jaipur-Itinerary-Featured-Image.jpg" 
              alt="Jaipur, Rajasthan"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://tripgourmets.com/wp-content/uploads/2018/04/Jaipur-Itinerary-Featured-Image.jpg";
              }}
            />
            <h3>Jaipur, Rajasthan</h3>
            <p>The Pink City with majestic forts and palaces</p>
          </div>
          <div className="dest-card-new">
            <img 
              src="https://tse4.mm.bing.net/th/id/OIP.J5VQPA5KVcTKfxc3f1441QHaEK?rs=1&pid=ImgDetMain&o=7&rm=3" 
              alt="Kerala Backwaters"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://tse4.mm.bing.net/th/id/OIP.J5VQPA5KVcTKfxc3f1441QHaEK?rs=1&pid=ImgDetMain&o=7&rm=3";
              }}
            />
            <h3>Kerala Backwaters</h3>
            <p>Serene houseboat experiences through palm-fringed canals</p>
          </div>
          <div className="dest-card-new">
            <img 
              src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
              alt="Goa Beaches"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
              }}
            />
            <h3>Goa Beaches</h3>
            <p>Sun-kissed beaches and Portuguese heritage</p>
          </div>
          <div className="dest-card-new">
            <img 
              src="https://tse3.mm.bing.net/th/id/OIP.FnRBJviOl-VN_KEp0FKVkgHaE7?w=3840&h=2553&rs=1&pid=ImgDetMain&o=7&rm=3" 
              alt="Leh-Ladakh"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://tse3.mm.bing.net/th/id/OIP.FnRBJviOl-VN_KEp0FKVkgHaE7?w=3840&h=2553&rs=1&pid=ImgDetMain&o=7&rm=3";
              }}
            />
            <h3>Leh-Ladakh</h3>
            <p>High-altitude desert with stunning mountain landscapes</p>
          </div>
          <div className="dest-card-new">
            <img 
              src="https://media.istockphoto.com/photos/varanasi-picture-id537988165?b=1&k=20&m=537988165&s=170667a&w=0&h=tZ9HLnS2kFKqh-UGJnR04-sPSf3BYArnpstcknShd2M=" 
              alt="Varanasi, Uttar Pradesh"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://media.istockphoto.com/photos/varanasi-picture-id537988165?b=1&k=20&m=537988165&s=170667a&w=0&h=tZ9HLnS2kFKqh-UGJnR04-sPSf3BYArnpstcknShd2M=";
              }}
            />
            <h3>Varanasi, Uttar Pradesh</h3>
            <p>Spiritual capital on the banks of River Ganges</p>
          </div>
        </div>
      </section>

      {/* Features Section - India Focused */}
      <section className="features-new">
        <h2 className="section-title-new">Why Choose TourVista India?</h2>
        <div className="features-grid-new">
          <div className="feature-card">
            <h3>Authentic Indian Experiences</h3>
            <p>Curated tours that showcase India's rich cultural heritage and local traditions</p>
          </div>
          <div className="feature-card">
            <h3>Local Expert Guides</h3>
            <p>Knowledgeable Indian guides for authentic and memorable travel experiences</p>
          </div>
          <div className="feature-card">
            <h3>Best Value Packages</h3>
            <p>Affordable prices with transparent costs covering all major Indian destinations</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to Explore India?</h2>
        <p className="cta-subtitle">Join thousands of travelers who trust us with their Indian adventures</p>
        <div className="cta-buttons">
          <Link to="/register" className="cta-btn primary">
            Create Account
          </Link>
          <Link to="/tours" className="cta-btn secondary">
            Browse Indian Tours
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-new">
        <div className="footer-content-new">
          <div className="footer-section-new">
            <h3>TourVista India</h3>
            <p>Making Indian travel dreams come true since 2024. Explore India with confidence.</p>
          </div>
          <div className="footer-section-new">
            <h3>Quick Links</h3>
            <Link to="/">Home</Link>
            <Link to="/tours">Indian Tours</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-section-new">
            <h3>Contact Info</h3>
            <p>📧 support@tourvista.com</p>
            <p>📞 +91 98765 43210</p>
            <p>📍 123 Travel Street, New Delhi, India</p>
          </div>
        </div>
        <div className="footer-bottom-new">
          <p>&copy; {new Date().getFullYear()} TourVista India. All rights reserved.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: '0.7' }}>
            <Link to="/login" style={{ color: 'inherit' }}>Login</Link> | 
            <Link to="/register" style={{ color: 'inherit', margin: '0 0.5rem' }}>Register</Link> | 
            <Link to="/dashboard" style={{ color: 'inherit' }}>Dashboard</Link>
          </p>
        </div>
      </footer>

      {/* Modals (if needed in future) */}
      {showLogin && (
        <div className="modal-overlay-bg">
          <div className="modal-container">
            <button className="close-btn" onClick={() => setShowLogin(false)}>×</button>
            <div className="modal-form">
              <h2>Login</h2>
              <input type="email" placeholder="Email Address" />
              <input type="password" placeholder="Password" />
              <button className="modal-btn" onClick={() => setShowLogin(false)}>Login</button>
            </div>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="modal-overlay-bg">
          <div className="modal-container">
            <button className="close-btn" onClick={() => setShowRegister(false)}>×</button>
            <div className="modal-form">
              <h2>Register</h2>
              <input type="text" placeholder="Full Name" />
              <input type="email" placeholder="Email Address" />
              <input type="password" placeholder="Password" />
              <input type="password" placeholder="Confirm Password" />
              <button className="modal-btn" onClick={() => setShowRegister(false)}>Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;