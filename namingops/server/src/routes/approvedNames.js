const express = require('express');
const router = express.Router();
const ApprovedName = require('../models/ApprovedName');

// Service Line options
router.get('/options/service-lines', async (req, res) => {
  try {
    const serviceLines = await ApprovedName.distinct('serviceLine');
    res.json(serviceLines.filter(Boolean));
  } catch (err) {
    console.error('Service Line Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// IPR options
router.get('/options/ipr', async (req, res) => {
  try {
    const iprOptions = await ApprovedName.distinct('ipr');
    res.json(iprOptions.filter(Boolean));
  } catch (err) {
    console.error('IPR Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Category options
router.get('/options/categories', async (req, res) => {
  try {
    const categories = await ApprovedName.distinct('category');
    res.json(categories.filter(Boolean));
  } catch (err) {
    console.error('Category Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Class options
router.get('/options/classes', async (req, res) => {
  try {
    const classes = await ApprovedName.distinct('class');
    res.json(classes.filter(Boolean));
  } catch (err) {
    console.error('Class Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, serviceLine, ipr, category, class: classFilter } = req.query;
    const query = {};

    // Keyword search across multiple fields
    if (search) {
      query.$or = [
        { approvedName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { serviceLine: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ];
    }

     // Multi-keyword search (split by space, AND logic)
    if (search) {
      const keywords = search.split(' ').filter(Boolean);
      query.$and = keywords.map(keyword => ({
        $or: [
          { approvedName: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { serviceLine: { $regex: keyword, $options: 'i' } },
          { contactPerson: { $regex: keyword, $options: 'i' } }
        ]
      }));
    }

    // Filters
    if (serviceLine) query.serviceLine = serviceLine;
    if (ipr) query.ipr = ipr;
    if (category) query.category = category;
    if (classFilter) query.class = classFilter;

    const names = await ApprovedName.find(query).limit(100);
    res.json(names);
  } catch (err) {
    console.error('Approved Names Search Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;