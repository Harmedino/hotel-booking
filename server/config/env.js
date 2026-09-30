require('dotenv').config({ quiet: true });

// Render sets RENDER=true on every service; treat it as production for the
// required-variable checks so a missing NODE_ENV can't fall back to dev defaults.
const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const isTest = process.env.NODE_ENV === 'test';

// Empty dashboard values (e.g. `STRIPE_SECRET_KEY=`) count as unset.
const read = (key) => {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? undefined : value.trim();
};

const problems = [];
const warnings = [];
const stripSlash = (url) => url.replace(/\/+$/, '');
const isOrigin = (url) => /^https?:\/\/[^/\s]+$/.test(url);
const isLocal = (url) => /localhost|127\.0\.0\.1/.test(url);

// The deployed frontend. Always allowed in production so a missing or
// localhost CLIENT_URL can't block sign-up from the real site.
const DEFAULT_APP_URL = 'https://hotel-booking-eosin-nu.vercel.app';
const DEFAULT_PREVIEW_ORIGINS = 'https://hotel-booking-*.vercel.app';

// ---- MongoDB -----------------------------------------------------------
// Must be a replica set (every MongoDB Atlas cluster is): bookings use transactions.
let mongoUri = (isTest && read('MONGODB_URI_TEST')) || read('MONGODB_URI');
if (!mongoUri) {
  if (isProd) problems.push('MONGODB_URI is required (your MongoDB Atlas connection string, e.g. ...mongodb.net/quickstay?retryWrites=true&w=majority)');
  else mongoUri = `mongodb://127.0.0.1:27017/${isTest ? 'quickstay_test' : 'quickstay'}?replicaSet=rs0`;
} else if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
  problems.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
}

// ---- Auth --------------------------------------------------------------
let jwtSecret = read('JWT_SECRET');
if (isProd && (!jwtSecret || jwtSecret.length < 32 || ['change-me', 'changeme', 'secret'].includes(jwtSecret))) {
  // Don't refuse to start: derive a stable secret from the (secret) database URI so
  // logins survive restarts, and warn loudly so a real one gets set.
  warnings.push(
    `JWT_SECRET is ${jwtSecret ? 'too weak' : 'not set'}; using a secret derived from MONGODB_URI. ` +
      'Set JWT_SECRET to 32+ random characters (openssl rand -hex 32) on Render.'
  );
  jwtSecret = mongoUri ? require('crypto').createHash('sha256').update(`jwt:${mongoUri}`).digest('hex') : jwtSecret;
} else if (!jwtSecret) {
  jwtSecret = 'dev-only-insecure-secret';
}

// ---- Frontend URLs -----------------------------------------------------
// CLIENT_URL: comma-separated origins allowed to call the API. A "*" wildcard
// is allowed, e.g. https://hotel-booking-*.vercel.app for Vercel previews.
const clientOrigins = (read('CLIENT_URL') || '').split(',').map((o) => stripSlash(o.trim())).filter(Boolean);
const badOrigins = clientOrigins.filter((o) => !isOrigin(o));
if (badOrigins.length) {
  problems.push(`CLIENT_URL has invalid entries (${badOrigins.join(', ')}); use full origins like https://your-app.vercel.app`);
}
if (isProd && (!clientOrigins.length || clientOrigins.every(isLocal))) {
  warnings.push(`CLIENT_URL is ${clientOrigins.length ? clientOrigins.join(', ') : 'not set'}; allowing ${DEFAULT_APP_URL}. Set CLIENT_URL on Render if the site moves.`);
}
if (isProd) clientOrigins.push(DEFAULT_APP_URL, DEFAULT_PREVIEW_ORIGINS);
if (!isProd) clientOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173');

const corsOrigins = [...new Set(clientOrigins)].map((o) =>
  o.includes('*')
    ? new RegExp(`^${o.split('*').map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[a-z0-9-]+')}$`)
    : o
);

// APP_URL: public frontend URL for links in emails and Stripe redirects.
let appUrl = stripSlash(read('APP_URL') || clientOrigins.find((o) => !o.includes('*') && !(isProd && isLocal(o))) || 'http://localhost:5173');
if (!/^https?:\/\/[^\s]+$/.test(appUrl)) problems.push('APP_URL must be a full URL like https://your-app.vercel.app');
if (isProd && isLocal(appUrl)) {
  warnings.push(`APP_URL points at ${appUrl}; using ${DEFAULT_APP_URL} for email links and payment redirects.`);
  appUrl = DEFAULT_APP_URL;
}

// ---- Optional integrations ---------------------------------------------
const stripeSecretKey = read('STRIPE_SECRET_KEY') || '';
const stripeWebhookSecret = read('STRIPE_WEBHOOK_SECRET') || '';
if (stripeSecretKey && !/^sk_(test|live)_/.test(stripeSecretKey)) problems.push('STRIPE_SECRET_KEY should start with sk_test_ or sk_live_');
if (stripeSecretKey && !stripeWebhookSecret) {
  warnings.push('STRIPE_WEBHOOK_SECRET is not set: payments still confirm when guests return from Stripe, but not if they close the tab first.');
}

const smtpHost = read('SMTP_HOST') || '';
const mailFrom = read('MAIL_FROM') || 'QuickStay <no-reply@quickstay.app>';
if (smtpHost && /\]\(mailto:|^[^<]*\[/.test(mailFrom)) {
  warnings.push('MAIL_FROM looks like pasted Markdown; use the form: QuickStay <no-reply@yourdomain.com>');
}
if (smtpHost && (!read('SMTP_USER') || !read('SMTP_PASS'))) {
  warnings.push('SMTP_HOST is set without SMTP_USER/SMTP_PASS: most providers will reject unauthenticated mail.');
}

const taxRate = read('TAX_RATE') !== undefined ? Number(read('TAX_RATE')) : 0.1;
if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 1) problems.push('TAX_RATE must be a number between 0 and 1 (0.1 = 10%)');

if (problems.length) {
  const message = `Invalid environment configuration${isProd ? ' (production)' : ''}:\n${problems.map((p) => `  - ${p}`).join('\n')}\nSet these in Render → Environment, or in server/.env locally.`;
  throw new Error(message);
}
if (!isTest) warnings.forEach((w) => console.warn(`Warning: ${w}`));

const env = {
  isProd,
  isTest,
  port: Number(read('PORT')) || 4000,
  mongoUri,
  jwtSecret,
  jwtExpiresIn: read('JWT_EXPIRES_IN') || '7d',
  corsOrigins,
  appUrl,
  currency: (read('CURRENCY') || 'usd').toLowerCase(),
  taxRate,
  // Minutes an unpaid online-payment booking holds inventory.
  holdMinutes: 30,
  stripeSecretKey,
  stripeWebhookSecret,
  smtp: {
    host: smtpHost,
    port: Number(read('SMTP_PORT')) || 587,
    user: read('SMTP_USER') || '',
    pass: read('SMTP_PASS') || '',
  },
  mailFrom,
  // Seeds demo data only into a completely empty database, and never in
  // production unless explicitly enabled with SEED_ON_EMPTY=true.
  seedOnEmpty: read('SEED_ON_EMPTY') ? read('SEED_ON_EMPTY') === 'true' : !isProd,
};

module.exports = env;
