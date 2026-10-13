import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function App() {
  // Navigation: 'contributor' | 'admin' | 'reviews'
  const [activeTab, setActiveTab] = useState('contributor');

  // Backend Health State
  const [healthStatus, setHealthStatus] = useState('idle');
  const [healthDetails, setHealthDetails] = useState(null);
  const [healthError, setHealthError] = useState('');

  // Public / Contributor Projects State (published only)
  const [publicProjects, setPublicProjects] = useState([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState('');

  // Selected Project for Submission flow
  const [selectedProject, setSelectedProject] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');

  // Submission Form State
  const [subForm, setSubForm] = useState({
    contributorId: '',
    activityDescription: '',
    capturedLatitude: '',
    capturedLongitude: ''
  });
  const [selectedImages, setSelectedImages] = useState([]); // [{ id, file, previewUrl }]
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [subFormError, setSubFormError] = useState('');
  const [subFormSuccess, setSubFormSuccess] = useState('');

  // NGO / Admin Projects State (all projects)
  const [adminProjects, setAdminProjects] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Admin Project Creation Form State
  const [adminForm, setAdminForm] = useState({
    name: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    eligibilityRules: '',
    requiredEvidence: ''
  });
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminFormError, setAdminFormError] = useState('');
  const [adminFormSuccess, setAdminFormSuccess] = useState('');

  // NGO / Admin Review Dashboard State (submissions across projects)
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [allSubmissionsLoading, setAllSubmissionsLoading] = useState(false);
  const [allSubmissionsError, setAllSubmissionsError] = useState('');
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'pending' | 'field_review' | 'approved' | 'rejected'
  const [reviewingId, setReviewingId] = useState(null);
  const [activeActionDialog, setActiveActionDialog] = useState(null); // { id, type: 'reject' | 'field_review' | 'approve', note: '' }
  const [reviewActionError, setReviewActionError] = useState('');
  const [reviewActionSuccess, setReviewActionSuccess] = useState('');

  // 1. Health check
  const checkHealth = async () => {
    setHealthStatus('loading');
    setHealthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setHealthDetails(data);
      setHealthStatus('connected');
    } catch (err) {
      setHealthError(err.message || 'Failed to connect to backend server');
      setHealthStatus('error');
    }
  };

  // 2. Fetch public published projects
  const fetchPublicProjects = async () => {
    setPublicLoading(true);
    setPublicError('');
    try {
      const res = await fetch(`${API_BASE_URL}/projects?status=published`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load published projects');
      setPublicProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setPublicError(err.message || 'Failed to load published projects');
    } finally {
      setPublicLoading(false);
    }
  };

  // 3. Fetch all admin projects (drafts + published)
  const fetchAdminProjects = async () => {
    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await fetch(`${API_BASE_URL}/projects`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load projects');
      setAdminProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setAdminError(err.message || 'Failed to load projects');
    } finally {
      setAdminLoading(false);
    }
  };

  // 4. Fetch submissions for a specific project
  const fetchSubmissions = async (projectId) => {
    setSubmissionsLoading(true);
    setSubmissionsError('');
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/submissions`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load submissions');
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setSubmissionsError(err.message || 'Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // 5. Fetch all submissions across projects for review dashboard
  const fetchAllSubmissions = async () => {
    setAllSubmissionsLoading(true);
    setAllSubmissionsError('');
    try {
      const res = await fetch(`${API_BASE_URL}/submissions`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load submissions for review');
      setAllSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setAllSubmissionsError(err.message || 'Failed to load submissions');
    } finally {
      setAllSubmissionsLoading(false);
    }
  };

  // Open project detail view
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setSubFormError('');
    setSubFormSuccess('');
    selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setSelectedImages([]);
    fetchSubmissions(project._id);
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setSubFormError('');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const newSelected = [...selectedImages];

    for (const file of files) {
      if (newSelected.length >= 5) {
        setSubFormError('Maximum of 5 images allowed per submission.');
        break;
      }
      if (!allowedTypes.includes(file.type)) {
        setSubFormError(`Unsupported file type: "${file.name}". Only JPEG, PNG, and WebP images are allowed.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSubFormError(`File "${file.name}" exceeds the 5 MB limit.`);
        continue;
      }
      if (!newSelected.some((item) => item.file.name === file.name && item.file.size === file.size)) {
        newSelected.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl: URL.createObjectURL(file)
        });
      }
    }

    setSelectedImages(newSelected);
    e.target.value = '';
  };

  // Remove a selected image
  const handleRemoveImage = (idToRemove) => {
    setSelectedImages((prev) => {
      const itemToRemove = prev.find((item) => item.id === idToRemove);
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  // Submit contributor evidence
  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    setSubFormError('');
    setSubFormSuccess('');

    if (!subForm.activityDescription.trim()) {
      setSubFormError('Activity description is required.');
      return;
    }

    if (subForm.activityDescription.trim().length < 5) {
      setSubFormError('Activity description must be at least 5 characters long.');
      return;
    }

    setSubmittingEvidence(true);
    try {
      const formData = new FormData();
      if (subForm.contributorId.trim()) {
        formData.append('contributorId', subForm.contributorId.trim());
      }
      formData.append('activityDescription', subForm.activityDescription.trim());
      if (subForm.capturedLatitude !== '') {
        formData.append('capturedLatitude', subForm.capturedLatitude);
      }
      if (subForm.capturedLongitude !== '') {
        formData.append('capturedLongitude', subForm.capturedLongitude);
      }

      selectedImages.forEach((imgItem) => {
        formData.append('images', imgItem.file);
      });

      const res = await fetch(`${API_BASE_URL}/projects/${selectedProject._id}/submissions`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSubFormSuccess(
        `Evidence record submitted successfully! (${data.evidenceFiles?.length || 0} photo${data.evidenceFiles?.length === 1 ? '' : 's'} attached)`
      );
      setSubForm({
        contributorId: '',
        activityDescription: '',
        capturedLatitude: '',
        capturedLongitude: ''
      });

      selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      setSelectedImages([]);

      await fetchSubmissions(selectedProject._id);
    } catch (err) {
      setSubFormError(err.message || 'Error submitting evidence');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // Admin Project Creation
  const handleCreateProject = async (statusToSet) => {
    setAdminFormError('');
    setAdminFormSuccess('');

    if (!adminForm.name.trim()) {
      setAdminFormError('Project name is required.');
      return;
    }
    if (!adminForm.location.trim()) {
      setAdminFormError('Project location is required.');
      return;
    }

    setAdminSubmitting(true);
    try {
      const payload = {
        name: adminForm.name.trim(),
        description: adminForm.description.trim(),
        location: adminForm.location.trim(),
        latitude: adminForm.latitude !== '' ? Number(adminForm.latitude) : null,
        longitude: adminForm.longitude !== '' ? Number(adminForm.longitude) : null,
        status: statusToSet,
        eligibilityRules: adminForm.eligibilityRules,
        requiredEvidence: adminForm.requiredEvidence
      };

      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      setAdminFormSuccess(`Project "${data.name}" created as ${data.status}.`);
      setAdminForm({
        name: '',
        description: '',
        location: '',
        latitude: '',
        longitude: '',
        eligibilityRules: '',
        requiredEvidence: ''
      });

      await fetchAdminProjects();
      await fetchPublicProjects();
    } catch (err) {
      setAdminFormError(err.message || 'Error creating project');
    } finally {
      setAdminSubmitting(false);
    }
  };

  // Admin Publishing a Draft Project
  const handlePublishProject = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/publish`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish project');

      await fetchAdminProjects();
      await fetchPublicProjects();
    } catch (err) {
      alert(`Publishing failed: ${err.message}`);
    }
  };

  // Handle Review Decision (Approve / Reject / Field Review)
  const handleExecuteReviewDecision = async (submissionId, decisionStatus, note) => {
    setReviewActionError('');
    setReviewActionSuccess('');

    if (decisionStatus === 'rejected' && (!note || !note.trim())) {
      setReviewActionError('Rejection requires a documented reason.');
      return;
    }

    setReviewingId(submissionId);
    try {
      const payload = {
        reviewStatus: decisionStatus,
        reviewNote: note ? note.trim() : null
      };

      const res = await fetch(`${API_BASE_URL}/submissions/${submissionId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update review status');

      setReviewActionSuccess(
        `Submission marked as "${decisionStatus}". Decision timestamp recorded.`
      );
      setActiveActionDialog(null);

      // Refresh all reviews list and project submissions if open
      await fetchAllSubmissions();
      if (selectedProject) {
        await fetchSubmissions(selectedProject._id);
      }
    } catch (err) {
      setReviewActionError(err.message || 'Review decision update failed');
    } finally {
      setReviewingId(null);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchPublicProjects();
    fetchAdminProjects();
    fetchAllSubmissions();
  }, []);

  // Filtered submissions for Review Dashboard
  const filteredSubmissions = allSubmissions.filter((s) => {
    if (reviewFilter === 'all') return true;
    return s.reviewStatus === reviewFilter;
  });

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">AI-Assisted Blockchain Framework for MRV-Based Carbon Credit Issuance</h1>
        <p className="tagline">
          Day 5 Prototype: NGO/Admin Review Workflow & Evidence Verification
        </p>
      </header>

      {/* Backend & DB Health Bar */}
      <section className="status-section">
        <div className="status-row">
          <span className="status-label">API & Database Connection:</span>
          {healthStatus === 'loading' && <span className="badge badge-loading">Connecting...</span>}
          {healthStatus === 'connected' && (
            <span className="badge badge-connected">
              ● Connected {healthDetails?.database ? `(DB: ${healthDetails.database})` : ''}
            </span>
          )}
          {healthStatus === 'error' && <span className="badge badge-error">● Error</span>}
        </div>
      </section>

      {/* Role / Perspective Tabs */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'contributor' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('contributor');
            fetchPublicProjects();
          }}
        >
          Contributor Directory
        </button>
        <button
          className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('admin');
            fetchAdminProjects();
          }}
        >
          NGO Project Management
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('reviews');
            fetchAllSubmissions();
          }}
        >
          NGO Review Dashboard ({allSubmissions.filter((s) => s.reviewStatus === 'pending').length} Pending)
        </button>
      </nav>

      <main>
        {/* TAB 1: Contributor / Public View */}
        {activeTab === 'contributor' && (
          <div>
            {selectedProject ? (
              // Selected Project Detail & Submission Flow
              <div className="detail-view">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                      setSelectedImages([]);
                      setSelectedProject(null);
                    }}
                  >
                    &larr; Back to Published Projects
                  </button>
                  <span className="badge badge-published">● Published Project</span>
                </div>

                <h2 style={{ fontSize: '1.3rem', color: '#f8fafc', marginBottom: '0.4rem' }}>
                  {selectedProject.name}
                </h2>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  📍 {selectedProject.location}{' '}
                  {selectedProject.latitude !== null && selectedProject.longitude !== null && (
                    <span>({selectedProject.latitude}, {selectedProject.longitude})</span>
                  )}
                </div>

                {selectedProject.description && (
                  <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                    {selectedProject.description}
                  </p>
                )}

                {/* Boundary Status */}
                <div className="info-note" style={{ marginBottom: '1.25rem' }}>
                  <strong>Boundary Status:</strong>{' '}
                  {selectedProject.boundary?.coordinates
                    ? `GeoJSON Polygon defined (v${selectedProject.boundaryVersion || 1})`
                    : `No boundary polygon configured (v${selectedProject.boundaryVersion || 1})`}
                </div>

                {/* Eligibility Rules */}
                <div className="req-section" style={{ marginBottom: '1rem' }}>
                  <span className="req-label">Eligibility Requirements:</span>
                  {selectedProject.eligibilityRules?.length > 0 ? (
                    <div className="tag-list">
                      {selectedProject.eligibilityRules.map((rule, idx) => (
                        <span key={idx} className="tag-item">✓ {rule}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>None specified</span>
                  )}
                </div>

                {/* Required Evidence */}
                <div className="req-section" style={{ marginBottom: '1.5rem' }}>
                  <span className="req-label">Required Evidence Types:</span>
                  {selectedProject.requiredEvidence?.length > 0 ? (
                    <div className="tag-list">
                      {selectedProject.requiredEvidence.map((ev, idx) => (
                        <span key={idx} className="tag-item">📎 {ev}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>None specified</span>
                  )}
                </div>

                <hr style={{ borderColor: 'var(--card-border)', margin: '1.5rem 0' }} />

                {/* Contributor Submission Form */}
                <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.75rem' }}>
                  Submit Activity Evidence
                </h3>

                <p className="info-note" style={{ marginBottom: '1rem' }}>
                  Upload evidence photos (JPEG, PNG, WebP up to 5 MB each, max 5 images). Submissions are recorded and queued for NGO review.
                </p>

                <form className="form" onSubmit={handleSubmitEvidence}>
                  <div className="form-group">
                    <label className="label" htmlFor="contributorId">
                      Contributor Identifier (Optional)
                    </label>
                    <input
                      id="contributorId"
                      type="text"
                      className="input"
                      placeholder="e.g. Field Team #104 / Contributor Name"
                      value={subForm.contributorId}
                      onChange={(e) => setSubForm({ ...subForm, contributorId: e.target.value })}
                      disabled={submittingEvidence}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="activityDescription">
                      Activity Description <span className="required">*</span>
                    </label>
                    <textarea
                      id="activityDescription"
                      className="textarea"
                      placeholder="Describe restoration activity, saplings planted, conservation actions, etc..."
                      value={subForm.activityDescription}
                      onChange={(e) => setSubForm({ ...subForm, activityDescription: e.target.value })}
                      disabled={submittingEvidence}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="label" htmlFor="capturedLatitude">
                        Captured Latitude (-90 to 90)
                      </label>
                      <input
                        id="capturedLatitude"
                        type="number"
                        step="any"
                        className="input"
                        placeholder="e.g. 11.4102"
                        value={subForm.capturedLatitude}
                        onChange={(e) => setSubForm({ ...subForm, capturedLatitude: e.target.value })}
                        disabled={submittingEvidence}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label" htmlFor="capturedLongitude">
                        Captured Longitude (-180 to 180)
                      </label>
                      <input
                        id="capturedLongitude"
                        type="number"
                        step="any"
                        className="input"
                        placeholder="e.g. 76.6950"
                        value={subForm.capturedLongitude}
                        onChange={(e) => setSubForm({ ...subForm, capturedLongitude: e.target.value })}
                        disabled={submittingEvidence}
                      />
                    </div>
                  </div>

                  {/* Image Upload Input & Previews */}
                  <div className="form-group">
                    <label className="label">
                      Attach Evidence Photos (Max 5 images, up to 5 MB each)
                    </label>
                    <div className="file-upload-box">
                      <input
                        id="evidenceImagesInput"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageSelect}
                        className="file-input"
                        disabled={submittingEvidence || selectedImages.length >= 5}
                      />
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Supported formats: JPEG, PNG, WebP. Selected: {selectedImages.length}/5
                      </div>

                      {selectedImages.length > 0 && (
                        <div className="preview-grid">
                          {selectedImages.map((imgItem) => (
                            <div key={imgItem.id} className="preview-card">
                              <img src={imgItem.previewUrl} alt={imgItem.file.name} className="preview-img" />
                              <button
                                type="button"
                                className="preview-remove-btn"
                                onClick={() => handleRemoveImage(imgItem.id)}
                                title="Remove image"
                              >
                                ✕
                              </button>
                              <div className="preview-info">
                                <span className="preview-name" title={imgItem.file.name}>
                                  {imgItem.file.name}
                                </span>
                                <span>{(imgItem.file.size / 1024).toFixed(0)} KB</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {subFormError && (
                    <div className="alert-message alert-error">{subFormError}</div>
                  )}

                  {subFormSuccess && (
                    <div className="alert-message alert-success">{subFormSuccess}</div>
                  )}

                  <div>
                    <button
                      type="submit"
                      className="btn"
                      disabled={submittingEvidence}
                    >
                      {submittingEvidence ? 'Submitting Record...' : 'Submit Evidence Record'}
                    </button>
                  </div>
                </form>

                <hr style={{ borderColor: 'var(--card-border)', margin: '1.5rem 0' }} />

                {/* Submissions on this project */}
                <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.75rem' }}>
                  Existing Submissions for this Project ({submissions.length})
                </h3>

                {submissionsLoading && (
                  <div className="state-message">Loading submissions...</div>
                )}

                {submissionsError && (
                  <div className="alert-message alert-error">{submissionsError}</div>
                )}

                {!submissionsLoading && !submissionsError && submissions.length === 0 && (
                  <div className="state-message">
                    No submissions recorded for this project yet. Use the form above to submit your first report.
                  </div>
                )}

                {!submissionsLoading && !submissionsError && submissions.length > 0 && (
                  <div>
                    {submissions.map((sub) => (
                      <div key={sub._id} className="submission-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                            {sub.contributorId ? `👤 ${sub.contributorId}` : '👤 Anonymous Contributor'}
                          </span>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span className={`badge badge-${sub.reviewStatus || 'pending'}`}>
                              Review: {sub.reviewStatus || 'pending'}
                            </span>
                            <span className="badge badge-info">AI: {sub.aiStatus}</span>
                            <span className="badge badge-idle">Location: {sub.locationCheckStatus}</span>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                          {sub.activityDescription}
                        </p>

                        {/* Review History Notes */}
                        {sub.reviewedAt && (
                          <div className="review-history-box">
                            <div>
                              <strong>Review Decision:</strong> <span style={{ textTransform: 'capitalize' }}>{sub.reviewStatus}</span> by {sub.reviewedBy || 'NGO Reviewer'} on {new Date(sub.reviewedAt).toLocaleString()}
                            </div>
                            {sub.reviewNote && (
                              <div>
                                <strong>Note/Reason:</strong> {sub.reviewNote}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Evidence Photos Gallery */}
                        {sub.evidenceFiles && sub.evidenceFiles.length > 0 && (
                          <div className="evidence-gallery">
                            <span className="evidence-gallery-title">
                              Attached Evidence Photos ({sub.evidenceFiles.length}):
                            </span>
                            <div className="evidence-grid">
                              {sub.evidenceFiles.map((ev, i) => (
                                <a
                                  key={i}
                                  href={ev.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="evidence-card"
                                  title={`View full image: ${ev.originalName}`}
                                >
                                  <img src={ev.url} alt={ev.originalName} className="evidence-thumb" />
                                  <div className="evidence-caption">
                                    <span className="evidence-filename" title={ev.originalName}>
                                      {ev.originalName}
                                    </span>
                                    <span className="evidence-filesize">
                                      {(ev.size / 1024).toFixed(0)} KB
                                    </span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="submission-meta">
                          <span>
                            <strong>Coordinates:</strong>{' '}
                            {sub.capturedLatitude !== null && sub.capturedLongitude !== null
                              ? `${sub.capturedLatitude}, ${sub.capturedLongitude}`
                              : 'Not specified'}
                          </span>
                          <span>
                            <strong>Date:</strong> {new Date(sub.createdAt).toLocaleString()}
                          </span>
                          <span>
                            <strong>ID:</strong> {sub._id}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Published Projects List
              <section className="section-box">
                <div className="section-header">
                  <h2 className="section-title">
                    Published Environmental Projects ({publicProjects.length})
                  </h2>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={fetchPublicProjects}
                    disabled={publicLoading}
                  >
                    {publicLoading ? 'Refreshing...' : 'Refresh List'}
                  </button>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                  Contributors: Select a published project folder below to view eligibility details and submit field evidence records with photos.
                </p>

                {publicLoading && (
                  <div className="state-message">Loading published projects...</div>
                )}

                {publicError && (
                  <div className="alert-message alert-error">{publicError}</div>
                )}

                {!publicLoading && !publicError && publicProjects.length === 0 && (
                  <div className="state-message">
                    No published projects available yet. An authorized NGO/admin must publish a project first.
                  </div>
                )}

                {!publicLoading && !publicError && publicProjects.length > 0 && (
                  <div className="projects-list">
                    {publicProjects.map((proj) => (
                      <div key={proj._id} className="project-card">
                        <div className="project-top">
                          <div>
                            <h3 className="project-name">{proj.name}</h3>
                            <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                              📍 {proj.location}
                            </div>
                          </div>
                          <span className="badge badge-published">● Published</span>
                        </div>

                        {proj.description && (
                          <p className="project-desc">{proj.description}</p>
                        )}

                        {/* Eligibility & Evidence Snippets */}
                        {proj.eligibilityRules?.length > 0 && (
                          <div className="req-section">
                            <span className="req-label">Eligibility Rules:</span>
                            <div className="tag-list">
                              {proj.eligibilityRules.map((rule, idx) => (
                                <span key={idx} className="tag-item">✓ {rule}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {proj.requiredEvidence?.length > 0 && (
                          <div className="req-section">
                            <span className="req-label">Required Evidence:</span>
                            <div className="tag-list">
                              {proj.requiredEvidence.map((ev, idx) => (
                                <span key={idx} className="tag-item">📎 {ev}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="project-meta">
                          <span className="meta-item">
                            <strong>Boundary:</strong>{' '}
                            {proj.boundary?.coordinates
                              ? `Polygon (v${proj.boundaryVersion || 1})`
                              : `Not configured (v${proj.boundaryVersion || 1})`}
                          </span>
                          <span className="meta-item">
                            <strong>Created:</strong>{' '}
                            {new Date(proj.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            className="btn"
                            onClick={() => handleSelectProject(proj)}
                          >
                            View & Submit Evidence &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* TAB 2: NGO / Admin Project Management */}
        {activeTab === 'admin' && (
          <div>
            <div className="info-note" style={{ marginBottom: '1.5rem' }}>
              <strong>Admin Mode:</strong> Project folder creation and status management. (Full cryptographic role-based authorization will be integrated in later milestones.)
            </div>

            {/* Admin Project Creation Form */}
            <section className="section-box">
              <div className="section-header">
                <h2 className="section-title">Create Environmental Project Folder</h2>
              </div>

              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateProject('draft');
                }}
              >
                <div className="form-group">
                  <label className="label" htmlFor="admin-name">
                    Project Name <span className="required">*</span>
                  </label>
                  <input
                    id="admin-name"
                    type="text"
                    className="input"
                    placeholder="e.g. Western Ghats Agroforestry Pilot"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    disabled={adminSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="admin-desc">
                    Description
                  </label>
                  <textarea
                    id="admin-desc"
                    className="textarea"
                    placeholder="Comprehensive project objectives and land restoration targets..."
                    value={adminForm.description}
                    onChange={(e) => setAdminForm({ ...adminForm, description: e.target.value })}
                    disabled={adminSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="admin-loc">
                    Location <span className="required">*</span>
                  </label>
                  <input
                    id="admin-loc"
                    type="text"
                    className="input"
                    placeholder="e.g. Wayanad, Kerala, India"
                    value={adminForm.location}
                    onChange={(e) => setAdminForm({ ...adminForm, location: e.target.value })}
                    disabled={adminSubmitting}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label" htmlFor="admin-lat">
                      Latitude (-90 to 90)
                    </label>
                    <input
                      id="admin-lat"
                      type="number"
                      step="any"
                      className="input"
                      placeholder="e.g. 11.6854"
                      value={adminForm.latitude}
                      onChange={(e) => setAdminForm({ ...adminForm, latitude: e.target.value })}
                      disabled={adminSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="admin-lng">
                      Longitude (-180 to 180)
                    </label>
                    <input
                      id="admin-lng"
                      type="number"
                      step="any"
                      className="input"
                      placeholder="e.g. 76.1320"
                      value={adminForm.longitude}
                      onChange={(e) => setAdminForm({ ...adminForm, longitude: e.target.value })}
                      disabled={adminSubmitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="admin-eligibility">
                    Eligibility Requirements (One per line)
                  </label>
                  <textarea
                    id="admin-eligibility"
                    className="textarea"
                    placeholder="e.g.&#10;Land title or tenure agreement verified&#10;Native canopy tree planting only"
                    value={adminForm.eligibilityRules}
                    onChange={(e) => setAdminForm({ ...adminForm, eligibilityRules: e.target.value })}
                    disabled={adminSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="admin-evidence">
                    Required Evidence Types (One per line)
                  </label>
                  <textarea
                    id="admin-evidence"
                    className="textarea"
                    placeholder="e.g.&#10;Geotagged plantation photos&#10;Sapling purchase and planting receipt"
                    value={adminForm.requiredEvidence}
                    onChange={(e) => setAdminForm({ ...adminForm, requiredEvidence: e.target.value })}
                    disabled={adminSubmitting}
                  />
                </div>

                {adminFormError && (
                  <div className="alert-message alert-error">{adminFormError}</div>
                )}

                {adminFormSuccess && (
                  <div className="alert-message alert-success">{adminFormSuccess}</div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={adminSubmitting}
                    onClick={() => handleCreateProject('draft')}
                  >
                    {adminSubmitting ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={adminSubmitting}
                    onClick={() => handleCreateProject('published')}
                  >
                    {adminSubmitting ? 'Saving...' : 'Publish Project'}
                  </button>
                </div>
              </form>
            </section>

            {/* All Projects Management (Admin View) */}
            <section className="section-box">
              <div className="section-header">
                <h2 className="section-title">
                  All Project Folders ({adminProjects.length})
                </h2>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={fetchAdminProjects}
                  disabled={adminLoading}
                >
                  {adminLoading ? 'Refreshing...' : 'Refresh List'}
                </button>
              </div>

              {adminLoading && (
                <div className="state-message">Loading all projects...</div>
              )}

              {adminError && (
                <div className="alert-message alert-error">{adminError}</div>
              )}

              {!adminLoading && !adminError && adminProjects.length === 0 && (
                <div className="state-message">No projects found. Create one above.</div>
              )}

              {!adminLoading && !adminError && adminProjects.length > 0 && (
                <div className="projects-list">
                  {adminProjects.map((proj) => (
                    <div key={proj._id} className="project-card">
                      <div className="project-top">
                        <div>
                          <h3 className="project-name">{proj.name}</h3>
                          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            📍 {proj.location}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`badge badge-${proj.status || 'draft'}`}>
                            ● {proj.status || 'draft'}
                          </span>
                          {proj.status === 'draft' && (
                            <button
                              className="btn btn-small"
                              onClick={() => handlePublishProject(proj._id)}
                            >
                              Publish Now
                            </button>
                          )}
                        </div>
                      </div>

                      {proj.description && (
                        <p className="project-desc">{proj.description}</p>
                      )}

                      <div className="project-meta">
                        <span className="meta-item">
                          <strong>Rules:</strong> {proj.eligibilityRules?.length || 0}
                        </span>
                        <span className="meta-item">
                          <strong>Evidence Types:</strong> {proj.requiredEvidence?.length || 0}
                        </span>
                        <span className="meta-item">
                          <strong>Created:</strong> {new Date(proj.createdAt).toLocaleDateString()}
                        </span>
                        <span className="meta-item">
                          <strong>ID:</strong> {proj._id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 3: NGO Review Dashboard */}
        {activeTab === 'reviews' && (
          <div>
            <div className="info-note" style={{ marginBottom: '1.25rem' }}>
              <strong>NGO Review Dashboard:</strong> Human reviewer interface to audit contributor evidence, inspect field photos, and record approval, rejection, or field verification decisions. (Demonstration prototype mode).
            </div>

            {/* Filter & Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  className={`btn btn-small ${reviewFilter === 'all' ? '' : 'btn-secondary'}`}
                  onClick={() => setReviewFilter('all')}
                >
                  All ({allSubmissions.length})
                </button>
                <button
                  className={`btn btn-small ${reviewFilter === 'pending' ? '' : 'btn-secondary'}`}
                  onClick={() => setReviewFilter('pending')}
                >
                  Pending ({allSubmissions.filter((s) => s.reviewStatus === 'pending').length})
                </button>
                <button
                  className={`btn btn-small ${reviewFilter === 'field_review' ? '' : 'btn-secondary'}`}
                  onClick={() => setReviewFilter('field_review')}
                >
                  Field Review ({allSubmissions.filter((s) => s.reviewStatus === 'field_review').length})
                </button>
                <button
                  className={`btn btn-small ${reviewFilter === 'approved' ? '' : 'btn-secondary'}`}
                  onClick={() => setReviewFilter('approved')}
                >
                  Approved ({allSubmissions.filter((s) => s.reviewStatus === 'approved').length})
                </button>
                <button
                  className={`btn btn-small ${reviewFilter === 'rejected' ? '' : 'btn-secondary'}`}
                  onClick={() => setReviewFilter('rejected')}
                >
                  Rejected ({allSubmissions.filter((s) => s.reviewStatus === 'rejected').length})
                </button>
              </div>

              <button
                className="btn btn-secondary btn-small"
                onClick={fetchAllSubmissions}
                disabled={allSubmissionsLoading}
              >
                {allSubmissionsLoading ? 'Refreshing...' : 'Refresh Reviews'}
              </button>
            </div>

            {reviewActionError && (
              <div className="alert-message alert-error" style={{ marginBottom: '1rem' }}>
                {reviewActionError}
              </div>
            )}

            {reviewActionSuccess && (
              <div className="alert-message alert-success" style={{ marginBottom: '1rem' }}>
                {reviewActionSuccess}
              </div>
            )}

            {allSubmissionsLoading && (
              <div className="state-message">Loading submissions for review...</div>
            )}

            {allSubmissionsError && (
              <div className="alert-message alert-error">{allSubmissionsError}</div>
            )}

            {!allSubmissionsLoading && !allSubmissionsError && filteredSubmissions.length === 0 && (
              <div className="state-message">
                No submissions found for the selected filter "{reviewFilter}".
              </div>
            )}

            {!allSubmissionsLoading && !allSubmissionsError && filteredSubmissions.length > 0 && (
              <div className="projects-list">
                {filteredSubmissions.map((sub) => (
                  <div key={sub._id} className="project-card">
                    {/* Header */}
                    <div className="project-top">
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                          📁 Project: {sub.projectId?.name || 'Unknown Project'}
                        </div>
                        <h3 className="project-name" style={{ fontSize: '1rem', marginTop: '0.2rem' }}>
                          {sub.contributorId ? `👤 ${sub.contributorId}` : '👤 Anonymous Contributor'}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Submitted on {new Date(sub.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                        <span className={`badge badge-${sub.reviewStatus || 'pending'}`}>
                          ● Review: {sub.reviewStatus || 'pending'}
                        </span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>AI: {sub.aiStatus}</span>
                          <span className="badge badge-idle" style={{ fontSize: '0.75rem' }}>Loc: {sub.locationCheckStatus}</span>
                        </div>
                      </div>
                    </div>

                    {/* Activity Description */}
                    <div style={{ background: '#090d16', padding: '0.75rem', borderRadius: '6px', border: '1px solid #1e293b' }}>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem', fontWeight: 600 }}>
                        Activity Description:
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#f8fafc', lineHeight: '1.4' }}>
                        {sub.activityDescription}
                      </p>
                    </div>

                    {/* Location coordinates */}
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      <strong>Coordinates:</strong>{' '}
                      {sub.capturedLatitude !== null && sub.capturedLongitude !== null
                        ? `${sub.capturedLatitude}, ${sub.capturedLongitude}`
                        : 'Not specified'}
                    </div>

                    {/* Evidence Photos */}
                    {sub.evidenceFiles && sub.evidenceFiles.length > 0 && (
                      <div className="evidence-gallery">
                        <span className="evidence-gallery-title">
                          Attached Evidence Photos ({sub.evidenceFiles.length}):
                        </span>
                        <div className="evidence-grid">
                          {sub.evidenceFiles.map((ev, i) => (
                            <a
                              key={i}
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="evidence-card"
                              title={`View full image: ${ev.originalName}`}
                            >
                              <img src={ev.url} alt={ev.originalName} className="evidence-thumb" />
                              <div className="evidence-caption">
                                <span className="evidence-filename" title={ev.originalName}>
                                  {ev.originalName}
                                </span>
                                <span className="evidence-filesize">
                                  {(ev.size / 1024).toFixed(0)} KB
                                </span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prior Review History Note if present */}
                    {sub.reviewedAt && (
                      <div className="review-history-box">
                        <div>
                          <strong>Review Record:</strong> Status set to <span style={{ textTransform: 'capitalize' }}>{sub.reviewStatus}</span> on {new Date(sub.reviewedAt).toLocaleString()}
                        </div>
                        {sub.reviewNote && (
                          <div>
                            <strong>Decision Note / Reason:</strong> {sub.reviewNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Review Decision Controls */}
                    <div className="review-panel">
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        Review Decision Actions:
                      </div>

                      {/* Main Decision Buttons */}
                      <div className="review-btn-group">
                        <button
                          type="button"
                          className="btn btn-approve btn-small"
                          disabled={reviewingId === sub._id}
                          onClick={() => setActiveActionDialog({ id: sub._id, type: 'approve', note: '' })}
                        >
                          ✓ Approve Submission
                        </button>

                        <button
                          type="button"
                          className="btn btn-field-review btn-small"
                          disabled={reviewingId === sub._id}
                          onClick={() => setActiveActionDialog({ id: sub._id, type: 'field_review', note: '' })}
                        >
                          🔍 Flag for Field Review
                        </button>

                        <button
                          type="button"
                          className="btn btn-reject btn-small"
                          disabled={reviewingId === sub._id}
                          onClick={() => setActiveActionDialog({ id: sub._id, type: 'reject', note: '' })}
                        >
                          ✕ Reject Submission
                        </button>
                      </div>

                      {/* Inline Decision Dialog */}
                      {activeActionDialog && activeActionDialog.id === sub._id && (
                        <div className="review-dialog">
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                            {activeActionDialog.type === 'approve' && 'Confirm Approval'}
                            {activeActionDialog.type === 'reject' && 'Specify Rejection Reason (Required)'}
                            {activeActionDialog.type === 'field_review' && 'Flag for In-Person Field Verification'}
                          </div>

                          <textarea
                            className="textarea"
                            placeholder={
                              activeActionDialog.type === 'reject'
                                ? 'Document the specific reason for rejecting this evidence record (required)...'
                                : activeActionDialog.type === 'field_review'
                                ? 'Explain why in-person physical audit is requested (e.g. uncertain boundaries, canopy mismatch)...'
                                : 'Optional approval notes (e.g. verified saplings meet criteria)...'
                            }
                            value={activeActionDialog.note}
                            onChange={(e) => setActiveActionDialog({ ...activeActionDialog, note: e.target.value })}
                            disabled={reviewingId === sub._id}
                          />

                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              disabled={reviewingId === sub._id}
                              onClick={() => setActiveActionDialog(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className={`btn btn-small ${
                                activeActionDialog.type === 'approve'
                                  ? 'btn-approve'
                                  : activeActionDialog.type === 'reject'
                                  ? 'btn-reject'
                                  : 'btn-field-review'
                              }`}
                              disabled={reviewingId === sub._id}
                              onClick={() => {
                                handleExecuteReviewDecision(
                                  sub._id,
                                  activeActionDialog.type === 'approve'
                                    ? 'approved'
                                    : activeActionDialog.type === 'reject'
                                    ? 'rejected'
                                    : 'field_review',
                                  activeActionDialog.note
                                );
                              }}
                            >
                              {reviewingId === sub._id ? 'Saving Decision...' : 'Confirm Decision'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
