const router= require('express').Router();
const auth= require('../middleware/auth');
const Event= require('../models/Event');
const { Parser }= require('json2csv');

router.post('/create',auth(['admin']), async (req, res) => {
  const {title, description, location, date, time }= req.body;
  const event= await Event.create({ title, description, location, date, time });
  res.json(event);
});

router.get('/attendees/:id',auth(['admin']), async (req, res) => {
  const event= await Event.findById(req.params.id);
  res.json({ attendees: event.attendees });
});

router.get('/export/:id',auth(['admin']), async (req, res) => {
  const event= await Event.findById(req.params.id);
  const parser= new Parser();
  const csv= parser.parse(event.attendees);
  res.header('Content-Type', 'text/csv');
  res.attachment(`event-${req.params.id}-attendees.csv`);
  return res.send(csv);
});

module.exports= router;
