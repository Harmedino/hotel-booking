const express = require('express');
const router = express.Router();
const { rooms } = require('../data/store');

router.get('/', (req, res) => {
  res.json(rooms);
});

router.get('/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

module.exports = router;
