const { Schema, model } = require('mongoose');

const opts = { timestamps: true };

const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['guest', 'owner'], default: 'guest' },
  avatarUrl: String,
  phone: { type: String, default: '' },
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
  resetTokenHash: { type: String, index: true },
  resetTokenExpires: Date,
}, opts));

const Hotel = model('Hotel', new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  address: { type: String, required: true },
  city: { type: String, required: true, trim: true },
  country: { type: String, default: '' },
  contact: { type: String, default: '' },
  coverImage: String,
  isActive: { type: Boolean, default: true },
}, opts));

const Room = model('Room', new Schema({
  hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomType: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  pricePerNight: { type: Number, required: true, min: 0.01 },
  // Friday and Saturday nights; empty = the normal price.
  weekendPrice: { type: Number, min: 0.01, default: null },
  // Inclusive 'YYYY-MM-DD' ranges, e.g. the festive season. Beats the weekend price.
  seasonalRates: {
    type: [{ _id: false, name: { type: String, required: true }, start: { type: String, required: true }, end: { type: String, required: true }, price: { type: Number, required: true, min: 0.01 } }],
    default: [],
  },
  maxGuests: { type: Number, default: 2, min: 1 },
  totalUnits: { type: Number, default: 1, min: 1 },
  amenities: { type: [String], default: [] },
  images: { type: [String], default: [] },
  isAvailable: { type: Boolean, default: true },
  // Denormalised from reviews so search can sort by rating cheaply.
  ratingAvg: { type: Number, default: null },
  reviewCount: { type: Number, default: 0 },
  // Bumped inside booking transactions so concurrent bookings of the same room conflict.
  bookingLock: { type: Number, default: 0 },
}, opts));

const bookingSchema = new Schema({
  reference: { type: String, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  // Plain 'YYYY-MM-DD' strings: no timezone shifts, and they compare correctly as strings.
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  guests: { type: Number, required: true, min: 1 },
  nights: { type: Number, required: true, min: 1 },
  pricePerNight: { type: Number, required: true },
  // How the subtotal was made up when rates varied (weekend, season).
  priceLines: { type: [{ _id: false, label: String, price: Number, nights: Number }], default: undefined },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  promoCode: String,
  status: { type: String, enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, enum: ['pay_at_hotel', 'stripe'], required: true },
  isPaid: { type: Boolean, default: false },
  isRefunded: { type: Boolean, default: false },
  stripeSessionId: String,
  stripePaymentIntent: String,
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestPhone: { type: String, default: '' },
  specialRequests: { type: String, default: '' },
  hasReview: { type: Boolean, default: false },
  cancelledAt: Date,
}, opts);
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ stripeSessionId: 1 }, { unique: true, partialFilterExpression: { stripeSessionId: { $type: 'string' } } });
const Booking = model('Booking', bookingSchema);

// Units taken out of sale (maintenance, owner use) for [start, end), like a stay.
const roomBlockSchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  units: { type: Number, required: true, min: 1 },
  note: { type: String, default: '' },
}, opts);
roomBlockSchema.index({ room: 1, start: 1, end: 1 });
const RoomBlock = model('RoomBlock', roomBlockSchema);

const Review = model('Review', new Schema({
  booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, opts));

const PromoCode = model('PromoCode', new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  percentOff: { type: Number, required: true, min: 1, max: 90 },
  image: String,
  expiresAt: String,
  isActive: { type: Boolean, default: true },
}));

const Image = model('Image', new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  mime: { type: String, required: true },
  data: { type: Buffer, required: true },
}, opts));

const Subscriber = model('Subscriber', new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, opts));

module.exports = { User, Hotel, Room, RoomBlock, Booking, Review, PromoCode, Image, Subscriber };
