function simulatePromote(event, opts = {}) {
  const attendees = [...(event.attendees || [])];
  const waitlist = [...(event.waitlist || [])];
  const capacity = event.capacity || 100;
  if (!waitlist.length || attendees.length >= capacity) return null;

  const first = waitlist.shift();
  attendees.push({
    _id: opts.attendeeId || 'promoted',
    userId: first.userId,
    ticketId: opts.ticketId || 'ticket',
    checkedIn: false,
    registeredAt: opts.now || new Date(0),
  });

  return { ...event, attendees, waitlist };
}

module.exports = { simulatePromote };
