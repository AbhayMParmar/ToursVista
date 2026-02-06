import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import './admin.css';

// Replace line 6:
const API_URL = process.env.REACT_APP_API_URL || 'https://toursvista.onrender.com/api';

// Helper Functions - UPDATED for MongoDB
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

// Save tour to database
const saveTour = async (tourData) => {
  try {
    const response = await axios.post(`${API_URL}/tours`, tourData);
    return response.data;
  } catch (error) {
    console.error('Error saving tour:', error);
    return null;
  }
};

// Update tour in database
const updateTour = async (tourId, tourData) => {
  try {
    const response = await axios.put(`${API_URL}/tours/${tourId}`, tourData);
    return response.data;
  } catch (error) {
    console.error('Error updating tour:', error);
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

// Tours Management Component - FIXED with improved popup
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
    price: '',
    duration: '',
    image: '',
    region: 'north',
    type: 'heritage'
  });
  const tableContainerRef = useRef(null);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const allTours = await getTours();
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
    
    const tourData = {
      title: tourForm.title,
      description: tourForm.description,
      price: parseInt(tourForm.price) || 0,
      duration: tourForm.duration,
      image: tourForm.image,
      region: tourForm.region,
      type: tourForm.type,
      destination: tourForm.region === 'north' ? 'North India' : 
                  tourForm.region === 'south' ? 'South India' :
                  tourForm.region === 'west' ? 'West India' : 'East India'
    };

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
      setTourForm({
        title: '',
        description: '',
        price: '',
        duration: '',
        image: '',
        region: 'north',
        type: 'heritage'
      });
    } catch (error) {
      console.error('Error saving tour:', error);
      alert('Error saving tour. Please try again.');
    }
  };

  const handleRowClick = (tour) => {
    setSelectedTour(tour);
    setShowTourDetails(true);
  };

  const handleEditTour = (tour) => {
    setEditingTour(tour);
    setTourForm({
      title: tour.title,
      description: tour.description,
      price: tour.price.toString(),
      duration: tour.duration,
      image: tour.image,
      region: tour.region || 'north',
      type: tour.type || tour.category || 'heritage'
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
      default: return '🏔️';
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
            setTourForm({
              title: '',
              description: '',
              price: '',
              duration: '',
              image: '',
              region: 'north',
              type: 'heritage'
            });
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
                          src={tour.image} 
                          alt={tour.title}
                          className="tour-thumbnail"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/60x40?text=No+Image';
                          }}
                        />
                      </td>
                      <td>{tour.title}</td>
                      <td>₹{tour.price.toLocaleString('en-IN')}</td>
                      <td>{tour.duration}</td>
                      <td>
                        <span className="tour-type">{tour.type || tour.category}</span>
                      </td>
                      <td>
                        <span className="tour-region">{tour.region}</span>
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
                        src={tour.image} 
                        alt={tour.title}
                        className="tour-thumbnail"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/60x40?text=No+Image';
                        }}
                      />
                    </td>
                    <td>{tour.title}</td>
                    <td>₹{tour.price.toLocaleString('en-IN')}</td>
                    <td>{tour.duration}</td>
                    <td>
                      <span className="tour-type">{tour.type || tour.category}</span>
                    </td>
                    <td>
                      <span className="tour-region">{tour.region}</span>
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
      
      {/* Tour Details Modal */}
      {showTourDetails && selectedTour && (
        <div className="modal-overlay" onClick={() => setShowTourDetails(false)}>
          <div className="modal-content medium-modal" onClick={(e) => e.stopPropagation()}>
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
                  {getTourTypeIcon(selectedTour.type || selectedTour.category)}
                </div>
                <div className="profile-info">
                  <h3>{selectedTour.title}</h3>
                  <p>{selectedTour.description?.substring(0, 100)}...</p>
                  <p>Tour ID: {selectedTour._id.slice(0, 12)}...</p>
                </div>
              </div>
              
              <div className="details-grid">
                <div className="detail-card">
                  <h3><i>💰</i> Pricing & Duration</h3>
                  <div className="detail-row">
                    <span className="detail-label">Price</span>
                    <span className="detail-value amount">₹{selectedTour.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{selectedTour.duration}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Type</span>
                    <span className="detail-value badge tour-type">{selectedTour.type || selectedTour.category}</span>
                  </div>
                </div>
                
                <div className="detail-card">
                  <h3><i>📍</i> Location & Region</h3>
                  <div className="detail-row">
                    <span className="detail-label">Region</span>
                    <span className="detail-value">{selectedTour.region}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Destination</span>
                    <span className="detail-value">{selectedTour.destination || selectedTour.region === 'north' ? 'North India' : 
                      selectedTour.region === 'south' ? 'South India' :
                      selectedTour.region === 'west' ? 'West India' : 'East India'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className="detail-value badge stat-badge active">Active</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-card">
                <h3><i>📝</i> Description</h3>
                <p style={{color: '#666', lineHeight: '1.6', margin: '0'}}>
                  {selectedTour.description}
                </p>
              </div>
              
              <div className="detail-card">
                <h3><i>🖼️</i> Tour Image</h3>
                <div style={{textAlign: 'center', marginTop: '1rem'}}>
                  <img 
                    src={selectedTour.image} 
                    alt={selectedTour.title}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      height: 'auto',
                      borderRadius: '8px',
                      border: '1px solid #eee'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x250?text=Tour+Image';
                    }}
                  />
                </div>
              </div>
              
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
      
      {/* Add/Edit Tour Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
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
                <label>Description *</label>
                <textarea
                  value={tourForm.description}
                  onChange={(e) => setTourForm({...tourForm, description: e.target.value})}
                  required
                  placeholder="Enter tour description"
                  rows="3"
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
              
              <div className="form-group">
                <label>Image URL *</label>
                <input
                  type="url"
                  value={tourForm.image}
                  onChange={(e) => setTourForm({...tourForm, image: e.target.value})}
                  required
                  placeholder="Enter image URL"
                />
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
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={tourForm.type}
                    onChange={(e) => setTourForm({...tourForm, type: e.target.value})}
                  >
                    <option value="heritage">Heritage</option>
                    <option value="adventure">Adventure</option>
                    <option value="beach">Beach</option>
                    <option value="wellness">Wellness</option>
                    <option value="cultural">Cultural</option>
                  </select>
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
