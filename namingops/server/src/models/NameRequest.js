const mongoose = require('mongoose');
const { Schema } = mongoose;

const nameRequestSchema = new Schema({
  request_id: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  request_date: {
    type: Date,
    default: Date.now,
    required: true
  },
  request_title: {
    type: String,
    required: true,
    trim: true
  },
  requestor_name: {
    type: String,
    required: true,
    trim: true
  },
  requestor_id: {
    type: Number,
    required: true
  },
  business_unit: {
    type: String,
    required: true,
    trim: true
  },
  asset_type: {
    type: String,
    enum: [
      'Product',
      'Platform',
      'Feature',
      'Internal Tool',
      'Program',
      'Initiative',
      'Solution',
      'Other'
    ],
    required: true
  },
  asset_type_specify: {
    type: String,
    trim: true
  },
  asset_description: {
    type: String,
    required: true,
    trim: true
  },
  proposed_name_1: {
    type: String,
    required: true,
    trim: true
  },
  proposed_name_2: {
    type: String,
    trim: true
  },
  proposed_name_3: {
    type: String,
    trim: true
  },
  rename: {
    type: Boolean,
    default: false
  },
  file_attachment: {
    path: String,
    filename: String,
    mimetype: String,
    size: Number
  },
  status: {
    type: String,
    enum: [
      'New',
      'In Progress',
      'Legal Review',
      'On Hold',
      'Cancelled',
      'Approved'
    ],
    default: 'New'
  },
  reviewer_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewer_notes: {
    type: String,
    trim: true
  },
  final_approved_name: {
    type: String,
    trim: true
  },
  trademark_details: {
    type: String,
    trim: true
  },
  approval_notes: {
    type: String,
    trim: true
  },
  approval_date: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
nameRequestSchema.index({ request_id: 1 });
nameRequestSchema.index({ requestor_id: 1 });
nameRequestSchema.index({ status: 1 });
nameRequestSchema.index({ asset_type: 1 });
nameRequestSchema.index({ business_unit: 1 });

// Text index for search
nameRequestSchema.index(
  {
    request_title: 'text',
    asset_description: 'text',
    proposed_name_1: 'text',
    proposed_name_2: 'text',
    proposed_name_3: 'text'
  },
  {
    weights: {
      request_title: 5,
      proposed_name_1: 4,
      proposed_name_2: 3,
      proposed_name_3: 2,
      asset_description: 1
    },
    name: 'text_search_index'
  }
);

// Virtual for reviewer details
nameRequestSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewer_id',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to handle status changes
nameRequestSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Approved' && !this.approval_date) {
    this.approval_date = new Date();
  }
  next();
});

const NameRequest = mongoose.model('NameRequest', nameRequestSchema);

module.exports = NameRequest;
