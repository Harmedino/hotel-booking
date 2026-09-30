require('dotenv').config({ quiet: true });

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// CLIENT_URL: comma-separated allowed origins. Unset = allow all (local dev).
const clientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const env = {
  isProd,
  isTest,
  port: Number(process.env.PORT) || 4000,
  databaseUrl:
    process.env.DATABASE_URL ||
    (isTest
      ? 'postgres://quickstay:quickstay@localhost:5432/quickstay_test'
      : 'postgres://quickstay:quickstay@localhost:5432/quickstay'),
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET || (isProd ? null : 'dev-only-insecure-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins,
  // Public URL of the frontend, used in emails and Stripe redirects.
  appUrl: (process.env.APP_URL || clientOrigins[0] || 'http://localhost:5173').replace(/\/$/, ''),
  // Public URL of this API, used to build absolute links in emails.
  apiUrl: (process.env.API_URL || `http://localhost:${Number(process.env.PORT) || 4000}`).replace(/\/$/, ''),
  currency: (process.env.CURRENCY || 'usd').toLowerCase(),
  taxRate: process.env.TAX_RATE !== undefined ? Number(process.env.TAX_RATE) : 0.1,
  // Minutes an unpaid online-payment booking holds inventory.
  holdMinutes: 30,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  mailFrom: process.env.MAIL_FROM || 'QuickStay <no-reply@quickstay.app>',
  seedOnEmpty: process.env.SEED_ON_EMPTY !== 'false',
};

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = env;
