import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import './admin.css';

// Replace line 6:
const API_URL = process.env.REACT_APP_API_URL || 'https://toursvista.onrender.com/api';

// Helper Functions - UPDATED for MongoDB with image handling
const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/users`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

const getAllBookings = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/bookings`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

const getTours = async () => {
  try {
    const response = await axios.get(`${API_URL}/tours`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching tours:', error);
    return [];
  }
};

// Calculate stats from database
const calculateStats = async () => {
  try {
    const [usersResponse, toursResponse, bookingsResponse] = await Promise.all([
      axios.get(`${API_URL}/admin/users`),
      axios.get(`${API_URL}/tours`),
      axios.get(`${API_URL}/admin/bookings`)
    ]);
    
    const users = usersResponse.data.data || [];
    const tours = toursResponse.data.data || [];
    const bookings = bookingsResponse.data.data || [];
    
    const regularUsers = users.filter(user => user.role !== 'admin');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (parseFloat(booking.totalAmount) || 0), 0);
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    
    return {
      totalUsers: regularUsers.length,
      totalTours: tours.length,
      totalBookings: bookings.length,
      revenue: totalRevenue,
      pendingBookings: pendingBookings.length,
      confirmedBookings: confirmedBookings.length
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      totalUsers: 0,
      totalTours: 0,
      totalBookings: 0,
      revenue: 0,
      pendingBookings: 0,
      confirmedBookings: 0
    };
  }
};

// Save booking to database
const saveBooking = async (booking) => {
  try {
    const response = await axios.post(`${API_URL}/bookings`, booking);
    return response.data.success;
  } catch (error) {
    console.error('Error saving booking:', error);
    return false;
  }
};

// Update booking status in database - UPDATED to use admin endpoint
const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await axios.put(`${API_URL}/admin/bookings/${bookingId}/status`, { status });
    return response.data.success;
  } catch (error) {
    console.error('Error updating booking:', error);
    // Fallback to regular endpoint
    try {
      const response = await axios.put(`${API_URL}/bookings/${bookingId}`, { status });
      return response.data.success;
    } catch (fallbackError) {
      return false;
    }
  }
};

// Delete booking from database
const deleteBooking = async (bookingId) => {
  try {
    const response = await axios.delete(`${API_URL}/bookings/${bookingId}`);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting booking:', error);
    return false;
  }
};

// Save tour to database with enhanced image handling
const saveTour = async (tourData) => {
  try {
    console.log('📤 Saving tour with images:', {
      mainImage: tourData.image,
      additionalImages: tourData.images,
      totalImages: tourData.images ? tourData.images.length : 0
    });
    
    const response = await axios.post(`${API_URL}/tours`, tourData);
    console.log('✅ Tour saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error saving tour:', error.response?.data || error.message);
    return null;
  }
};

// Update tour in database with enhanced image handling
const updateTour = async (tourId, tourData) => {
  try {
    console.log('🔄 Updating tour:', tourId);
    console.log('📝 Image data:', {
      mainImage: tourData.image,
      additionalImages: tourData.images,
      totalImages: tourData.images ? tourData.images.length : 0
    });
    
    const response = await axios.put(`${API_URL}/tours/${tourId}`, tourData);
    console.log('✅ Tour updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating tour:', error.response?.data || error.message);
    return null;
  }
};

// Delete tour from database
const deleteTour = async (tourId) => {
  try {
    const response = await axios.delete(`${API_URL}/tours/${tourId}`);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting tour:', error);
    return false;
  }
};

