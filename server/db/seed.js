const bcrypt = require('bcryptjs');
const { User, Hotel, Room, Booking, Review, PromoCode } = require('../models');
const { quote } = require('../lib/pricing');

const img = (n) => `/static/seed/roomImg${n}.png`;
const offerImg = (n) => `/static/seed/exclusiveOfferCardImg${n}.png`;
const rotate = (start) => [1, 2, 3, 4].map((i) => img(((start + i - 2) % 4) + 1));

const HOTELS = [
  { name: 'Urbanza Suites', city: 'New York', country: 'USA', address: '123 Main Street, Midtown', contact: '+1 212 555 0101',
    description: 'Design-led suites steps from Times Square, with a rooftop bar and 24/7 concierge.' },
  { name: 'Marina Crown', city: 'Dubai', country: 'UAE', address: 'Dubai Marina Walk, Tower 4', contact: '+971 4 555 0199',
    description: 'Waterfront luxury with skyline views, an infinity pool and private beach access.' },
  { name: 'Orchid Bay Hotel', city: 'Singapore', country: 'Singapore', address: '8 Marina Boulevard', contact: '+65 6555 0123',
    description: 'A calm urban retreat surrounded by gardens, minutes from Marina Bay Sands.' },
  { name: 'The Kensington House', city: 'London', country: 'UK', address: '45 Kensington High St', contact: '+44 20 5550 0145',
    description: 'Georgian townhouse charm with modern comforts near Hyde Park.' },
  { name: 'Eko Atlantic Residences', city: 'Lagos', country: 'Nigeria', address: 'Ocean Drive, Eko Atlantic, Victoria Island', contact: '+234 1 555 0177',
    description: 'Ocean-front rooms in the heart of Victoria Island, with airport pickup and fast Wi-Fi.' },
  { name: 'Maison Lumière', city: 'Paris', country: 'France', address: '12 Rue de Rivoli', contact: '+33 1 5550 0112',
    description: 'A boutique hotel on the Right Bank with Eiffel Tower views from the top floors.' },
  { name: 'Ubud Canopy Villas', city: 'Bali', country: 'Indonesia', address: 'Jl. Raya Sanggingan, Ubud', contact: '+62 361 555 0188',
    description: 'Private pool villas above the jungle, with daily yoga and a spa.' },
  { name: 'Shibuya Stay', city: 'Tokyo', country: 'Japan', address: '2-21-1 Shibuya', contact: '+81 3 5550 0121',
    description: 'Compact, smart rooms at the centre of Tokyo nightlife and transit.' },
];

const ROOM_TEMPLATES = [
  { roomType: 'Single Bed', price: 119, maxGuests: 1, units: 6, amenities: ['Free WiFi', 'Room Service'] },
  { roomType: 'Double Bed', price: 199, maxGuests: 2, units: 5, amenities: ['Free WiFi', 'Free Breakfast', 'Room Service'] },
  { roomType: 'Family Suite', price: 329, maxGuests: 4, units: 3, amenities: ['Free WiFi', 'Free Breakfast', 'Pool Access', 'Room Service'] },
  { roomType: 'Luxury Room', price: 459, maxGuests: 2, units: 2, amenities: ['Free WiFi', 'Mountain View', 'Pool Access', 'Room Service', 'Free Breakfast'] },
];

const CITY_PRICE = { 'New York': 1.2, Dubai: 1.3, Singapore: 1.1, London: 1.15, Lagos: 0.7, Paris: 1.25, Bali: 0.8, Tokyo: 1 };

const DESCRIPTIONS = {
  'Single Bed': 'A smart, quiet room for solo travellers with a work desk and blackout blinds.',
  'Double Bed': 'Bright and spacious with a queen bed, rain shower and city views.',
  'Family Suite': 'Two connected spaces with a king bed, sofa bed and room for the whole crew.',
  'Luxury Room': 'Our signature room: floor-to-ceiling windows, soaking tub and premium linens.',
};

const REVIEWS = [
  [5, 'Spotless room, super comfortable bed and the staff went out of their way for us. Would book again.'],
  [5, 'Check-in took two minutes and the view was exactly like the photos. Perfect city break.'],
  [4, 'Great location and quiet at night. Breakfast could have more variety but overall excellent.'],
  [5, 'Honestly the best hotel stay I have had this year. The little touches made a difference.'],
  [4, 'Clean, modern and well priced. The pool was a highlight for the kids.'],
  [3, 'Room was nice but the Wi-Fi dropped a few times. Staff were helpful about it.'],
];

