process.env.NODE_ENV = 'test';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect } = require('../db/connect');
const { seed } = require('../db/seed');
const app = require('../app');

const api = request(app);
const day = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const auth = (t) => ({ Authorization: `Bearer ${t}` });

let guestToken;
let ownerToken;

before(async () => {
  await connect();
  await mongoose.connection.dropDatabase();
  await connect();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  await seed();
  guestToken = (await api.post('/api/auth/login').send({ email: 'guest@quickstay.app', password: 'password123' })).body.token;
  ownerToken = (await api.post('/api/auth/login').send({ email: 'owner@quickstay.app', password: 'password123' })).body.token;
});

after(() => disconnect());

test('register, login and profile', async () => {
  const reg = await api.post('/api/auth/register').send({ name: 'Ada', email: 'Ada@Example.com', password: 'secret123' });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.email, 'ada@example.com');

  const dup = await api.post('/api/auth/register').send({ name: 'Ada', email: 'ada@example.com', password: 'secret123' });
  assert.equal(dup.status, 409);

  const bad = await api.post('/api/auth/login').send({ email: 'ada@example.com', password: 'wrongpass' });
  assert.equal(bad.status, 401);

  const me = await api.get('/api/auth/me').set(auth(reg.body.token));
  assert.equal(me.body.name, 'Ada');
  assert.equal((await api.get('/api/auth/me')).status, 401);
});

test('password reset flow', async () => {
  const res = await api.post('/api/auth/forgot-password').send({ email: 'ada@example.com' });
  const token = new URL(res.body.devResetUrl).searchParams.get('token');
  const reset = await api.post('/api/auth/reset-password').send({ token, password: 'newpass123' });
  assert.equal(reset.status, 200);
  assert.equal((await api.post('/api/auth/reset-password').send({ token, password: 'again1234' })).status, 400);
  assert.equal((await api.post('/api/auth/login').send({ email: 'ada@example.com', password: 'newpass123' })).status, 200);
});

test('search filters by destination, price and dates', async () => {
  const lagos = await api.get('/api/rooms?destination=lagos');
  assert.ok(lagos.body.items.length > 0);
  assert.ok(lagos.body.items.every((r) => r.hotel.city === 'Lagos'));

  const cheap = await api.get('/api/rooms?maxPrice=150&sort=price_asc');
  assert.ok(cheap.body.items.every((r) => r.pricePerNight <= 150));

  const past = await api.get(`/api/rooms?checkIn=${day(-3)}&checkOut=${day(-1)}`);
  assert.equal(past.status, 400);
});

test('booking: quote, promo, overbooking protection, cancel', async () => {
  const owner = await api.post('/api/owner/hotels').set(auth(guestToken)).send({ name: 'Test Inn', address: '1 Test Rd', city: 'Testville' });
  assert.equal(owner.status, 201);
  // Guest became an owner; create a room with a single unit.
  const room = await api.post('/api/owner/rooms').set(auth(guestToken)).send({
    hotelId: owner.body.id, roomType: 'Tiny Room', pricePerNight: 100, maxGuests: 2, totalUnits: 1, images: ['/static/seed/roomImg1.png'],
  });
  assert.equal(room.status, 201);
  const roomId = room.body.id;

  const q = await api.get(`/api/rooms/${roomId}/quote?checkIn=${day(10)}&checkOut=${day(13)}&guests=2&promoCode=summer25`);
  assert.equal(q.body.subtotal, 300);
  assert.equal(q.body.discount, 75);
  assert.equal(q.body.taxes, 22.5);
  assert.equal(q.body.total, 247.5);
  assert.equal(q.body.available, true);

  const body = {
    roomId, checkIn: day(10), checkOut: day(13), guests: 2, paymentMethod: 'pay_at_hotel',
    guestName: 'Gabriel', guestEmail: 'guest@quickstay.app', promoCode: 'SUMMER25',
  };
  const b1 = await api.post('/api/bookings').set(auth(ownerToken)).send(body);
  assert.equal(b1.status, 201);
  assert.equal(b1.body.booking.status, 'confirmed');
  assert.equal(b1.body.booking.totalPrice, 247.5);

  // Only one unit, overlapping dates must be rejected, even under concurrency.
  const results = await Promise.all([
    api.post('/api/bookings').set(auth(ownerToken)).send({ ...body, checkIn: day(11), checkOut: day(12) }),
    api.post('/api/bookings').set(auth(ownerToken)).send({ ...body, checkIn: day(12), checkOut: day(14) }),
  ]);
  assert.deepEqual(results.map((r) => r.status), [409, 409]);

  // Back-to-back stays are fine.
  const b2 = await api.post('/api/bookings').set(auth(ownerToken)).send({ ...body, checkIn: day(13), checkOut: day(15) });
  assert.equal(b2.status, 201);

  const tooMany = await api.post('/api/bookings').set(auth(ownerToken)).send({ ...body, checkIn: day(20), checkOut: day(21), guests: 3 });
  assert.equal(tooMany.status, 400);

  const stripe = await api.post('/api/bookings').set(auth(ownerToken)).send({ ...body, checkIn: day(20), checkOut: day(21), paymentMethod: 'stripe' });
  assert.equal(stripe.status, 400, 'stripe is disabled without keys');

  // Another user cannot cancel it; the booker can, and dates free up.
  assert.equal((await api.post(`/api/bookings/${b1.body.booking.id}/cancel`).set(auth(guestToken))).status, 403);
  const cancel = await api.post(`/api/bookings/${b1.body.booking.id}/cancel`).set(auth(ownerToken));
  assert.equal(cancel.body.status, 'cancelled');
  const again = await api.post('/api/bookings').set(auth(ownerToken)).send({ ...body, checkIn: day(11), checkOut: day(12) });
  assert.equal(again.status, 201);

  const mine = await api.get('/api/bookings/mine').set(auth(ownerToken));
  assert.ok(mine.body.some((b) => b.id === b1.body.booking.id));
});

