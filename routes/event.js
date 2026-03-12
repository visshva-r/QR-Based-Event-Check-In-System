const express= require('express');
const router= express.Router(); 

const auth= require('../middleware/auth');
const verifyToken= require('../middleware/verifyToken');
const Event= require('../models/Event');
const QRCode= require('qrcode');
const nodemailer= require('nodemailer');
const User= require('../models/User');

const transporter= nodemailer.createTransport({
      service:'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

// Get all events
router.get('/', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

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

    // We send the QR code as an attachment and link it using "cid"
    await transporter.sendMail({
      from: 'noreply@example.com',
      to: user.email,
      subject: 'Event Registration',
      html: `
        <h2>You are registered!</h2>
        <p>You have successfully registered for ${event.title}.</p>
        <p>Please present the QR code below at the entrance for check-in:</p>
        <img src="cid:event-qrcode" alt="Your QR Code" />
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          path: qrCode,          // Nodemailer automatically parses the base64 string!
          cid: 'event-qrcode'    // This MUST match the src="cid:..." in the HTML above
        }
      ]
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

router.get('/export/:eventId', auth(['admin']), async (req, res) => {
  try {
    const event= await Event.findById(req.params.eventId).populate('attendees.userId', 'name email studentId'); // Populate userId
    if(!event) return res.status(404).json({ error: 'Event not found' });

    const format= req.query.format || 'json';

    if(!event.attendees || event.attendees.length === 0) {
      return res.status(404).json({ error: 'No attendees found' });
    }

    const data= event.attendees.map(a => ({
      name: a.userId ? a.userId.name : 'Unknown',
      email: a.userId ? a.userId.email : 'Unknown',
      studentId: a.userId ? a.userId.studentId : 'Unknown',
      checkedIn: a.checkedIn,
    }));

    if(format === 'csv') {
      const parser= new Parser();
      const csv= parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${event.title.replace(/\s+/g, '_')}_attendees.csv`);
      return res.send(csv);
    } else {
      return res.json(data);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports= router;