const crypto = require('crypto');
const db = require('../db');
const env = require('../config/env');
const payments = require('./payments');
const mailer = require('./mailer');
const { nightsBetween, todayIso, quote } = require('./pricing');
const { badRequest, notFound, conflict } = require('./errors');

// Bookings that occupy inventory. Unpaid online bookings only hold the room briefly.
const ACTIVE_BOOKING = `(b.status IN ('confirmed', 'checked_in', 'completed')
  OR (b.status = 'pending' AND b.created_at > now() - interval '${env.holdMinutes} minutes'))`;

const MAX_NIGHTS = 30;

function validateDates(checkIn, checkOut) {
  if (checkIn < todayIso()) throw badRequest('Check-in date cannot be in the past');
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw badRequest('Check-out must be after check-in');
  if (nights > MAX_NIGHTS) throw badRequest(`Stays are limited to ${MAX_NIGHTS} nights`);
  return nights;
}

async function getPromo(code, client = db) {
  if (!code) return null;
  const { rows } = await client.query(
    `SELECT * FROM promo_codes
     WHERE upper(code) = upper($1) AND is_active AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)`,
    [code.trim()]
  );
  if (!rows[0]) throw badRequest('That promo code is invalid or has expired');
  return rows[0];
}

async function unitsBooked(client, roomId, checkIn, checkOut) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS n FROM bookings b
     WHERE b.room_id = $1 AND ${ACTIVE_BOOKING} AND b.check_in < $3 AND b.check_out > $2`,
    [roomId, checkIn, checkOut]
  );
  return rows[0].n;
}

// Price + availability for a prospective stay. Does not reserve anything.
async function getQuote({ roomId, checkIn, checkOut, guests, promoCode }) {
  const room = await db.one('SELECT * FROM rooms WHERE id = $1', [roomId]);
  if (!room) throw notFound('Room not found');
  const nights = validateDates(checkIn, checkOut);
  if (guests > room.max_guests) throw badRequest(`This room fits up to ${room.max_guests} guests`);
  const promo = await getPromo(promoCode);
  const booked = await unitsBooked(db.pool, roomId, checkIn, checkOut);
  const unitsLeft = Math.max(room.total_units - booked, 0);
  return {
    available: room.is_available && unitsLeft > 0,
    unitsLeft,
    promo: promo ? { code: promo.code, title: promo.title, percentOff: promo.percent_off } : null,
    ...quote({ pricePerNight: room.price_per_night, nights, percentOff: promo?.percent_off || 0 }),
  };
}

const newReference = () => `QS-${crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 7)}`;

async function createBooking(user, input) {
  const { roomId, checkIn, checkOut, guests, promoCode, paymentMethod } = input;

  if (paymentMethod === 'stripe' && !payments.isEnabled()) {
    throw badRequest('Online payment is not available right now. Choose pay at hotel.');
  }

  const { booking, room } = await db.tx(async (client) => {
    // Lock the room row so concurrent bookings for it are serialised.
    const { rows } = await client.query(
      `SELECT r.*, h.name AS hotel_name, h.is_active AS hotel_active
       FROM rooms r JOIN hotels h ON h.id = r.hotel_id
       WHERE r.id = $1 FOR UPDATE OF r`,
      [roomId]
    );
    const room = rows[0];
    if (!room || !room.hotel_active) throw notFound('Room not found');
    if (!room.is_available) throw conflict('This room is not accepting bookings right now');
    const nights = validateDates(checkIn, checkOut);
    if (guests > room.max_guests) throw badRequest(`This room fits up to ${room.max_guests} guests`);

    const booked = await unitsBooked(client, roomId, checkIn, checkOut);
    if (booked >= room.total_units) throw conflict('Sorry, this room was just booked for those dates. Try other dates.');

    const promo = await getPromo(promoCode, client);
    const price = quote({ pricePerNight: room.price_per_night, nights, percentOff: promo?.percent_off || 0 });

    const insert = await client.query(
      `INSERT INTO bookings (reference, user_id, room_id, hotel_id, check_in, check_out, guests, nights,
         price_per_night, subtotal, discount, taxes, total_price, promo_code, status, payment_method,
         guest_name, guest_email, guest_phone, special_requests)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [
        newReference(), user.id, roomId, room.hotel_id, checkIn, checkOut, guests, nights,
        price.pricePerNight, price.subtotal, price.discount, price.taxes, price.total, promo?.code || null,
        paymentMethod === 'stripe' ? 'pending' : 'confirmed', paymentMethod,
        input.guestName || user.name, input.guestEmail || user.email, input.guestPhone || '', input.specialRequests || '',
      ]
    );
    return { booking: insert.rows[0], room };
  });

  if (paymentMethod === 'stripe') {
    try {
      const checkoutUrl = await startCheckout(booking, room.room_type, room.hotel_name);
      return { booking, checkoutUrl };
    } catch (err) {
      await db.query('DELETE FROM bookings WHERE id = $1', [booking.id]);
      throw err;
    }
  }

  mailer.bookingConfirmed(booking, room.room_type, room.hotel_name);
  return { booking, checkoutUrl: null };
}

async function startCheckout(booking, roomType, hotelName) {
  const session = await payments.createCheckoutSession({ booking, roomType, hotelName });
  await db.query('UPDATE bookings SET stripe_session_id = $2, updated_at = now() WHERE id = $1', [booking.id, session.id]);
  return session.url;
}

// Idempotent: safe to call from both the webhook and the success-page verify.
async function markSessionPaid(session) {
  if (session.payment_status !== 'paid') return null;
  const b = await db.one(
    `UPDATE bookings SET is_paid = true, stripe_payment_intent = $2,
       status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END, updated_at = now()
     WHERE stripe_session_id = $1 AND NOT is_paid RETURNING *`,
    [session.id, typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id]
  );
  if (b) {
    const info = await db.one(
      'SELECT r.room_type, h.name AS hotel_name FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE r.id = $1',
      [b.room_id]
    );
    mailer.bookingConfirmed(b, info.room_type, info.hotel_name);
  }
  return b;
}

async function cancelBooking(booking) {
  if (['cancelled', 'completed', 'checked_in'].includes(booking.status)) {
    throw badRequest(`A ${booking.status.replace('_', ' ')} booking cannot be cancelled`);
  }
  let refunded = false;
  if (booking.is_paid && booking.payment_method === 'stripe' && booking.stripe_payment_intent && payments.isEnabled()) {
    await payments.refund(booking.stripe_payment_intent);
    refunded = true;
  }
  const updated = await db.one(
    `UPDATE bookings SET status = 'cancelled', cancelled_at = now(), is_refunded = $2, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [booking.id, refunded]
  );
  mailer.bookingCancelled(updated);
  return updated;
}

module.exports = {
  ACTIVE_BOOKING,
  getQuote,
  createBooking,
  startCheckout,
  markSessionPaid,
  cancelBooking,
  validateDates,
};
