// server/src/models/NamingRequest.js
const mongoose = require('mongoose');

const namingRequestSchema = new mongoose.Schema({
  requestTitle: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requestor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  requestorName: { type: String, required: true },
  proposedNames: [{
    name: { type: String, required: true, trim: true },
    description: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'in_review', 'approved', 'rejected', 'archived'],
    default: 'draft'
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  dueDate: { type: Date },
  reviewer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewerName: String,
  reviewDate: Date,
  reviewComments: String,
  metadata: {
    product: String,
    targetAudience: String,
    competitors: [String],
    keywords: [String],
    businessUnit: String,
    projectCode: String
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  history: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    comment: String,
    timestamp: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true }
}, { 
  collection: 'NamingRequests',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text index for search
namingRequestSchema.index({
  'requestTitle': 'text',
  'description': 'text',
  'proposedNames.name': 'text',
  'proposedNames.description': 'text',
  'metadata.product': 'text',
  'metadata.keywords': 'text'
});

// Virtual for request URL
namingRequestSchema.virtual('url').get(function() {
  return `/requests/${this._id}`;
});

// Pre-save hook to update history
namingRequestSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.history.push({
      status: this.status,
      changedBy: this.reviewer || this.requestor,
      changedByName: this.reviewerName || this.requestorName,
      comment: `Status changed to ${this.status}`
    });
  }
  next();
});

// Static method to get requests by status
namingRequestSchema.statics.findByStatus = function(status) {
  return this.find({ status, isActive: true })
    .sort({ createdAt: -1 })
    .populate('requestor', 'name email')
    .populate('reviewer', 'name email');
};

// Instance method to get request timeline
namingRequestSchema.methods.getTimeline = function() {
  return this.history.sort((a, b) => b.timestamp - a.timestamp);
};

module.exports = mongoose.model('NamingRequest', namingRequestSchema);