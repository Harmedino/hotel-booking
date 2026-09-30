const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');
const env = require('../config/env');
const mailer = require('../lib/mailer');
const { validate, z } = require('../lib/validate');
const { ah, badRequest, unauthorized, conflict } = require('../lib/errors');
const { signToken, serializeUser, requireAuth } = require('../lib/auth');

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

router.post('/register', limiter, validate(z.object({ name: z.string().trim().min(2).max(80), email, password })), ah(async (req, res) => {
  const { name, email: mail, password: pw } = req.body;
  if (await User.exists({ email: mail })) throw conflict('An account with this email already exists');
  const user = await User.create({ name, email: mail, passwordHash: await bcrypt.hash(pw, 10) });
  res.status(201).json({ token: signToken(user._id), user: serializeUser(user) });
}));

router.post('/login', limiter, validate(z.object({ email, password: z.string().min(1).max(200) })), ah(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const ok = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!ok) throw unauthorized('Incorrect email or password');
  res.json({ token: signToken(user._id), user: serializeUser(user) });
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
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  await req.user.save();
  res.json(serializeUser(req.user));
}));

router.post('/me/password', requireAuth, validate(z.object({ currentPassword: z.string().min(1), newPassword: password })), ah(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
    throw badRequest('Your current password is incorrect');
  }
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
  await user.save();
  res.json({ ok: true });
}));

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

router.post('/forgot-password', limiter, validate(z.object({ email })), ah(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const response = { ok: true, message: 'If that email has an account, a reset link is on its way.' };
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = sha256(token);
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const url = `${env.appUrl}/reset-password?token=${token}`;
    await mailer.passwordReset(user.email, url);
    // Without email configured, expose the link outside production so the flow is testable.
    if (!mailer.isEnabled() && !env.isProd) response.devResetUrl = url;
  }
  res.json(response);
}));

router.post('/reset-password', limiter, validate(z.object({ token: z.string().min(20).max(200), password })), ah(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { resetTokenHash: sha256(req.body.token), resetTokenExpires: { $gt: new Date() } },
    { passwordHash: await bcrypt.hash(req.body.password, 10), $unset: { resetTokenHash: 1, resetTokenExpires: 1 } },
    { new: true }
  );
  if (!user) throw badRequest('This reset link is invalid or has expired. Request a new one.');
  res.json({ token: signToken(user._id), user: serializeUser(user) });
}));

module.exports = router;
