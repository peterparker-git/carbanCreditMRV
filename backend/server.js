import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import { connectDB } from './config/db.js';
import Project from './models/Project.js';
import Submission from './models/Submission.js';
import { upload, uploadDir, cleanupFiles } from './middleware/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static uploaded evidence images
app.use('/uploads', express.static(uploadDir));

// Initialize database connection
connectDB();

// Helper to check DB readiness
const checkDbConnection = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      error: 'Database is currently unavailable. Please verify MongoDB is running.'
    });
    return false;
  }
  return true;
};

// GET /api/health - Health check endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    service: 'mrv-carbon-demo-api',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// GET /api/projects - Return projects (supports ?status=published or all)
app.get('/api/projects', async (req, res) => {
  if (!checkDbConnection(res)) return;

  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve projects from database.'
    });
  }
});

// GET /api/projects/:id - Get a single project
app.get('/api/projects/:id', async (req, res) => {
  if (!checkDbConnection(res)) return;

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid project ID format.' });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project.' });
  }
});

// POST /api/projects - NGO/admin project creation (draft or published)
app.post('/api/projects', async (req, res) => {
  if (!checkDbConnection(res)) return;

  const {
    name,
    description,
    location,
    latitude,
    longitude,
    status,
    eligibilityRules,
    requiredEvidence,
    boundary,
    boundaryVersion
  } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Project name is required.' });
  }

  if (!location || typeof location !== 'string' || location.trim().length === 0) {
    return res.status(400).json({ error: 'Project location is required.' });
  }

  let parsedLat = null;
  if (latitude !== undefined && latitude !== null && latitude !== '') {
    parsedLat = Number(latitude);
    if (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      return res.status(400).json({ error: 'Latitude must be a valid number between -90 and 90.' });
    }
  }

  let parsedLng = null;
  if (longitude !== undefined && longitude !== null && longitude !== '') {
    parsedLng = Number(longitude);
    if (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({ error: 'Longitude must be a valid number between -180 and 180.' });
    }
  }

  // Parse eligibilityRules array if string provided
  let parsedEligibility = [];
  if (Array.isArray(eligibilityRules)) {
    parsedEligibility = eligibilityRules.map((r) => String(r).trim()).filter(Boolean);
  } else if (typeof eligibilityRules === 'string' && eligibilityRules.trim()) {
    parsedEligibility = eligibilityRules.split('\n').map((r) => r.trim()).filter(Boolean);
  }

  // Parse requiredEvidence array if string provided
  let parsedEvidence = [];
  if (Array.isArray(requiredEvidence)) {
    parsedEvidence = requiredEvidence.map((e) => String(e).trim()).filter(Boolean);
  } else if (typeof requiredEvidence === 'string' && requiredEvidence.trim()) {
    parsedEvidence = requiredEvidence.split('\n').map((e) => e.trim()).filter(Boolean);
  }

  const initialStatus = ['draft', 'published', 'closed'].includes(status) ? status : 'draft';

  try {
    const project = new Project({
      name: name.trim(),
      description: description ? description.trim() : '',
      location: location.trim(),
      latitude: parsedLat,
      longitude: parsedLng,
      status: initialStatus,
      eligibilityRules: parsedEligibility,
      requiredEvidence: parsedEvidence,
      boundary: boundary && boundary.type === 'Polygon' ? boundary : undefined,
      boundaryVersion: typeof boundaryVersion === 'number' ? boundaryVersion : 1
    });

    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Failed to save project. Please try again later.' });
  }
});

// PATCH /api/projects/:id/publish - Publish a project
app.patch('/api/projects/:id/publish', async (req, res) => {
  if (!checkDbConnection(res)) return;

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid project ID format.' });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    project.status = 'published';
    const updated = await project.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish project.' });
  }
});

