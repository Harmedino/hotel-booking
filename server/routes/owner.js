const express = require('express');
const { User, Hotel, Room, RoomBlock, Booking, Review } = require('../models');
const { validate, z, objectId, isoDate } = require('../lib/validate');
const { ah, notFound, badRequest, conflict } = require('../lib/errors');
const { requireAuth, requireOwner } = require('../lib/auth');
const { cancelBooking, usedByNight, peakUsed, activeFilter } = require('../lib/bookings');
const { todayIso, addDays: addDaysIso, nightsBetween, rateFor } = require('../lib/pricing');
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
  const hotel = await Hotel.create({ ...req.body, owner: req.user._id });
  if (req.user.role !== 'owner') await User.updateOne({ _id: req.user._id }, { role: 'owner' });
  res.status(201).json(serialize.hotel(hotel));
}));

router.use(requireOwner);

async function ownHotel(userId, hotelId) {
  const hotel = await Hotel.findOne({ _id: hotelId, owner: userId });
  if (!hotel) throw notFound('Hotel not found');
  return hotel;
}

const ownHotelIds = async (userId) => (await Hotel.find({ owner: userId }).select('_id')).map((h) => h._id);

const UPCOMING = { status: { $in: ['pending', 'confirmed', 'checked_in'] } };

router.get('/hotels', ah(async (req, res) => {
  const hotels = await Hotel.find({ owner: req.user._id }).sort({ createdAt: 1 });
  const counts = await Room.aggregate([{ $match: { hotel: { $in: hotels.map((h) => h._id) } } }, { $group: { _id: '$hotel', n: { $sum: 1 } } }]);
  const byHotel = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json(hotels.map((h) => serialize.hotel(h, { roomCount: byHotel.get(String(h._id)) || 0 })));
}));

router.patch('/hotels/:id', validate(hotelSchema.partial().extend({ isActive: z.boolean().optional() })), ah(async (req, res) => {
  const hotel = await ownHotel(req.user._id, req.params.id);
  Object.assign(hotel, req.body);
  await hotel.save();
  res.json(serialize.hotel(hotel));
}));

router.delete('/hotels/:id', ah(async (req, res) => {
  const hotel = await ownHotel(req.user._id, req.params.id);
  const active = await Booking.countDocuments({ hotel: hotel._id, ...UPCOMING, checkOut: { $gte: todayIso() } });
  if (active) throw badRequest(`This hotel has ${active} upcoming booking(s). Deactivate it instead.`);
  const roomIds = (await Room.find({ hotel: hotel._id }).select('_id')).map((r) => r._id);
  await Promise.all([
    Booking.deleteMany({ hotel: hotel._id }),
    Review.deleteMany({ hotel: hotel._id }),
    RoomBlock.deleteMany({ hotel: hotel._id }),
    Room.deleteMany({ hotel: hotel._id }),
    User.updateMany({}, { $pull: { wishlist: { $in: roomIds } } }),
  ]);
  await hotel.deleteOne();
  res.json({ ok: true });
}));

const roomSchema = z.object({
  hotelId: objectId,
  roomType: z.string().trim().min(2).max(60),
  description: z.string().trim().max(2000).default(''),
  pricePerNight: z.number().positive().max(100000),
  maxGuests: z.number().int().min(1).max(20).default(2),
  totalUnits: z.number().int().min(1).max(500).default(1),
  amenities: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  images: z.array(z.string().trim().min(1).max(500)).min(1, 'add at least one photo').max(8),
  isAvailable: z.boolean().default(true),
  // null clears it.
  weekendPrice: z.number().positive().max(100000).nullable().optional(),
  seasonalRates: z
    .array(
      z
        .object({ name: z.string().trim().min(2).max(40), start: isoDate, end: isoDate, price: z.number().positive().max(100000) })
        .refine((r) => r.start <= r.end, { message: 'must end on or after its start date', path: ['end'] })
    )
    .max(12)
    .optional(),
});

const HOTEL_FIELDS = 'name city country address contact description';

