const mongoose = require('mongoose');
const env = require('../config/env');

mongoose.set('strictQuery', true);

async function connect() {
  if (mongoose.connection.readyState === 1) return mongoose;
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    throw new Error(`Could not connect to MongoDB (${err.message}). Check MONGODB_URI and, on Atlas, that Network Access allows 0.0.0.0/0.`);
  }
  const { host, name } = mongoose.connection;
  if (!env.isTest) console.log(`MongoDB connected: ${host}/${name}`);
  // Bookings use transactions, which need a replica set (every Atlas cluster is one).
  const hello = await mongoose.connection.db.admin().command({ hello: 1 }).catch(() => null);
  if (hello && !hello.setName && hello.msg !== 'isdbgrid') {
    console.warn('Warning: MongoDB is not a replica set, so creating bookings will fail. Use MongoDB Atlas or a local replica set.');
  }
  // Build indexes (unique email, booking reference, etc.) before serving traffic.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  return mongoose;
}

const disconnect = () => mongoose.disconnect();

module.exports = { connect, disconnect, mongoose };
