const env = require('./config/env');
const app = require('./app');
const { connect } = require('./db/connect');
const { seedIfEmpty } = require('./db/seed');

async function start() {
  await connect();
  if (env.seedOnEmpty) await seedIfEmpty();
  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