// Multer upload error handling wrapper
const uploadMiddleware = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size limit exceeded. Each image must be 5 MB or smaller.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Cannot upload more than 5 images per submission.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// POST /api/projects/:projectId/submissions - Create submission with optional evidence images
app.post('/api/projects/:projectId/submissions', uploadMiddleware, async (req, res) => {
  if (!checkDbConnection(res)) {
    cleanupFiles(req.files);
    return;
  }

  const { projectId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    cleanupFiles(req.files);
    return res.status(400).json({ error: 'Invalid project ID format.' });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      cleanupFiles(req.files);
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.status !== 'published') {
      cleanupFiles(req.files);
      return res.status(400).json({
        error: `Submissions can only be submitted for published projects. Current project status is "${project.status}".`
      });
    }

    const {
      activityDescription,
      contributorId,
      capturedLatitude,
      capturedLongitude,
      locationAccuracy
    } = req.body;

    if (!activityDescription || typeof activityDescription !== 'string' || activityDescription.trim().length < 5) {
      cleanupFiles(req.files);
      return res.status(400).json({
        error: 'Activity description is required and must be at least 5 characters long.'
      });
    }

    let parsedLat = null;
    if (capturedLatitude !== undefined && capturedLatitude !== null && capturedLatitude !== '') {
      parsedLat = Number(capturedLatitude);
      if (Number.isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        cleanupFiles(req.files);
        return res.status(400).json({ error: 'Captured latitude must be between -90 and 90.' });
      }
    }

    let parsedLng = null;
    if (capturedLongitude !== undefined && capturedLongitude !== null && capturedLongitude !== '') {
      parsedLng = Number(capturedLongitude);
      if (Number.isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        cleanupFiles(req.files);
        return res.status(400).json({ error: 'Captured longitude must be between -180 and 180.' });
      }
    }

    // Persist uploaded file metadata
    const evidenceFiles = (req.files || []).map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date()
    }));

    const submission = new Submission({
      projectId: project._id,
      contributorId: contributorId && typeof contributorId === 'string' ? contributorId.trim() : null,
      activityDescription: activityDescription.trim(),
      evidenceFiles,
      capturedLatitude: parsedLat,
      capturedLongitude: parsedLng,
      locationAccuracy: locationAccuracy ? Number(locationAccuracy) : null,
      locationCheckStatus: 'not_checked',
      aiStatus: 'not_started',
      reviewStatus: 'pending'
    });

    const savedSubmission = await submission.save();
    res.status(201).json(savedSubmission);
  } catch (error) {
    cleanupFiles(req.files);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Failed to record submission.' });
  }
});

// GET /api/projects/:projectId/submissions - List submissions for a project
app.get('/api/projects/:projectId/submissions', async (req, res) => {
  if (!checkDbConnection(res)) return;

  const { projectId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID format.' });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const submissions = await Submission.find({ projectId: project._id }).sort({ createdAt: -1 });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve project submissions.' });
  }
});

// GET /api/submissions - List all submissions across projects with populated project details
app.get('/api/submissions', async (req, res) => {
  if (!checkDbConnection(res)) return;

  try {
    const filter = {};
    if (req.query.reviewStatus) {
      filter.reviewStatus = req.query.reviewStatus;
    }

    const submissions = await Submission.find(filter)
      .populate('projectId', 'name location status')
      .sort({ createdAt: -1 });

    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve submissions.' });
  }
});

// PATCH /api/submissions/:id/review - Update submission review status (approved, rejected, field_review)
app.patch('/api/submissions/:id/review', async (req, res) => {
  if (!checkDbConnection(res)) return;

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid submission ID format.' });
  }

  const { reviewStatus, reviewNote, reviewedBy } = req.body;

  const validStatuses = ['approved', 'rejected', 'field_review'];
  if (!reviewStatus || !validStatuses.includes(reviewStatus)) {
    return res.status(400).json({
      error: 'Invalid review status. Must be "approved", "rejected", or "field_review".'
    });
  }

  // Enforce rejection reason
  if (reviewStatus === 'rejected') {
    if (!reviewNote || typeof reviewNote !== 'string' || reviewNote.trim().length === 0) {
      return res.status(400).json({
        error: 'A rejection reason is required when rejecting a submission.'
      });
    }
  }

  try {
    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    submission.reviewStatus = reviewStatus;
    submission.reviewNote = reviewNote ? reviewNote.trim() : null;
    submission.reviewedAt = new Date();
    submission.reviewedBy = reviewedBy && typeof reviewedBy === 'string' ? reviewedBy.trim() : 'NGO Reviewer (Demo)';

    const updated = await submission.save();
    await updated.populate('projectId', 'name location status');

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update submission review status.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
