const express = require('express');
const router = express.Router();
const FormConfiguration = require('../models/FormConfiguration');
const { isAdmin } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Configure as needed

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
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true') {
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
      error: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEMO_MODE === 'true' ? err.message : undefined
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

// @route   GET /api/v1/form-configurations/:id
// @desc    Get a form configuration by ID
// @access  Admin
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);
    if (!config) return res.status(404).json({ error: 'Not found' });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
// @desc    Update a form configuration (supports file upload)
// @access  Admin
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const updateData = req.body;
    console.log('Update payload:', updateData);
    const updatedConfig = await FormConfiguration.findByIdAndUpdate(
      req.params.id,
      { $set: { ...updateData, fields: updateData.fields } },
      { new: true, runValidators: true }
    );
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
    console.log(`Activating form configuration with ID: ${id}`);

    // Deactivate all configs
    console.log('Deactivating all form configurations');
    const deactivateResult = await FormConfiguration.updateMany({}, { $set: { isActive: false } });
    console.log('Deactivation result:', deactivateResult);

    // Activate the selected config
    console.log(`Activating form configuration with ID: ${id}`);
    const activatedConfig = await FormConfiguration.findByIdAndUpdate(
      id,
      { $set: { isActive: true } },
      { new: true }
    );

    if (!activatedConfig) {
      console.log(`Form configuration with ID ${id} not found`);
      return res.status(404).json({ msg: 'Form configuration not found' });
    }

    console.log('Successfully activated form configuration:', activatedConfig);
    res.json(activatedConfig);
  } catch (err) {
    console.error('Error activating form configuration:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/v1/form-configurations/deactivate
// @desc    Deactivate all form configurations (set isActive=false for all)
// @access  Admin
router.put('/deactivate', isAdmin, async (req, res) => {
  try {
    console.log('Deactivating all form configurations');
    const result = await FormConfiguration.updateMany({}, { $set: { isActive: false } });
    console.log('Deactivation result:', result);
    res.json({ msg: 'All form configurations deactivated', result });
  } catch (err) {
    console.error('Error deactivating form configurations:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/v1/form-configurations/:id/deactivate
// @desc    Deactivate a single form configuration (set isActive=false for this config)
// @access  Admin
router.put('/:id/deactivate', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deactivatedConfig = await FormConfiguration.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!deactivatedConfig) {
      return res.status(404).json({ msg: 'Form configuration not found' });
    }
    res.json(deactivatedConfig);
  } catch (err) {
    console.error('Error deactivating form configuration:', err);
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/v1/form-configurations/:id/reorder-fields
// @desc    Reorder fields/components of a form configuration
// @access  Admin
router.put('/:id/reorder-fields', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.body; // fields should be an array in the desired order

    if (!Array.isArray(fields)) {
      return res.status(400).json({ msg: 'Fields must be an array.' });
    }

    const updatedConfig = await FormConfiguration.findByIdAndUpdate(
      id,
      { $set: { fields } },
      { new: true, runValidators: true }
    );

    if (!updatedConfig) {
      return res.status(404).json({ msg: 'Form configuration not found' });
    }

    res.json(updatedConfig);
  } catch (err) {
    console.error('Error reordering fields:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;