router.get('/rooms', ah(async (req, res) => {
  const rooms = await Room.find({ hotel: { $in: await ownHotelIds(req.user._id) } }).sort({ createdAt: -1 }).populate('hotel', HOTEL_FIELDS);
  res.json(rooms.map((r) => serialize.room(r)));
}));

router.post('/rooms', validate(roomSchema), ah(async (req, res) => {
  const { hotelId, ...data } = req.body;
  await ownHotel(req.user._id, hotelId);
  const room = await Room.create({ ...data, hotel: hotelId });
  await room.populate('hotel', HOTEL_FIELDS);
  res.status(201).json(serialize.room(room));
}));

async function ownRoom(userId, roomId) {
  const room = await Room.findById(roomId);
  if (!room || !(await Hotel.exists({ _id: room.hotel, owner: userId }))) throw notFound('Room not found');
  return room;
}

router.patch('/rooms/:id', validate(roomSchema.partial()), ah(async (req, res) => {
  const room = await ownRoom(req.user._id, req.params.id);
  const { hotelId, ...data } = req.body;
  if (hotelId) {
    await ownHotel(req.user._id, hotelId);
    room.hotel = hotelId;
  }
  Object.assign(room, data);
  await room.save();
  await room.populate('hotel', HOTEL_FIELDS);
  res.json(serialize.room(room));
}));

router.delete('/rooms/:id', ah(async (req, res) => {
  const room = await ownRoom(req.user._id, req.params.id);
  const active = await Booking.countDocuments({ room: room._id, ...UPCOMING, checkOut: { $gte: todayIso() } });
  if (active) throw badRequest(`This room has ${active} upcoming booking(s). Pause it instead.`);
  await Promise.all([
    Booking.deleteMany({ room: room._id }),
    Review.deleteMany({ room: room._id }),
    RoomBlock.deleteMany({ room: room._id }),
    User.updateMany({ wishlist: room._id }, { $pull: { wishlist: room._id } }),
  ]);
  await room.deleteOne();
  res.json({ ok: true });
}));

const withDetails = (q) => q.populate('room', 'roomType images').populate('hotel', 'name city address contact');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const bookingListSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'checked_in', 'completed', 'cancelled']).optional(),
  hotelId: objectId.optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/bookings', validate(bookingListSchema, 'query'), ah(async (req, res) => {
  const q = req.validQuery;
  const hotelIds = await ownHotelIds(req.user._id);
  const filter = { hotel: { $in: q.hotelId ? hotelIds.filter((id) => String(id) === q.hotelId) : hotelIds } };
  if (q.status) filter.status = q.status;
  if (q.q) {
    const re = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ reference: re }, { guestName: re }, { guestEmail: re }];
  }
  const [total, items] = await Promise.all([
    Booking.countDocuments(filter),
    withDetails(Booking.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit)),
  ]);
  res.json({ items: items.map(serialize.booking), total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
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
    const b = await withDetails(Booking.findOne({ _id: req.params.id, hotel: { $in: await ownHotelIds(req.user._id) } }));
    if (!b) throw notFound('Booking not found');
    const { status, isPaid } = req.body;
    if (status && status !== b.status) {
      if (!TRANSITIONS[b.status].includes(status)) {
        throw badRequest(`Cannot move a ${b.status.replace('_', ' ')} booking to ${status.replace('_', ' ')}`);
      }
      if (status === 'cancelled') await cancelBooking(b);
      else {
        b.status = status;
        await b.save();
      }
    }
    if (isPaid !== undefined && isPaid !== b.isPaid) {
      if (b.paymentMethod === 'stripe') throw badRequest('Online payments are updated automatically');
      b.isPaid = isPaid;
      await b.save();
    }
    res.json(serialize.booking(b));
  })
);

