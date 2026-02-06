const Tour = require('../models/Tour');

// Get all tours
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find({ isActive: true });
    
    // Format tours for frontend
    const formattedTours = tours.map(tour => ({
      _id: tour._id,
      title: tour.title,
      description: tour.description,
      price: tour.price,
      duration: tour.duration,
      image: tour.images && tour.images.length > 0 ? tour.images[0] : 'https://via.placeholder.com/300x200?text=No+Image',
      region: tour.region || 'north',
      type: tour.category || 'heritage',
      destination: tour.destination,
      category: tour.category,
      included: tour.included || [],
      createdAt: tour.createdAt
    }));
    
    res.json({
      success: true,
      count: formattedTours.length,
      data: formattedTours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single tour
exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }
    
    const formattedTour = {
      _id: tour._id,
      title: tour.title,
      description: tour.description,
      price: tour.price,
      duration: tour.duration,
      image: tour.images && tour.images.length > 0 ? tour.images[0] : 'https://via.placeholder.com/300x200?text=No+Image',
      region: tour.region || 'north',
      type: tour.category || 'heritage',
      destination: tour.destination,
      category: tour.category,
      included: tour.included || [],
      excluded: tour.excluded || [],
      itinerary: tour.itinerary || [],
      maxParticipants: tour.maxParticipants,
      currentParticipants: tour.currentParticipants,
      availableDates: tour.availableDates,
      isActive: tour.isActive,
      createdAt: tour.createdAt
    };
    
    res.json({
      success: true,
      data: formattedTour
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new tour
exports.createTour = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      price, 
      duration, 
      image, 
      region, 
      type,
      destination 
    } = req.body;

    // Validation
    if (!title || !description || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, price, and duration'
      });
    }

    const newTour = new Tour({
      title,
      description,
      price: parseInt(price),
      duration,
      images: [image || 'https://via.placeholder.com/300x200?text=No+Image'],
      region: region || 'north',
      category: type || 'heritage',
      destination: destination || (region === 'north' ? 'North India' : 
                  region === 'south' ? 'South India' :
                  region === 'west' ? 'West India' : 'East India'),
      included: ['Accommodation', 'Meals as per itinerary', 'Sightseeing tours', 'Transportation'],
      excluded: ['Airfare', 'Travel Insurance', 'Personal Expenses'],
      itinerary: [],
      maxParticipants: 20,
      currentParticipants: 0,
      availableDates: [],
      isActive: true
    });

    const savedTour = await newTour.save();

    res.json({
      success: true,
      message: 'Tour created successfully',
      data: {
        _id: savedTour._id,
        title: savedTour.title,
        description: savedTour.description,
        price: savedTour.price,
        duration: savedTour.duration,
        image: savedTour.images && savedTour.images.length > 0 ? savedTour.images[0] : 'https://via.placeholder.com/300x200?text=No+Image',
        region: savedTour.region,
        type: savedTour.category,
        destination: savedTour.destination
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

// Update tour
exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const tour = await Tour.findById(id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Update fields
    if (updateData.title) tour.title = updateData.title;
    if (updateData.description) tour.description = updateData.description;
    if (updateData.price) tour.price = parseInt(updateData.price);
    if (updateData.duration) tour.duration = updateData.duration;
    if (updateData.image) {
      tour.images = [updateData.image];
    }
    if (updateData.region) tour.region = updateData.region;
    if (updateData.type) tour.category = updateData.type;
    if (updateData.destination) tour.destination = updateData.destination;

    const updatedTour = await tour.save();

    res.json({
      success: true,
      message: 'Tour updated successfully',
      data: {
        _id: updatedTour._id,
        title: updatedTour.title,
        description: updatedTour.description,
        price: updatedTour.price,
        duration: updatedTour.duration,
        image: updatedTour.images && updatedTour.images.length > 0 ? updatedTour.images[0] : 'https://via.placeholder.com/300x200?text=No+Image',
        region: updatedTour.region,
        type: updatedTour.category,
        destination: updatedTour.destination
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

// Delete tour
exports.deleteTour = async (req, res) => {
  try {
    const { id } = req.params;

    const tour = await Tour.findById(id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    await Tour.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Tour deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get tours by category
exports.getToursByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const tours = await Tour.find({ 
      category: category,
      isActive: true 
    });
    
    const formattedTours = tours.map(tour => ({
      _id: tour._id,
      title: tour.title,
      description: tour.description,
      price: tour.price,
      duration: tour.duration,
      image: tour.images && tour.images.length > 0 ? tour.images[0] : 'https://via.placeholder.com/300x200?text=No+Image',
      region: tour.region || 'north',
      type: tour.category || 'heritage'
    }));
    
    res.json({
      success: true,
      count: formattedTours.length,
      data: formattedTours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};