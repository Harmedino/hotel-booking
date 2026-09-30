let env;
try {
  env = require('./config/env');
} catch (err) {
  console.error(`\n${err.message}\n`);
  process.exit(1);
}
const app = require('./app');
const { connect } = require('./db/connect');
const { seedIfEmpty } = require('./db/seed');

async function start() {
  await connect();
  if (env.seedOnEmpty) await seedIfEmpty();
  // No host argument: listens on all interfaces, which Render requires.
  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port} (${env.isProd ? 'production' : 'development'})`);
  });
}

start().catch((err) => {
  console.error(`Failed to start server:\n${err.message}`);
  process.exit(1);
});