const DAY = 86400000;
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const dayOf = (d) => new Date(d).toISOString().slice(0, 10);
const nightsOverlap = (b, s, e) => {
  const from = b.checkIn > s ? b.checkIn : s;
  const to = b.checkOut < e ? b.checkOut : e;
  return to > from ? Math.round((Date.parse(to) - Date.parse(from)) / DAY) : 0;
};
const round2 = (n) => Math.round(n * 100) / 100;

router.get('/stats', validate(z.object({ days: z.coerce.number().int().refine((d) => [7, 30, 90, 365].includes(d)).default(30) }), 'query'), ah(async (req, res) => {
  const days = req.validQuery.days;
  const today = todayIso();
  const hotelIds = await ownHotelIds(req.user._id);
  const [rooms, bookings, rating] = await Promise.all([
    Room.find({ hotel: { $in: hotelIds } }).populate('hotel', 'name'),
    Booking.find({ hotel: { $in: hotelIds } }).select('-specialRequests').lean(),
    Review.aggregate([{ $match: { hotel: { $in: hotelIds } } }, { $group: { _id: null, avg: { $avg: '$rating' } } }]),
  ]);
  const units = rooms.reduce((sum, r) => sum + r.totalUnits, 0);

  // Windows include today: [start, end) as calendar days.
  const kpis = (start, end) => {
    const made = bookings.filter((b) => dayOf(b.createdAt) >= start && dayOf(b.createdAt) < end);
    const live = made.filter((b) => b.status !== 'cancelled');
    const nights = live.reduce((s, b) => s + b.nights, 0);
    const roomNights = bookings
      .filter((b) => ['confirmed', 'checked_in', 'completed'].includes(b.status))
      .reduce((s, b) => s + nightsOverlap(b, start, end), 0);
    return {
      bookings: live.length,
      cancellations: made.length - live.length,
      revenue: round2(live.reduce((s, b) => s + b.totalPrice, 0)),
      collected: round2(live.filter((b) => b.isPaid).reduce((s, b) => s + b.totalPrice, 0)),
      adr: nights ? round2(live.reduce((s, b) => s + b.subtotal, 0) / nights) : 0,
      occupancy: units ? Math.round((roomNights / (units * days)) * 1000) / 10 : 0,
    };
  };
  const end = addDays(today, 1);
  const start = addDays(end, -days);

  const series = Array.from({ length: days }, (_, i) => ({ day: addDays(start, i), revenue: 0, bookings: 0 }));
  const seriesIdx = new Map(series.map((s, i) => [s.day, i]));
  const byRoom = new Map();
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const i = seriesIdx.get(dayOf(b.createdAt));
    if (i === undefined) continue;
    series[i].revenue = round2(series[i].revenue + b.totalPrice);
    series[i].bookings += 1;
    const r = byRoom.get(String(b.room)) || { bookings: 0, revenue: 0 };
    r.bookings += 1;
    r.revenue += b.totalPrice;
    byRoom.set(String(b.room), r);
  }

  const topRooms = rooms
    .map((r) => ({ id: String(r._id), roomType: r.roomType, image: r.images[0] || null, hotelName: r.hotel.name, ...(byRoom.get(String(r._id)) || { bookings: 0, revenue: 0 }) }))
    .map((r) => ({ ...r, revenue: round2(r.revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const [upcoming, recent] = await Promise.all([
    withDetails(Booking.find({ hotel: { $in: hotelIds }, status: { $in: ['confirmed', 'pending'] }, checkIn: { $gte: today, $lte: addDays(today, 7) } }).sort({ checkIn: 1 }).limit(8)),
    withDetails(Booking.find({ hotel: { $in: hotelIds } }).sort({ createdAt: -1 }).limit(6)),
  ]);

  res.json({
    days,
    current: kpis(start, end),
    previous: kpis(addDays(start, -days), start),
    series,
    topRooms,
    upcoming: upcoming.map(serialize.booking),
    recent: recent.map(serialize.booking),
    totals: { hotels: hotelIds.length, rooms: rooms.length, rating: rating[0] ? Math.round(rating[0].avg * 10) / 10 : null },
  });
}));

// ---- Occupancy calendar and blocked dates ----

const calendarSchema = z.object({ from: isoDate.optional(), days: z.coerce.number().int().min(1).max(31).default(14) });

// Every room × night: units in use, and who is staying.
router.get('/calendar', validate(calendarSchema, 'query'), ah(async (req, res) => {
  const from = req.validQuery.from || todayIso();
  const to = addDaysIso(from, req.validQuery.days);
  const hotelIds = await ownHotelIds(req.user._id);
  const rooms = await Room.find({ hotel: { $in: hotelIds } }).populate('hotel', 'name').sort({ hotel: 1, pricePerNight: 1 });
  const roomIds = rooms.map((r) => r._id);
  const [used, bookings, blocks] = await Promise.all([
    usedByNight(roomIds, from, to),
    Booking.find({ room: { $in: roomIds }, ...activeFilter(), checkIn: { $lt: to }, checkOut: { $gt: from } })
      .select('reference room guestName guests checkIn checkOut status isPaid')
      .sort({ checkIn: 1 })
      .lean(),
    RoomBlock.find({ room: { $in: roomIds }, start: { $lt: to }, end: { $gt: from } }).sort({ start: 1 }).lean(),
  ]);
  const dates = [];
  for (let d = from; d < to; d = addDaysIso(d, 1)) dates.push(d);

  res.json({
    from,
    to,
    dates,
    rooms: rooms.map((r) => {
      const nights = used.get(String(r._id));
      return {
        id: String(r._id),
        roomType: r.roomType,
        hotelName: r.hotel?.name || '',
        totalUnits: r.totalUnits,
        isAvailable: r.isAvailable,
        nights: dates.map((d) => ({ date: d, used: Math.min(nights?.get(d) || 0, r.totalUnits), price: rateFor(r, d).price })),
        bookings: bookings
          .filter((b) => String(b.room) === String(r._id))
          .map((b) => ({ id: String(b._id), reference: b.reference, guestName: b.guestName, guests: b.guests, checkIn: b.checkIn, checkOut: b.checkOut, status: b.status, isPaid: b.isPaid })),
        blocks: blocks
          .filter((b) => String(b.room) === String(r._id))
          .map((b) => ({ id: String(b._id), start: b.start, end: b.end, units: b.units, note: b.note })),
      };
    }),
  });
}));

const blockSchema = z
  .object({
    roomId: objectId,
    start: isoDate,
    end: isoDate,
    units: z.number().int().min(1).max(500).optional(),
    note: z.string().trim().max(120).default(''),
  })
  .refine((b) => b.end > b.start, { message: 'must be after the first night', path: ['end'] });

// Take units out of sale. Can't block what guests have already booked.
router.post('/blocks', validate(blockSchema), ah(async (req, res) => {
  const { roomId, start, end, note } = req.body;
  if (start < todayIso()) throw badRequest('You can only block today or later');
  if (nightsBetween(start, end) > 180) throw badRequest('Block at most 180 nights at a time');
  const room = await ownRoom(req.user._id, roomId);
  const units = Math.min(req.body.units || room.totalUnits, room.totalUnits);
  const free = room.totalUnits - peakUsed((await usedByNight([room._id], start, end)).get(String(room._id)));
  if (units > free) {
    throw conflict(
      free > 0
        ? `Guests are booked on some of those nights. You can block at most ${free} of ${room.totalUnits} then.`
        : 'Every unit is already booked or blocked on some of those nights.'
    );
  }
  const block = await RoomBlock.create({ room: room._id, hotel: room.hotel, start, end, units, note });
  res.status(201).json({ id: String(block._id), roomId, start, end, units, note });
}));

router.delete('/blocks/:id', ah(async (req, res) => {
  const block = await RoomBlock.findOne({ _id: req.params.id, hotel: { $in: await ownHotelIds(req.user._id) } });
  if (!block) throw notFound('Blocked dates not found');
  await block.deleteOne();
  res.json({ ok: true });
}));

module.exports = router;
