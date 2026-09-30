const express = require('express');
const db = require('../db');
const { ah, notFound } = require('../lib/errors');
const { requireAuth } = require('../lib/auth');
const serialize = require('../lib/serializers');

const router = express.Router();
router.use(requireAuth);

router.get('/', ah(async (req, res) => {
  const rows = await db.many(
    `SELECT r.*, h.name AS hotel_name, h.city AS hotel_city, h.country AS hotel_country,
       h.address AS hotel_address, h.contact AS hotel_contact, h.description AS hotel_description,
       rv.rating_avg, COALESCE(rv.review_count, 0) AS review_count
     FROM wishlists w
     JOIN rooms r ON r.id = w.room_id
     JOIN hotels h ON h.id = r.hotel_id
     LEFT JOIN (SELECT room_id, AVG(rating)::float AS rating_avg, COUNT(*)::int AS review_count
                FROM reviews GROUP BY room_id) rv ON rv.room_id = r.id
     WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json(rows.map(serialize.room));
}));

router.get('/ids', ah(async (req, res) => {
  const rows = await db.many('SELECT room_id FROM wishlists WHERE user_id = $1', [req.user.id]);
  res.json(rows.map((r) => r.room_id));
}));

router.put('/:roomId', ah(async (req, res) => {
  const room = await db.one('SELECT id FROM rooms WHERE id = $1', [req.params.roomId]);
  if (!room) throw notFound('Room not found');
  await db.query('INSERT INTO wishlists (user_id, room_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
    req.user.id,
    room.id,
  ]);
  res.json({ saved: true });
}));

router.delete('/:roomId', ah(async (req, res) => {
  await db.query('DELETE FROM wishlists WHERE user_id = $1 AND room_id = $2', [req.user.id, req.params.roomId]);
  res.json({ saved: false });
}));

module.exports = router;
