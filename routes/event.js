const express= require('express');
const router= express.Router(); 

const auth= require('../middleware/auth');
const verifyToken= require('../middleware/verifyToken');
const Event= require('../models/Event');
const QRCode= require('qrcode');
const nodemailer= require('nodemailer');
const User= require('../models/User');

router.get('/secure',verifyToken,(req, res) => {
    res.json({ message:'Protected route access granted!', user: req.user });
});

router.post('/register/:id',auth(['student']),async (req, res) => {
  try {
    const event= await Event.findById(req.params.id);
    if(!event) return res.status(404).json({ error: 'Event not found' });

    const existing= event.attendees.find(a => a.userId === req.user.id);
    if(existing) return res.status(400).json({ error: 'Already registered' });

    const qrData= `${req.user.id}-${event._id}`;
    const qrCode= await QRCode.toDataURL(qrData);
    event.attendees.push({ userId: req.user.id, qrCode, checkedIn: false });
    await event.save();

    const user= await User.findById(req.user.id);
    const transporter= nodemailer.createTransport({
      service:'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: 'noreply@example.com',
      to: user.email,
      subject: 'Event Registration',
      html: `<p>You have registered for ${event.title}</p><img src="${qrCode}" />`,
    });

    res.json({ message:'Registered', qrCode });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error:'Server error' });
  }
});

router.post('/checkin/:eventId/:userId', auth(['admin']), async (req, res) => {
  try {
    const event= await Event.findById(req.params.eventId);
    if(!event) return res.status(404).json({ error: 'Event not found' });

    const attendee= event.attendees.find(a => a.userId === req.params.userId);
    if(!attendee) return res.status(404).json({ error: 'User not found in attendees' });

    attendee.checkedIn= true;
    await event.save();

    res.json({ message:'Check-in successful' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error:'Server error' });
  }
});

module.exports= router;