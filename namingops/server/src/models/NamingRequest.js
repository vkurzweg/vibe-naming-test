const mongoose = require('mongoose');

const statusEnum = [
  'submitted',
  'brand_review',
  'legal_review',
  'approved',
  'on_hold',
  'canceled'
];

const namingRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  formData: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    enum: statusEnum,
    default: 'submitted',
    required: true,
  },
  assignedReviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  reviewNotes: {
    type: String,
    default: '',
  },
  statusHistory: [{
    status: {
      type: String,
      enum: statusEnum,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: String,
      default: '',
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a text index for searching
namingRequestSchema.index({ title: 'text', 'formData.name': 'text', 'formData.description': 'text' });

module.exports = mongoose.model('NamingRequest', namingRequestSchema);