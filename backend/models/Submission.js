import mongoose from 'mongoose';

const evidenceFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID reference is required']
  },
  contributorId: {
    type: String,
    default: null,
    trim: true
  },
  activityDescription: {
    type: String,
    required: [true, 'Activity description is required'],
    trim: true,
    minlength: [5, 'Activity description must be at least 5 characters']
  },
  evidenceFiles: {
    type: [evidenceFileSchema],
    default: []
  },
  capturedLatitude: {
    type: Number,
    default: null
  },
  capturedLongitude: {
    type: Number,
    default: null
  },
  capturedAt: {
    type: Date,
    default: Date.now
  },
  locationAccuracy: {
    type: Number,
    default: null
  },
  locationCheckStatus: {
    type: String,
    default: 'not_checked',
    enum: ['not_checked', 'within_boundary', 'outside_boundary']
  },
  aiStatus: {
    type: String,
    default: 'not_started',
    enum: ['not_started', 'in_progress', 'completed', 'flagged']
  },
  reviewStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'field_review']
  },
  reviewNote: {
    type: String,
    default: null,
    trim: true
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewedBy: {
    type: String,
    default: null,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
