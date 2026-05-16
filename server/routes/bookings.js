const express = require('express');
const router = express.Router();
const { bookings, rooms, uuidv4 } = require('../data/store');
const Booking = require('../models/booking');
const validateBooking = require('../middleware/validateBooking');

router.get('/', (req, res) => {
  res.json(bookings);
});

router.post('/', validateBooking, (req, res) => {
  const { roomId, checkInDate, checkOutDate, guests, customerEmail } = req.body;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(400).json({ error: 'Invalid roomId' });

  const booking = new Booking({
    id: uuidv4(),
    roomId,
    roomName: room.name,
    checkInDate,
    checkOutDate,
    guests,
    customerEmail,
    totalPrice: room.price,
  });

  bookings.push(booking);
  res.status(201).json(booking);
});

router.delete('/:id', (req, res) => {
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  const [removed] = bookings.splice(idx, 1);
  res.json(removed);
});

module.exports = router;
