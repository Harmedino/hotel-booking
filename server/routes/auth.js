const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const env = require('../config/env');
const mailer = require('../lib/mailer');
const { validate, z } = require('../lib/validate');
const { ah, badRequest, unauthorized, conflict } = require('../lib/errors');
const { signToken, serializeUser, requireAuth, USER_COLUMNS } = require('../lib/auth');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

const email = z.string().trim().toLowerCase().email('must be a valid email').max(200);
const password = z.string().min(8, 'must be at least 8 characters').max(200);

const registerSchema = z.object({ name: z.string().trim().min(2).max(80), email, password });

router.post('/register', limiter, validate(registerSchema), ah(async (req, res) => {
  const { name, email: mail, password: pw } = req.body;
  const exists = await db.one('SELECT 1 FROM users WHERE lower(email) = $1', [mail]);
  if (exists) throw conflict('An account with this email already exists');
  const hash = await bcrypt.hash(pw, 10);
  const user = await db.one(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING ${USER_COLUMNS}`,
    [name, mail, hash]
  );
  res.status(201).json({ token: signToken(user.id), user: serializeUser(user) });
}));

const loginSchema = z.object({ email, password: z.string().min(1).max(200) });

router.post('/login', limiter, validate(loginSchema), ah(async (req, res) => {
  const row = await db.one(`SELECT ${USER_COLUMNS}, password_hash FROM users WHERE lower(email) = $1`, [req.body.email]);
  const ok = row && (await bcrypt.compare(req.body.password, row.password_hash));
  if (!ok) throw unauthorized('Incorrect email or password');
  res.json({ token: signToken(row.id), user: serializeUser(row) });
}));

router.get('/me', requireAuth, (req, res) => {
  res.json(serializeUser(req.user));
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  avatarUrl: z.string().trim().max(500).nullable().optional(),
});

router.patch('/me', requireAuth, validate(profileSchema), ah(async (req, res) => {
  const { name, phone, avatarUrl } = req.body;
  const user = await db.one(
    `UPDATE users SET
       name = COALESCE($2, name),
       phone = COALESCE($3, phone),
       avatar_url = CASE WHEN $4::boolean THEN $5 ELSE avatar_url END,
       updated_at = now()
     WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [req.user.id, name ?? null, phone ?? null, avatarUrl !== undefined, avatarUrl ?? null]
  );
  res.json(serializeUser(user));
}));

const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });

router.post('/me/password', requireAuth, validate(passwordSchema), ah(async (req, res) => {
  const row = await db.one('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!(await bcrypt.compare(req.body.currentPassword, row.password_hash))) {
    throw badRequest('Your current password is incorrect');
  }
  await db.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [
    req.user.id,
    await bcrypt.hash(req.body.newPassword, 10),
  ]);
  res.json({ ok: true });
}));

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

router.post('/forgot-password', limiter, validate(z.object({ email })), ah(async (req, res) => {
  const user = await db.one('SELECT id, email FROM users WHERE lower(email) = $1', [req.body.email]);
  const response = { ok: true, message: 'If that email has an account, a reset link is on its way.' };
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    await db.query(
      `UPDATE users SET reset_token_hash = $2, reset_token_expires = now() + interval '1 hour' WHERE id = $1`,
      [user.id, sha256(token)]
    );
    const url = `${env.appUrl}/reset-password?token=${token}`;
    await mailer.passwordReset(user.email, url);
    // Without email configured, expose the link outside production so the flow is testable.
    if (!mailer.isEnabled() && !env.isProd) response.devResetUrl = url;
  }
  res.json(response);
}));

const resetSchema = z.object({ token: z.string().min(20).max(200), password });

router.post('/reset-password', limiter, validate(resetSchema), ah(async (req, res) => {
  const user = await db.one(
    `UPDATE users SET password_hash = $2, reset_token_hash = NULL, reset_token_expires = NULL, updated_at = now()
     WHERE reset_token_hash = $1 AND reset_token_expires > now() RETURNING ${USER_COLUMNS}`,
    [sha256(req.body.token), await bcrypt.hash(req.body.password, 10)]
  );
  if (!user) throw badRequest('This reset link is invalid or has expired. Request a new one.');
  res.json({ token: signToken(user.id), user: serializeUser(user) });
}));

module.exports = router;
