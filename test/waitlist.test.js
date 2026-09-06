const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { simulatePromote } = require('../utils/waitlistLogic');

describe('waitlist promotion', () => {
  it('promotes the first waitlisted student when a seat opens', () => {
    const next = simulatePromote({
      capacity: 1,
      attendees: [],
      waitlist: [{ userId: 'a' }, { userId: 'b' }],
    }, { ticketId: 'new-ticket' });

    assert.equal(next.attendees.length, 1);
    assert.equal(next.attendees[0].userId, 'a');
    assert.equal(next.attendees[0].ticketId, 'new-ticket');
    assert.equal(next.waitlist.length, 1);
    assert.equal(next.waitlist[0].userId, 'b');
  });

  it('does not promote when the event is still full', () => {
    const next = simulatePromote({
      capacity: 1,
      attendees: [{ userId: 'seated' }],
      waitlist: [{ userId: 'waiting' }],
    });
    assert.equal(next, null);
  });

  it('does not promote an empty waitlist', () => {
    const next = simulatePromote({
      capacity: 10,
      attendees: [{ userId: 'seated' }],
      waitlist: [],
    });
    assert.equal(next, null);
  });
});
