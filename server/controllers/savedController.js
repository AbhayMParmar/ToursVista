const SavedTour = require('../models/SavedTour');
const Tour = require('../models/Tour');

// Get saved tours for a user
exports.getSavedTours = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const savedTours = await SavedTour.find({ user: userId })
      .populate('tour', 'title description price duration images category region');
    
    const savedTourData = savedTours.map(item => ({
      _id: item.tour._id,
      title: item.tour.title,
      description: item.tour.description,
      price: item.tour.price,
      duration: item.tour.duration,
      image: item.tour.images && item.tour.images.length > 0 
        ? item.tour.images[0] 
        : 'https://via.placeholder.com/300x200',
      category: item.tour.category,
      region: item.tour.region,
      savedAt: item.createdAt
    }));
    
    res.status(200).json({
      success: true,
      data: savedTourData
    });
  } catch (error) {
    console.error('Error fetching saved tours:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching saved tours'
    });
  }
};

// Save a tour for a user
exports.saveTour = async (req, res) => {
  try {
    const { userId, tourId } = req.body;
    
    // Check if already saved
    const existing = await SavedTour.findOne({ user: userId, tour: tourId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Tour already saved'
      });
    }
    
    // Create saved tour
    const savedTour = new SavedTour({
      user: userId,
      tour: tourId
    });
    
    await savedTour.save();
    
    // Get tour details
    const tour = await Tour.findById(tourId);
    
    res.status(201).json({
      success: true,
      message: 'Tour saved successfully',
      data: {
        _id: tour._id,
        title: tour.title,
        description: tour.description,
        price: tour.price,
        duration: tour.duration,
        image: tour.images && tour.images.length > 0 
          ? tour.images[0] 
          : 'https://via.placeholder.com/300x200',
        category: tour.category,
        region: tour.region,
        savedAt: savedTour.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving tour:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving tour'
    });
  }
};

// Remove saved tour
exports.removeSavedTour = async (req, res) => {
  try {
    const { userId, tourId } = req.params;
    
    const result = await SavedTour.findOneAndDelete({ 
      user: userId, 
      tour: tourId 
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Saved tour not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Tour removed from saved list'
    });
  } catch (error) {
    console.error('Error removing saved tour:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing saved tour'
    });
  }
};