const PROMOS = [
  { code: 'SUMMER25', title: 'Summer Escape Package', description: 'Enjoy 25% off any stay this season.', percent: 25, image: offerImg(1) },
  { code: 'ROMANCE20', title: 'Romantic Getaway', description: 'Couples save 20% on every room type.', percent: 20, image: offerImg(2) },
  { code: 'LUXE30', title: 'Luxury Retreat', description: 'Book ahead and save 30% at any of our luxury properties.', percent: 30, image: offerImg(3) },
];

const addDays = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

async function seed() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const [owner, guest, ...others] = await User.insertMany([
    { name: 'Olivia Owner', email: 'owner@quickstay.app', passwordHash, role: 'owner' },
    { name: 'Gabriel Guest', email: 'guest@quickstay.app', passwordHash },
    { name: 'Emma Rodriguez', email: 'emma@example.com', passwordHash },
    { name: 'Liam Johnson', email: 'liam@example.com', passwordHash },
    { name: 'Sophia Lee', email: 'sophia@example.com', passwordHash },
  ]);
  const reviewers = [guest, ...others];

  await PromoCode.insertMany(
    PROMOS.map((p) => ({ code: p.code, title: p.title, description: p.description, percentOff: p.percent, image: p.image, expiresAt: addDays(120) }))
  );

  let n = 0;
  for (const [hi, h] of HOTELS.entries()) {
    const hotel = await Hotel.create({ ...h, owner: owner._id, coverImage: img((hi % 4) + 1), createdAt: daysAgo(120 - hi) });
    // Each hotel gets 3 of the 4 room types.
    const templates = ROOM_TEMPLATES.filter((_, i) => (i + hi) % 4 !== 3);
    for (const t of templates) {
      n += 1;
      const price = Math.round(t.price * (CITY_PRICE[h.city] || 1));
      const room = await Room.create({
        hotel: hotel._id, roomType: t.roomType, description: DESCRIPTIONS[t.roomType], pricePerNight: price,
        maxGuests: t.maxGuests, totalUnits: t.units, amenities: t.amenities, images: rotate(n), createdAt: daysAgo(100 - n),
      });

      // Past stays with reviews, plus upcoming bookings for the dashboard.
      const stays = [
        { offset: -40 - (n % 20), nights: 2, status: 'completed', review: true },
        { offset: -15 - (n % 10), nights: 3, status: 'completed', review: n % 2 === 0 },
        { offset: 5 + (n % 20), nights: 2, status: 'confirmed', review: false },
      ];
      const ratings = [];
      for (const [si, s] of stays.entries()) {
        const u = reviewers[(n + si) % reviewers.length];
        const pq = quote({ pricePerNight: price, nights: s.nights });
        const booking = await Booking.create({
          reference: `QS-S${String(n).padStart(3, '0')}${si}`, user: u._id, room: room._id, hotel: hotel._id,
          checkIn: addDays(s.offset), checkOut: addDays(s.offset + s.nights), guests: 1, nights: s.nights,
          pricePerNight: price, subtotal: pq.subtotal, taxes: pq.taxes, totalPrice: pq.total, status: s.status,
          paymentMethod: si % 2 ? 'stripe' : 'pay_at_hotel', isPaid: s.status === 'completed' || si % 2 === 1,
          guestName: u.name, guestEmail: u.email, hasReview: s.review,
          createdAt: daysAgo(Math.max(-(s.offset - 3 - (n % 7)), 1)),
        });
        if (s.review) {
          const [rating, comment] = REVIEWS[(n + si) % REVIEWS.length];
          ratings.push(rating);
          await Review.create({
            booking: booking._id, room: room._id, hotel: hotel._id, user: u._id, rating, comment,
            createdAt: daysAgo(-(s.offset + s.nights + 1)),
          });
        }
      }
      if (ratings.length) {
        room.ratingAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        room.reviewCount = ratings.length;
        await room.save();
      }
    }
  }
  console.log('Seeded demo data. Owner: owner@quickstay.app / Guest: guest@quickstay.app (password123)');
}

// Only ever seeds a completely empty database: never adds to or overwrites real data.
async function seedIfEmpty() {
  const counts = await Promise.all([User, Hotel, Room, Booking].map((m) => m.estimatedDocumentCount()));
  if (counts.some((n) => n > 0)) return false;
  try {
    await seed();
    return true;
  } catch (err) {
    // Another instance seeded at the same moment (unique email index): not an error.
    if (err.code === 11000) return false;
    throw err;
  }
}

module.exports = { seed, seedIfEmpty };

if (require.main === module) {
  const { connect, disconnect } = require('./connect');
  connect()
    .then(seedIfEmpty)
    .then(disconnect)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
