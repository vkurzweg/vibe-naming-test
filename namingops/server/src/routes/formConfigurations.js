const express = require('express');
const router = express.Router();
const FormConfiguration = require('../models/FormConfiguration');
const { isAdmin } = require('../middleware/auth');

// @route   GET /api/v1/form-configurations/active
// @desc    Get the active form configuration
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const formConfig = await FormConfiguration.findOne({ isActive: true });
    if (!formConfig) {
      return res.status(404).json({ msg: 'No active form configuration found' });
    }
    res.json(formConfig);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/v1/form-configurations
// @desc    Get all form configurations
// @access  Admin
router.get('/', isAdmin, async (req, res) => {
  try {
    const formConfigs = await FormConfiguration.find().sort({ createdAt: -1 });
    res.json(formConfigs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/v1/form-configurations
// @desc    Create a form configuration
// @access  Admin
router.post('/', isAdmin, async (req, res) => {
  try {
    const newFormConfig = new FormConfiguration(req.body);
    await newFormConfig.save();
    res.status(201).json(newFormConfig);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ message: err.message });
  }
});

// @route   PUT /api/v1/form-configurations/:id
// @desc    Update a form configuration
// @access  Admin
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const updatedConfig = await FormConfiguration.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedConfig) {
      return res.status(404).json({ msg: 'Form configuration not found' });
    }
    res.json(updatedConfig);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE /api/v1/form-configurations/:id
// @desc    Delete a form configuration
// @access  Admin
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const deletedConfig = await FormConfiguration.findByIdAndDelete(req.params.id);
    if (!deletedConfig) {
      return res.status(404).json({ msg: 'Form configuration not found' });
    }
    res.json({ msg: 'Form configuration deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
