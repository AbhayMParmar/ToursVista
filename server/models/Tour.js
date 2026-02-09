const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tour title is required'],
    trim: true,
    maxlength: [200, 'Tour title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Tour description is required'],
    trim: true
  },
  detailedDescription: {
    type: String,
    default: '',
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Tour price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  duration: {
    type: String,
    required: [true, 'Tour duration is required'],
    trim: true,
    default: 'Not specified'
  },
  image: {
    type: String,
    required: [true, 'Main image is required'],
    default: 'https://via.placeholder.com/600x400?text=Tour+Image',
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  region: {
    type: String,
    enum: ['north', 'south', 'west', 'east', 'central'],
    default: 'north',
    required: true
  },
  category: {
    type: String,
    enum: ['heritage', 'adventure', 'beach', 'wellness', 'cultural', 'spiritual'],
    default: 'heritage',
    required: true
  },
  destination: {
    type: String,
    default: '',
    trim: true
  },
  
  // Tour Overview Details
  overview: {
    highlights: {
      type: [String],
      default: []
    },
    groupSize: {
      type: String,
      default: 'Not specified',
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'difficult'],
      default: 'easy'
    },
    ageRange: {
      type: String,
      default: 'Not specified',
      trim: true
    },
    bestSeason: {
      type: String,
      default: 'Not specified',
      trim: true
    },
    languages: {
      type: [String],
      default: []
    }
  },
  
  // Included/Excluded Services
  included: {
    type: [String],
    default: []
  },
  excluded: {
    type: [String],
    default: []
  },
  
  // Detailed Itinerary
  itinerary: [{
    day: {
      type: Number,
      required: true,
      min: 1
    },
    title: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    activities: {
      type: [String],
      default: []
    },
    meals: {
      type: String,
      default: '',
      trim: true
    },
    accommodation: {
      type: String,
      default: '',
      trim: true
    }
  }],
  
  // Ratings & Reviews
  ratings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    review: {
      type: String,
      default: '',
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Tour Requirements
  requirements: {
    physicalLevel: {
      type: String,
      default: 'Not specified',
      trim: true
    },
    fitnessLevel: {
      type: String,
      default: 'Not specified',
      trim: true
    },
    documents: {
      type: [String],
      default: []
    },
    packingList: {
      type: [String],
      default: []
    }
  },
  
  // Pricing Details
  pricing: {
    basePrice: {
      type: Number,
      default: 0
    },
    discounts: [{
      name: {
        type: String,
        default: '',
        trim: true
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      description: {
        type: String,
        default: '',
        trim: true
      }
    }],
    paymentPolicy: {
      type: String,
      default: 'Not specified',
      trim: true
    },
    cancellationPolicy: {
      type: String,
      default: 'Not specified',
      trim: true
    }
  },
  
  // Important Information
  importantInfo: {
    bookingCutoff: {
      type: String,
      default: 'Not specified',
      trim: true
    },
    refundPolicy: {
      type: String,
      default: 'Not specified',
      trim: true
    },
    healthAdvisory: {
      type: String,
      default: 'Not specified',
      trim: true
    },
    safetyMeasures: {
      type: String,
      default: 'Not specified',
      trim: true
    }
  },
  
  maxParticipants: {
    type: Number,
    default: 20,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  availableDates: [{
    type: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
tourSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate average rating before saving
tourSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const total = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = total / this.ratings.length;
    this.totalRatings = this.ratings.length;
  } else {
    this.averageRating = 0;
    this.totalRatings = 0;
  }
  
  // Ensure all nested objects exist
  if (!this.overview) this.overview = {};
  if (!this.requirements) this.requirements = {};
  if (!this.pricing) this.pricing = {};
  if (!this.importantInfo) this.importantInfo = {};
  
  // Ensure arrays exist
  if (!this.images) this.images = [];
  if (!this.itinerary) this.itinerary = [];
  if (!this.included) this.included = [];
  if (!this.excluded) this.excluded = [];
  if (!this.ratings) this.ratings = [];
  
  next();
});

// Middleware to ensure data consistency
tourSchema.pre('find', function() {
  this.where({ isActive: true });
});

tourSchema.pre('findOne', function() {
  this.where({ isActive: true });
});

module.exports = mongoose.model('Tour', tourSchema);