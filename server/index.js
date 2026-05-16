const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory data store (replace with DB in production)
const rooms = [
  { id: 'r1', name: 'Cozy Single Room', city: 'Paris', price: 80 },
  { id: 'r2', name: 'Deluxe Double', city: 'London', price: 150 },
  { id: 'r3', name: 'Suite with View', city: 'New York', price: 300 }
];

const bookings = [];

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Rooms
app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// Bookings
app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const { roomId, checkInDate, checkOutDate, guests, customerEmail } = req.body;
  if (!roomId || !checkInDate || !checkOutDate || !customerEmail) {
    return res.status(400).json({ error: 'Missing required booking fields' });
  }
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(400).json({ error: 'Invalid roomId' });

  const booking = {
    id: uuidv4(),
    roomId,
    roomName: room.name,
    checkInDate,
    checkOutDate,
    guests: guests || 1,
    customerEmail,
    totalPrice: room.price // naive pricing
  };
  bookings.push(booking);
  res.status(201).json(booking);
});

app.delete('/api/bookings/:id', (req, res) => {
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  const [removed] = bookings.splice(idx, 1);
  res.json(removed);
});

// Simple auth stub
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // WARNING: This is a demo stub. Replace with real auth in production.
  const token = uuidv4();
  res.json({ token, email });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
