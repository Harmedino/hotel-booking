const express = require('express');
const payments = require('../lib/payments');
const { markSessionPaid } = require('../lib/bookings');
const { ah, badRequest } = require('../lib/errors');
const { requireAuth } = require('../lib/auth');
const db = require('../db');
const serialize = require('../lib/serializers');

const router = express.Router();

// Mounted with express.raw() in app.js so the signature can be verified.
async function webhook(req, res) {
  if (!payments.isEnabled()) return res.status(503).json({ error: 'Payments are not configured' });
  let event;
  try {
    event = payments.constructEvent(req.body, req.headers['stripe-signature']);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    await markSessionPaid(event.data.object);
  }
  res.json({ received: true });
}

// Called by the success page, so bookings confirm even when webhooks are not set up.
router.get('/verify', requireAuth, ah(async (req, res) => {
  if (!payments.isEnabled()) throw badRequest('Payments are not configured');
  const sessionId = String(req.query.session_id || '');
  if (!sessionId.startsWith('cs_')) throw badRequest('Invalid session');
  const session = await payments.retrieveSession(sessionId);
  await markSessionPaid(session);
  const row = await db.one(
    `SELECT b.*, r.room_type, r.images AS room_images, h.name AS hotel_name, h.city AS hotel_city,
       h.address AS hotel_address, h.contact AS hotel_contact
     FROM bookings b JOIN rooms r ON r.id = b.room_id JOIN hotels h ON h.id = b.hotel_id
     WHERE b.stripe_session_id = $1 AND b.user_id = $2`,
    [sessionId, req.user.id]
  );
  if (!row) throw badRequest('Booking not found for this payment');
  res.json(serialize.booking(row));
}));

module.exports = { router, webhook: ah(webhook) };
