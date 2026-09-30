const express = require('express');
const db = require('../db');
const { validate, z, isoDate, uuid } = require('../lib/validate');
const { ah, notFound, forbidden, conflict } = require('../lib/errors');
const { optionalAuth, requireAuth } = require('../lib/auth');
const { ACTIVE_BOOKING, getQuote, validateDates } = require('../lib/bookings');
const serialize = require('../lib/serializers');

const router = express.Router();

const ROOM_SELECT = `
  SELECT r.*, h.name AS hotel_name, h.city AS hotel_city, h.country AS hotel_country,
    h.address AS hotel_address, h.contact AS hotel_contact, h.description AS hotel_description,
    rv.rating_avg, COALESCE(rv.review_count, 0) AS review_count
  FROM rooms r
  JOIN hotels h ON h.id = r.hotel_id
  LEFT JOIN (
    SELECT room_id, AVG(rating)::float AS rating_avg, COUNT(*)::int AS review_count
    FROM reviews GROUP BY room_id
  ) rv ON rv.room_id = r.id`;

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

const SORTS = {
  recommended: 'rv.rating_avg DESC NULLS LAST, rv.review_count DESC NULLS LAST, r.created_at DESC',
  price_asc: 'r.price_per_night ASC, r.created_at DESC',
  price_desc: 'r.price_per_night DESC, r.created_at DESC',
  rating: 'rv.rating_avg DESC NULLS LAST, r.price_per_night ASC',
  newest: 'r.created_at DESC',
};

