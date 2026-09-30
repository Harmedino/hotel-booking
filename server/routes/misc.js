const express = require('express');
const db = require('../db');
const env = require('../config/env');
const payments = require('../lib/payments');
const { validate, z } = require('../lib/validate');
const { ah } = require('../lib/errors');

const router = express.Router();

router.get('/health', ah(async (req, res) => {
  await db.query('SELECT 1');
  res.json({ status: 'ok' });
}));

router.get('/config', (req, res) => {
  res.json({ stripeEnabled: payments.isEnabled(), currency: env.currency, taxRate: env.taxRate, holdMinutes: env.holdMinutes });
});

router.get('/stats', ah(async (req, res) => {
  const s = await db.one(`SELECT
    (SELECT COUNT(*) FROM hotels WHERE is_active)::int AS hotels,
    (SELECT COUNT(*) FROM rooms r JOIN hotels h ON h.id = r.hotel_id WHERE h.is_active AND r.is_available)::int AS rooms,
    (SELECT COUNT(DISTINCT lower(city)) FROM hotels WHERE is_active)::int AS cities,
    (SELECT COUNT(*) FROM bookings WHERE status <> 'cancelled')::int AS bookings,
    (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM reviews) AS avg_rating`);
  res.json({ hotels: s.hotels, rooms: s.rooms, cities: s.cities, bookings: s.bookings, avgRating: s.avg_rating });
}));

router.get('/cities', ah(async (req, res) => {
  const rows = await db.many(`
    SELECT h.city, MIN(h.country) AS country, COUNT(DISTINCT h.id)::int AS hotels, COUNT(r.id)::int AS rooms,
      MIN(r.price_per_night) AS from_price,
      (ARRAY_AGG(r.images[1] ORDER BY r.created_at) FILTER (WHERE r.images[1] IS NOT NULL))[1] AS image
    FROM hotels h JOIN rooms r ON r.hotel_id = h.id AND r.is_available
    WHERE h.is_active
    GROUP BY h.city ORDER BY COUNT(r.id) DESC, h.city LIMIT 12`);
  res.json(rows.map((r) => ({
    city: r.city, country: r.country, hotels: r.hotels, rooms: r.rooms, fromPrice: r.from_price, image: r.image,
  })));
}));

router.get('/offers', ah(async (req, res) => {
  const rows = await db.many(`SELECT * FROM promo_codes
    WHERE is_active AND (expires_at IS NULL OR expires_at >= CURRENT_DATE) ORDER BY percent_off DESC`);
  res.json(rows.map((p) => ({
    code: p.code, title: p.title, description: p.description, percentOff: p.percent_off, image: p.image, expiresAt: p.expires_at,
  })));
}));

router.post('/newsletter', validate(z.object({ email: z.string().trim().toLowerCase().email('must be a valid email') })), ah(async (req, res) => {
  await db.query('INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT DO NOTHING', [req.body.email]);
  res.status(201).json({ ok: true });
}));

module.exports = router;
