const crypto = require('crypto');
const mongoose = require('mongoose');
const env = require('../config/env');
const { Room, RoomBlock, Booking, PromoCode } = require('../models');
const payments = require('./payments');
const mailer = require('./mailer');
const { nightsBetween, todayIso, addDays, nightlyRates, quote } = require('./pricing');
const { badRequest, notFound, conflict } = require('./errors');

const MAX_NIGHTS = 30;

// Bookings that occupy inventory. Unpaid online bookings only hold the room briefly.
function activeFilter() {
  return {
    $or: [
      { status: { $in: ['confirmed', 'checked_in', 'completed'] } },
      { status: 'pending', createdAt: { $gt: new Date(Date.now() - env.holdMinutes * 60 * 1000) } },
    ],
  };
}

// Mongo filter for bookings of `roomFilter` overlapping [checkIn, checkOut).
const overlapFilter = (roomFilter, checkIn, checkOut) => ({
  ...roomFilter,
  ...activeFilter(),
  checkIn: { $lt: checkOut },
  checkOut: { $gt: checkIn },
});

function validateDates(checkIn, checkOut) {
  if (checkIn < todayIso()) throw badRequest('Check-in date cannot be in the past');
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw badRequest('Check-out must be after check-in');
  if (nights > MAX_NIGHTS) throw badRequest(`Stays are limited to ${MAX_NIGHTS} nights`);
  return nights;
}

async function getPromo(code, session) {
  if (!code) return null;
  const promo = await PromoCode.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: todayIso() } }],
  }).session(session || null);
  if (!promo) throw badRequest('That promo code is invalid or has expired');
  return promo;
}

// Units in use per room per night in [from, to): active bookings plus blocked units.
// Returns Map(roomId -> Map(date -> units)).
async function usedByNight(roomIds, from, to, session) {
  const roomFilter = roomIds ? { room: { $in: roomIds } } : {};
  const [bookings, blocks] = await Promise.all([
    Booking.find(overlapFilter(roomFilter, from, to)).select('room checkIn checkOut').session(session || null).lean(),
    RoomBlock.find({ ...roomFilter, start: { $lt: to }, end: { $gt: from } }).select('room start end units').session(session || null).lean(),
  ]);
  const used = new Map();
  const add = (room, start, end, units) => {
    const key = String(room);
    if (!used.has(key)) used.set(key, new Map());
    const nights = used.get(key);
    for (let d = start > from ? start : from; d < (end < to ? end : to); d = addDays(d, 1)) nights.set(d, (nights.get(d) || 0) + units);
  };
  bookings.forEach((b) => add(b.room, b.checkIn, b.checkOut, 1));
  blocks.forEach((b) => add(b.room, b.start, b.end, b.units));
  return used;
}

// The busiest night decides how many units are free for the whole stay.
const peakUsed = (nights) => (nights ? Math.max(0, ...nights.values()) : 0);

async function unitsLeftFor(room, checkIn, checkOut, session) {
  const used = await usedByNight([room._id], checkIn, checkOut, session);
  return Math.max(room.totalUnits - peakUsed(used.get(String(room._id))), 0);
}

// Room ids that have no free units for the given dates.
async function fullyBookedRoomIds(checkIn, checkOut) {
  const used = await usedByNight(null, checkIn, checkOut);
  if (!used.size) return [];
  const rooms = await Room.find({ _id: { $in: [...used.keys()] } }).select('totalUnits');
  return rooms.filter((r) => peakUsed(used.get(String(r._id))) >= r.totalUnits).map((r) => r._id);
}

// Price + availability for a prospective stay. Does not reserve anything.
async function getQuote({ roomId, checkIn, checkOut, guests, promoCode }) {
  const room = await Room.findById(roomId);
  if (!room) throw notFound('Room not found');
  validateDates(checkIn, checkOut);
  if (guests > room.maxGuests) throw badRequest(`This room fits up to ${room.maxGuests} guests`);
  const promo = await getPromo(promoCode);
  const unitsLeft = await unitsLeftFor(room, checkIn, checkOut);
  return {
    available: room.isAvailable && unitsLeft > 0,
    unitsLeft,
    promo: promo ? { code: promo.code, title: promo.title, percentOff: promo.percentOff } : null,
    ...quote({ nightly: nightlyRates(room, checkIn, checkOut), percentOff: promo?.percentOff || 0 }),
  };
}

const newReference = () => `QS-${crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 7)}`;

