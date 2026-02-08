const Tour = require('../models/Tour');

// Get all tours with complete data
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tours.length,
      data: tours
    });
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tours',
      error: error.message
    });
  }
};

// Get single tour with complete data
exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }
    
    res.json({
      success: true,
      data: tour
    });
  } catch (error) {
    console.error('Error fetching tour:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tour',
      error: error.message
    });
  }
};

// Create new tour with complete data
exports.createTour = async (req, res) => {
  try {
    console.log('Creating tour with data:', JSON.stringify(req.body, null, 2));
    
    const { 
      title, 
      description, 
      detailedDescription,
      price, 
      duration, 
      image, 
      images,
      region, 
      category,
      destination,
      
      // Overview
      overview,
      
      // Included/Excluded
      included,
      excluded,
      
      // Itinerary
      itinerary,
      
      // Requirements
      requirements,
      
      // Pricing
      pricing,
      
      // Important Info
      importantInfo
    } = req.body;

    // Validation - Required fields
    if (!title || !description || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, price, and duration'
      });
    }

    // Clean and format data
    const cleanedIncluded = Array.isArray(included) ? included.filter(item => item && item.trim() !== '') : [];
    const cleanedExcluded = Array.isArray(excluded) ? excluded.filter(item => item && item.trim() !== '') : [];
    const cleanedImages = Array.isArray(images) ? images.filter(img => img && img.trim() !== '') : [];
    
    // Ensure itinerary has proper day numbers
    let cleanedItinerary = [];
    if (Array.isArray(itinerary)) {
      cleanedItinerary = itinerary
        .filter(day => day && (day.title || day.description || (day.activities && day.activities.length > 0)))
        .map((day, index) => ({
          day: index + 1,
          title: day.title || `Day ${index + 1}`,
          description: day.description || '',
          activities: Array.isArray(day.activities) ? day.activities.filter(a => a && a.trim() !== '') : [],
          meals: day.meals || '',
          accommodation: day.accommodation || ''
        }));
    }

    const newTour = new Tour({
      title: title.trim(),
      description: description.trim(),
      detailedDescription: detailedDescription ? detailedDescription.trim() : description.trim(),
      price: parseInt(price) || 0,
      duration: duration.trim(),
      image: image && image.trim() !== '' ? image.trim() : 'https://via.placeholder.com/600x400?text=Tour+Image',
      images: cleanedImages,
      region: region || 'north',
      category: category || 'heritage',
      destination: destination || `${region || 'north'} India`,
      
      // Overview
      overview: overview || {
        highlights: [],
        groupSize: '',
        difficulty: 'easy',
        ageRange: '',
        bestSeason: '',
        languages: []
      },
      
      // Included/Excluded
      included: cleanedIncluded,
      excluded: cleanedExcluded,
      
      // Itinerary
      itinerary: cleanedItinerary,
      
      // Requirements
      requirements: requirements || {
        physicalLevel: '',
        fitnessLevel: '',
        documents: [],
        packingList: []
      },
      
      // Pricing
      pricing: pricing || {
        basePrice: parseInt(price) || 0,
        discounts: [],
        paymentPolicy: '',
        cancellationPolicy: ''
      },
      
      // Important Info
      importantInfo: importantInfo || {
        bookingCutoff: '',
        refundPolicy: '',
        healthAdvisory: '',
        safetyMeasures: ''
      },
      
      isActive: true
    });

    const savedTour = await newTour.save();
    
    console.log('✅ Tour created successfully:', savedTour._id);

    res.status(201).json({
      success: true,
      message: 'Tour created successfully with all details',
      data: savedTour
    });
  } catch (error) {
    console.error('❌ Error creating tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tour',
      error: error.message,
      details: error.errors || {}
    });
  }
};

