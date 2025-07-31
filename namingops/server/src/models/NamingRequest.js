const mongoose = require('mongoose');

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
    enum: ['Submitted', 'In Review', 'Needs Information', 'Approved', 'Rejected'],
    default: 'Submitted',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a text index for searching
namingRequestSchema.index({ title: 'text', 'formData.name': 'text', 'formData.description': 'text' });

module.exports = mongoose.model('NamingRequest', namingRequestSchema);