const express = require('express');
const multer = require('multer');
const { Image } = require('../models');
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

// Images live in MongoDB so uploads survive restarts on hosts with ephemeral disks.
router.post('/', requireAuth, upload.array('images', 8), ah(async (req, res) => {
  if (!req.files?.length) throw badRequest('No images uploaded');
  const docs = await Image.insertMany(req.files.map((f) => ({ owner: req.user._id, mime: f.mimetype, data: f.buffer })));
  res.status(201).json({ urls: docs.map((d) => `/api/uploads/${d._id}`) });
}));

router.get('/:id', ah(async (req, res) => {
  const img = await Image.findById(req.params.id);
  if (!img) throw notFound('Image not found');
  res.set('Content-Type', img.mime);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.send(img.data);
}));

module.exports = router;