test('owners only see and manage their own data', async () => {
  const stats = await api.get('/api/owner/stats?days=30').set(auth(ownerToken));
  assert.equal(stats.status, 200);
  assert.equal(stats.body.series.length, 30);
  assert.equal(stats.body.totals.hotels, 8);

  const ownerRooms = await api.get('/api/owner/rooms').set(auth(ownerToken));
  const someRoom = ownerRooms.body[0];
  // guestToken is now an owner of a different hotel.
  assert.equal((await api.patch(`/api/owner/rooms/${someRoom.id}`).set(auth(guestToken)).send({ pricePerNight: 1 })).status, 404);

  const fresh = await api.post('/api/auth/register').send({ name: 'Newbie', email: 'newbie@example.com', password: 'secret123' });
  assert.equal((await api.get('/api/owner/stats').set(auth(fresh.body.token))).status, 403);

  const list = await api.get('/api/owner/bookings?status=confirmed').set(auth(ownerToken));
  const target = list.body.items[0];
  const bad = await api.patch(`/api/owner/bookings/${target.id}`).set(auth(ownerToken)).send({ status: 'confirmed' });
  assert.equal(bad.status, 200);
  const checkIn = await api.patch(`/api/owner/bookings/${target.id}`).set(auth(ownerToken)).send({ status: 'checked_in' });
  assert.equal(checkIn.body.status, 'checked_in');
  const invalid = await api.patch(`/api/owner/bookings/${target.id}`).set(auth(ownerToken)).send({ status: 'cancelled' });
  assert.equal(invalid.status, 400);
});

test('reviews require a completed stay, once per booking', async () => {
  const fresh = await api.post('/api/auth/register').send({ name: 'Rita', email: 'rita@example.com', password: 'secret123' });
  const room = (await api.get('/api/rooms?limit=1')).body.items[0];
  const res = await api.post(`/api/rooms/${room.id}/reviews`).set(auth(fresh.body.token)).send({ rating: 5, comment: 'Lovely place to stay!' });
  assert.equal(res.status, 403);

  const reviews = await api.get(`/api/rooms/${room.id}/reviews`);
  assert.ok(reviews.body.items.length > 0);
});

test('wishlist and newsletter', async () => {
  const room = (await api.get('/api/rooms?limit=1')).body.items[0];
  await api.put(`/api/wishlist/${room.id}`).set(auth(guestToken)).expect(200);
  const ids = await api.get('/api/wishlist/ids').set(auth(guestToken));
  assert.deepEqual(ids.body, [room.id]);
  const detail = await api.get(`/api/rooms/${room.id}`).set(auth(guestToken));
  assert.equal(detail.body.isSaved, true);
  await api.delete(`/api/wishlist/${room.id}`).set(auth(guestToken)).expect(200);
  assert.equal((await api.get('/api/wishlist').set(auth(guestToken))).body.length, 0);

  assert.equal((await api.post('/api/newsletter').send({ email: 'x@y.com' })).status, 201);
  assert.equal((await api.post('/api/newsletter').send({ email: 'nope' })).status, 400);
  assert.equal((await api.get('/api/rooms/not-an-id')).status, 404);
});

test('race: five simultaneous bookings for the last unit, exactly one wins', async () => {
  const hotels = await api.get('/api/owner/hotels').set(auth(ownerToken));
  const room = await api.post('/api/owner/rooms').set(auth(ownerToken)).send({
    hotelId: hotels.body[0].id, roomType: 'Last Room', pricePerNight: 50, totalUnits: 1, images: ['/static/seed/roomImg2.png'],
  });
  const body = {
    roomId: room.body.id, checkIn: day(40), checkOut: day(42), guests: 1, paymentMethod: 'pay_at_hotel',
    guestName: 'Racer', guestEmail: 'race@example.com',
  };
  const results = await Promise.all(Array.from({ length: 5 }, () => api.post('/api/bookings').set(auth(guestToken)).send(body)));
  const statuses = results.map((r) => r.status).sort();
  assert.deepEqual(statuses, [201, 409, 409, 409, 409]);
});

