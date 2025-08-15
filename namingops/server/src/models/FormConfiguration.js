const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() { return this.fieldType !== 'content'; },
    trim: true,
    description: 'The machine-readable name for the field (e.g., projectName).'
  },
  label: {
    type: String,
    required: function() { return this.fieldType !== 'content'; },
    trim: true,
    description: 'The human-readable label displayed in the UI.'
  },
  fieldType: {
    type: String,
    required: true,
    enum: [
      'text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'number', 'content'
    ], // <-- add 'content' to enum
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
  content: {
    type: String,
    required: function() { return this.fieldType === 'content'; },
    description: 'HTML or text content for content blocks.'
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
  },
  geminiSuggest: {
    type: Boolean,
    default: false,
    description: 'If true, render a Gemini Suggest button next to this field.'
  },
  geminiEvaluate: {
    type: Boolean,
    default: false,
    description: 'If true, render a Gemini Evaluate button next to this field.'
  },
  geminiSuggestLabel: {
    type: String,
    default: 'Suggest with Gemini',
    description: 'Custom label for the Gemini Suggest button.'
  },
  geminiEvaluateLabel: {
    type: String,
    default: 'Evaluate with Gemini',
    description: 'Custom label for the Gemini Evaluate button.'
  },
  geminiHelperText: {
    type: String,
    default: '',
    description: 'Helper text to display under Gemini buttons.'
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