const listSchema = z.object({
  destination: z.string().trim().max(100).optional(),
  checkIn: isoDate.optional(),
  checkOut: isoDate.optional(),
  guests: z.coerce.number().int().min(1).max(20).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  roomType: z.string().trim().max(60).optional(),
  amenities: z.string().max(300).optional(),
  hotelId: uuid.optional(),
  sort: z.enum(Object.keys(SORTS)).default('recommended'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

router.get('/', validate(listSchema, 'query'), ah(async (req, res) => {
  const q = req.validQuery;
  const where = ['r.is_available', 'h.is_active'];
  const params = [];
  const add = (v) => { params.push(v); return `$${params.length}`; };

  if (q.destination) {
    const p = add(`%${escapeLike(q.destination)}%`);
    where.push(`(h.city ILIKE ${p} OR h.name ILIKE ${p} OR h.country ILIKE ${p} OR r.room_type ILIKE ${p})`);
  }
  if (q.guests) where.push(`r.max_guests >= ${add(q.guests)}`);
  if (q.minPrice !== undefined) where.push(`r.price_per_night >= ${add(q.minPrice)}`);
  if (q.maxPrice !== undefined) where.push(`r.price_per_night <= ${add(q.maxPrice)}`);
  if (q.roomType) where.push(`r.room_type ILIKE ${add(q.roomType)}`);
  if (q.hotelId) where.push(`r.hotel_id = ${add(q.hotelId)}`);
  if (q.amenities) {
    const list = q.amenities.split(',').map((a) => a.trim()).filter(Boolean);
    if (list.length) where.push(`r.amenities @> ${add(list)}::text[]`);
  }
  if (q.checkIn && q.checkOut) {
    validateDates(q.checkIn, q.checkOut);
    const ci = add(q.checkIn);
    const co = add(q.checkOut);
    where.push(`r.total_units > (SELECT COUNT(*) FROM bookings b
      WHERE b.room_id = r.id AND ${ACTIVE_BOOKING} AND b.check_in < ${co} AND b.check_out > ${ci})`);
  }

  const offset = (q.page - 1) * q.limit;
  const sql = `SELECT *, COUNT(*) OVER() AS total_count FROM (
      ${ROOM_SELECT} WHERE ${where.join(' AND ')}
      ORDER BY ${SORTS[q.sort]}
    ) t LIMIT ${add(q.limit)} OFFSET ${add(offset)}`;
  const result = await db.many(sql, params);
  const total = result[0]?.total_count || 0;
  res.json({
    items: result.map(serialize.room),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  });
}));

router.get('/featured', ah(async (req, res) => {
  const rows = await db.many(
    `${ROOM_SELECT} WHERE r.is_available AND h.is_active
     ORDER BY rv.rating_avg DESC NULLS LAST, rv.review_count DESC NULLS LAST, r.created_at DESC LIMIT 8`
  );
  res.json(rows.map(serialize.room));
}));

router.get('/filters', ah(async (req, res) => {
  const [types, amenities, range] = await Promise.all([
    db.many(`SELECT DISTINCT r.room_type FROM rooms r JOIN hotels h ON h.id = r.hotel_id
             WHERE r.is_available AND h.is_active ORDER BY 1`),
    db.many(`SELECT DISTINCT unnest(r.amenities) AS a FROM rooms r JOIN hotels h ON h.id = r.hotel_id
             WHERE r.is_available AND h.is_active ORDER BY 1`),
    db.one(`SELECT COALESCE(MIN(price_per_night), 0) AS min, COALESCE(MAX(price_per_night), 0) AS max
            FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE r.is_available AND h.is_active`),
  ]);
  res.json({
    roomTypes: types.map((t) => t.room_type),
    amenities: amenities.map((a) => a.a),
    priceRange: { min: Math.floor(range.min), max: Math.ceil(range.max) },
  });
}));

router.get('/:id', optionalAuth, ah(async (req, res) => {
  const row = await db.one(`${ROOM_SELECT} WHERE r.id = $1 AND h.is_active`, [req.params.id]);
  if (!row) throw notFound('Room not found');
  const room = serialize.room(row);

  room.isSaved = false;
  room.canReview = false;
  if (req.user) {
    const [saved, eligible] = await Promise.all([
      db.one('SELECT 1 FROM wishlists WHERE user_id = $1 AND room_id = $2', [req.user.id, row.id]),
      findReviewableBooking(req.user.id, row.id),
    ]);
    room.isSaved = Boolean(saved);
    room.canReview = Boolean(eligible);
  }
  res.json(room);
}));

router.get('/:id/similar', ah(async (req, res) => {
  const base = await db.one(
    'SELECT r.id, r.room_type, r.price_per_night, h.city FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE r.id = $1',
    [req.params.id]
  );
  if (!base) throw notFound('Room not found');
  const rows = await db.many(
    `${ROOM_SELECT} WHERE r.id <> $1 AND r.is_available AND h.is_active
     ORDER BY (lower(h.city) = lower($2)) DESC, (r.room_type = $3) DESC, abs(r.price_per_night - $4) ASC
     LIMIT 4`,
    [base.id, base.city, base.room_type, base.price_per_night]
  );
  res.json(rows.map(serialize.room));
}));

const quoteSchema = z.object({
  checkIn: isoDate,
  checkOut: isoDate,
  guests: z.coerce.number().int().min(1).max(20).default(1),
  promoCode: z.string().trim().max(40).optional(),
});

router.get('/:id/quote', validate(quoteSchema, 'query'), ah(async (req, res) => {
  res.json(await getQuote({ roomId: req.params.id, ...req.validQuery }));
}));

router.get('/:id/reviews', ah(async (req, res) => {
  const rows = await db.many(
    `SELECT rv.*, u.name AS user_name, u.avatar_url AS user_avatar
     FROM reviews rv JOIN users u ON u.id = rv.user_id
     WHERE rv.room_id = $1 ORDER BY rv.created_at DESC LIMIT 50`,
    [req.params.id]
  );
  const breakdown = await db.many(
    'SELECT rating, COUNT(*)::int AS n FROM reviews WHERE room_id = $1 GROUP BY rating',
    [req.params.id]
  );
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  breakdown.forEach((b) => { counts[b.rating] = b.n; });
  res.json({ items: rows.map(serialize.review), breakdown: counts });
}));

function findReviewableBooking(userId, roomId) {
  return db.one(
    `SELECT b.id, b.hotel_id FROM bookings b
     LEFT JOIN reviews rv ON rv.booking_id = b.id
     WHERE b.user_id = $1 AND b.room_id = $2 AND rv.id IS NULL
       AND (b.status = 'completed' OR (b.status IN ('confirmed', 'checked_in') AND b.check_out <= CURRENT_DATE))
     ORDER BY b.check_out DESC LIMIT 1`,
    [userId, roomId]
  );
}

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10, 'should be at least 10 characters').max(2000),
});

router.post('/:id/reviews', requireAuth, validate(reviewSchema), ah(async (req, res) => {
  const room = await db.one('SELECT id FROM rooms WHERE id = $1', [req.params.id]);
  if (!room) throw notFound('Room not found');
  const booking = await findReviewableBooking(req.user.id, room.id);
  if (!booking) {
    const already = await db.one('SELECT 1 FROM reviews WHERE user_id = $1 AND room_id = $2', [req.user.id, room.id]);
    if (already) throw conflict('You have already reviewed this stay');
    throw forbidden('You can leave a review after your stay');
  }
  const row = await db.one(
    `INSERT INTO reviews (booking_id, room_id, hotel_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [booking.id, room.id, booking.hotel_id, req.user.id, req.body.rating, req.body.comment]
  );
  res.status(201).json(serialize.review({ ...row, user_name: req.user.name, user_avatar: req.user.avatar_url }));
}));

module.exports = router;