test('smart pricing: weekend and seasonal rates, night by night', async () => {
  const hotels = await api.get('/api/owner/hotels').set(auth(ownerToken));
  // The first Thursday at least 30 days out: Thu night standard, Fri and Sat weekend.
  let thu = 30;
  while (new Date(`${day(thu)}T00:00:00Z`).getUTCDay() !== 4) thu += 1;
  const room = await api.post('/api/owner/rooms').set(auth(ownerToken)).send({
    hotelId: hotels.body[0].id, roomType: 'Priced Room', pricePerNight: 100, weekendPrice: 150, totalUnits: 2,
    seasonalRates: [{ name: 'Carnival', start: day(thu + 7), end: day(thu + 7), price: 300 }],
    images: ['/static/seed/roomImg1.png'],
  });
  assert.equal(room.status, 201);
  assert.equal(room.body.weekendPrice, 150);

  const weekend = await api.get(`/api/rooms/${room.body.id}/quote?checkIn=${day(thu)}&checkOut=${day(thu + 3)}`);
  assert.equal(weekend.body.subtotal, 400);
  assert.deepEqual(weekend.body.lines, [{ label: 'Standard', price: 100, nights: 1 }, { label: 'Weekend', price: 150, nights: 2 }]);

  // The season beats the weekend price.
  const season = await api.get(`/api/rooms/${room.body.id}/quote?checkIn=${day(thu + 7)}&checkOut=${day(thu + 8)}`);
  assert.equal(season.body.subtotal, 300);
  assert.equal(season.body.lines[0].label, 'Carnival');

  const booked = await api.post('/api/bookings').set(auth(guestToken)).send({
    roomId: room.body.id, checkIn: day(thu), checkOut: day(thu + 3), guests: 1, paymentMethod: 'pay_at_hotel',
    guestName: 'Weekend Guest', guestEmail: 'wk@example.com',
  });
  assert.equal(booked.body.booking.subtotal, 400);
  assert.equal(booked.body.booking.priceLines.length, 2);

  const badSeason = await api.patch(`/api/owner/rooms/${room.body.id}`).set(auth(ownerToken)).send({
    seasonalRates: [{ name: 'Backwards', start: day(50), end: day(40), price: 10 }],
  });
  assert.equal(badSeason.status, 400);
  const cleared = await api.patch(`/api/owner/rooms/${room.body.id}`).set(auth(ownerToken)).send({ weekendPrice: null });
  assert.equal(cleared.body.weekendPrice, null);
});

test('blocked dates take units out of sale; calendars show it', async () => {
  const hotels = await api.get('/api/owner/hotels').set(auth(ownerToken));
  const room = (await api.post('/api/owner/rooms').set(auth(ownerToken)).send({
    hotelId: hotels.body[0].id, roomType: 'Blockable Room', pricePerNight: 80, totalUnits: 2, images: ['/static/seed/roomImg1.png'],
  })).body;
  const stay = {
    roomId: room.id, checkIn: day(70), checkOut: day(71), guests: 1, paymentMethod: 'pay_at_hotel',
    guestName: 'Blocker', guestEmail: 'block@example.com',
  };

  const block = await api.post('/api/owner/blocks').set(auth(ownerToken)).send({ roomId: room.id, start: day(70), end: day(72), units: 1, note: 'Repairs' });
  assert.equal(block.status, 201);

  const cal = await api.get(`/api/rooms/${room.id}/calendar?from=${day(69)}&days=4`);
  assert.deepEqual(cal.body.days.map((d) => d.unitsLeft), [2, 1, 1, 2]);

  assert.equal((await api.post('/api/bookings').set(auth(guestToken)).send(stay)).status, 201);
  assert.equal((await api.post('/api/bookings').set(auth(guestToken)).send(stay)).status, 409, 'one booked + one blocked = full');

  // Full rooms drop out of search for those dates.
  const search = await api.get(`/api/rooms?destination=Blockable&checkIn=${day(70)}&checkOut=${day(71)}`);
  assert.equal(search.body.items.length, 0);

  // Can't block a unit a guest already has.
  const tooMuch = await api.post('/api/owner/blocks').set(auth(ownerToken)).send({ roomId: room.id, start: day(70), end: day(71), units: 1 });
  assert.equal(tooMuch.status, 409);

  const grid = await api.get(`/api/owner/calendar?from=${day(69)}&days=4`).set(auth(ownerToken));
  const row = grid.body.rooms.find((r) => r.id === room.id);
  assert.deepEqual(row.nights.map((n) => n.used), [0, 2, 1, 0]);
  assert.equal(row.bookings.length, 1);
  assert.equal(row.blocks[0].note, 'Repairs');

  // Only the owner can lift it; then the room is bookable again.
  assert.equal((await api.delete(`/api/owner/blocks/${block.body.id}`).set(auth(guestToken))).status, 404);
  assert.equal((await api.delete(`/api/owner/blocks/${block.body.id}`).set(auth(ownerToken))).status, 200);
  assert.equal((await api.post('/api/bookings').set(auth(guestToken)).send(stay)).status, 201);
});