async function createBooking(user, input) {
  const { roomId, checkIn, checkOut, guests, promoCode, paymentMethod } = input;

  if (paymentMethod === 'stripe' && !payments.isEnabled()) {
    throw badRequest('Online payment is not available right now. Choose pay at hotel.');
  }

  let booking;
  let room;
  // Retried automatically by the driver on transient write conflicts.
  await mongoose.connection.transaction(async (session) => {
    // Writing to the room first makes concurrent bookings of it conflict,
    // so only one of them can pass the availability check below.
    room = await Room.findOneAndUpdate({ _id: roomId }, { $inc: { bookingLock: 1 } }, { new: true, session }).populate({
      path: 'hotel',
      select: 'name isActive',
      options: { session },
    });
    if (!room || !room.hotel?.isActive) throw notFound('Room not found');
    if (!room.isAvailable) throw conflict('This room is not accepting bookings right now');
    validateDates(checkIn, checkOut);
    if (guests > room.maxGuests) throw badRequest(`This room fits up to ${room.maxGuests} guests`);

    if ((await unitsLeftFor(room, checkIn, checkOut, session)) < 1) {
      throw conflict('Sorry, this room was just booked for those dates. Try other dates.');
    }

    const promo = await getPromo(promoCode, session);
    const price = quote({ nightly: nightlyRates(room, checkIn, checkOut), percentOff: promo?.percentOff || 0 });

    [booking] = await Booking.create(
      [{
        reference: newReference(),
        user: user._id,
        room: room._id,
        hotel: room.hotel._id,
        checkIn,
        checkOut,
        guests,
        nights: price.nights,
        pricePerNight: price.pricePerNight,
        priceLines: price.lines.length > 1 || price.lines[0]?.label !== 'Standard' ? price.lines : undefined,
        subtotal: price.subtotal,
        discount: price.discount,
        taxes: price.taxes,
        totalPrice: price.total,
        promoCode: promo?.code,
        status: paymentMethod === 'stripe' ? 'pending' : 'confirmed',
        paymentMethod,
        guestName: input.guestName || user.name,
        guestEmail: input.guestEmail || user.email,
        guestPhone: input.guestPhone || '',
        specialRequests: input.specialRequests || '',
      }],
      { session }
    );
  });

  if (paymentMethod === 'stripe') {
    try {
      const checkoutUrl = await startCheckout(booking, room.roomType, room.hotel.name);
      return { booking, checkoutUrl };
    } catch (err) {
      await Booking.deleteOne({ _id: booking._id });
      throw err;
    }
  }

  mailer.bookingConfirmed(booking, room.roomType, room.hotel.name);
  return { booking, checkoutUrl: null };
}

async function startCheckout(booking, roomType, hotelName) {
  const session = await payments.createCheckoutSession({ booking, roomType, hotelName });
  await Booking.updateOne({ _id: booking._id }, { stripeSessionId: session.id });
  return session.url;
}

// Idempotent: safe to call from both the webhook and the success-page verify.
async function markSessionPaid(session) {
  if (session.payment_status !== 'paid') return null;
  const pending = await Booking.findOne({ stripeSessionId: session.id, isPaid: false });
  if (!pending) return null;
  const b = await Booking.findOneAndUpdate(
    { _id: pending._id, isPaid: false },
    {
      isPaid: true,
      stripePaymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      status: pending.status === 'pending' ? 'confirmed' : pending.status,
    },
    { new: true }
  ).populate('room', 'roomType').populate('hotel', 'name');
  if (b) mailer.bookingConfirmed(b, b.room.roomType, b.hotel.name);
  return b;
}

async function cancelBooking(booking) {
  if (['cancelled', 'completed', 'checked_in'].includes(booking.status)) {
    throw badRequest(`A ${booking.status.replace('_', ' ')} booking cannot be cancelled`);
  }
  let refunded = false;
  if (booking.isPaid && booking.paymentMethod === 'stripe' && booking.stripePaymentIntent && payments.isEnabled()) {
    await payments.refund(booking.stripePaymentIntent);
    refunded = true;
  }
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.isRefunded = refunded;
  await booking.save();
  mailer.bookingCancelled(booking);
  return booking;
}

module.exports = {
  activeFilter,
  overlapFilter,
  usedByNight,
  peakUsed,
  fullyBookedRoomIds,
  getQuote,
  createBooking,
  startCheckout,
  markSessionPaid,
  cancelBooking,
  validateDates,
};
