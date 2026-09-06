function toPublicEvent(event, userId) {
  const attendees = event.attendees || [];
  const waitlist = event.waitlist || [];
  const capacity = event.capacity || 100;
  const registeredCount = attendees.length;
  let isRegistered = false;
  let isWaitlisted = false;
  let waitlistPosition = null;
  let isCheckedIn = false;

  if (userId) {
    const uid = String(userId);
    const attendee = attendees.find((a) => a.userId && a.userId.toString() === uid);
    if (attendee) {
      isRegistered = true;
      isCheckedIn = !!attendee.checkedIn;
    }
    const idx = waitlist.findIndex((w) => w.userId && w.userId.toString() === uid);
    if (idx >= 0) {
      isWaitlisted = true;
      waitlistPosition = idx + 1;
    }
  }

  return {
    _id: event._id,
    title: event.title,
    description: event.description,
    location: event.location,
    date: event.date,
    time: event.time,
    capacity,
    registeredCount,
    seatsRemaining: Math.max(0, capacity - registeredCount),
    waitlistCount: waitlist.length,
    isRegistered,
    isWaitlisted,
    isCheckedIn,
    waitlistPosition,
  };
}

function eventStats(event) {
  const attendees = event.attendees || [];
  const waitlist = event.waitlist || [];
  const capacity = event.capacity || 100;
  const checkedIn = attendees.filter((a) => a.checkedIn).length;
  return {
    capacity,
    registeredCount: attendees.length,
    checkedInCount: checkedIn,
    waitlistCount: waitlist.length,
    seatsRemaining: Math.max(0, capacity - attendees.length),
    checkInPercent: attendees.length ? Math.round((checkedIn / attendees.length) * 100) : 0,
  };
}

function emitToAdmins(app, eventName, payload) {
  const io = app.get('io');
  if (io) io.to('admin').emit(eventName, payload);
}

module.exports = { toPublicEvent, eventStats, emitToAdmins };
