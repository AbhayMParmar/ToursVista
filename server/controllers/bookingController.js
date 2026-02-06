const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const User = require('../models/User');

// Helper function to validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate phone
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Create booking - UPDATED with better validation and error handling
exports.createBooking = async (req, res) => {
  try {
    console.log('📝 Creating booking request:', req.body);

    const { user, tour, participants, travelers, travelDate, specialRequirements, specialRequests, contactNumber, email, status = 'confirmed' } = req.body;

    // Use participants if provided, otherwise use travelers
    const actualParticipants = participants || travelers || 1;

    // Validation
    const errors = [];
    
    if (!user) errors.push('User ID is required');
    if (!tour) errors.push('Tour ID is required');
    if (!actualParticipants || actualParticipants < 1) errors.push('At least 1 traveler is required');
    if (actualParticipants > 10) errors.push('Maximum 10 travelers allowed');
    if (!travelDate) errors.push('Travel date is required');
    
    // Validate travel date
    if (travelDate) {
      const selectedDate = new Date(travelDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) errors.push('Travel date cannot be in the past');
    }
    
    if (contactNumber && !isValidPhone(contactNumber.replace(/\D/g, ''))) {
      errors.push('Contact number must be 10 digits');
    }
    
    if (email && !isValidEmail(email)) {
      errors.push('Valid email is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Get tour details
    const tourDetails = await Tour.findById(tour);
    
    if (!tourDetails) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Get user details
    const userDetails = await User.findById(user);
    
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate total price
    const totalPrice = tourDetails.price * actualParticipants;

    // Use provided contact number or user's phone
    const finalContactNumber = contactNumber || userDetails.phone || '';

    // Use provided email or user's email
    const finalEmail = email || userDetails.email;

    // Create booking
    const newBooking = new Booking({
      user,
      tour,
      participants: actualParticipants,
      travelDate: new Date(travelDate),
      bookingDate: new Date(),
      totalPrice,
      specialRequirements: specialRequirements || specialRequests || '',
      contactNumber: finalContactNumber,
      email: finalEmail,
      status: status
    });

    const savedBooking = await newBooking.save();

    // Populate user and tour details
    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate('user', 'name email phone')
      .populate('tour', 'title price duration images category region');

    console.log('✅ Booking created successfully:', populatedBooking._id);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        _id: populatedBooking._id,
        tourId: populatedBooking.tour._id,
        tourTitle: populatedBooking.tour.title,
        tourPrice: populatedBooking.tour.price,
        tourDuration: populatedBooking.tour.duration,
        tourImage: populatedBooking.tour.images && populatedBooking.tour.images.length > 0 
          ? populatedBooking.tour.images[0] 
          : 'https://via.placeholder.com/300x200',
        userId: populatedBooking.user._id,
        userName: populatedBooking.user.name,
        userEmail: populatedBooking.user.email,
        userPhone: populatedBooking.user.phone,
        participants: populatedBooking.participants,
        travelers: populatedBooking.participants,
        travelDate: populatedBooking.travelDate,
        bookingDate: populatedBooking.bookingDate,
        totalPrice: populatedBooking.totalPrice,
        totalAmount: populatedBooking.totalPrice,
        status: populatedBooking.status,
        specialRequirements: populatedBooking.specialRequirements,
        contactNumber: populatedBooking.contactNumber,
        createdAt: populatedBooking.createdAt
      }
    });

  } catch (error) {
    console.error('🔥 Booking creation error:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });

    // Handle duplicate or validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate booking found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all bookings (admin) - FIXED with better error handling
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email phone')
      .populate('tour', 'title price duration images')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      bookingId: `TV${booking._id.toString().slice(-8)}`,
      tourId: booking.tour?._id || null,
      tourTitle: booking.tour?.title || 'Tour not found',
      tourDuration: booking.tour?.duration || 'N/A',
      userId: booking.user?._id || null,
      userName: booking.user?.name || 'User not found',
      userEmail: booking.user?.email || 'N/A',
      userPhone: booking.user?.phone || 'N/A',
      travelers: booking.participants,
      participants: booking.participants,
      travelDate: booking.travelDate,
      bookingDate: booking.bookingDate,
      totalAmount: booking.totalPrice,
      totalPrice: booking.totalPrice,
      status: booking.status,
      specialRequests: booking.specialRequirements,
      contactNumber: booking.contactNumber || booking.user?.phone || 'N/A',
      email: booking.email || booking.user?.email || 'N/A',
      createdAt: booking.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      confirmedCount: formattedBookings.filter(b => b.status === 'confirmed').length,
      data: formattedBookings
    });

  } catch (error) {
    console.error('🔥 Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user bookings - FIXED with better error handling
exports.getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const bookings = await Booking.find({ user: userId })
      .populate('tour', 'title price description images duration category region')
      .sort({ createdAt: -1 });

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      bookingId: `TV${booking._id.toString().slice(-8)}`,
      tour: {
        _id: booking.tour?._id || null,
        title: booking.tour?.title || 'Tour not found',
        price: booking.tour?.price || 0,
        description: booking.tour?.description || '',
        duration: booking.tour?.duration || 'N/A',
        image: booking.tour?.images && booking.tour.images.length > 0 
          ? booking.tour.images[0] 
          : 'https://via.placeholder.com/300x200',
        category: booking.tour?.category || 'heritage',
        region: booking.tour?.region || 'north'
      },
      tourId: booking.tour?._id || null,
      tourTitle: booking.tour?.title || 'Tour not found',
      participants: booking.participants,
      travelers: booking.participants,
      travelDate: booking.travelDate,
      bookingDate: booking.bookingDate,
      totalPrice: booking.totalPrice,
      totalAmount: booking.totalPrice,
      status: booking.status,
      specialRequirements: booking.specialRequirements,
      contactNumber: booking.contactNumber || 'N/A',
      email: booking.email || 'N/A',
      createdAt: booking.createdAt
    }));

    const confirmedCount = formattedBookings.filter(b => b.status === 'confirmed').length;

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      confirmedCount: confirmedCount,
      data: formattedBookings
    });

  } catch (error) {
    console.error('🔥 Error fetching user bookings:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.userId
    });

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error fetching user bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update booking status - FIXED
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, confirmed, cancelled, or completed'
      });
    }

    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      data: {
        _id: booking._id,
        status: booking.status,
        updatedAt: booking.updatedAt
      }
    });

  } catch (error) {
    console.error('🔥 Error updating booking status:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await Booking.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('🔥 Error deleting booking:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
