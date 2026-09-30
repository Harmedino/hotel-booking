const express = require('express');
const db = require('../db');
const { validate, z, uuid } = require('../lib/validate');
const { ah, notFound, badRequest } = require('../lib/errors');
const { requireAuth, requireOwner } = require('../lib/auth');
const { cancelBooking } = require('../lib/bookings');
const serialize = require('../lib/serializers');

const router = express.Router();
router.use(requireAuth);

const hotelSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(''),
  address: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().max(80).default(''),
  contact: z.string().trim().max(60).default(''),
  coverImage: z.string().trim().max(500).nullable().optional(),
});

// Registering a first hotel turns a guest into an owner.
router.post('/hotels', validate(hotelSchema), ah(async (req, res) => {
  const h = req.body;
  const hotel = await db.tx(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO hotels (owner_id, name, description, address, city, country, contact, cover_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, h.name, h.description, h.address, h.city, h.country, h.contact, h.coverImage || null]
    );
    await client.query(`UPDATE users SET role = 'owner', updated_at = now() WHERE id = $1`, [req.user.id]);
    return rows[0];
  });
  res.status(201).json(serialize.hotel(hotel));
}));

router.use(requireOwner);

async function ownHotel(userId, hotelId) {
  const hotel = await db.one('SELECT * FROM hotels WHERE id = $1 AND owner_id = $2', [hotelId, userId]);
  if (!hotel) throw notFound('Hotel not found');
  return hotel;
}

router.get('/hotels', ah(async (req, res) => {
  const rows = await db.many(
    `SELECT h.*, (SELECT COUNT(*) FROM rooms r WHERE r.hotel_id = h.id)::int AS room_count
     FROM hotels h WHERE h.owner_id = $1 ORDER BY h.created_at`,
    [req.user.id]
  );
  res.json(rows.map(serialize.hotel));
}));

router.patch('/hotels/:id', validate(hotelSchema.partial().extend({ isActive: z.boolean().optional() })), ah(async (req, res) => {
  const hotel = await ownHotel(req.user.id, req.params.id);
  const h = { ...serialize.hotel(hotel), ...req.body };
  const row = await db.one(
    `UPDATE hotels SET name=$2, description=$3, address=$4, city=$5, country=$6, contact=$7, cover_image=$8,
       is_active=$9, updated_at=now() WHERE id=$1 RETURNING *`,
    [hotel.id, h.name, h.description, h.address, h.city, h.country, h.contact, h.coverImage || null, h.isActive]
  );
  res.json(serialize.hotel(row));
}));

router.delete('/hotels/:id', ah(async (req, res) => {
  const hotel = await ownHotel(req.user.id, req.params.id);
  const active = await db.one(
    `SELECT COUNT(*)::int AS n FROM bookings WHERE hotel_id = $1 AND status IN ('confirmed','checked_in','pending') AND check_out >= CURRENT_DATE`,
    [hotel.id]
  );
  if (active.n) throw badRequest(`This hotel has ${active.n} upcoming booking(s). Deactivate it instead.`);
  await db.query('DELETE FROM hotels WHERE id = $1', [hotel.id]);
  res.json({ ok: true });
}));

const roomSchema = z.object({
  hotelId: uuid,
  roomType: z.string().trim().min(2).max(60),
  description: z.string().trim().max(2000).default(''),
  pricePerNight: z.number().positive().max(100000),
  maxGuests: z.number().int().min(1).max(20).default(2),
  totalUnits: z.number().int().min(1).max(500).default(1),
  amenities: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  images: z.array(z.string().trim().min(1).max(500)).min(1, 'add at least one photo').max(8),
  isAvailable: z.boolean().default(true),
});

const OWNER_ROOM_SELECT = `SELECT r.*, h.name AS hotel_name, h.city AS hotel_city, h.country AS hotel_country,
  h.address AS hotel_address, h.contact AS hotel_contact, h.description AS hotel_description,
  (SELECT AVG(rating)::float FROM reviews WHERE room_id = r.id) AS rating_avg,
  (SELECT COUNT(*)::int FROM reviews WHERE room_id = r.id) AS review_count
  FROM rooms r JOIN hotels h ON h.id = r.hotel_id`;

router.get('/rooms', ah(async (req, res) => {
  const rows = await db.many(`${OWNER_ROOM_SELECT} WHERE h.owner_id = $1 ORDER BY r.created_at DESC`, [req.user.id]);
  res.json(rows.map(serialize.room));
}));

