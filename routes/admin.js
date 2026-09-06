const router = require('express').Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const CheckInLog = require('../models/CheckInLog');
const { Parser } = require('json2csv');
const { eventStats } = require('../utils/events');

function serializeAdminEvent(event) {
  const stats = eventStats(event);
  return {
    _id: event._id,
    title: event.title,
    description: event.description,
    location: event.location,
    date: event.date,
    time: event.time,
    ...stats,
    attendees: event.attendees,
    waitlist: event.waitlist,
  };
}

router.get('/events', auth(['admin']), async (req, res) => {
  try {
    const events = await Event.find()
      .populate('attendees.userId', 'name email studentId')
      .populate('waitlist.userId', 'name email studentId');
    res.json(events.map(serializeAdminEvent));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/events/:id', auth(['admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('attendees.userId', 'name email studentId')
      .populate('waitlist.userId', 'name email studentId');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(serializeAdminEvent(event));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.get('/logs', auth(['admin']), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const query = req.query.eventId ? { eventId: req.query.eventId } : {};
    const logs = await CheckInLog.find(query).sort({ createdAt: -1 }).limit(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.post('/create', auth(['admin']), async (req, res) => {
  const { title, description, location, date, time, capacity } = req.body;
  if (!title || !date || !location) {
    return res.status(400).json({ error: 'Title, date, and location are required' });
  }
  const cap = Number(capacity);
  if (!Number.isFinite(cap) || cap < 1) {
    return res.status(400).json({ error: 'Capacity must be at least 1' });
  }
  const event = await Event.create({
    title,
    description: description || '',
    location,
    date,
    time: time || '',
    capacity: Math.floor(cap),
  });
  res.json(serializeAdminEvent(event));
});

router.get('/attendees/:id', auth(['admin']), async (req, res) => {
  const event = await Event.findById(req.params.id).populate('attendees.userId', 'name email studentId');
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ attendees: event.attendees });
});

router.get('/export/:id', auth(['admin']), async (req, res) => {
  const event = await Event.findById(req.params.id).populate('attendees.userId', 'name email studentId');
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const rows = event.attendees.map((a) => ({
    name: a.userId?.name ?? 'Unknown',
    email: a.userId?.email ?? 'Unknown',
    studentId: a.userId?.studentId ?? 'Unknown',
    checkedIn: a.checkedIn ? 'Yes' : 'No',
    ticketId: a.ticketId ?? '',
  }));
  const parser = new Parser();
  const csv = parser.parse(rows);
  res.header('Content-Type', 'text/csv');
  res.attachment(`event-${String(event.title).replace(/[^a-zA-Z0-9-_]/g, '-')}-attendees.csv`);
  return res.send(csv);
});

module.exports = router;