// Delete user from database
const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/users/${userId}`);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

// Admin Dashboard Component - FIXED to fetch data correctly
const AdminDashboard = ({ stats, refreshStats }) => {
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        setLoading(true);
        const [bookings, users] = await Promise.all([
          getAllBookings(),
          getUsers()
        ]);
        
        const sortedBookings = bookings
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        const sortedUsers = users
          .filter(user => user.role !== 'admin')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        setRecentBookings(sortedBookings);
        setRecentUsers(sortedUsers);
      } catch (error) {
        console.error('Error fetching recent data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentData();
  }, [stats]);

  return (
    <div className="admin-content">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome to TourVista India Admin Panel</p>
      </div>
      
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <p className="stat-change">+{recentUsers.length} new recently</p>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Tours</h3>
            <p className="stat-number">{stats.totalTours}</p>
            <p className="stat-change">Active packages</p>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Bookings</h3>
            <p className="stat-number">{stats.totalBookings}</p>
            <p className="stat-change">{stats.confirmedBookings} confirmed</p>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-number">₹{stats.revenue.toLocaleString('en-IN')}</p>
            <p className="stat-change">All time</p>
          </div>
        </div>
      </div>
      
      {/* Recent Activity Section */}
      <div className="recent-activity-grid">
        {/* Recent Users */}
        <div className="recent-card">
          <div className="recent-card-header">
            <h3>Recent Users</h3>
            <Link to="/admin/users">View All →</Link>
          </div>
          <div className="recent-card-content">
            {loading ? (
              <p className="no-data">Loading...</p>
            ) : recentUsers.length === 0 ? (
              <p className="no-data">No users found</p>
            ) : (
              recentUsers.map(user => (
                <div key={user._id} className="recent-item">
                  <div className="recent-item-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="recent-item-info">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                  <div className="recent-item-meta">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Recent Bookings */}
        <div className="recent-card">
          <div className="recent-card-header">
            <h3>Recent Bookings</h3>
            <Link to="/admin/bookings">View All →</Link>
          </div>
          <div className="recent-card-content">
            {loading ? (
              <p className="no-data">Loading...</p>
            ) : recentBookings.length === 0 ? (
              <p className="no-data">No bookings found</p>
            ) : (
              recentBookings.map(booking => (
                <div key={booking._id} className="recent-item">
                  <div className="booking-info">
                    <strong>{booking.tourTitle}</strong>
                    <div className="booking-meta">
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                      <span className="booking-amount">
                        ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="recent-item-meta">
                    <small>{booking.userName || 'Unknown User'}</small>
                    <small>{new Date(booking.travelDate || booking.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/admin/users" className="action-card">
            <div className="action-icon">👥</div>
            <h3>Manage Users</h3>
            <p>View and manage all registered users</p>
            <span className="action-count">{stats.totalUsers} users</span>
          </Link>
          
          <Link to="/admin/tours" className="action-card">
            <div className="action-icon">🏔️</div>
            <h3>Manage Tours</h3>
            <p>Add, edit or delete tour packages</p>
            <span className="action-count">{stats.totalTours} tours</span>
          </Link>
          
          <Link to="/admin/bookings" className="action-card">
            <div className="action-icon">📋</div>
            <h3>Manage Bookings</h3>
            <p>View and manage all bookings</p>
            <span className="action-count">{stats.totalBookings} bookings</span>
          </Link>
          
          <Link to="/admin/settings" className="action-card">
            <div className="action-icon">⚙️</div>
            <h3>Settings</h3>
            <p>System settings and configurations</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Users Management Component - FIXED with improved popup
const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getUsers();
      const regularUsers = allUsers.filter(user => user.role !== 'admin');
      
      // Get bookings count for each user
      const allBookings = await getAllBookings();
      const usersWithBookings = regularUsers.map(user => {
        const userBookings = allBookings.filter(booking => 
          booking.userId === user._id || booking.userEmail === user.email
        );
        
        return {
          ...user,
          bookings: userBookings,
          bookingsCount: userBookings.length,
          confirmedBookingsCount: userBookings.filter(b => b.status === 'confirmed').length,
          totalSpent: userBookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0)
        };
      });
      
      setUsers(usersWithBookings);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error loading users. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will also delete all their bookings.')) {
      try {
        const success = await deleteUser(userId);
        if (success) {
          setUsers(prev => prev.filter(user => user._id !== userId));
          
          // Close details modal if open
          if (selectedUser && selectedUser._id === userId) {
            setShowUserDetails(false);
            setSelectedUser(null);
          }
          
          alert('User deleted successfully');
        }
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

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

  return (
    <div className="admin-content">
      <div className="admin-header">
        <div>
          <h1>Users Management</h1>
          <p>Total {users.length} registered users</p>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <>
          {/* Mobile Table View with Horizontal Scroll */}
          <div className="mobile-table-wrapper">
            <div 
              className="mobile-table-container"
              ref={tableContainerRef}
            >
              <table className="mobile-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Total Bookings</th>
                    <th>Confirmed</th>
                    <th>Spent</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="clickable-row" onClick={() => handleRowClick(user)}>
                      <td>
                        {user._id.slice(0, 8)}...
                      </td>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>
                        <span className="booking-count">
                          {user.bookingsCount} bookings
                        </span>
                      </td>
                      <td>
                        <span className="confirmed-count">
                          {user.confirmedBookingsCount} confirmed
                        </span>
                      </td>
                      <td className="amount-cell">
                        ₹{user.totalSpent.toLocaleString('en-IN')}
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons">
                          <button 
                            className="btn-view"
                            onClick={() => handleRowClick(user)}
                          >
                            View
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="no-results">
                <p>No users found</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="admin-table-container desktop-table-view">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Bookings</th>
                  <th>Confirmed</th>
                  <th>Spent</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id} className="clickable-row" onClick={() => handleRowClick(user)}>
                    <td>
                      {user._id.slice(0, 8)}...
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>
                      <span className="booking-count">
                        {user.bookingsCount} bookings
                      </span>
                    </td>
                    <td>
                      <span className="confirmed-count">
                        {user.confirmedBookingsCount} confirmed
                      </span>
                    </td>
                    <td className="amount-cell">
                      ₹{user.totalSpent.toLocaleString('en-IN')}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button 
                          className="btn-view"
                          onClick={() => handleRowClick(user)}
                        >
                          View
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="no-results">
                <p>No users found</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserDetails(false)}>
          <div className="modal-content medium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                }}
              >
                <span>×</span>
              </button>
            </div>
            
            <div className="details-container">
              <div className="profile-section">
                <div className="profile-avatar-large">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.email}</p>
                  <p>{selectedUser.phone || 'No phone number provided'}</p>
                  <p>Member since: {formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              
              <div className="stats-cards">
                <div className="stat-card">
                  <h4>Total Bookings</h4>
                  <p className="stat-number">{selectedUser.bookingsCount}</p>
                </div>
                <div className="stat-card">
                  <h4>Confirmed Bookings</h4>
                  <p className="stat-number">{selectedUser.confirmedBookingsCount}</p>
                </div>
                <div className="stat-card">
                  <h4>Total Spent</h4>
                  <p className="stat-number">₹{selectedUser.totalSpent.toLocaleString('en-IN')}</p>
                </div>
                <div className="stat-card">
                  <h4>Account Status</h4>
                  <p className="stat-badge active">Active</p>
                </div>
              </div>
              
              <div className="details-grid">
                <div className="detail-card">
                  <h3><i>📧</i> Contact Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{selectedUser.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">User ID</span>
                    <span className="detail-value">{selectedUser._id.slice(0, 12)}...</span>
                  </div>
                </div>
                
                <div className="detail-card">
                  <h3><i>📊</i> Statistics</h3>
                  <div className="detail-row">
                    <span className="detail-label">Total Bookings</span>
                    <span className="detail-value">{selectedUser.bookingsCount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Confirmed</span>
                    <span className="detail-value badge status-badge confirmed">{selectedUser.confirmedBookingsCount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Spent</span>
                    <span className="detail-value amount">₹{selectedUser.totalSpent.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              
              <div className="booking-history">
                <h3><i>📋</i> Booking History</h3>
                {selectedUser.bookings.length === 0 ? (
                  <div className="no-bookings">
                    <p>No bookings yet</p>
                  </div>
                ) : (
                  <div className="booking-list">
                    {selectedUser.bookings.slice(0, 5).map(booking => (
                      <div key={booking._id} className="booking-item">
                        <div className="booking-header">
                          <h4>{booking.tourTitle || 'Unknown Tour'}</h4>
                          <span className={`status-badge ${booking.status || 'pending'}`}>
                            {booking.status || 'pending'}
                          </span>
                        </div>
                        <div className="booking-details">
                          <p>
                            <span className="detail-label">Travel Date:</span>
                            <span>{formatDate(booking.travelDate)}</span>
                          </p>
                          <p>
                            <span className="detail-label">Travelers:</span>
                            <span>{booking.travelers || 1}</span>
                          </p>
                          <p>
                            <span className="detail-label">Amount:</span>
                            <span className="amount">₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
                          </p>
                          <p>
                            <span className="detail-label">Booked on:</span>
                            <span>{formatDate(booking.bookingDate || booking.createdAt)}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowUserDetails(false);
                    setSelectedUser(null);
                  }}
                >
                  Close
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this user?')) {
                      handleDeleteUser(selectedUser._id);
                      setShowUserDetails(false);
                    }
                  }}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tours Management Component - UPDATED with enhanced form and image handling
const ToursManagement = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showTourDetails, setShowTourDetails] = useState(false);
  const [tourForm, setTourForm] = useState({
    title: '',
    description: '',
    detailedDescription: '',
    price: '',
    duration: '',
    image: '',
    images: [''],
    region: 'north',
    category: 'heritage',
    destination: '',
    
    // Overview
    overview: {
      highlights: [''],
      groupSize: '',
      difficulty: 'easy',
      ageRange: '',
      bestSeason: '',
      languages: []
    },
    
    // Included/Excluded
    included: [''],
    excluded: [''],
    
    // Itinerary
    itinerary: [{
      day: 1,
      title: '',
      description: '',
      activities: [''],
      meals: '',
      accommodation: ''
    }],
    
    // Requirements
    requirements: {
      physicalLevel: '',
      fitnessLevel: '',
      documents: [''],
      packingList: ['']
    },
    
    // Pricing
    pricing: {
      basePrice: '',
      discounts: [{ name: '', percentage: 0, description: '' }],
      paymentPolicy: '',
      cancellationPolicy: ''
    },
    
    // Important Info
    importantInfo: {
      bookingCutoff: '',
      refundPolicy: '',
      healthAdvisory: '',
      safetyMeasures: ''
    }
  });
  const tableContainerRef = useRef(null);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const allTours = await getTours();
      console.log('📊 Loaded tours for admin:', allTours.length);
      
      // Log image information for debugging
      allTours.forEach((tour, index) => {
        console.log(`Tour ${index + 1}:`, {
          title: tour.title,
          hasImages: !!tour.images,
          imagesCount: tour.images?.length || 0,
          mainImage: tour.image,
          allImages: tour.images
        });
      });
      
      setTours(allTours);
    } catch (error) {
      console.error('Error fetching tours:', error);
      alert('Error loading tours. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTour = async (e) => {
    e.preventDefault();
    
    // Validate images
    const mainImage = tourForm.image.trim();
    if (!mainImage) {
      alert('Please provide a main image URL');
      return;
    }
    
    // Prepare tour data with image handling
    const tourData = {
      title: tourForm.title,
      description: tourForm.description,
      detailedDescription: tourForm.detailedDescription,
      price: parseInt(tourForm.price) || 0,
      duration: tourForm.duration,
      image: mainImage,
      images: [mainImage, ...tourForm.images.filter(img => img.trim() !== '')].filter((img, index, array) => 
        img && array.indexOf(img) === index // Remove duplicates
      ),
      region: tourForm.region,
      category: tourForm.category,
      destination: tourForm.destination || `${tourForm.region} India`,
      
      overview: {
        highlights: tourForm.overview.highlights.filter(h => h.trim() !== ''),
        groupSize: tourForm.overview.groupSize,
        difficulty: tourForm.overview.difficulty,
        ageRange: tourForm.overview.ageRange,
        bestSeason: tourForm.overview.bestSeason,
        languages: tourForm.overview.languages.filter(l => l.trim() !== '')
      },
      
      included: tourForm.included.filter(i => i.trim() !== ''),
      excluded: tourForm.excluded.filter(e => e.trim() !== ''),
      
      itinerary: tourForm.itinerary.map(item => ({
        day: item.day || 1,
        title: item.title || `Day ${item.day}`,
        description: item.description || '',
        activities: item.activities.filter(a => a.trim() !== ''),
        meals: item.meals || '',
        accommodation: item.accommodation || ''
      })),
      
      requirements: {
        physicalLevel: tourForm.requirements.physicalLevel,
        fitnessLevel: tourForm.requirements.fitnessLevel,
        documents: tourForm.requirements.documents.filter(d => d.trim() !== ''),
        packingList: tourForm.requirements.packingList.filter(p => p.trim() !== '')
      },
      
      pricing: {
        basePrice: parseInt(tourForm.pricing.basePrice) || parseInt(tourForm.price) || 0,
        discounts: tourForm.pricing.discounts.filter(d => d.name.trim() !== ''),
        paymentPolicy: tourForm.pricing.paymentPolicy,
        cancellationPolicy: tourForm.pricing.cancellationPolicy
      },
      
      importantInfo: {
        bookingCutoff: tourForm.importantInfo.bookingCutoff,
        refundPolicy: tourForm.importantInfo.refundPolicy,
        healthAdvisory: tourForm.importantInfo.healthAdvisory,
        safetyMeasures: tourForm.importantInfo.safetyMeasures
      }
    };

    console.log('📦 Prepared tour data with images:', {
      mainImage: tourData.image,
      allImages: tourData.images,
      imageCount: tourData.images.length
    });

    try {
      if (editingTour) {
        // Update existing tour
        const updated = await updateTour(editingTour._id, tourData);
        if (updated) {
          alert('Tour updated successfully!');
          await fetchTours(); // Refresh tours list
        }
      } else {
        // Create new tour
        const created = await saveTour(tourData);
        if (created) {
          alert('Tour added successfully!');
          await fetchTours(); // Refresh tours list
        }
      }
      
      setShowAddModal(false);
      setEditingTour(null);
      resetTourForm();
    } catch (error) {
      console.error('Error saving tour:', error);
      alert('Error saving tour. Please try again.');
    }
  };

  const resetTourForm = () => {
    setTourForm({
      title: '',
      description: '',
      detailedDescription: '',
      price: '',
      duration: '',
      image: '',
      images: [''],
      region: 'north',
      category: 'heritage',
      destination: '',
      
      overview: {
        highlights: [''],
        groupSize: '',
        difficulty: 'easy',
        ageRange: '',
        bestSeason: '',
        languages: []
      },
      
      included: [''],
      excluded: [''],
      
      itinerary: [{
        day: 1,
        title: '',
        description: '',
        activities: [''],
        meals: '',
        accommodation: ''
      }],
      
      requirements: {
        physicalLevel: '',
        fitnessLevel: '',
        documents: [''],
        packingList: ['']
      },
      
      pricing: {
        basePrice: '',
        discounts: [{ name: '', percentage: 0, description: '' }],
        paymentPolicy: '',
        cancellationPolicy: ''
      },
      
      importantInfo: {
        bookingCutoff: '',
        refundPolicy: '',
        healthAdvisory: '',
        safetyMeasures: ''
      }
    });
  };

  const handleRowClick = (tour) => {
    setSelectedTour(tour);
    setShowTourDetails(true);
  };

  const handleEditTour = (tour) => {
    console.log('📝 Editing tour images:', {
      mainImage: tour.image,
      allImages: tour.images,
      imageCount: tour.images?.length || 0
    });
    
    setEditingTour(tour);
    setTourForm({
      title: tour.title || '',
      description: tour.description || '',
      detailedDescription: tour.detailedDescription || '',
      price: tour.price?.toString() || '',
      duration: tour.duration || '',
      image: tour.image || '',
      images: tour.images?.filter(img => img !== tour.image) || [''],
      region: tour.region || 'north',
      category: tour.category || 'heritage',
      destination: tour.destination || '',
      
      overview: tour.overview || {
        highlights: [''],
        groupSize: '',
        difficulty: 'easy',
        ageRange: '',
        bestSeason: '',
        languages: []
      },
      
      included: tour.included?.length > 0 ? tour.included : [''],
      excluded: tour.excluded?.length > 0 ? tour.excluded : [''],
      
      itinerary: tour.itinerary?.length > 0 ? tour.itinerary : [{
        day: 1,
        title: '',
        description: '',
        activities: [''],
        meals: '',
        accommodation: ''
      }],
      
      requirements: tour.requirements || {
        physicalLevel: '',
        fitnessLevel: '',
        documents: [''],
        packingList: ['']
      },
      
      pricing: tour.pricing || {
        basePrice: tour.price?.toString() || '',
        discounts: [{ name: '', percentage: 0, description: '' }],
        paymentPolicy: '',
        cancellationPolicy: ''
      },
      
      importantInfo: tour.importantInfo || {
        bookingCutoff: '',
        refundPolicy: '',
        healthAdvisory: '',
        safetyMeasures: ''
      }
    });
    setShowAddModal(true);
  };

  const handleDeleteTour = async (tourId) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        const success = await deleteTour(tourId);
        if (success) {
          await fetchTours();
          alert('Tour deleted successfully');
        }
      } catch (error) {
        alert('Error deleting tour');
      }
    }
  };

  const getTourTypeIcon = (type) => {
    switch(type) {
      case 'heritage': return '🏛️';
      case 'adventure': return '⛰️';
      case 'beach': return '🏖️';
      case 'wellness': return '🧘';
      case 'cultural': return '🎭';
      case 'spiritual': return '🕉️';
      default: return '🏔️';
    }
  };

  // Helper functions for dynamic arrays
  const addArrayItem = (field, parent = null) => {
    setTourForm(prev => {
      if (parent) {
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [field]: [...prev[parent][field], '']
          }
        };
      }
      return {
        ...prev,
        [field]: [...prev[field], '']
      };
    });
  };

  const removeArrayItem = (field, index, parent = null) => {
    setTourForm(prev => {
      if (parent) {
        const newArray = [...prev[parent][field]];
        newArray.splice(index, 1);
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [field]: newArray
          }
        };
      }
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const updateArrayItem = (field, index, value, parent = null) => {
    setTourForm(prev => {
      if (parent) {
        const newArray = [...prev[parent][field]];
        newArray[index] = value;
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [field]: newArray
          }
        };
      }
      const newArray = [...prev[field]];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  // Itinerary helpers
  const addItineraryDay = () => {
    const newDay = tourForm.itinerary.length + 1;
    setTourForm(prev => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        {
          day: newDay,
          title: '',
          description: '',
          activities: [''],
          meals: '',
          accommodation: ''
        }
      ]
    }));
  };

  const removeItineraryDay = (index) => {
    setTourForm(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index).map((item, i) => ({ ...item, day: i + 1 }))
    }));
  };

  // Image preview handler
  const handleImagePreview = (url) => {
    if (!url) return null;
    
    try {
      // Create a new image to check if it loads
      const img = new Image();
      img.src = url;
      
      img.onload = () => {
        console.log('✅ Image loaded successfully:', url);
      };
      
      img.onerror = () => {
        console.log('❌ Failed to load image:', url);
      };
      
      return url;
    } catch (error) {
      console.error('Error checking image:', error);
      return 'https://via.placeholder.com/60x40?text=No+Image';
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-header">
        <div>
          <h1>Tours Management</h1>
          <p>Total {tours.length} tour packages</p>
        </div>
        <button 
          className="btn-add"
          onClick={() => {
            setEditingTour(null);
            resetTourForm();
            setShowAddModal(true);
          }}
        >
          + Add New Tour
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading tours...</div>
      ) : (
        <>
          {/* Mobile Table View with Horizontal Scroll */}
          <div className="mobile-table-wrapper">
            <div 
              className="mobile-table-container"
              ref={tableContainerRef}
            >
              <table className="mobile-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Region</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map(tour => (
                    <tr key={tour._id} className="clickable-row" onClick={() => handleRowClick(tour)}>
                      <td>
                        {tour._id.slice(0, 8)}...
                      </td>
                      <td>
                        <img 
                          src={tour.images && tour.images.length > 0 ? tour.images[0] : tour.image || 'https://via.placeholder.com/60x40?text=No+Image'} 
                          alt={tour.title}
                          className="tour-thumbnail"
                          onError={(e) => {
                            console.log('❌ Failed to load tour image:', tour.image);
                            e.target.src = 'https://via.placeholder.com/60x40?text=No+Image';
                            e.target.onerror = null; // Prevent infinite loop
                          }}
                          loading="lazy"
                        />
                      </td>
                      <td>{tour.title}</td>
                      <td>₹{tour.price?.toLocaleString('en-IN')}</td>
                      <td>{tour.duration}</td>
                      <td>
                        <span className="tour-type">{tour.category || tour.type}</span>
                      </td>
                      <td>
                        <span className="tour-region">{tour.region}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#FF9966' }}>★</span>
                          <span>{tour.averageRating?.toFixed(1) || '0.0'}</span>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            ({tour.totalRatings || 0})
                          </span>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons">
                          <button 
                            className="btn-edit"
                            onClick={() => handleEditTour(tour)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteTour(tour._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {tours.length === 0 && (
              <div className="no-results">
                <p>No tours found. Add your first tour!</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="admin-table-container desktop-table-view">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Region</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tours.map(tour => (
                  <tr key={tour._id} className="clickable-row" onClick={() => handleRowClick(tour)}>
                    <td>
                      {tour._id.slice(0, 8)}...
                    </td>
                    <td>
                      <img 
                        src={tour.images && tour.images.length > 0 ? tour.images[0] : tour.image || 'https://via.placeholder.com/60x40?text=No+Image'} 
                        alt={tour.title}
                        className="tour-thumbnail"
                        onError={(e) => {
                          console.log('❌ Failed to load tour image:', tour.image);
                          e.target.src = 'https://via.placeholder.com/60x40?text=No+Image';
                          e.target.onerror = null; // Prevent infinite loop
                        }}
                        loading="lazy"
                      />
                    </td>
                    <td>{tour.title}</td>
                    <td>₹{tour.price?.toLocaleString('en-IN')}</td>
                    <td>{tour.duration}</td>
                    <td>
                      <span className="tour-type">{tour.category || tour.type}</span>
                    </td>
                    <td>
                      <span className="tour-region">{tour.region}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#FF9966' }}>★</span>
                        <span>{tour.averageRating?.toFixed(1) || '0.0'}</span>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>
                          ({tour.totalRatings || 0})
                        </span>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditTour(tour)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteTour(tour._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {tours.length === 0 && (
              <div className="no-results">
                <p>No tours found. Add your first tour!</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Tour Details Modal - ENHANCED with image gallery */}
      {showTourDetails && selectedTour && (
        <div className="modal-overlay" onClick={() => setShowTourDetails(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tour Details</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowTourDetails(false);
                  setSelectedTour(null);
                }}
              >
                <span>×</span>
              </button>
            </div>
            
            <div className="details-container">
              <div className="profile-section">
                <div className="profile-avatar-large" style={{background: 'linear-gradient(135deg, #4A90E2, #357ABD)'}}>
                  {getTourTypeIcon(selectedTour.category)}
                </div>
                <div className="profile-info">
                  <h3>{selectedTour.title}</h3>
                  <p>{selectedTour.description?.substring(0, 100)}...</p>
                  <p>Tour ID: {selectedTour._id.slice(0, 12)}...</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#FF9966', fontSize: '1.2rem' }}>★</span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {selectedTour.averageRating?.toFixed(1) || '0.0'}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>
                        ({selectedTour.totalRatings || 0} ratings)
                      </span>
                    </div>
                    <span className="tour-type">{selectedTour.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="stats-cards">
                <div className="stat-card" style={{background: 'linear-gradient(135deg, #2E8B57, #1a5c3a)'}}>
                  <h4>Price</h4>
                  <p className="stat-number">₹{selectedTour.price?.toLocaleString('en-IN')}</p>
                </div>
                <div className="stat-card" style={{background: 'linear-gradient(135deg, #6c5ce7, #4834d4)'}}>
                  <h4>Duration</h4>
                  <p className="stat-number">{selectedTour.duration}</p>
                </div>
                <div className="stat-card" style={{background: 'linear-gradient(135deg, #00b894, #00a085)'}}>
                  <h4>Group Size</h4>
                  <p className="stat-number">{selectedTour.overview?.groupSize || 'Not specified'}</p>
                </div>
                <div className="stat-card" style={{background: 'linear-gradient(135deg, #fdcb6e, #f9a825)'}}>
                  <h4>Status</h4>
                  <p className="stat-badge active">Active</p>
                </div>
              </div>
              
              {/* Image Gallery Section */}
              <div className="detail-card">
                <h3><i>🖼️</i> Tour Images ({selectedTour.images ? selectedTour.images.length : 1})</h3>
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  overflowX: 'auto', 
                  padding: '1rem 0',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#2E8B57 #f0f0f0'
                }}>
                  {selectedTour.images && selectedTour.images.length > 0 ? (
                    selectedTour.images.map((img, index) => (
                      <div key={index} style={{ 
                        position: 'relative',
                        flexShrink: 0,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: index === 0 ? '3px solid #2E8B57' : '1px solid #eee'
                      }}>
                        <img 
                          src={img} 
                          alt={`${selectedTour.title} ${index + 1}`}
                          style={{
                            width: '200px',
                            height: '150px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            console.log('❌ Failed to load gallery image:', img);
                            e.target.src = 'https://via.placeholder.com/200x150?text=Image+Error';
                            e.target.onerror = null;
                          }}
                          loading="lazy"
                        />
                        {index === 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: '#2E8B57',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            Main
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      textAlign: 'center', 
                      padding: '2rem',
                      background: '#FFFAF5',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</div>
                      <p style={{ color: '#666' }}>No images available for this tour</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="details-grid">
                <div className="detail-card">
                  <h3><i>📍</i> Location & Details</h3>
                  <div className="detail-row">
                    <span className="detail-label">Region</span>
                    <span className="detail-value">{selectedTour.region}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Destination</span>
                    <span className="detail-value">{selectedTour.destination}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Best Season</span>
                    <span className="detail-value">{selectedTour.overview?.bestSeason || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Languages</span>
                    <span className="detail-value">
                      {selectedTour.overview?.languages?.join(', ') || 'Not specified'}
                    </span>
                  </div>
                </div>
                
                <div className="detail-card">
                  <h3><i>🎯</i> Tour Overview</h3>
                  <div className="detail-row">
                    <span className="detail-label">Difficulty</span>
                    <span className="detail-value">{selectedTour.overview?.difficulty || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age Range</span>
                    <span className="detail-value">{selectedTour.overview?.ageRange || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Max Participants</span>
                    <span className="detail-value">{selectedTour.maxParticipants || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Current Bookings</span>
                    <span className="detail-value">{selectedTour.currentParticipants || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-card">
                <h3><i>📝</i> Detailed Description</h3>
                <p style={{color: '#666', lineHeight: '1.6', margin: '0', whiteSpace: 'pre-line'}}>
                  {selectedTour.detailedDescription || selectedTour.description || 'No detailed description provided'}
                </p>
              </div>
              
              {/* Tour Highlights */}
              {selectedTour.overview?.highlights && selectedTour.overview.highlights.length > 0 && (
                <div className="detail-card">
                  <h3><i>✨</i> Tour Highlights</h3>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                    {selectedTour.overview.highlights.map((highlight, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem', color: '#666' }}>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowTourDetails(false);
                    setSelectedTour(null);
                  }}
                >
                  Close
                </button>
                <button 
                  className="btn-edit"
                  onClick={() => {
                    setShowTourDetails(false);
                    handleEditTour(selectedTour);
                  }}
                >
                  Edit Tour
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this tour?')) {
                      handleDeleteTour(selectedTour._id);
                      setShowTourDetails(false);
                    }
                  }}
                >
                  Delete Tour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit Tour Modal - ENHANCED with image preview */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal" style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h2>{editingTour ? 'Edit Tour' : 'Add New Tour'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTour(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSaveTour} className="tour-form">
              <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1.5rem' }}>
                {/* Basic Information */}
                <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #eee' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#2E8B57' }}>Basic Information</h3>
                  <div className="form-group">
                    <label>Tour Title *</label>
                    <input
                      type="text"
                      value={tourForm.title}
                      onChange={(e) => setTourForm({...tourForm, title: e.target.value})}
                      required
                      placeholder="Enter tour title"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Short Description *</label>
                    <textarea
                      value={tourForm.description}
                      onChange={(e) => setTourForm({...tourForm, description: e.target.value})}
                      required
                      placeholder="Enter short description (for cards)"
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Detailed Description</label>
                    <textarea
                      value={tourForm.detailedDescription}
                      onChange={(e) => setTourForm({...tourForm, detailedDescription: e.target.value})}
                      placeholder="Enter detailed description (for tour page)"
                      rows="5"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (INR) *</label>
                      <input
                        type="number"
                        value={tourForm.price}
                        onChange={(e) => setTourForm({...tourForm, price: e.target.value})}
                        required
                        placeholder="Enter price"
                        min="0"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Duration *</label>
                      <input
                        type="text"
                        value={tourForm.duration}
                        onChange={(e) => setTourForm({...tourForm, duration: e.target.value})}
                        required
                        placeholder="e.g., 7 days"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Region</label>
                      <select
                        value={tourForm.region}
                        onChange={(e) => setTourForm({...tourForm, region: e.target.value})}
                      >
                        <option value="north">North India</option>
                        <option value="south">South India</option>
                        <option value="west">West India</option>
                        <option value="east">East India</option>
                        <option value="central">Central India</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={tourForm.category}
                        onChange={(e) => setTourForm({...tourForm, category: e.target.value})}
                      >
                        <option value="heritage">Heritage</option>
                        <option value="adventure">Adventure</option>
                        <option value="beach">Beach</option>
                        <option value="wellness">Wellness</option>
                        <option value="cultural">Cultural</option>
                        <option value="spiritual">Spiritual</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Main Image */}
                  <div className="form-group">
                    <label>Main Image URL *</label>
                    <input
                      type="url"
                      value={tourForm.image}
                      onChange={(e) => setTourForm({...tourForm, image: e.target.value})}
                      required
                      placeholder="Enter main image URL"
                    />
                    {tourForm.image && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Preview:</p>
                        <img 
                          src={tourForm.image} 
                          alt="Main image preview"
                          style={{
                            width: '100px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100x80?text=Invalid+URL';
                            e.target.onerror = null;
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Additional Images */}
                  <div className="form-group">
                    <label>Additional Image URLs</label>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      Add extra images for the tour gallery
                    </p>
                    {tourForm.images.map((img, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="url"
                            value={img}
                            onChange={(e) => {
                              const newImages = [...tourForm.images];
                              newImages[index] = e.target.value;
                              setTourForm({...tourForm, images: newImages});
                            }}
                            placeholder="Enter additional image URL"
                            style={{ width: '100%' }}
                          />
                          {img && (
                            <div style={{ marginTop: '0.25rem' }}>
                              <img 
                                src={img} 
                                alt={`Preview ${index + 1}`}
                                style={{
                                  width: '80px',
                                  height: '60px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: '1px solid #ddd'
                                }}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/80x60?text=Invalid+URL';
                                  e.target.onerror = null;
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeArrayItem('images', index)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            alignSelf: 'flex-start'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('images')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#2E8B57',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginTop: '0.5rem'
                      }}
                    >
                      + Add Image
                    </button>
                  </div>
                </div>
                
                {/* Tour Overview */}
                <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #eee' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#2E8B57' }}>Tour Overview</h3>
                  
                  <div className="form-group">
                    <label>Tour Highlights</label>
                    {tourForm.overview.highlights.map((highlight, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) => updateArrayItem('highlights', index, e.target.value, 'overview')}
                          placeholder="Enter tour highlight"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('highlights', index, 'overview')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('highlights', 'overview')}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#2E8B57',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginTop: '0.5rem'
                      }}
                    >
                      + Add Highlight
                    </button>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Group Size</label>
                      <input
                        type="text"
                        value={tourForm.overview.groupSize}
                        onChange={(e) => setTourForm({
                          ...tourForm,
                          overview: {...tourForm.overview, groupSize: e.target.value}
                        })}
                        placeholder="e.g., 2-10 People"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select
                        value={tourForm.overview.difficulty}
                        onChange={(e) => setTourForm({
                          ...tourForm,
                          overview: {...tourForm.overview, difficulty: e.target.value}
                        })}
                      >
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="difficult">Difficult</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Age Range</label>
                      <input
                        type="text"
                        value={tourForm.overview.ageRange}
                        onChange={(e) => setTourForm({
                          ...tourForm,
                          overview: {...tourForm.overview, ageRange: e.target.value}
                        })}
                        placeholder="e.g., 18-65 years"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Best Season</label>
                      <input
                        type="text"
                        value={tourForm.overview.bestSeason}
                        onChange={(e) => setTourForm({
                          ...tourForm,
                          overview: {...tourForm.overview, bestSeason: e.target.value}
                        })}
                        placeholder="e.g., October to March"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Languages (comma separated)</label>
                    <input
                      type="text"
                      value={tourForm.overview.languages.join(', ')}
                      onChange={(e) => setTourForm({
                        ...tourForm,
                        overview: {...tourForm.overview, languages: e.target.value.split(',').map(l => l.trim())}
                      })}
                      placeholder="e.g., English, Hindi, Local Language"
                    />
                  </div>
                </div>
                
                {/* Included/Excluded Services */}
                <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #eee' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#2E8B57' }}>Services</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Included Services</label>
                      {tourForm.included.map((item, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateArrayItem('included', index, e.target.value)}
                            placeholder="e.g., Accommodation for all nights"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('included', index)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('included')}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#2E8B57',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginTop: '0.5rem'
                        }}
                      >
                        + Add Inclusion
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <label>Excluded Services</label>
                      {tourForm.excluded.map((item, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateArrayItem('excluded', index, e.target.value)}
                            placeholder="e.g., International flights"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem('excluded', index)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem('excluded')}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#2E8B57',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginTop: '0.5rem'
                        }}
                      >
                        + Add Exclusion
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Itinerary */}
                <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#2E8B57', margin: 0 }}>Itinerary</h3>
                    <button
                      type="button"
                      onClick={addItineraryDay}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#2E8B57',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Day
                    </button>
                  </div>
                  
                  {tourForm.itinerary.map((day, index) => (
                    <div key={index} style={{ 
                      background: '#f8f9fa', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      marginBottom: '1rem',
                      border: '1px solid #eee'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, color: '#2E8B57' }}>Day {day.day}</h4>
                        {tourForm.itinerary.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItineraryDay(index)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Remove Day
                          </button>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>Day Title</label>
                        <input
                          type="text"
                          value={day.title}
                          onChange={(e) => {
                            const newItinerary = [...tourForm.itinerary];
                            newItinerary[index].title = e.target.value;
                            setTourForm({...tourForm, itinerary: newItinerary});
                          }}
                          placeholder="e.g., Arrival & Orientation"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Day Description</label>
                        <textarea
                          value={day.description}
                          onChange={(e) => {
                            const newItinerary = [...tourForm.itinerary];
                            newItinerary[index].description = e.target.value;
                            setTourForm({...tourForm, itinerary: newItinerary});
                          }}
                          placeholder="Describe the day's activities"
                          rows="3"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Activities</label>
                        {day.activities.map((activity, activityIndex) => (
                          <div key={activityIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                              type="text"
                              value={activity}
                              onChange={(e) => {
                                const newItinerary = [...tourForm.itinerary];
                                newItinerary[index].activities[activityIndex] = e.target.value;
                                setTourForm({...tourForm, itinerary: newItinerary});
                              }}
                              placeholder="e.g., Arrival at destination airport"
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItinerary = [...tourForm.itinerary];
                                newItinerary[index].activities.splice(activityIndex, 1);
                                setTourForm({...tourForm, itinerary: newItinerary});
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newItinerary = [...tourForm.itinerary];
                            newItinerary[index].activities.push('');
                            setTourForm({...tourForm, itinerary: newItinerary});
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#2E8B57',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginTop: '0.5rem'
                          }}
                        >
                          + Add Activity
                        </button>
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Meals Included</label>
                          <input
                            type="text"
                            value={day.meals}
                            onChange={(e) => {
                              const newItinerary = [...tourForm.itinerary];
                              newItinerary[index].meals = e.target.value;
                              setTourForm({...tourForm, itinerary: newItinerary});
                            }}
                            placeholder="e.g., Breakfast, Lunch, Dinner"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Accommodation</label>
                          <input
                            type="text"
                            value={day.accommodation}
                            onChange={(e) => {
                              const newItinerary = [...tourForm.itinerary];
                              newItinerary[index].accommodation = e.target.value;
                              setTourForm({...tourForm, itinerary: newItinerary});
                            }}
                            placeholder="e.g., Hotel or Resort"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTour(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingTour ? 'Update Tour' : 'Add Tour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Bookings Management Component - FIXED with improved popup
const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const allBookings = await getAllBookings();
      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Error loading bookings. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
    const matchesSearch = 
      (booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.tourTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking._id?.toString().includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const success = await updateBookingStatus(bookingId, newStatus);
      if (success) {
        // Update local state
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId ? { ...booking, status: newStatus } : booking
        ));
        
        // Update selected booking if it's open
        if (selectedBooking && selectedBooking._id === bookingId) {
          setSelectedBooking({...selectedBooking, status: newStatus});
        }
        
        // Show success message
        showStatusUpdateNotification(bookingId, newStatus);
      } else {
        alert('Error updating booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status. Please try again.');
    }
  };

  const showStatusUpdateNotification = (bookingId, newStatus) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (booking) {
      alert(`Booking ${bookingId.slice(-8)} status updated to ${newStatus} for ${booking.userName}`);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const success = await deleteBooking(bookingId);
        if (success) {
          setBookings(prev => prev.filter(b => b._id !== bookingId));
          
          // Close details modal if open
          if (selectedBooking && selectedBooking._id === bookingId) {
            setShowBookingDetails(false);
            setSelectedBooking(null);
          }
          
          alert('Booking deleted successfully');
        }
      } catch (error) {
        alert('Error deleting booking');
      }
    }
  };

  const handleRowClick = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const getStatusCounts = () => {
    return {
      all: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      completed: bookings.filter(b => b.status === 'completed').length
    };
  };

  const statusCounts = getStatusCounts();

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

  return (
    <div className="admin-content">
      <div className="admin-header">
        <div>
          <h1>Bookings Management</h1>
          <p>Total {bookings.length} bookings ({statusCounts.confirmed} confirmed)</p>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search bookings by user, tour, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Status Filter Tabs */}
      <div className="status-tabs">
        <button 
          className={`status-tab ${selectedStatus === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('all')}
        >
          All <span className="tab-count">{statusCounts.all}</span>
        </button>
        <button 
          className={`status-tab ${selectedStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('pending')}
        >
          Pending <span className="tab-count">{statusCounts.pending}</span>
        </button>
        <button 
          className={`status-tab ${selectedStatus === 'confirmed' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('confirmed')}
        >
          Confirmed <span className="tab-count">{statusCounts.confirmed}</span>
        </button>
        <button 
          className={`status-tab ${selectedStatus === 'cancelled' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('cancelled')}
        >
          Cancelled <span className="tab-count">{statusCounts.cancelled}</span>
        </button>
        <button 
          className={`status-tab ${selectedStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('completed')}
        >
          Completed <span className="tab-count">{statusCounts.completed}</span>
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading bookings...</div>
      ) : (
        <>
          {/* Mobile Table View with Horizontal Scroll */}
          <div className="mobile-table-wrapper">
            <div 
              className="mobile-table-container"
              ref={tableContainerRef}
            >
              <table className="mobile-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>User</th>
                    <th>Tour</th>
                    <th>Travel Date</th>
                    <th>Travelers</th>
                    <th>Amount</th>
                    <th>Booked On</th>
                    <th>Status</th>
                    <th>Update Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(booking => (
                    <tr key={booking._id} className="clickable-row" onClick={() => handleRowClick(booking)}>
                      <td>
                        <div className="booking-id">
                          TV{booking._id.toString().slice(-8)}
                        </div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar small">
                            {booking.userName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <strong>{booking.userName || 'Unknown User'}</strong>
                            <br />
                            <small>{booking.userEmail || 'No email'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="tour-cell">
                          <strong>{booking.tourTitle || 'Unknown Tour'}</strong>
                          <small>Tour ID: {booking.tourId || 'N/A'}</small>
                        </div>
                      </td>
                      <td>
                        {formatDate(booking.travelDate)}
                      </td>
                      <td>{booking.travelers || 1}</td>
                      <td className="amount-cell">
                        ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td>
                        {formatDate(booking.bookingDate || booking.createdAt)}
                      </td>
                      <td>
                        <span className={`status-badge ${booking.status || 'pending'}`}>
                          {booking.status || 'pending'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="admin-status-update">
                          <select 
                            value={booking.status || 'pending'}
                            onChange={(e) => handleUpdateStatus(booking._id, e.target.value)}
                            className="admin-status-select"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons">
                          <button 
                            className="btn-view"
                            onClick={() => handleRowClick(booking)}
                          >
                            View
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteBooking(booking._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredBookings.length === 0 && (
              <div className="no-results">
                <p>No bookings found</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="admin-table-container desktop-table-view">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>User</th>
                  <th>Tour</th>
                  <th>Travel Date</th>
                  <th>Travelers</th>
                  <th>Amount</th>
                  <th>Booked On</th>
                  <th>Status</th>
                  <th>Update Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => (
                  <tr key={booking._id} className="clickable-row" onClick={() => handleRowClick(booking)}>
                    <td>
                      <div className="booking-id">
                        TV{booking._id.toString().slice(-8)}
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar small">
                          {booking.userName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <strong>{booking.userName || 'Unknown User'}</strong>
                          <br />
                          <small>{booking.userEmail || 'No email'}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="tour-cell">
                        <strong>{booking.tourTitle || 'Unknown Tour'}</strong>
                        <small>Tour ID: {booking.tourId || 'N/A'}</small>
                      </div>
                    </td>
                    <td>
                      {formatDate(booking.travelDate)}
                    </td>
                    <td>{booking.travelers || 1}</td>
                    <td className="amount-cell">
                      ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      {formatDate(booking.bookingDate || booking.createdAt)}
                    </td>
                    <td>
                      <span className={`status-badge ${booking.status || 'pending'}`}>
                        {booking.status || 'pending'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="admin-status-update">
                        <select 
                          value={booking.status || 'pending'}
                          onChange={(e) => handleUpdateStatus(booking._id, e.target.value)}
                          className="admin-status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button 
                          className="btn-view"
                          onClick={() => handleRowClick(booking)}
                        >
                          View
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteBooking(booking._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredBookings.length === 0 && (
              <div className="no-results">
                <p>No bookings found</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowBookingDetails(false)}>
          <div className="modal-content medium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowBookingDetails(false);
                  setSelectedBooking(null);
                }}
              >
                <span>×</span>
              </button>
            </div>
            
            <div className="details-container">
              <div className="profile-section">
                <div className="profile-avatar-large" style={{background: 'linear-gradient(135deg, #6c5ce7, #4834d4)'}}>
                  {selectedBooking.userName?.charAt(0).toUpperCase() || 'B'}
                </div>
                <div className="profile-info">
                  <h3>{selectedBooking.userName || 'Unknown User'}</h3>
                  <p>{selectedBooking.userEmail || 'No email provided'}</p>
                  <p>Booking ID: TV{selectedBooking._id.toString().slice(-8)}</p>
                  <p>Booking Date: {formatDate(selectedBooking.bookingDate || selectedBooking.createdAt)}</p>
                </div>
              </div>
              
              <div className="stats-cards">
                <div className="stat-card" style={{background: 'linear-gradient(135deg, #2E8B57, #1a5c3a)'}}>
                  <h4>Tour</h4>
                  <p className="stat-number">{selectedBooking.tourTitle || 'Unknown Tour'}</p>
                </div>
                <div className="stat-card" style={{background: 'linear-gradient(135deg, #6c5ce7, #4834d4)'}}>
                  <h4>Amount</h4>
                  <p className="stat-number">₹{(selectedBooking.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="stat-card" style={{background: 'linear-gradient(135deg, #00b894, #00a085)'}}>
                  <h4>Travelers</h4>
                  <p className="stat-number">{selectedBooking.travelers || 1}</p>
                </div>
                <div className="stat-card" style={{background: 'linear-gradient(135deg, #fdcb6e, #f9a825)'}}>
                  <h4>Status</h4>
                  <p className={`status-badge ${selectedBooking.status || 'pending'}`}>
                    {selectedBooking.status || 'pending'}
                  </p>
                </div>
              </div>
              
              <div className="details-grid">
                <div className="detail-card">
                  <h3><i>👤</i> User Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{selectedBooking.userName || 'Unknown User'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selectedBooking.userEmail || 'No email'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">User ID</span>
                    <span className="detail-value">{selectedBooking.userId?.slice(0, 12) || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="detail-card">
                  <h3><i>🏔️</i> Tour Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Tour Title</span>
                    <span className="detail-value">{selectedBooking.tourTitle || 'Unknown Tour'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tour ID</span>
                    <span className="detail-value">{selectedBooking.tourId || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Travel Date</span>
                    <span className="detail-value">{formatDate(selectedBooking.travelDate)}</span>
                  </div>
                </div>
              </div>
              
              <div className="details-grid">
                <div className="detail-card">
                  <h3><i>💰</i> Payment Details</h3>
                  <div className="detail-row">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value amount">₹{(selectedBooking.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Travelers</span>
                    <span className="detail-value">{selectedBooking.travelers || 1}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Booking Date</span>
                    <span className="detail-value">{formatDate(selectedBooking.bookingDate || selectedBooking.createdAt)}</span>
                  </div>
                </div>
                
                <div className="detail-card">
                  <h3><i>📊</i> Status Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Current Status</span>
                    <span className={`detail-value badge status-badge ${selectedBooking.status || 'pending'}`}>
                      {selectedBooking.status || 'pending'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Booking ID</span>
                    <span className="detail-value">TV{selectedBooking._id.toString().slice(-8)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Last Updated</span>
                    <span className="detail-value">{formatDate(selectedBooking.updatedAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="status-update-section">
                <h4>Update Booking Status</h4>
                <div className="status-update-grid">
                  <select 
                    value={selectedBooking.status || 'pending'}
                    onChange={(e) => handleUpdateStatus(selectedBooking._id, e.target.value)}
                    className="admin-status-select"
                    style={{width: '100%'}}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button 
                    className="btn-save"
                    onClick={() => {
                      setShowBookingDetails(false);
                      setSelectedBooking(null);
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowBookingDetails(false);
                    setSelectedBooking(null);
                  }}
                >
                  Close
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this booking?')) {
                      handleDeleteBooking(selectedBooking._id);
                      setShowBookingDetails(false);
                    }
                  }}
                >
                  Delete Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Component
const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'TourVista India',
    adminEmail: 'admin@tourvista.com',
    supportEmail: 'support@tourvista.com',
    contactNumber: '+91 98765 43210',
    commissionRate: 10,
    currency: 'INR'
  });

  const handleSaveSettings = async () => {
    try {
      // In a real app, you would save these to database
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('This will reset all data including users and bookings. Are you sure?')) {
      try {
        const response = await axios.post(`${API_URL}/admin/reset-data`);
        if (response.data.success) {
          alert('Data reset successfully!');
          window.location.reload();
        }
      } catch (error) {
        alert('Error resetting data');
      }
    }
  };

  return (
    <div className="admin-content">
      <h1>Admin Settings</h1>
      
      <div className="settings-form">
        <div className="form-group">
          <label>Site Name</label>
          <input 
            type="text" 
            value={settings.siteName}
            onChange={(e) => setSettings({...settings, siteName: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Admin Email</label>
          <input 
            type="email" 
            value={settings.adminEmail}
            onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Support Email</label>
          <input 
            type="email" 
            value={settings.supportEmail}
            onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Contact Number</label>
          <input 
            type="tel" 
            value={settings.contactNumber}
            onChange={(e) => setSettings({...settings, contactNumber: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Commission Rate (%)</label>
          <input 
            type="number" 
            value={settings.commissionRate}
            onChange={(e) => setSettings({...settings, commissionRate: parseInt(e.target.value) || 0})}
            min="0"
            max="100"
          />
        </div>
        
        <div className="form-group">
          <label>Currency</label>
          <select 
            value={settings.currency}
            onChange={(e) => setSettings({...settings, currency: e.target.value})}
          >
            <option value="INR">Indian Rupee (₹)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button className="btn-save" onClick={handleSaveSettings}>
            Save Settings
          </button>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <p>These actions are irreversible. Please proceed with caution.</p>
        
        <div className="danger-actions">
          <button 
            className="btn-danger"
            onClick={handleResetData}
          >
            Reset All Data
          </button>
          <button 
            className="btn-danger"
            onClick={async () => {
              if (window.confirm('This will delete all bookings. Continue?')) {
                try {
                  const response = await axios.delete(`${API_URL}/admin/bookings/all`);
                  if (response.data.success) {
                    alert('All bookings deleted!');
                    window.location.reload();
                  }
                } catch (error) {
                  alert('Error deleting bookings');
                }
              }
            }}
          >
            Clear All Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

// Sidebar Menu Item Component
const SidebarMenuItem = ({ to, icon, text, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || 
                   (to !== '/admin' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={`menu-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="menu-icon">{icon}</span>
      <span className="menu-text">{text}</span>
      {isActive && <span className="active-indicator"></span>}
    </Link>
  );
};

// Main Admin Panel Component
const AdminPanel = () => {
  const navigate = useNavigate();
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalTours: 0,
    totalBookings: 0,
    revenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin' && user.email !== 'admin@tourvista.com') {
      navigate('/dashboard');
      return;
    }
    // Calculate initial stats
    refreshStats();
    
    // Check screen width on load
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const refreshStats = async () => {
    try {
      setLoading(true);
      const stats = await calculateStats();
      setAdminStats(stats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '×' : '☰'}
      </button>
      
      {/* Sidebar */}
      <div className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>TourVista Admin</h2>
          <p>Administration Panel</p>
        </div>
        
        <div className="sidebar-menu">
          <SidebarMenuItem 
            to="/admin" 
            icon="📊"
            text="Dashboard"
            onClick={() => setSidebarOpen(false)}
          />
          
          <SidebarMenuItem 
            to="/admin/users" 
            icon="👥"
            text="Users"
            onClick={() => setSidebarOpen(false)}
          />
          
          <SidebarMenuItem 
            to="/admin/tours" 
            icon="🏔️"
            text="Tours"
            onClick={() => setSidebarOpen(false)}
          />
          
          <SidebarMenuItem 
            to="/admin/bookings" 
            icon="📋"
            text="Bookings"
            onClick={() => setSidebarOpen(false)}
          />
          
          <SidebarMenuItem 
            to="/admin/settings" 
            icon="⚙️"
            text="Settings"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
        
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <strong>Administrator</strong>
              <small>Admin</small>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <span className="logout-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="admin-main">
        {/* Top Navbar */}
        <div className="admin-navbar">
          <div className="navbar-left">
            <h1>Admin Dashboard</h1>
          </div>
          <div className="navbar-right">
            <div className="admin-profile">
              <span className="profile-avatar">👑</span>
              <span className="profile-name">Administrator</span>
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="admin-content-area">
          <Routes>
            <Route 
              path="/" 
              element={
                <AdminDashboard 
                  stats={adminStats} 
                  refreshStats={refreshStats} 
                />
              } 
            />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/tours" element={<ToursManagement />} />
            <Route path="/bookings" element={<BookingsManagement />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;