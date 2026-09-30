const express = require('express');
const multer = require('multer');
const db = require('../db');
const { ah, badRequest, notFound } = require('../lib/errors');
const { requireAuth } = require('../lib/auth');

const router = express.Router();

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(badRequest('Only JPG, PNG or WebP images are allowed')),
});

// Images live in Postgres so uploads survive restarts on hosts with ephemeral disks.
router.post('/', requireAuth, upload.array('images', 8), ah(async (req, res) => {
  if (!req.files?.length) throw badRequest('No images uploaded');
  const urls = [];
  for (const file of req.files) {
    const row = await db.one('INSERT INTO images (owner_id, mime, data) VALUES ($1, $2, $3) RETURNING id', [
      req.user.id,
      file.mimetype,
      file.buffer,
    ]);
    urls.push(`/api/uploads/${row.id}`);
  }
  res.status(201).json({ urls });
}));

router.get('/:id', ah(async (req, res) => {
  const row = await db.one('SELECT mime, data FROM images WHERE id = $1', [req.params.id]);
  if (!row) throw notFound('Image not found');
  res.set('Content-Type', row.mime);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.send(row.data);
}));

module.exports = router;
