const router= require('express').Router();
const auth= require('../middleware/auth');
const Event= require('../models/Event');
const { Parser }= require('json2csv');

// Get all events with populated attendees (for admin dashboard)
router.get('/events', auth(['admin']), async (req, res) => {
  try {
    const events = await Event.find().populate('attendees.userId', 'name email studentId');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/create',auth(['admin']), async (req, res) => {
  const {title, description, location, date, time }= req.body;
  if (!title || !date || !location) {
    return res.status(400).json({ error: 'Title, date, and location are required' });
  }
  const event= await Event.create({ title, description: description || '', location, date, time: time || '' });
  res.json(event);
});

router.get('/attendees/:id',auth(['admin']), async (req, res) => {
  const event= await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ attendees: event.attendees });
});

router.get('/export/:id',auth(['admin']), async (req, res) => {
  const event= await Event.findById(req.params.id).populate('attendees.userId', 'name email studentId');
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const rows = event.attendees.map(a => ({
    name: a.userId?.name ?? 'Unknown',
    email: a.userId?.email ?? 'Unknown',
    studentId: a.userId?.studentId ?? 'Unknown',
    checkedIn: a.checkedIn ? 'Yes' : 'No',
  }));
  const parser= new Parser();
  const csv= parser.parse(rows);
  res.header('Content-Type', 'text/csv');
  res.attachment(`event-${String(event.title).replace(/[^a-zA-Z0-9-_]/g, '-')}-attendees.csv`);
  return res.send(csv);
});

module.exports= router;
