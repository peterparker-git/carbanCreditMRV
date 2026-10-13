import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [2, 'Project name must be at least 2 characters']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'published', 'closed', 'pending']
  },
  eligibilityRules: {
    type: [String],
    default: []
  },
  requiredEvidence: {
    type: [String],
    default: []
  },
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: undefined
    },
    coordinates: {
      type: [[[Number]]],
      default: undefined
    }
  },
  boundaryVersion: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
