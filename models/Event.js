const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  date: String,
  time: String,
  attendees: [{
    // Changed to ObjectId and added a 'ref' to your User model
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    qrCode: String,
    checkedIn: { 
      type: Boolean, 
      default: false 
    }
  }]
});

module.exports = mongoose.model('Event', eventSchema);