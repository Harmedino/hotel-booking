const express = require('express');
const db = require('../db');
const { validate, z, isoDate, uuid } = require('../lib/validate');
const { ah, notFound, forbidden, badRequest } = require('../lib/errors');
const { requireAuth } = require('../lib/auth');
const { createBooking, cancelBooking, startCheckout } = require('../lib/bookings');
const payments = require('../lib/payments');
const { todayIso } = require('../lib/pricing');
const serialize = require('../lib/serializers');

const router = express.Router();
router.use(requireAuth);

const BOOKING_SELECT = `
  SELECT b.*, r.room_type, r.images AS room_images, h.name AS hotel_name, h.city AS hotel_city,
    h.address AS hotel_address, h.contact AS hotel_contact, h.owner_id AS hotel_owner_id,
    EXISTS (SELECT 1 FROM reviews rv WHERE rv.booking_id = b.id) AS has_review
  FROM bookings b
  JOIN rooms r ON r.id = b.room_id
  JOIN hotels h ON h.id = b.hotel_id`;

const createSchema = z.object({
  roomId: uuid,
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.number().int().min(1).max(20),
  paymentMethod: z.enum(['pay_at_hotel', 'stripe']),
  promoCode: z.string().trim().max(40).optional().or(z.literal('')),
  guestName: z.string().trim().min(2).max(80),
  guestEmail: z.string().trim().email('must be a valid email').max(200),
  guestPhone: z.string().trim().max(30).optional(),
  specialRequests: z.string().trim().max(1000).optional(),
});

router.post('/', validate(createSchema), ah(async (req, res) => {
  const { booking, checkoutUrl } = await createBooking(req.user, req.body);
  res.status(201).json({ booking: serialize.booking(booking), checkoutUrl });
}));

router.get('/mine', ah(async (req, res) => {
  const rows = await db.many(`${BOOKING_SELECT} WHERE b.user_id = $1 ORDER BY b.check_in DESC, b.created_at DESC`, [
    req.user.id,
  ]);
  res.json(rows.map(serialize.booking));
}));

async function loadOwnBooking(req) {
  const row = await db.one(`${BOOKING_SELECT} WHERE b.id = $1`, [req.params.id]);
  if (!row) throw notFound('Booking not found');
  if (row.user_id !== req.user.id && row.hotel_owner_id !== req.user.id) throw forbidden();
  return row;
}

router.get('/:id', ah(async (req, res) => {
  res.json(serialize.booking(await loadOwnBooking(req)));
}));

router.post('/:id/cancel', ah(async (req, res) => {
  const row = await loadOwnBooking(req);
  if (row.user_id !== req.user.id) throw forbidden();
  if (row.check_in <= todayIso()) throw badRequest('Bookings can only be cancelled before the check-in date');
  const updated = await cancelBooking(row);
  res.json(serialize.booking({ ...row, ...updated }));
}));

// Retry payment for an unpaid online booking whose checkout was abandoned.
router.post('/:id/pay', ah(async (req, res) => {
  const row = await loadOwnBooking(req);
  if (row.user_id !== req.user.id) throw forbidden();
  if (!payments.isEnabled()) throw badRequest('Online payment is not available right now');
  if (row.is_paid) throw badRequest('This booking is already paid');
  if (row.status === 'cancelled') throw badRequest('This booking was cancelled');
  if (row.payment_method === 'stripe' && row.status === 'pending') {
    const fresh = await db.one(
      `SELECT created_at > now() - interval '30 minutes' AS held FROM bookings WHERE id = $1`,
      [row.id]
    );
    if (!fresh.held) throw badRequest('This reservation hold has expired. Please book again.');
  }
  const checkoutUrl = await startCheckout(row, row.room_type, row.hotel_name);
  res.json({ checkoutUrl });
}));

module.exports = router;
