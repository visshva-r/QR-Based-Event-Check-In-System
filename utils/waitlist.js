const crypto = require('crypto');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const { createTicket } = require('./tickets');
const { sendTicketEmail } = require('./mail');
const { emitToAdmins } = require('./events');

async function promoteFromWaitlist(eventId, app) {
  const ticketId = crypto.randomUUID();
  const attendeeId = new mongoose.Types.ObjectId();
  const now = new Date();

  const event = await Event.findOneAndUpdate(
    {
      _id: eventId,
      'waitlist.0': { $exists: true },
      $expr: {
        $lt: [
          { $size: { $ifNull: ['$attendees', []] } },
          { $ifNull: ['$capacity', 100] },
        ],
      },
    },
    [
      { $set: { _promoted: { $arrayElemAt: ['$waitlist', 0] } } },
      {
        $set: {
          attendees: {
            $concatArrays: [
              { $ifNull: ['$attendees', []] },
              [{
                _id: attendeeId,
                userId: '$_promoted.userId',
                ticketId,
                checkedIn: false,
                registeredAt: now,
              }],
            ],
          },
          waitlist: {
            $slice: ['$waitlist', 1, { $size: { $ifNull: ['$waitlist', []] } }],
          },
        },
      },
      { $unset: '_promoted' },
    ],
    { new: true }
  );

  if (!event) return null;

  const attendee = event.attendees.find((a) => a.ticketId === ticketId);
  if (attendee) {
    const user = await User.findById(attendee.userId);
    if (user) {
      const token = createTicket({ eventId: event._id, userId: user._id, ticketId });
      await sendTicketEmail({ to: user.email, event, token, promoted: true });
    }
  }

  emitToAdmins(app, 'event-updated', { eventId: String(event._id) });
  return event;
}

async function promoteUntilFull(eventId, app) {
  for (let i = 0; i < 20; i++) {
    const promoted = await promoteFromWaitlist(eventId, app);
    if (!promoted) break;
  }
}

module.exports = { promoteFromWaitlist, promoteUntilFull };
