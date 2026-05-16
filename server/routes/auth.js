const express = require('express');
const router = express.Router();
const { uuidv4 } = require('../data/store');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const token = uuidv4();
  res.json({ token, email });
});

module.exports = router;
