const mongoose = require('mongoose');

const statusEnum = [
  'submitted',
  'brand_review',
  'legal_review',
  'approved',
  'on_hold',
  'canceled'
];

// Define a reusable file schema for file fields
const fileSchema = new mongoose.Schema({
  name: String,
  url: String,
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

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
  // PATCH: allow formData to have file arrays for file fields
  formData: {
    type: Object,
    required: true,
    // Example: supportingDocs: [fileSchema], otherField: String
    // You will need to enforce this structure in your upload/update logic
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
    isActive: { type: Boolean, default: true },
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
  reviewerNotes: { type: String, default: '' },
  adminNotes: { type: String, default: '' },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
});

// Add a text index for searching
namingRequestSchema.index({ title: 'text', 'formData.name': 'text', 'formData.description': 'text' });

module.exports = mongoose.model('NamingRequest', namingRequestSchema);