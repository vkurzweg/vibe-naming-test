const mongoose = require('mongoose');

const namingRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  title: {
    type: String,
    required: false,
  },
  formData: {
    type: Object,
    required: false,
  },
  status: {
    type: String,
    enum: ['Submitted', 'In Review', 'Needs Information', 'Approved', 'Rejected', 'pending', 'draft'],
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