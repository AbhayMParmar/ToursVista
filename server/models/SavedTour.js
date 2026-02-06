const mongoose = require('mongoose');

const savedTourSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  }
}, {
  timestamps: true
});

// Prevent duplicate saved tours
savedTourSchema.index({ user: 1, tour: 1 }, { unique: true });

module.exports = mongoose.model('SavedTour', savedTourSchema);