// Update tour with complete data
exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('Updating tour:', id, 'with data:', JSON.stringify(updateData, null, 2));

    const tour = await Tour.findById(id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Update all fields
    if (updateData.title) tour.title = updateData.title.trim();
    if (updateData.description) tour.description = updateData.description.trim();
    if (updateData.detailedDescription !== undefined) tour.detailedDescription = updateData.detailedDescription.trim();
    if (updateData.price !== undefined) tour.price = parseInt(updateData.price) || 0;
    if (updateData.duration) tour.duration = updateData.duration.trim();
    if (updateData.image) tour.image = updateData.image.trim();
    if (updateData.images !== undefined) {
      tour.images = Array.isArray(updateData.images) 
        ? updateData.images.filter(img => img && img.trim() !== '')
        : [];
    }
    if (updateData.region) tour.region = updateData.region;
    if (updateData.category) tour.category = updateData.category;
    if (updateData.destination !== undefined) tour.destination = updateData.destination.trim();
    
    // Update overview
    if (updateData.overview) {
      tour.overview = {
        ...tour.overview,
        ...updateData.overview
      };
      
      // Clean arrays in overview
      if (updateData.overview.highlights) {
        tour.overview.highlights = Array.isArray(updateData.overview.highlights)
          ? updateData.overview.highlights.filter(h => h && h.trim() !== '')
          : [];
      }
      
      if (updateData.overview.languages) {
        tour.overview.languages = Array.isArray(updateData.overview.languages)
          ? updateData.overview.languages.filter(l => l && l.trim() !== '')
          : [];
      }
    }
    
    // Update included/excluded
    if (updateData.included !== undefined) {
      tour.included = Array.isArray(updateData.included)
        ? updateData.included.filter(item => item && item.trim() !== '')
        : [];
    }
    
    if (updateData.excluded !== undefined) {
      tour.excluded = Array.isArray(updateData.excluded)
        ? updateData.excluded.filter(item => item && item.trim() !== '')
        : [];
    }
    
    // Update itinerary
    if (updateData.itinerary !== undefined) {
      if (Array.isArray(updateData.itinerary)) {
        tour.itinerary = updateData.itinerary
          .filter(day => day && (day.title || day.description || (day.activities && day.activities.length > 0)))
          .map((day, index) => ({
            day: index + 1,
            title: day.title || `Day ${index + 1}`,
            description: day.description || '',
            activities: Array.isArray(day.activities) ? day.activities.filter(a => a && a.trim() !== '') : [],
            meals: day.meals || '',
            accommodation: day.accommodation || ''
          }));
      }
    }
    
    // Update requirements
    if (updateData.requirements) {
      tour.requirements = {
        ...tour.requirements,
        ...updateData.requirements
      };
      
      // Clean arrays in requirements
      if (updateData.requirements.documents) {
        tour.requirements.documents = Array.isArray(updateData.requirements.documents)
          ? updateData.requirements.documents.filter(d => d && d.trim() !== '')
          : [];
      }
      
      if (updateData.requirements.packingList) {
        tour.requirements.packingList = Array.isArray(updateData.requirements.packingList)
          ? updateData.requirements.packingList.filter(p => p && p.trim() !== '')
          : [];
      }
    }
    
    // Update pricing
    if (updateData.pricing) {
      tour.pricing = {
        ...tour.pricing,
        ...updateData.pricing
      };
      
      // Ensure basePrice is set
      if (!tour.pricing.basePrice && tour.price) {
        tour.pricing.basePrice = tour.price;
      }
      
      // Clean discounts array
      if (updateData.pricing.discounts) {
        tour.pricing.discounts = Array.isArray(updateData.pricing.discounts)
          ? updateData.pricing.discounts.filter(d => d && d.name && d.name.trim() !== '')
          : [];
      }
    }
    
    // Update importantInfo
    if (updateData.importantInfo) {
      tour.importantInfo = {
        ...tour.importantInfo,
        ...updateData.importantInfo
      };
    }

    const updatedTour = await tour.save();
    
    console.log('✅ Tour updated successfully:', updatedTour._id);

    res.json({
      success: true,
      message: 'Tour updated successfully with all details',
      data: updatedTour
    });
  } catch (error) {
    console.error('❌ Error updating tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tour',
      error: error.message,
      details: error.errors || {}
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
    console.error('Error deleting tour:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting tour',
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
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tours.length,
      data: tours
    });
  } catch (error) {
    console.error('Error fetching tours by category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tours by category',
      error: error.message
    });
  }
};

// Add rating to a tour
exports.rateTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { userId, rating, review } = req.body;

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Check if user already rated
    const existingRatingIndex = tour.ratings.findIndex(r => r.userId.toString() === userId);
    
    if (existingRatingIndex !== -1) {
      // Update existing rating
      tour.ratings[existingRatingIndex].rating = rating;
      tour.ratings[existingRatingIndex].review = review || '';
      tour.ratings[existingRatingIndex].date = Date.now();
    } else {
      // Add new rating
      tour.ratings.push({
        userId,
        rating,
        review: review || '',
        date: Date.now()
      });
    }

    // Save will trigger pre-save hook to calculate average
    await tour.save();

    res.status(200).json({
      success: true,
      message: existingRatingIndex !== -1 ? 'Rating updated successfully' : 'Rating added successfully',
      data: {
        averageRating: tour.averageRating,
        totalRatings: tour.totalRatings,
        rating: {
          userId,
          rating,
          review,
          date: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error rating tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error rating tour',
      error: error.message
    });
  }
};

// Get all ratings for a tour
exports.getTourRatings = async (req, res) => {
  try {
    const { tourId } = req.params;

    const tour = await Tour.findById(tourId)
      .populate('ratings.userId', 'name email')
      .select('ratings averageRating totalRatings');

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ratings: tour.ratings,
        averageRating: tour.averageRating,
        totalRatings: tour.totalRatings
      }
    });
  } catch (error) {
    console.error('Error getting tour ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting tour ratings',
      error: error.message
    });
  }
};

// Get user's rating for a tour
exports.getUserRating = async (req, res) => {
  try {
    const { tourId, userId } = req.params;

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const userRating = tour.ratings.find(r => r.userId.toString() === userId);

    res.status(200).json({
      success: true,
      data: userRating || null
    });
  } catch (error) {
    console.error('Error getting user rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user rating',
      error: error.message
    });
  }
};
