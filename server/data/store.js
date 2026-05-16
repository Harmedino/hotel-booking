// In-memory store for development
const { v4: uuidv4 } = require('uuid');

const rooms = [
  { id: 'r1', name: 'Cozy Single Room', city: 'Paris', price: 80 },
  { id: 'r2', name: 'Deluxe Double', city: 'London', price: 150 },
  { id: 'r3', name: 'Suite with View', city: 'New York', price: 300 }
];

const bookings = [];

module.exports = { rooms, bookings, uuidv4 };
