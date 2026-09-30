const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed UUIDs in route params behave like missing records.
  if (err.code === '22P02') return res.status(404).json({ error: 'Not found' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Each image must be under 5 MB' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 && env.isProd ? 'Something went wrong. Please try again.' : err.message,
    details: err.details,
  });
}

module.exports = errorHandler;
