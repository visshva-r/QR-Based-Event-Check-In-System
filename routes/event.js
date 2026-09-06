const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const Event = require('../models/Event');
const User = require('../models/User');
const CheckInLog = require('../models/CheckInLog');
const { createTicket, verifyTicket } = require('../utils/tickets');
const { sendTicketEmail } = require('../utils/mail');
const { toPublicEvent, emitToAdmins } = require('../utils/events');
const { promoteUntilFull } = require('../utils/waitlist');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const events = await Event.find();
    const userId = req.user?.id;
    res.json(events.map((e) => toPublicEvent(e, userId)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/register/:id', auth(['student']), async (req, res) => {
  try {
    const eventId = req.params.id;
    const userOid = new mongoose.Types.ObjectId(req.user.id);
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const alreadyIn = event.attendees.some((a) => a.userId && a.userId.toString() === req.user.id);
    if (alreadyIn) return res.status(400).json({ error: 'Already registered' });
    const alreadyWait = event.waitlist.some((w) => w.userId && w.userId.toString() === req.user.id);
    if (alreadyWait) return res.status(400).json({ error: 'Already on the waitlist' });

    const ticketId = crypto.randomUUID();
    const registered = await Event.findOneAndUpdate(
      {
        _id: eventId,
        'attendees.userId': { $ne: userOid },
        'waitlist.userId': { $ne: userOid },
        $expr: {
          $lt: [
            { $size: { $ifNull: ['$attendees', []] } },
            { $ifNull: ['$capacity', 100] },
          ],
        },
      },
      {
        $push: {
          attendees: {
            userId: userOid,
            ticketId,
            checkedIn: false,
            registeredAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (registered) {
      const token = createTicket({ eventId: registered._id, userId: req.user.id, ticketId });
      const user = await User.findById(req.user.id);
      const emailSent = await sendTicketEmail({ to: user?.email, event: registered, token });
      emitToAdmins(req.app, 'event-updated', { eventId: String(registered._id) });
      return res.json({
        status: 'registered',
        message: emailSent
          ? 'Registration successful. Ticket is in the app and emailed.'
          : 'Registration successful. Ticket is in the app. Email could not be sent.',
        emailSent,
        ticketId,
        event: toPublicEvent(registered, req.user.id),
      });
    }

    const waitlisted = await Event.findOneAndUpdate(
      {
        _id: eventId,
        'attendees.userId': { $ne: userOid },
        'waitlist.userId': { $ne: userOid },
      },
      { $push: { waitlist: { userId: userOid, joinedAt: new Date() } } },
      { new: true }
    );

    if (!waitlisted) {
      return res.status(400).json({ error: 'Already registered or on the waitlist' });
    }

    emitToAdmins(req.app, 'event-updated', { eventId: String(waitlisted._id) });
    const pub = toPublicEvent(waitlisted, req.user.id);
    return res.json({
      status: 'waitlisted',
      message: `Event is full. You are #${pub.waitlistPosition} on the waitlist.`,
      emailSent: false,
      event: pub,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/unregister/:id', auth(['student']), async (req, res) => {
  try {
    const eventId = req.params.id;
    const userOid = new mongoose.Types.ObjectId(req.user.id);
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const attendee = event.attendees.find((a) => a.userId && a.userId.toString() === req.user.id);
    if (attendee?.checkedIn) {
      return res.status(400).json({ error: 'Cannot cancel after check-in' });
    }

    const pulledAttendee = await Event.findOneAndUpdate(
      { _id: eventId, 'attendees.userId': userOid },
      { $pull: { attendees: { userId: userOid } } },
      { new: true }
    );

    if (pulledAttendee) {
      await promoteUntilFull(eventId, req.app);
      const updated = await Event.findById(eventId);
      emitToAdmins(req.app, 'event-updated', { eventId: String(eventId) });
      return res.json({ message: 'Registration cancelled', event: toPublicEvent(updated, req.user.id) });
    }

    const pulledWait = await Event.findOneAndUpdate(
      { _id: eventId, 'waitlist.userId': userOid },
      { $pull: { waitlist: { userId: userOid } } },
      { new: true }
    );

    if (!pulledWait) {
      return res.status(400).json({ error: 'You are not registered or waitlisted' });
    }

    emitToAdmins(req.app, 'event-updated', { eventId: String(eventId) });
    return res.json({ message: 'Left the waitlist', event: toPublicEvent(pulledWait, req.user.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during cancel' });
  }
});

router.get('/:id/ticket', auth(['student']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const attendee = event.attendees.find((a) => a.userId && a.userId.toString() === req.user.id);
    if (!attendee) {
      return res.status(404).json({ error: 'No ticket. Register first or you may be waitlisted.' });
    }
    if (!attendee.ticketId) {
      attendee.ticketId = crypto.randomUUID();
      await event.save();
    }
    const token = createTicket({
      eventId: event._id,
      userId: req.user.id,
      ticketId: attendee.ticketId,
    });
    const qrCode = await QRCode.toDataURL(token);
    const holder = await User.findById(req.user.id).select('name email studentId');
    res.json({
      qrCode,
      ticketId: attendee.ticketId,
      checkedIn: attendee.checkedIn,
      holder: {
        name: holder?.name || 'Student',
        email: holder?.email,
        studentId: holder?.studentId,
      },
      event: {
        _id: event._id,
        title: event.title,
        description: event.description,
        location: event.location,
        date: event.date,
        time: event.time,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load ticket' });
  }
});

router.post('/checkin', auth(['admin']), async (req, res) => {
  try {
    const raw = req.body?.token;
    if (!raw || typeof raw !== 'string') {
      return res.status(400).json({ error: 'Invalid ticket', status: 'invalid' });
    }

    let payload;
    try {
      payload = verifyTicket(raw);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or tampered ticket', status: 'invalid' });
    }

    const event = await Event.findById(payload.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found', status: 'invalid' });

    const attendee = event.attendees.find(
      (a) => a.userId && a.userId.toString() === payload.userId && a.ticketId === payload.ticketId
    );

    if (!attendee) {
      return res.status(404).json({ error: 'Student is not registered for this event', status: 'invalid' });
    }

    if (attendee.checkedIn) {
      const user = await User.findById(payload.userId).select('name email');
      return res.status(400).json({
        error: 'Already checked in',
        status: 'duplicate',
        attendee: { name: user?.name, email: user?.email },
      });
    }

    attendee.checkedIn = true;
    attendee.checkedInAt = new Date();
    await event.save();

    const user = await User.findById(payload.userId);
    const log = await CheckInLog.create({
      eventId: event._id,
      userId: payload.userId,
      ticketId: payload.ticketId,
      scannerId: req.user.id,
      attendeeName: user?.name || 'Unknown',
      attendeeEmail: user?.email || 'Unknown',
      eventTitle: event.title,
    });

    const logPayload = {
      _id: log._id,
      eventId: String(event._id),
      ticketId: log.ticketId,
      attendeeName: log.attendeeName,
      attendeeEmail: log.attendeeEmail,
      eventTitle: log.eventTitle,
      scannerId: String(req.user.id),
      createdAt: log.createdAt,
    };

    emitToAdmins(req.app, 'checkin', logPayload);
    emitToAdmins(req.app, 'event-updated', { eventId: String(event._id) });

    res.json({
      status: 'ok',
      message: `Check-in successful for ${user?.name || payload.userId}`,
      attendee: { name: user?.name, email: user?.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during check-in', status: 'invalid' });
  }
});

router.get('/export/:eventId', auth(['admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('attendees.userId', 'name email studentId');
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const data = event.attendees.map((a) => ({
      name: a.userId ? a.userId.name : 'Unknown',
      email: a.userId ? a.userId.email : 'Unknown',
      studentId: a.userId ? a.userId.studentId : 'Unknown',
      checkedIn: a.checkedIn,
      ticketId: a.ticketId,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during export' });
  }
});

module.exports = router;
