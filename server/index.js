const env = require('./config/env');
const app = require('./app');
const migrate = require('./db/migrate');
const { seedIfEmpty } = require('./db/seed');

async function start() {
  await migrate();
  if (env.seedOnEmpty) await seedIfEmpty();
  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
