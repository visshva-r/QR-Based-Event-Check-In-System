const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendTicketEmail({ to, event, token, promoted = false }) {
  const transporter = getTransporter();
  if (!transporter || !to) return false;
  try {
    const qrCode = await QRCode.toDataURL(token);
    const heading = promoted ? 'A seat opened up. You are in.' : 'You are registered.';
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: promoted
        ? `Waitlist: ${event.title}`
        : `Pass: ${event.title}`,
      html: `
        <div style="font-family: sans-serif; text-align: center; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #2563eb;">${heading}</h2>
          <p>Your pass for <strong>${event.title}</strong> is attached.</p>
          <p>Show this QR at the door. You can also open it in the Gate app.</p>
          <div style="margin: 20px 0;">
            <img src="cid:event-qrcode" alt="Your QR Code" style="width: 200px;" />
          </div>
          <p style="font-size: 12px; color: #666;">${event.location || ''} ${event.date || ''}</p>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          path: qrCode,
          cid: 'event-qrcode',
        },
      ],
    });
    return true;
  } catch (err) {
    console.error('Email failed:', err.message);
    return false;
  }
}

module.exports = { sendTicketEmail };
