const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

process.env.QR_SECRET = 'unit-test-qr-secret';
process.env.JWT_SECRET = 'unit-test-jwt-secret';

const { createTicket, verifyTicket } = require('../utils/tickets');

describe('HMAC tickets', () => {
  it('round-trips eventId, userId, and ticketId', () => {
    const token = createTicket({ eventId: 'evt1', userId: 'usr1', ticketId: 'tkt1' });
    assert.deepEqual(verifyTicket(token), {
      eventId: 'evt1',
      userId: 'usr1',
      ticketId: 'tkt1',
    });
  });

  it('rejects a tampered payload', () => {
    const token = createTicket({ eventId: 'evt1', userId: 'usr1', ticketId: 'tkt1' });
    const [data, sig] = token.split('.');
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    payload.u = 'attacker';
    const forged = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${sig}`;
    assert.throws(() => verifyTicket(forged), /Invalid ticket signature/);
  });

  it('rejects a flipped signature byte', () => {
    const token = createTicket({ eventId: 'evt1', userId: 'usr1', ticketId: 'tkt1' });
    const last = token[token.length - 1] === 'a' ? 'b' : 'a';
    assert.throws(() => verifyTicket(token.slice(0, -1) + last), /Invalid ticket/);
  });

  it('rejects the old plaintext userId-eventId format', () => {
    assert.throws(() => verifyTicket('64abc-64def'), /Invalid ticket/);
  });
});
