const express = require('express');
const mongoose = require('mongoose');
const env = require('../config/env');
const payments = require('../lib/payments');
const { Hotel, Room, Booking, Review, PromoCode, Subscriber } = require('../models');
const { todayIso } = require('../lib/pricing');
const { validate, z } = require('../lib/validate');
const { ah } = require('../lib/errors');

const router = express.Router();

router.get('/health', (req, res) => {
  const up = mongoose.connection.readyState === 1;
  res.status(up ? 200 : 503).json({ status: up ? 'ok' : 'database unavailable' });
});

router.get('/config', (req, res) => {
  res.json({ stripeEnabled: payments.isEnabled(), currency: env.currency, taxRate: env.taxRate, holdMinutes: env.holdMinutes });
});

router.get('/stats', ah(async (req, res) => {
  const hotels = await Hotel.find({ isActive: true }).select('city');
  const [rooms, bookings, rating] = await Promise.all([
    Room.countDocuments({ isAvailable: true, hotel: { $in: hotels.map((h) => h._id) } }),
    Booking.countDocuments({ status: { $ne: 'cancelled' } }),
    Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
  ]);
  res.json({
    hotels: hotels.length,
    rooms,
    cities: new Set(hotels.map((h) => h.city.toLowerCase())).size,
    bookings,
    avgRating: rating[0] ? Math.round(rating[0].avg * 10) / 10 : 0,
  });
}));

router.get('/cities', ah(async (req, res) => {
  const hotels = await Hotel.find({ isActive: true }).select('city country');
  const rooms = await Room.find({ isAvailable: true, hotel: { $in: hotels.map((h) => h._id) } })
    .select('hotel pricePerNight images createdAt')
    .sort({ createdAt: 1 });
  const byHotel = new Map(hotels.map((h) => [String(h._id), h]));
  const cities = new Map();
  for (const r of rooms) {
    const h = byHotel.get(String(r.hotel));
    const c = cities.get(h.city) || { city: h.city, country: h.country, hotels: new Set(), rooms: 0, fromPrice: Infinity, image: null };
    c.hotels.add(String(h._id));
    c.rooms += 1;
    c.fromPrice = Math.min(c.fromPrice, r.pricePerNight);
    c.image = c.image || r.images[0] || null;
    cities.set(h.city, c);
  }
  const list = [...cities.values()]
    .map((c) => ({ ...c, hotels: c.hotels.size }))
    .sort((a, b) => b.rooms - a.rooms || a.city.localeCompare(b.city))
    .slice(0, 12);
  res.json(list);
}));

router.get('/offers', ah(async (req, res) => {
  const promos = await PromoCode.find({ isActive: true, $or: [{ expiresAt: null }, { expiresAt: { $gte: todayIso() } }] }).sort({ percentOff: -1 });
  res.json(promos.map((p) => ({
    code: p.code, title: p.title, description: p.description, percentOff: p.percentOff, image: p.image, expiresAt: p.expiresAt,
  })));
}));

router.post('/newsletter', validate(z.object({ email: z.string().trim().toLowerCase().email('must be a valid email') })), ah(async (req, res) => {
  await Subscriber.updateOne({ email: req.body.email }, { $setOnInsert: { email: req.body.email } }, { upsert: true });
  res.status(201).json({ ok: true });
}));

module.exports = router;
