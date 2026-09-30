const nodemailer = require('nodemailer');
const env = require('../config/env');

const transport = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

const isEnabled = () => Boolean(transport);

const layout = (title, body) => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0f172a">
  <h2 style="margin:0 0 16px">${title}</h2>
  ${body}
  <p style="margin-top:32px;color:#64748b;font-size:12px">QuickStay · You're receiving this because of activity on your account.</p>
</div>`;

// Never throws: email failure must not break the request that triggered it.
async function send({ to, subject, html }) {
  if (!transport) {
    if (!env.isTest) console.log(`[mail disabled] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await transport.sendMail({ from: env.mailFrom, to, subject, html });
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}

const money = (n) => `$${Number(n).toFixed(2)}`;

function bookingConfirmed(b, roomName, hotelName) {
  return send({
    to: b.guest_email,
    subject: `Booking confirmed · ${b.reference}`,
    html: layout(
      'Your stay is booked 🎉',
      `<p>Hi ${b.guest_name},</p>
       <p><b>${roomName}</b> at <b>${hotelName}</b></p>
       <p>${b.check_in} → ${b.check_out} · ${b.nights} night(s) · ${b.guests} guest(s)</p>
       <p>Total: <b>${money(b.total_price)}</b> (${b.is_paid ? 'paid' : 'pay at hotel'})</p>
       <p><a href="${env.appUrl}/my-bookings">View your booking</a></p>`
    ),
  });
}

function bookingCancelled(b) {
  return send({
    to: b.guest_email,
    subject: `Booking cancelled · ${b.reference}`,
    html: layout(
      'Your booking was cancelled',
      `<p>Booking <b>${b.reference}</b> (${b.check_in} → ${b.check_out}) has been cancelled.</p>
       ${b.is_refunded ? `<p>A refund of ${money(b.total_price)} is on its way to your card.</p>` : ''}`
    ),
  });
}

function passwordReset(to, url) {
  return send({
    to,
    subject: 'Reset your QuickStay password',
    html: layout(
      'Reset your password',
      `<p>Click the link below to choose a new password. It expires in 1 hour.</p>
       <p><a href="${url}">${url}</a></p>
       <p>If you didn't ask for this, you can ignore this email.</p>`
    ),
  });
}

module.exports = { isEnabled, bookingConfirmed, bookingCancelled, passwordReset };
