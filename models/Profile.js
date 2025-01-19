const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  username: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensure one profile per user
  },
  avatar: {
    type: String // URL to avatar image
  }
}, {
  timestamps: true
});

// Add index for better query performance
profileSchema.index({ username: 1 });

module.exports = mongoose.model('Profile', profileSchema); 