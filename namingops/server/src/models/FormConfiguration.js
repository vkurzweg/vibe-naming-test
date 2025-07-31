const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    description: 'The machine-readable name for the field (e.g., projectName).'
  },
  label: {
    type: String,
    required: true,
    trim: true,
    description: 'The human-readable label displayed in the UI.'
  },
  fieldType: {
    type: String,
    required: true,
    enum: ['text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number'],
    description: 'The type of the form input field.'
  },
  options: {
    type: [String],
    description: 'An array of choices for select, radio, or checkbox fields.',
    default: undefined
  },
  required: {
    type: Boolean,
    default: false,
    description: 'Specifies whether the field must be filled out.'
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    description: 'The default value for the field.'
  },
  placeholder: {
    type: String,
    trim: true,
    description: 'Placeholder text for the input field.'
  },
  validation: {
    minLength: { type: Number },
    maxLength: { type: Number },
    pattern: { type: String, description: 'A regex pattern for validation.' }
  }
}, { _id: false });

const formConfigurationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    description: 'The unique name for this form configuration (e.g., Standard Request).'
  },
  description: {
    type: String,
    trim: true,
    description: 'A brief description of the form\'s purpose.'
  },
  fields: {
    type: [fieldSchema],
    required: true,
    validate: [val => val.length > 0, 'A form must have at least one field.']
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Whether this form configuration is active and available for use.'
  }
}, {
  timestamps: true,
  collection: 'form_configurations'
});

const FormConfiguration = mongoose.model('FormConfiguration', formConfigurationSchema);

module.exports = FormConfiguration;
