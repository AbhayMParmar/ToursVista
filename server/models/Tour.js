const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tour title is required']
  },
  description: {
    type: String,
    required: [true, 'Tour description is required']
  },
  detailedDescription: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Tour price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: String,
    required: [true, 'Tour duration is required']
  },
  image: {
    type: String,
    required: [true, 'Main image is required'],
    default: 'https://via.placeholder.com/600x400?text=Tour+Image'
  },
  images: [{
    type: String
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
    default: ''
  },
  
  // Tour Overview Details
  overview: {
    highlights: [String],
    groupSize: String,
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'difficult'],
      default: 'easy'
    },
    ageRange: String,
    bestSeason: String,
    languages: [String]
  },
  
  // Included/Excluded Services
  included: [{
    type: String
  }],
  excluded: [{
    type: String
  }],
  
  // Detailed Itinerary
  itinerary: [{
    day: {
      type: Number,
      required: true,
      min: 1
    },
    title: String,
    description: String,
    activities: [String],
    meals: String,
    accommodation: String
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
    review: String,
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
    physicalLevel: String,
    fitnessLevel: String,
    documents: [String],
    packingList: [String]
  },
  
  // Pricing Details
  pricing: {
    basePrice: Number,
    discounts: [{
      name: String,
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      description: String
    }],
    paymentPolicy: String,
    cancellationPolicy: String
  },
  
  // Important Information
  importantInfo: {
    bookingCutoff: String,
    refundPolicy: String,
    healthAdvisory: String,
    safetyMeasures: String
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
  next();
});

module.exports = mongoose.model('Tour', tourSchema);