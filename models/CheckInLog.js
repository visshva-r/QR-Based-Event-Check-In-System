const mongoose = require('mongoose');

const checkInLogSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ticketId: String,
  scannerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendeeName: String,
  attendeeEmail: String,
  eventTitle: String,
  createdAt: { type: Date, default: Date.now },
});

checkInLogSchema.index({ createdAt: -1 });
checkInLogSchema.index({ eventId: 1, createdAt: -1 });

module.exports = mongoose.model('CheckInLog', checkInLogSchema);
