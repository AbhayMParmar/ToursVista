const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  detailedDescription: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  region: {
    type: String,
    enum: ['north', 'south', 'west', 'east', 'central'],
    default: 'north'
  },
  category: {
    type: String,
    enum: ['heritage', 'adventure', 'beach', 'wellness', 'cultural', 'spiritual'],
    default: 'heritage'
  },
  destination: {
    type: String,
    required: false
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
    day: Number,
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
      max: 5
    },
    review: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
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
      percentage: Number,
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
    default: 20
  },
  currentParticipants: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('Tour', tourSchema);