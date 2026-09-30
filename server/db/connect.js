const mongoose = require('mongoose');
const env = require('../config/env');

mongoose.set('strictQuery', true);

async function connect() {
  if (mongoose.connection.readyState === 1) return mongoose;
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
  // Build indexes (unique email, booking reference, etc.) before serving traffic.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  return mongoose;
}

const disconnect = () => mongoose.disconnect();

module.exports = { connect, disconnect, mongoose };
