const env = require('../config/env');
const { User, Hotel, Room, RoomBlock, Booking, Review, PromoCode, Image } = require('../models');

// What the old db/seed.js put into the database: the demo logins, three sample
// reviewers and three sample promo codes.
const DEMO_EMAILS = ['owner@quickstay.app', 'guest@quickstay.app', 'emma@example.com', 'liam@example.com', 'sophia@example.com'];
const DEMO_PROMOS = [
  { code: 'SUMMER25', title: 'Summer Escape Package' },
  { code: 'ROMANCE20', title: 'Romantic Getaway' },
  { code: 'LUXE30', title: 'Luxury Retreat' },
];

/**
 * Removes the demo accounts, every hotel they own (with its rooms, bookings,
 * reviews and blocked dates) and the sample promo codes. Runs on each start-up
 * and does nothing once they're gone. Accounts go last, so a run that stops
 * half way is finished by the next one.
 */
async function removeDemoData() {
  const promos = (await PromoCode.deleteMany({ $or: DEMO_PROMOS })).deletedCount;
  const users = await User.find({ email: { $in: DEMO_EMAILS } }).select('_id').lean();
  if (!users.length) {
    if (promos && !env.isTest) console.log(`Removed ${promos} sample promo codes.`);
    return;
  }

  const userIds = users.map((u) => u._id);
  const hotelIds = (await Hotel.find({ owner: { $in: userIds } }).select('_id').lean()).map((h) => h._id);
  const roomIds = (await Room.find({ hotel: { $in: hotelIds } }).select('_id').lean()).map((r) => r._id);
  // Rooms in real hotels that a demo account reviewed: their rating is recounted below.
  const reviewedElsewhere = await Review.distinct('room', { user: { $in: userIds }, hotel: { $nin: hotelIds } });

  const byDemo = { $or: [{ hotel: { $in: hotelIds } }, { user: { $in: userIds } }] };
  const reviews = (await Review.deleteMany(byDemo)).deletedCount;
  const bookings = (await Booking.deleteMany(byDemo)).deletedCount;
  await RoomBlock.deleteMany({ hotel: { $in: hotelIds } });
  await User.updateMany({ wishlist: { $in: roomIds } }, { $pull: { wishlist: { $in: roomIds } } });
  const rooms = (await Room.deleteMany({ _id: { $in: roomIds } })).deletedCount;
  const hotels = (await Hotel.deleteMany({ _id: { $in: hotelIds } })).deletedCount;
  await Image.deleteMany({ owner: { $in: userIds } });

  for (const roomId of reviewedElsewhere) {
    const [agg] = await Review.aggregate([{ $match: { room: roomId } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
    await Room.updateOne({ _id: roomId }, { ratingAvg: agg?.avg ?? null, reviewCount: agg?.n || 0 });
  }

  const accounts = (await User.deleteMany({ _id: { $in: userIds } })).deletedCount;
  if (env.isTest) return;
  console.log(
    `Removed the demo data: ${accounts} accounts, ${hotels} hotels, ${rooms} rooms, ${bookings} bookings, ${reviews} reviews, ${promos} promo codes.`
  );
}

module.exports = { removeDemoData };
