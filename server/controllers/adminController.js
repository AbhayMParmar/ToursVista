const User = require('../models/User');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTours = await Tour.countDocuments({ isActive: true });
    const totalBookings = await Booking.countDocuments();
    
    // Calculate total revenue - FIXED: Include confirmed bookings only
    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    // Get bookings counts
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookingsCount = await Booking.countDocuments({ status: 'confirmed' });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalTours,
        totalBookings,
        revenue: totalRevenue,
        pendingBookings,
        confirmedBookings: confirmedBookingsCount // FIXED: Use count, not array
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all users for admin
exports.getAllUsersForAdmin = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    // Get bookings for each user
    const usersWithBookings = await Promise.all(users.map(async (user) => {
      const userBookings = await Booking.find({ user: user._id });
      const confirmedBookingsCount = userBookings.filter(b => b.status === 'confirmed').length;
      const totalSpent = userBookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + b.totalPrice, 0);
      
      return {
        ...user.toObject(),
        bookingsCount: userBookings.length,
        confirmedBookingsCount,
        totalSpent
      };
    }));
    
    res.json({
      success: true,
      count: usersWithBookings.length,
      data: usersWithBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete user (admin)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deletion of admin user
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }
    
    // Delete user's bookings
    await Booking.deleteMany({ user: userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: 'User and associated bookings deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all tours for admin
exports.getAllToursForAdmin = async (req, res) => {
  try {
    const tours = await Tour.find();
    
    const toursWithBookings = await Promise.all(tours.map(async (tour) => {
      const confirmedBookingsCount = await Booking.countDocuments({ 
        tour: tour._id, 
        status: 'confirmed' 
      });
      const totalBookingsCount = await Booking.countDocuments({ tour: tour._id });
      
      return {
        _id: tour._id,
        title: tour.title,
        description: tour.description,
        price: tour.price,
        duration: tour.duration,
        image: tour.images && tour.images.length > 0 ? tour.images[0] : 'https://via.placeholder.com/300x200?text=No+Image',
        region: tour.region || 'north',
        type: tour.category || 'heritage',
        confirmedBookingsCount, // FIXED: Add confirmed bookings count
        totalBookingsCount,
        isActive: tour.isActive,
        createdAt: tour.createdAt
      };
    }));
    
    res.json({
      success: true,
      count: toursWithBookings.length,
      data: toursWithBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all bookings for admin - UPDATED with better status handling
exports.getAllBookingsForAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email phone')
      .populate('tour', 'title price duration');
    
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      tourId: booking.tour._id,
      tourTitle: booking.tour.title,
      tourDuration: booking.tour.duration,
      userId: booking.user._id,
      userName: booking.user.name,
      userEmail: booking.user.email,
      userPhone: booking.user.phone || 'N/A',
      travelers: booking.participants,
      travelDate: booking.travelDate,
      bookingDate: booking.bookingDate,
      totalAmount: booking.totalPrice,
      status: booking.status,
      specialRequests: booking.specialRequirements,
      contactNumber: booking.contactNumber || booking.user.phone || 'N/A',
      createdAt: booking.createdAt
    }));
    
    // Sort by latest first
    formattedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      count: formattedBookings.length,
      data: formattedBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update booking status (admin)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, confirmed, cancelled, or completed'
      });
    }

    booking.status = status;
    await booking.save();

    // Get updated booking with populated data
    const updatedBooking = await Booking.findById(id)
      .populate('user', 'name email')
      .populate('tour', 'title');

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        _id: updatedBooking._id,
        status: updatedBooking.status,
        tourTitle: updatedBooking.tour.title,
        userName: updatedBooking.user.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reset all data (dangerous - admin only)
exports.resetAllData = async (req, res) => {
  try {
    // Keep admin user
    const adminUser = await User.findOne({ email: 'admin@tourvista.com' });
    
    if (!adminUser) {
      // Create admin user if doesn't exist
      const newAdmin = new User({
        name: 'Administrator',
        email: 'admin@tourvista.com',
        password: '$2a$10$YourHashedPasswordHere', // You should hash a real password
        phone: '+91 9876543210',
        role: 'admin'
      });
      await newAdmin.save();
    }
    
    // Delete all non-admin users
    await User.deleteMany({ email: { $ne: 'admin@tourvista.com' } });
    
    // Delete all bookings
    await Booking.deleteMany({});
    
    // Delete all tours
    await Tour.deleteMany({});
    
    // Create some sample tours
    const sampleTours = [
      {
        title: 'Golden Triangle Tour',
        description: 'Experience Delhi, Agra, and Jaipur - India\'s most iconic circuit',
        price: 25000,
        duration: '7 days',
        images: ['https://images.unsplash.com/photo-1524307875964-4c93f6cd2f14'],
        category: 'heritage',
        region: 'north',
        isActive: true
      },
      {
        title: 'Kerala Backwaters',
        description: 'Cruise through the tranquil backwaters of Kerala',
        price: 18000,
        duration: '5 days',
        images: ['https://images.unsplash.com/photo-1593693399748-2c36d5ea7d89'],
        category: 'wellness',
        region: 'south',
        isActive: true
      }
    ];
    
    await Tour.insertMany(sampleTours);
    
    res.json({
      success: true,
      message: 'All data reset successfully (admin user preserved and sample tours created)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete all bookings (admin only)
exports.deleteAllBookings = async (req, res) => {
  try {
    await Booking.deleteMany({});
    
    res.json({
      success: true,
      message: 'All bookings deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};