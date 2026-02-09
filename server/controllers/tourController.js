const Tour = require('../models/Tour');

// Get all tours - ENHANCED to return complete data structure
exports.getAllTours = async (req, res) => {
  try {
    console.log('🔄 Fetching all tours with complete data...');
    
    const tours = await Tour.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${tours.length} active tours`);
    
    // Ensure all tours have complete data structure
    const enhancedTours = tours.map(tour => {
      const tourObj = tour.toObject();
      
      return {
        ...tourObj,
        // Ensure all admin-added fields are present
        overview: tourObj.overview || {
          highlights: [],
          groupSize: 'Not specified',
          difficulty: 'easy',
          ageRange: 'Not specified',
          bestSeason: 'Not specified',
          languages: []
        },
        requirements: tourObj.requirements || {
          physicalLevel: 'Not specified',
          fitnessLevel: 'Not specified',
          documents: [],
          packingList: []
        },
        pricing: tourObj.pricing || {
          basePrice: tourObj.price || 0,
          discounts: [],
          paymentPolicy: 'Not specified',
          cancellationPolicy: 'Not specified'
        },
        importantInfo: tourObj.importantInfo || {
          bookingCutoff: 'Not specified',
          refundPolicy: 'Not specified',
          healthAdvisory: 'Not specified',
          safetyMeasures: 'Not specified'
        },
        // Ensure arrays exist
        itinerary: tourObj.itinerary || [],
        included: tourObj.included || [],
        excluded: tourObj.excluded || [],
        images: tourObj.images || [tourObj.image],
        // Ensure rating properties
        averageRating: tourObj.averageRating || 0,
        totalRatings: tourObj.totalRatings || 0,
        // Ensure basic properties
        detailedDescription: tourObj.detailedDescription || tourObj.description || '',
        destination: tourObj.destination || tourObj.region || 'Not specified',
        maxParticipants: tourObj.maxParticipants || 20,
        currentParticipants: tourObj.currentParticipants || 0
      };
    });
    
    res.json({
      success: true,
      count: enhancedTours.length,
      data: enhancedTours
    });
  } catch (error) {
    console.error('❌ Error fetching tours:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single tour with all details - ENHANCED
exports.getTourById = async (req, res) => {
  try {
    console.log('🔄 Fetching tour details for:', req.params.id);
    
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }
    
    const tourObj = tour.toObject();
    
    // Ensure complete data structure
    const enhancedTour = {
      ...tourObj,
      // Ensure all admin-added fields are present
      overview: tourObj.overview || {
        highlights: [],
        groupSize: 'Not specified',
        difficulty: 'easy',
        ageRange: 'Not specified',
        bestSeason: 'Not specified',
        languages: []
      },
      requirements: tourObj.requirements || {
        physicalLevel: 'Not specified',
        fitnessLevel: 'Not specified',
        documents: [],
        packingList: []
      },
      pricing: tourObj.pricing || {
        basePrice: tourObj.price || 0,
        discounts: [],
        paymentPolicy: 'Not specified',
        cancellationPolicy: 'Not specified'
      },
      importantInfo: tourObj.importantInfo || {
        bookingCutoff: 'Not specified',
        refundPolicy: 'Not specified',
        healthAdvisory: 'Not specified',
        safetyMeasures: 'Not specified'
      },
      // Ensure arrays exist
      itinerary: tourObj.itinerary || [],
      included: tourObj.included || [],
      excluded: tourObj.excluded || [],
      images: tourObj.images || [tourObj.image],
      // Ensure rating properties
      averageRating: tourObj.averageRating || 0,
      totalRatings: tourObj.totalRatings || 0,
      // Ensure basic properties
      detailedDescription: tourObj.detailedDescription || tourObj.description || '',
      destination: tourObj.destination || tourObj.region || 'Not specified',
      maxParticipants: tourObj.maxParticipants || 20,
      currentParticipants: tourObj.currentParticipants || 0
    };
    
    console.log('✅ Tour details loaded successfully');
    
    res.json({
      success: true,
      data: enhancedTour
    });
  } catch (error) {
    console.error('❌ Error fetching tour:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new tour - COMPLETELY UPDATED to handle all admin fields
exports.createTour = async (req, res) => {
  try {
    console.log('📝 Creating tour with data:', JSON.stringify(req.body, null, 2));
    
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

    // Validation - Check required fields
    if (!title || !description || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, price, and duration'
      });
    }

    // Prepare tour data
    const tourData = {
      title,
      description,
      detailedDescription: detailedDescription || description,
      price: parseInt(price) || 0,
      duration,
      image: image || 'https://via.placeholder.com/600x400?text=Tour+Image',
      images: images && images.length > 0 ? images : [image || 'https://via.placeholder.com/600x400?text=Tour+Image'],
      region: region || 'north',
      category: category || 'heritage',
      destination: destination || `${region || 'north'} India`,
      
      // Overview with defaults
      overview: overview || {
        highlights: ['Experience authentic culture', 'Visit iconic landmarks', 'Comfortable accommodation'],
        groupSize: '2-12 People',
        difficulty: 'easy',
        ageRange: '18-65 years',
        bestSeason: 'Year-round',
        languages: ['English', 'Hindi']
      },
      
      // Included/Excluded with defaults
      included: included && included.length > 0 ? included : [
        'Accommodation for all nights',
        'All meals as mentioned in itinerary',
        'Sightseeing tours with guide',
        'Transportation between destinations',
        'All entrance fees'
      ],
      
      excluded: excluded && excluded.length > 0 ? excluded : [
        'International flights',
        'Travel insurance',
        'Personal expenses',
        'Tips and gratuities',
        'Visa fees'
      ],
      
      // Itinerary with defaults
      itinerary: itinerary && itinerary.length > 0 ? itinerary.map(item => ({
        day: item.day || 1,
        title: item.title || `Day ${item.day}`,
        description: item.description || 'Day activities and exploration',
        activities: item.activities && item.activities.length > 0 ? item.activities : ['Cultural exploration', 'Local experiences'],
        meals: item.meals || 'Breakfast, Lunch, Dinner',
        accommodation: item.accommodation || 'Standard hotel'
      })) : [
        {
          day: 1,
          title: 'Arrival & Orientation',
          description: 'Arrive at destination, hotel check-in, and orientation session.',
          activities: ['Airport pickup', 'Hotel check-in', 'Welcome meeting'],
          meals: 'Dinner',
          accommodation: 'Standard hotel'
        },
        {
          day: 2,
          title: 'Cultural Exploration',
          description: 'Full day of cultural activities and local experiences.',
          activities: ['Guided city tour', 'Cultural show', 'Local market visit'],
          meals: 'Breakfast, Lunch, Dinner',
          accommodation: 'Standard hotel'
        }
      ],
      
      // Requirements with defaults
      requirements: requirements || {
        physicalLevel: 'Moderate',
        fitnessLevel: 'Average fitness required',
        documents: ['Passport', 'Travel insurance', 'Visa (if required)'],
        packingList: ['Comfortable shoes', 'Weather-appropriate clothing', 'Camera', 'Personal medications']
      },
      
      // Pricing details
      pricing: pricing || {
        basePrice: parseInt(price) || 0,
        discounts: [
          {
            name: 'Early Bird',
            percentage: 10,
            description: 'Book 60 days in advance'
          },
          {
            name: 'Group',
            percentage: 15,
            description: '4+ people traveling together'
          }
        ],
        paymentPolicy: '50% advance payment required at booking, balance 30 days before travel',
        cancellationPolicy: 'Full refund 60+ days before travel, 50% refund 30-59 days before travel'
      },
      
      // Important information
      importantInfo: importantInfo || {
        bookingCutoff: '30 days before travel date',
        refundPolicy: 'As per cancellation policy above',
        healthAdvisory: 'Consult your doctor before travel, recommended vaccinations',
        safetyMeasures: 'Professional guides, safe transportation, 24/7 emergency support'
      },
      
      // Ratings
      ratings: [],
      averageRating: 0,
      totalRatings: 0,
      
      // Participants
      maxParticipants: 20,
      currentParticipants: 0,
      
      // Status
      isActive: true
    };

    console.log('📦 Prepared tour data for save:', JSON.stringify(tourData, null, 2));

    const newTour = new Tour(tourData);
    const savedTour = await newTour.save();

    console.log('✅ Tour created successfully:', savedTour._id);

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: savedTour
    });
  } catch (error) {
    console.error('❌ Error creating tour:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating tour',
      error: error.message
    });
  }
};

// Update tour - COMPLETELY UPDATED
exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('🔄 Updating tour:', id);
    console.log('📝 Update data:', JSON.stringify(updateData, null, 2));

    // Find existing tour
    const tour = await Tour.findById(id);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Update basic fields
    if (updateData.title !== undefined) tour.title = updateData.title;
    if (updateData.description !== undefined) tour.description = updateData.description;
    if (updateData.detailedDescription !== undefined) tour.detailedDescription = updateData.detailedDescription;
    if (updateData.price !== undefined) tour.price = parseInt(updateData.price) || 0;
    if (updateData.duration !== undefined) tour.duration = updateData.duration;
    if (updateData.image !== undefined) {
      tour.image = updateData.image;
      if (!tour.images || tour.images.length === 0) {
        tour.images = [updateData.image];
      } else {
        tour.images[0] = updateData.image;
      }
    }
    if (updateData.images !== undefined) tour.images = updateData.images;
    if (updateData.region !== undefined) tour.region = updateData.region;
    if (updateData.category !== undefined) tour.category = updateData.category;
    if (updateData.destination !== undefined) tour.destination = updateData.destination;

    // Update overview if provided
    if (updateData.overview) {
      tour.overview = {
        ...tour.overview,
        ...updateData.overview
      };
    }

    // Update included/excluded if provided
    if (updateData.included !== undefined) tour.included = updateData.included;
    if (updateData.excluded !== undefined) tour.excluded = updateData.excluded;

    // Update itinerary if provided
    if (updateData.itinerary !== undefined) {
      tour.itinerary = updateData.itinerary.map(item => ({
        day: item.day || 1,
        title: item.title || `Day ${item.day}`,
        description: item.description || '',
        activities: item.activities || [],
        meals: item.meals || '',
        accommodation: item.accommodation || ''
      }));
    }

    // Update requirements if provided
    if (updateData.requirements) {
      tour.requirements = {
        ...tour.requirements,
        ...updateData.requirements
      };
    }

    // Update pricing if provided
    if (updateData.pricing) {
      tour.pricing = {
        ...tour.pricing,
        ...updateData.pricing,
        basePrice: updateData.pricing.basePrice || tour.price
      };
    }

    // Update important info if provided
    if (updateData.importantInfo) {
      tour.importantInfo = {
        ...tour.importantInfo,
        ...updateData.importantInfo
      };
    }

    // Update timestamps
    tour.updatedAt = Date.now();

    const updatedTour = await tour.save();

    console.log('✅ Tour updated successfully:', updatedTour._id);

    res.json({
      success: true,
      message: 'Tour updated successfully',
      data: updatedTour
    });
  } catch (error) {
    console.error('❌ Error updating tour:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating tour',
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

    // Soft delete by setting isActive to false
    tour.isActive = false;
    await tour.save();

    res.json({
      success: true,
      message: 'Tour deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting tour:', error);
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
    
    console.log(`🔄 Fetching tours for category: ${category}`);
    
    const tours = await Tour.find({ 
      category: category,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    // Ensure complete data structure
    const enhancedTours = tours.map(tour => {
      const tourObj = tour.toObject();
      return {
        ...tourObj,
        overview: tourObj.overview || {},
        requirements: tourObj.requirements || {},
        pricing: tourObj.pricing || {},
        importantInfo: tourObj.importantInfo || {},
        itinerary: tourObj.itinerary || [],
        included: tourObj.included || [],
        excluded: tourObj.excluded || [],
        images: tourObj.images || [tourObj.image]
      };
    });
    
    console.log(`✅ Found ${enhancedTours.length} tours for category ${category}`);
    
    res.json({
      success: true,
      count: enhancedTours.length,
      data: enhancedTours
    });
  } catch (error) {
    console.error('Error fetching tours by category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Add rating to a tour - ENHANCED
exports.rateTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { userId, rating, review } = req.body;

    console.log('⭐ Rating tour:', { tourId, userId, rating, review });

    if (!userId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'User ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Check if user already rated
    const existingRatingIndex = tour.ratings.findIndex(r => r.userId.toString() === userId.toString());
    
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

    // Calculate new average rating
    const totalRatings = tour.ratings.length;
    const sumRatings = tour.ratings.reduce((sum, r) => sum + r.rating, 0);
    tour.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
    tour.totalRatings = totalRatings;

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

// Get all ratings for a tour - ENHANCED
exports.getTourRatings = async (req, res) => {
  try {
    const { tourId } = req.params;

    console.log(`🔄 Fetching ratings for tour: ${tourId}`);

    const tour = await Tour.findById(tourId)
      .populate('ratings.userId', 'name email')
      .select('ratings averageRating totalRatings');

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    console.log(`✅ Found ${tour.ratings.length} ratings for tour ${tourId}`);

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

    console.log(`🔄 Fetching user rating: tour=${tourId}, user=${userId}`);

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const userRating = tour.ratings.find(r => r.userId.toString() === userId);

    console.log(`✅ User rating found: ${userRating ? 'Yes' : 'No'}`);

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

// Search tours - ENHANCED to search in all admin-added fields
exports.searchTours = async (req, res) => {
  try {
    const { query, region, category, minPrice, maxPrice } = req.query;
    
    console.log('🔍 Searching tours with params:', { query, region, category, minPrice, maxPrice });
    
    let searchCriteria = { isActive: true };
    
    if (query) {
      searchCriteria.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { detailedDescription: { $regex: query, $options: 'i' } },
        { 'overview.highlights': { $regex: query, $options: 'i' } },
        { 'itinerary.title': { $regex: query, $options: 'i' } },
        { 'itinerary.description': { $regex: query, $options: 'i' } },
        { 'itinerary.activities': { $regex: query, $options: 'i' } }
      ];
    }
    
    if (region) searchCriteria.region = region;
    if (category) searchCriteria.category = category;
    if (minPrice || maxPrice) {
      searchCriteria.price = {};
      if (minPrice) searchCriteria.price.$gte = parseInt(minPrice);
      if (maxPrice) searchCriteria.price.$lte = parseInt(maxPrice);
    }
    
    const tours = await Tour.find(searchCriteria)
      .sort({ createdAt: -1 });
    
    // Ensure complete data structure
    const enhancedTours = tours.map(tour => {
      const tourObj = tour.toObject();
      return {
        ...tourObj,
        overview: tourObj.overview || {},
        requirements: tourObj.requirements || {},
        pricing: tourObj.pricing || {},
        importantInfo: tourObj.importantInfo || {},
        itinerary: tourObj.itinerary || [],
        included: tourObj.included || [],
        excluded: tourObj.excluded || [],
        images: tourObj.images || [tourObj.image]
      };
    });
    
    console.log(`✅ Found ${enhancedTours.length} tours matching search criteria`);
    
    res.json({
      success: true,
      count: enhancedTours.length,
      data: enhancedTours
    });
  } catch (error) {
    console.error('Error searching tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching tours',
      error: error.message
    });
  }
};