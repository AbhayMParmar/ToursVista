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
    enum: ['north', 'south', 'west', 'east'],
    default: 'north'
  },
  category: {
    type: String,
    enum: ['heritage', 'adventure', 'beach', 'wellness', 'cultural'],
    default: 'heritage'
  },
  destination: {
    type: String,
    required: false
  },
  included: [{
    type: String
  }],
  excluded: [{
    type: String
  }],
  itinerary: [{
    day: Number,
    description: String
  }],
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
  }
});

module.exports = mongoose.model('Tour', tourSchema);