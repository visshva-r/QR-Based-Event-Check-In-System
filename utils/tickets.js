const crypto = require('crypto');

function getSecret() {
  return process.env.QR_SECRET || process.env.JWT_SECRET;
}

function createTicket({ eventId, userId, ticketId }) {
  const payload = {
    e: String(eventId),
    u: String(userId),
    t: String(ticketId),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyTicket(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid ticket');
  }
  const trimmed = token.trim();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    throw new Error('Invalid ticket');
  }
  const data = trimmed.slice(0, lastDot);
  const sig = trimmed.slice(lastDot + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('Invalid ticket signature');
  }
  const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  if (!payload.e || !payload.u || !payload.t) {
    throw new Error('Invalid ticket payload');
  }
  return { eventId: payload.e, userId: payload.u, ticketId: payload.t };
}

module.exports = { createTicket, verifyTicket };
