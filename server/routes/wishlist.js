const express = require('express');
const { Room, User } = require('../models');
const { ah, notFound } = require('../lib/errors');
const { requireAuth } = require('../lib/auth');
const serialize = require('../lib/serializers');

const router = express.Router();
router.use(requireAuth);

router.get('/', ah(async (req, res) => {
  const rooms = await Room.find({ _id: { $in: req.user.wishlist } }).populate('hotel', 'name city country address contact description');
  // Newest saves first.
  const order = req.user.wishlist.map(String).reverse();
  rooms.sort((a, b) => order.indexOf(String(a._id)) - order.indexOf(String(b._id)));
  res.json(rooms.map((r) => serialize.room(r)));
}));

router.get('/ids', (req, res) => {
  res.json(req.user.wishlist.map(String));
});

router.put('/:roomId', ah(async (req, res) => {
  const room = await Room.findById(req.params.roomId).select('_id');
  if (!room) throw notFound('Room not found');
  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: room._id } });
  res.json({ saved: true });
}));

router.delete('/:roomId', ah(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.roomId } });
  res.json({ saved: false });
}));

module.exports = router;
