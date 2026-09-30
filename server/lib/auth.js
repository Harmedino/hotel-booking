const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../db');
const { unauthorized, forbidden } = require('./errors');

const USER_COLUMNS = 'id, name, email, role, avatar_url, phone, created_at';

function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function serializeUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatar_url,
    phone: u.phone,
    createdAt: u.created_at,
  };
}

async function loadUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    return await db.one(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [payload.sub]);
  } catch {
    return null;
  }
}

async function optionalAuth(req, res, next) {
  try {
    req.user = await loadUser(req);
    next();
  } catch (err) {
    next(err);
  }
}

async function requireAuth(req, res, next) {
  try {
    req.user = await loadUser(req);
    if (!req.user) return next(unauthorized());
    next();
  } catch (err) {
    next(err);
  }
}

function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') return next(forbidden('Register a property to access the owner dashboard'));
  next();
}

module.exports = { signToken, serializeUser, optionalAuth, requireAuth, requireOwner, USER_COLUMNS };
