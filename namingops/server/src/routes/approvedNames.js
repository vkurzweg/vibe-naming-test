const express = require('express');
const ApprovedName = require('../models/ApprovedName');
const router = express.Router();

router.get('/approved-names', async (req, res) => {
  try {
    const names = await ApprovedName.find({});
    res.json(names);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;