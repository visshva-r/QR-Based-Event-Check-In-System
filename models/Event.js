const mongoose= require('mongoose');
const eventSchema= new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  date: String,
  time: String,
  attendees:[{
    userId: String,
    qrCode: String,
    checkedIn:{type: Boolean,default: false }
  }]
});
module.exports= mongoose.model('Event',eventSchema);
