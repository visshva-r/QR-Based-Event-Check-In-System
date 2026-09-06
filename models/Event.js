const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  date: String,
  time: String,
  capacity: { type: Number, default: 100, min: 1 },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ticketId: String,
    checkedIn: {
      type: Boolean,
      default: false,
    },
    registeredAt: { type: Date, default: Date.now },
    checkedInAt: Date,
  }],
  waitlist: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: { type: Date, default: Date.now },
  }],
});

module.exports = mongoose.model('Event', eventSchema);
