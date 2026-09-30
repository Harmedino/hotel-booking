const express = require('express');
const { Room, Hotel, Booking, Review } = require('../models');
const { validate, z, isoDate, objectId } = require('../lib/validate');
const { ah, notFound, forbidden, conflict } = require('../lib/errors');
const { optionalAuth, requireAuth } = require('../lib/auth');
const { getQuote, validateDates, fullyBookedRoomIds } = require('../lib/bookings');
const { todayIso } = require('../lib/pricing');
const serialize = require('../lib/serializers');

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const HOTEL_FIELDS = 'name city country address contact description isActive';

const SORTS = {
  recommended: { ratingAvg: -1, reviewCount: -1, createdAt: -1 },
  price_asc: { pricePerNight: 1, createdAt: -1 },
  price_desc: { pricePerNight: -1, createdAt: -1 },
  rating: { ratingAvg: -1, pricePerNight: 1 },
  newest: { createdAt: -1 },
};

async function activeHotelIds(extra = {}) {
  return (await Hotel.find({ isActive: true, ...extra }).select('_id')).map((h) => h._id);
}

const listSchema = z.object({
  destination: z.string().trim().max(100).optional(),
  checkIn: isoDate.optional(),
  checkOut: isoDate.optional(),
  guests: z.coerce.number().int().min(1).max(20).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  roomType: z.string().trim().max(60).optional(),
  amenities: z.string().max(300).optional(),
  hotelId: objectId.optional(),
  sort: z.enum(Object.keys(SORTS)).default('recommended'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

router.get('/', validate(listSchema, 'query'), ah(async (req, res) => {
  const q = req.validQuery;
  const filter = { isAvailable: true, hotel: { $in: await activeHotelIds() } };

  if (q.destination) {
    const re = new RegExp(escapeRegex(q.destination), 'i');
    const matched = await activeHotelIds({ $or: [{ city: re }, { name: re }, { country: re }] });
    filter.$or = [{ hotel: { $in: matched } }, { roomType: re }];
  }
  if (q.hotelId) filter.hotel = { $in: filter.hotel.$in.filter((id) => String(id) === q.hotelId) };
  if (q.guests) filter.maxGuests = { $gte: q.guests };
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.pricePerNight = {};
    if (q.minPrice !== undefined) filter.pricePerNight.$gte = q.minPrice;
    if (q.maxPrice !== undefined) filter.pricePerNight.$lte = q.maxPrice;
  }
  if (q.roomType) filter.roomType = new RegExp(`^${escapeRegex(q.roomType)}$`, 'i');
  if (q.amenities) {
    const list = q.amenities.split(',').map((a) => a.trim()).filter(Boolean);
    if (list.length) filter.amenities = { $all: list };
  }
  if (q.checkIn && q.checkOut) {
    validateDates(q.checkIn, q.checkOut);
    filter._id = { $nin: await fullyBookedRoomIds(q.checkIn, q.checkOut) };
  }

  const [total, rooms] = await Promise.all([
    Room.countDocuments(filter),
    Room.find(filter).sort(SORTS[q.sort]).skip((q.page - 1) * q.limit).limit(q.limit).populate('hotel', HOTEL_FIELDS),
  ]);
  res.json({
    items: rooms.map((r) => serialize.room(r)),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  });
}));

router.get('/featured', ah(async (req, res) => {
  const rooms = await Room.find({ isAvailable: true, hotel: { $in: await activeHotelIds() } })
    .sort(SORTS.recommended)
    .limit(8)
    .populate('hotel', HOTEL_FIELDS);
  res.json(rooms.map((r) => serialize.room(r)));
}));

router.get('/filters', ah(async (req, res) => {
  const match = { isAvailable: true, hotel: { $in: await activeHotelIds() } };
  const [roomTypes, amenities, range] = await Promise.all([
    Room.distinct('roomType', match),
    Room.distinct('amenities', match),
    Room.aggregate([{ $match: match }, { $group: { _id: null, min: { $min: '$pricePerNight' }, max: { $max: '$pricePerNight' } } }]),
  ]);
  res.json({
    roomTypes: roomTypes.sort(),
    amenities: amenities.sort(),
    priceRange: { min: Math.floor(range[0]?.min || 0), max: Math.ceil(range[0]?.max || 0) },
  });
}));

function findReviewableBooking(userId, roomId) {
  return Booking.findOne({
    user: userId,
    room: roomId,
    hasReview: false,
    $or: [{ status: 'completed' }, { status: { $in: ['confirmed', 'checked_in'] }, checkOut: { $lte: todayIso() } }],
  }).sort({ checkOut: -1 });
}

router.get('/:id', optionalAuth, ah(async (req, res) => {
  const room = await Room.findById(req.params.id).populate('hotel', HOTEL_FIELDS);
  if (!room || !room.hotel?.isActive) throw notFound('Room not found');
  let isSaved = false;
  let canReview = false;
  if (req.user) {
    isSaved = req.user.wishlist.some((id) => String(id) === String(room._id));
    canReview = Boolean(await findReviewableBooking(req.user._id, room._id));
  }
  res.json(serialize.room(room, { isSaved, canReview }));
}));

router.get('/:id/similar', ah(async (req, res) => {
  const base = await Room.findById(req.params.id).populate('hotel', 'city');
  if (!base) throw notFound('Room not found');
  const candidates = await Room.find({ _id: { $ne: base._id }, isAvailable: true, hotel: { $in: await activeHotelIds() } })
    .populate('hotel', HOTEL_FIELDS);
  const score = (r) => [
    r.hotel.city.toLowerCase() === base.hotel.city.toLowerCase() ? 0 : 1,
    r.roomType === base.roomType ? 0 : 1,
    Math.abs(r.pricePerNight - base.pricePerNight),
  ];
  candidates.sort((a, b) => {
    const [x, y] = [score(a), score(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  });
  res.json(candidates.slice(0, 4).map((r) => serialize.room(r)));
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
  const room = await Room.findById(req.params.id).select('_id');
  if (!room) throw notFound('Room not found');
  const [items, groups] = await Promise.all([
    Review.find({ room: room._id }).sort({ createdAt: -1 }).limit(50).populate('user', 'name avatarUrl'),
    Review.aggregate([{ $match: { room: room._id } }, { $group: { _id: '$rating', n: { $sum: 1 } } }]),
  ]);
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  groups.forEach((g) => { breakdown[g._id] = g.n; });
  res.json({ items: items.map(serialize.review), breakdown });
}));

// Keeps the denormalised rating on the room in sync with its reviews.
async function refreshRoomRating(roomId) {
  const [agg] = await Review.aggregate([{ $match: { room: roomId } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  await Room.updateOne({ _id: roomId }, { ratingAvg: agg?.avg ?? null, reviewCount: agg?.n || 0 });
}

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10, 'should be at least 10 characters').max(2000),
});

router.post('/:id/reviews', requireAuth, validate(reviewSchema), ah(async (req, res) => {
  const room = await Room.findById(req.params.id).select('_id');
  if (!room) throw notFound('Room not found');
  const booking = await findReviewableBooking(req.user._id, room._id);
  if (!booking) {
    const already = await Review.exists({ user: req.user._id, room: room._id });
    if (already) throw conflict('You have already reviewed this stay');
    throw forbidden('You can leave a review after your stay');
  }
  const review = await Review.create({
    booking: booking._id, room: room._id, hotel: booking.hotel, user: req.user._id,
    rating: req.body.rating, comment: req.body.comment,
  });
  booking.hasReview = true;
  await booking.save();
  await refreshRoomRating(room._id);
  review.user = req.user;
  res.status(201).json(serialize.review(review));
}));

module.exports = router;
module.exports.refreshRoomRating = refreshRoomRating;
