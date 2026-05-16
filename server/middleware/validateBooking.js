const Booking = require('../models/booking');

function validateBooking(req, res, next) {
  if (!Booking.validate(req.body)) {
    return res.status(400).json({ error: 'Missing required booking fields' });
  }
  next();
}

module.exports = validateBooking;
