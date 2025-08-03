const express = require('express');
const router = express.Router();
const FormConfiguration = require('../models/FormConfiguration');
const { isAdmin } = require('../middleware/auth');

// @route   GET /api/v1/form-configurations/active
// @desc    Get the active form configuration
// @access  Public
router.get('/active', async (req, res) => {
  try {
    console.log('Fetching active form configuration...');
    const formConfig = await FormConfiguration.findOne({ isActive: true });
    
    console.log('Active form config query result:', formConfig ? 'Found' : 'Not found');
    
    if (!formConfig) {
      console.log('No active form configuration found in database');
      // For development, return a default config if none is found
      if (process.env.NODE_ENV === 'development') {
        console.log('Returning default development form config');
        return res.json({
          _id: 'default-dev-config',
          name: 'Default Development Form',
          description: 'Default form configuration for development',
          isActive: true,
          fields: [
            {
              _id: '1',
              name: 'requestTitle',
              label: 'Request Title',
              fieldType: 'text',
              required: true
            },
            {
              _id: '2',
              name: 'description',
              label: 'Description',
              fieldType: 'textarea',
              required: true
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      return res.status(404).json({ msg: 'No active form configuration found' });
    }
    
    console.log('Returning active form config with fields:', 
      formConfig.fields?.map(f => ({
        name: f.name,
        type: f.fieldType,
        required: f.required
      }))
    );
    
    res.json(formConfig);
  } catch (err) {
    console.error('Error in active form config endpoint:', err);
    res.status(500).json({ 
      msg: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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

// @route   PUT /api/v1/form-configurations/:id/activate
// @desc    Activate a form configuration (set isActive=true for this, false for all others)
// @access  Admin
router.put('/:id/activate', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Deactivate all configs
    await FormConfiguration.updateMany({}, { $set: { isActive: false } });
    // Activate the selected config
    const activatedConfig = await FormConfiguration.findByIdAndUpdate(
      id,
      { $set: { isActive: true } },
      { new: true }
    );
    if (!activatedConfig) {
      return res.status(404).json({ msg: 'Form configuration not found' });
    }
    res.json(activatedConfig);
  } catch (err) {
    console.error('Error activating form configuration:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
