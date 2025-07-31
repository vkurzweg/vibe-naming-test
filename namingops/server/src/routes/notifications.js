// server/src/routes/notifications.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('notifications')
      .populate('notifications.requestId', 'requestTitle status');
    
    res.json(user.notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
// @route   PUT /api/notifications/:id/read