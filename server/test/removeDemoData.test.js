process.env.NODE_ENV = 'test';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connect, disconnect } = require('../db/connect');
const { removeDemoData } = require('../db/removeDemoData');
const { User, Hotel, Room, RoomBlock, Booking, Review, PromoCode } = require('../models');

let n = 0;
const user = (email, role) => User.create({ name: email, email, passwordHash: 'x', role });
const hotel = (owner, name) => Hotel.create({ owner: owner._id, name, address: '1 Road', city: 'Lagos' });
const room = (h) => Room.create({ hotel: h._id, roomType: 'Double Bed', pricePerNight: 100, totalUnits: 2, images: ['/x.png'] });
const booking = (u, r) =>
  Booking.create({
    reference: `T-${(n += 1)}`, user: u._id, room: r._id, hotel: r.hotel, checkIn: '2030-01-01', checkOut: '2030-01-02', guests: 1, nights: 1,
    pricePerNight: 100, subtotal: 100, taxes: 0, totalPrice: 100, paymentMethod: 'pay_at_hotel', guestName: 'G', guestEmail: u.email,
  });
const review = async (u, r, rating) => Review.create({ booking: (await booking(u, r))._id, room: r._id, hotel: r.hotel, user: u._id, rating, comment: 'ok' });

before(async () => {
  await connect();
  await mongoose.connection.dropDatabase();
  await connect();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
});

after(() => disconnect());

test('removes the demo accounts, their hotels and the sample promos, and nothing else', async () => {
  // What older versions seeded.
  const demoOwner = await user('owner@quickstay.app', 'owner');
  const demoGuest = await user('guest@quickstay.app');
  const demoHotel = await hotel(demoOwner, 'Urbanza Suites');
  const demoRoom = await room(demoHotel);
  await RoomBlock.create({ room: demoRoom._id, hotel: demoHotel._id, start: '2030-01-01', end: '2030-01-02', units: 1 });
  await review(demoGuest, demoRoom, 5);
  await PromoCode.create({ code: 'SUMMER25', title: 'Summer Escape Package', percentOff: 25 });

  // A real owner's hotel, which a real guest and the demo guest both stayed at.
  const realOwner = await user('ada@hotel.ng', 'owner');
  const realGuest = await user('bola@mail.ng');
  const realHotel = await hotel(realOwner, 'Real Hotel');
  const realRoom = await room(realHotel);
  await review(realGuest, realRoom, 4);
  await review(demoGuest, realRoom, 1);
  await Room.updateOne({ _id: realRoom._id }, { ratingAvg: 2.5, reviewCount: 2 });
  await User.updateOne({ _id: realGuest._id }, { wishlist: [demoRoom._id, realRoom._id] });
  await PromoCode.create({ code: 'LAGOS10', title: 'Our own promo', percentOff: 10 });

  await removeDemoData();

  assert.equal(await User.countDocuments({ email: /quickstay\.app$/ }), 0);
  assert.deepEqual((await Hotel.find()).map((h) => h.name), ['Real Hotel']);
  assert.equal(await Room.countDocuments({ hotel: demoHotel._id }), 0);
  assert.equal(await RoomBlock.countDocuments(), 0);
  assert.equal(await Booking.countDocuments({ user: demoGuest._id }), 0);
  assert.equal(await Booking.countDocuments({ hotel: realHotel._id }), 1, "the real guest's booking stays");
  assert.deepEqual((await PromoCode.find()).map((p) => p.code), ['LAGOS10']);

  // The demo guest's 1-star review no longer counts against the real room.
  const rated = await Room.findById(realRoom._id);
  assert.equal(rated.ratingAvg, 4);
  assert.equal(rated.reviewCount, 1);
  const guest = await User.findById(realGuest._id);
  assert.deepEqual(guest.wishlist.map(String), [String(realRoom._id)]);

  // Running it again is harmless.
  await removeDemoData();
  assert.equal(await Hotel.countDocuments(), 1);
});
