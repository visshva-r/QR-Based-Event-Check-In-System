const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 1. Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// 2. Register for an event
router.post('/register/:id', auth(['student']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // SAFE COMPARISON: Convert to string to avoid ObjectId mismatch
    const existing = event.attendees.find(a => a.userId.toString() === req.user.id);
    if (existing) return res.status(400).json({ error: 'Already registered' });

    const qrData = `${req.user.id}-${event._id}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // CRITICAL FIX: Ensure checkedIn is false on registration
    event.attendees.push({ 
      userId: req.user.id, 
      qrCode, 
      checkedIn: false 
    });
    
    await event.save();

    const user = await User.findById(req.user.id);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Registration Confirmed: ${event.title}`,
      html: `
        <div style="font-family: sans-serif; text-align: center; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2563eb;">You are registered!</h2>
          <p>You have successfully registered for <strong>${event.title}</strong>.</p>
          <p>Please present the QR code below at the entrance for check-in:</p>
          <div style="margin: 20px 0;">
            <img src="cid:event-qrcode" alt="Your QR Code" style="width: 200px;" />
          </div>
          <p style="font-size: 12px; color: #666;">User ID: ${req.user.id}</p>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          path: qrCode,
          cid: 'event-qrcode'
        }
      ]
    });

    res.json({ message: 'Registration successful! Check your email.', qrCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 3. Admin Check-in
router.post('/checkin/:eventId/:userId', auth(['admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Use .toString() for safe searching
    const attendee = event.attendees.find(a => a.userId.toString() === req.params.userId);
    
    if (!attendee) return res.status(404).json({ error: 'Student is not registered for this event' });
    
    if (attendee.checkedIn) {
      return res.status(400).json({ error: 'Student is already checked in!' });
    }

    attendee.checkedIn = true;
    await event.save();

    res.json({ message: `Check-in successful for ${req.params.userId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during check-in' });
  }
});

// 4. Export Attendees
router.get('/export/:eventId', auth(['admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('attendees.userId', 'name email studentId');
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const data = event.attendees.map(a => ({
      name: a.userId ? a.userId.name : 'Unknown',
      email: a.userId ? a.userId.email : 'Unknown',
      studentId: a.userId ? a.userId.studentId : 'Unknown',
      checkedIn: a.checkedIn,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during export' });
  }
});

module.exports = router;