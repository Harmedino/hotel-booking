const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const env = require('./config/env');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const payments = require('./routes/payments');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(env.clientOrigins.length ? { origin: env.clientOrigins } : undefined));
app.use(compression());
if (!env.isTest) app.use(logger);

// Stripe needs the raw body to verify signatures, so this sits before express.json().
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), payments.webhook);
app.use(express.json({ limit: '1mb' }));

app.use('/static', express.static(path.join(__dirname, 'public'), { maxAge: '30d' }));

app.use('/api', require('./routes/misc'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/payments', payments.router);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

module.exports = app;
