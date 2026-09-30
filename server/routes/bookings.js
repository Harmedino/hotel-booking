const express = require('express');
const { Booking } = require('../models');
const { validate, z, isoDate, objectId } = require('../lib/validate');
const { ah, notFound, forbidden, badRequest } = require('../lib/errors');
const { requireAuth } = require('../lib/auth');
const { createBooking, cancelBooking, startCheckout } = require('../lib/bookings');
const payments = require('../lib/payments');
const env = require('../config/env');
const { todayIso } = require('../lib/pricing');
const serialize = require('../lib/serializers');

const router = express.Router();
router.use(requireAuth);

const withDetails = (q) => q.populate('room', 'roomType images').populate('hotel', 'name city address contact owner');

const createSchema = z.object({
  roomId: objectId,
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
  const rows = await withDetails(Booking.find({ user: req.user._id }).sort({ checkIn: -1, createdAt: -1 }));
  res.json(rows.map(serialize.booking));
}));

// Guests see their own bookings; hotel owners see bookings at their hotels.
async function loadBooking(req) {
  const b = await withDetails(Booking.findById(req.params.id));
  if (!b) throw notFound('Booking not found');
  const mine = String(b.user) === String(req.user._id);
  if (!mine && String(b.hotel.owner) !== String(req.user._id)) throw forbidden();
  return { b, mine };
}

router.get('/:id', ah(async (req, res) => {
  res.json(serialize.booking((await loadBooking(req)).b));
}));

router.post('/:id/cancel', ah(async (req, res) => {
  const { b, mine } = await loadBooking(req);
  if (!mine) throw forbidden();
  if (b.checkIn <= todayIso()) throw badRequest('Bookings can only be cancelled before the check-in date');
  res.json(serialize.booking(await cancelBooking(b)));
}));

// Retry payment for an unpaid online booking whose checkout was abandoned.
router.post('/:id/pay', ah(async (req, res) => {
  const { b, mine } = await loadBooking(req);
  if (!mine) throw forbidden();
  if (!payments.isEnabled()) throw badRequest('Online payment is not available right now');
  if (b.isPaid) throw badRequest('This booking is already paid');
  if (b.status === 'cancelled') throw badRequest('This booking was cancelled');
  if (b.status === 'pending' && b.createdAt < new Date(Date.now() - env.holdMinutes * 60 * 1000)) {
    throw badRequest('This reservation hold has expired. Please book again.');
  }
  res.json({ checkoutUrl: await startCheckout(b, b.room.roomType, b.hotel.name) });
}));

module.exports = router;