router.post('/rooms', validate(roomSchema), ah(async (req, res) => {
  const r = req.body;
  await ownHotel(req.user.id, r.hotelId);
  const row = await db.one(
    `INSERT INTO rooms (hotel_id, room_type, description, price_per_night, max_guests, total_units, amenities, images, is_available)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [r.hotelId, r.roomType, r.description, r.pricePerNight, r.maxGuests, r.totalUnits, r.amenities, r.images, r.isAvailable]
  );
  res.status(201).json(serialize.room(await db.one(`${OWNER_ROOM_SELECT} WHERE r.id = $1`, [row.id])));
}));

async function ownRoom(userId, roomId) {
  const room = await db.one(
    'SELECT r.* FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE r.id = $1 AND h.owner_id = $2',
    [roomId, userId]
  );
  if (!room) throw notFound('Room not found');
  return room;
}

router.patch('/rooms/:id', validate(roomSchema.partial()), ah(async (req, res) => {
  const room = await ownRoom(req.user.id, req.params.id);
  if (req.body.hotelId) await ownHotel(req.user.id, req.body.hotelId);
  const cur = serialize.room(room);
  const r = { ...cur, ...req.body };
  await db.query(
    `UPDATE rooms SET hotel_id=$2, room_type=$3, description=$4, price_per_night=$5, max_guests=$6, total_units=$7,
       amenities=$8, images=$9, is_available=$10, updated_at=now() WHERE id=$1`,
    [room.id, r.hotelId, r.roomType, r.description, r.pricePerNight, r.maxGuests, r.totalUnits, r.amenities, r.images, r.isAvailable]
  );
  res.json(serialize.room(await db.one(`${OWNER_ROOM_SELECT} WHERE r.id = $1`, [room.id])));
}));

router.delete('/rooms/:id', ah(async (req, res) => {
  const room = await ownRoom(req.user.id, req.params.id);
  const active = await db.one(
    `SELECT COUNT(*)::int AS n FROM bookings WHERE room_id = $1 AND status IN ('confirmed','checked_in','pending') AND check_out >= CURRENT_DATE`,
    [room.id]
  );
  if (active.n) throw badRequest(`This room has ${active.n} upcoming booking(s). Pause it instead.`);
  await db.query('DELETE FROM rooms WHERE id = $1', [room.id]);
  res.json({ ok: true });
}));

const OWNER_BOOKING_SELECT = `SELECT b.*, r.room_type, r.images AS room_images, h.name AS hotel_name,
  h.city AS hotel_city, h.address AS hotel_address, h.contact AS hotel_contact
  FROM bookings b JOIN rooms r ON r.id = b.room_id JOIN hotels h ON h.id = b.hotel_id`;

const bookingListSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'checked_in', 'completed', 'cancelled']).optional(),
  hotelId: uuid.optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/bookings', validate(bookingListSchema, 'query'), ah(async (req, res) => {
  const q = req.validQuery;
  const params = [req.user.id];
  const where = ['h.owner_id = $1'];
  const add = (v) => { params.push(v); return `$${params.length}`; };
  if (q.status) where.push(`b.status = ${add(q.status)}`);
  if (q.hotelId) where.push(`b.hotel_id = ${add(q.hotelId)}`);
  if (q.q) {
    const p = add(`%${q.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    where.push(`(b.reference ILIKE ${p} OR b.guest_name ILIKE ${p} OR b.guest_email ILIKE ${p})`);
  }
  const rows = await db.many(
    `SELECT *, COUNT(*) OVER() AS total_count FROM (${OWNER_BOOKING_SELECT} WHERE ${where.join(' AND ')}
     ORDER BY b.created_at DESC) t LIMIT ${add(q.limit)} OFFSET ${add((q.page - 1) * q.limit)}`,
    params
  );
  const total = rows[0]?.total_count || 0;
  res.json({ items: rows.map(serialize.booking), total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
}));

// Allowed status moves for hotel staff.
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'completed'],
  checked_in: ['completed'],
  completed: [],
  cancelled: [],
};

router.patch(
  '/bookings/:id',
  validate(z.object({
    status: z.enum(['confirmed', 'checked_in', 'completed', 'cancelled']).optional(),
    isPaid: z.boolean().optional(),
  })),
  ah(async (req, res) => {
    const b = await db.one(`${OWNER_BOOKING_SELECT} WHERE b.id = $1 AND h.owner_id = $2`, [req.params.id, req.user.id]);
    if (!b) throw notFound('Booking not found');
    let row = b;
    const { status, isPaid } = req.body;
    if (status && status !== b.status) {
      if (!TRANSITIONS[b.status].includes(status)) {
        throw badRequest(`Cannot move a ${b.status.replace('_', ' ')} booking to ${status.replace('_', ' ')}`);
      }
      row = status === 'cancelled'
        ? await cancelBooking(b)
        : await db.one('UPDATE bookings SET status = $2, updated_at = now() WHERE id = $1 RETURNING *', [b.id, status]);
    }
    if (isPaid !== undefined && isPaid !== row.is_paid) {
      if (b.payment_method === 'stripe') throw badRequest('Online payments are updated automatically');
      row = await db.one('UPDATE bookings SET is_paid = $2, updated_at = now() WHERE id = $1 RETURNING *', [b.id, isPaid]);
    }
    res.json(serialize.booking({ ...b, ...row }));
  })
);

router.get('/stats', validate(z.object({ days: z.coerce.number().int().refine((d) => [7, 30, 90, 365].includes(d)).default(30) }), 'query'), ah(async (req, res) => {
  const days = req.validQuery.days;
  const uid = req.user.id;

  // KPIs for the current window and the one before it, for trend deltas.
  const kpiSql = (offset) => `
    WITH win AS (SELECT CURRENT_DATE - ${days + offset} AS s, CURRENT_DATE - ${offset} AS e),
    bk AS (SELECT b.* FROM bookings b JOIN hotels h ON h.id = b.hotel_id, win
           WHERE h.owner_id = $1 AND b.created_at::date >= win.s AND b.created_at::date < win.e)
    SELECT
      (SELECT COUNT(*) FROM bk WHERE status <> 'cancelled')::int AS bookings,
      (SELECT COUNT(*) FROM bk WHERE status = 'cancelled')::int AS cancellations,
      (SELECT COALESCE(SUM(total_price), 0) FROM bk WHERE status <> 'cancelled') AS revenue,
      (SELECT COALESCE(SUM(total_price), 0) FROM bk WHERE status <> 'cancelled' AND is_paid) AS collected,
      (SELECT COALESCE(SUM(subtotal) / NULLIF(SUM(nights), 0), 0) FROM bk WHERE status <> 'cancelled') AS adr,
      (SELECT COALESCE(SUM(GREATEST(0, LEAST(b.check_out, win.e) - GREATEST(b.check_in, win.s))), 0)
         FROM bookings b JOIN hotels h ON h.id = b.hotel_id
         WHERE h.owner_id = $1 AND b.status IN ('confirmed','checked_in','completed')) AS room_nights,
      (SELECT COALESCE(SUM(r.total_units), 0) FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE h.owner_id = $1) AS units
    FROM win`;

  const [cur, prev, series, topRooms, upcoming, recent, totals] = await Promise.all([
    db.one(kpiSql(0), [uid]),
    db.one(kpiSql(days), [uid]),
    db.many(
      `SELECT d::date AS day,
         COALESCE(SUM(b.total_price) FILTER (WHERE b.status <> 'cancelled'), 0) AS revenue,
         COUNT(b.id) FILTER (WHERE b.status <> 'cancelled')::int AS bookings
       FROM generate_series(CURRENT_DATE - ${days - 1}, CURRENT_DATE, interval '1 day') d
       LEFT JOIN (SELECT b.* FROM bookings b JOIN hotels h ON h.id = b.hotel_id WHERE h.owner_id = $1) b
         ON b.created_at::date = d::date
       GROUP BY d ORDER BY d`,
      [uid]
    ),
    db.many(
      `SELECT r.id, r.room_type, r.images[1] AS image, h.name AS hotel_name,
         COUNT(b.id)::int AS bookings, COALESCE(SUM(b.total_price), 0) AS revenue
       FROM rooms r JOIN hotels h ON h.id = r.hotel_id
       LEFT JOIN bookings b ON b.room_id = r.id AND b.status <> 'cancelled' AND b.created_at >= CURRENT_DATE - ${days}
       WHERE h.owner_id = $1 GROUP BY r.id, h.name ORDER BY revenue DESC LIMIT 5`,
      [uid]
    ),
    db.many(`${OWNER_BOOKING_SELECT} WHERE h.owner_id = $1 AND b.status IN ('confirmed','pending')
       AND b.check_in BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 ORDER BY b.check_in LIMIT 8`, [uid]),
    db.many(`${OWNER_BOOKING_SELECT} WHERE h.owner_id = $1 ORDER BY b.created_at DESC LIMIT 6`, [uid]),
    db.one(`SELECT (SELECT COUNT(*) FROM hotels WHERE owner_id = $1)::int AS hotels,
       (SELECT COUNT(*) FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE h.owner_id = $1)::int AS rooms,
       (SELECT ROUND(AVG(rv.rating)::numeric, 1) FROM reviews rv JOIN hotels h ON h.id = rv.hotel_id WHERE h.owner_id = $1) AS rating`, [uid]),
  ]);

  const shape = (k) => ({
    bookings: k.bookings,
    cancellations: k.cancellations,
    revenue: k.revenue,
    collected: k.collected,
    adr: Math.round(k.adr * 100) / 100,
    occupancy: k.units ? Math.round((k.room_nights / (k.units * days)) * 1000) / 10 : 0,
  });

  res.json({
    days,
    current: shape(cur),
    previous: shape(prev),
    series: series.map((s) => ({ day: s.day instanceof Date ? s.day.toISOString().slice(0, 10) : s.day, revenue: s.revenue, bookings: s.bookings })),
    topRooms: topRooms.map((r) => ({ id: r.id, roomType: r.room_type, image: r.image, hotelName: r.hotel_name, bookings: r.bookings, revenue: r.revenue })),
    upcoming: upcoming.map(serialize.booking),
    recent: recent.map(serialize.booking),
    totals,
  });
}));

module.exports = router;
