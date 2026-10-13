# Project Progress & Memory Log

This document tracks completed milestones, verified commands, architecture decisions, and remaining tasks across development sessions.

---

## Session 1: Day 1 Scaffold

**Date:** 2026-10-13  
**Milestone:** Day 1 — Application Foundation (Scaffold React/Vite frontend and Express backend; verify communication)

### What Works & Verification Results
- [x] Node.js (`v22.17.0`) and npm (`11.8.0`) verified in environment.
- [x] Backend dependencies installed cleanly (`added 71 packages, 0 vulnerabilities`).
- [x] Frontend dependencies installed cleanly (`added 63 packages`).
- [x] Frontend builds with zero errors (`vite build` completed in 1.07s).
- [x] Backend server running on `http://localhost:5000`.
- [x] Direct endpoint check via `Invoke-RestMethod -Uri http://localhost:5000/api/health` passed.
- [x] Vite dev proxy check via `Invoke-RestMethod -Uri http://localhost:3000/api/health` passed.
- [x] Live browser verification confirmed initial connection and retry button.

---

## Session 2: Day 2 — MongoDB Persistence & Project Registration

**Date:** 2026-10-13  
**Milestone:** Day 2 — Database Persistence (Connect MongoDB, implement Project schema, POST/GET API, React registration form, and persistent project list)

### What Works & Verification Results
- [x] **MongoDB Verification:** Windows Service `MongoDB` is installed, active, and listening on `127.0.0.1:27017` (`TcpTestSucceeded : True`).
- [x] **Mongoose Integration:** Added `mongoose` to backend dependencies (`added 19 packages, 0 vulnerabilities`).
- [x] **Database Module & Env:** Created `backend/config/db.js` with timeout handling and honest connection reporting. Created `backend/.env` with `MONGO_URI=mongodb://127.0.0.1:27017/mrv_carbon_demo`.
- [x] **Project Schema & Model:** Created `backend/models/Project.js`.
- [x] **Backend API Endpoints:** `GET /api/health`, `POST /api/projects`, `GET /api/projects`.
- [x] **Frontend UI & Persistence:** Created registration form and project listing; confirmed MongoDB persistence.

---

## Session 3: Day 3 — Shared-Project Workflow & Contributor Submissions

**Date:** 2026-10-13  
**Milestone:** Day 3 — Product Concept Refactor (Shared project folder model, draft/publish lifecycle, and linked contributor submissions)

### What Works & Verification Results
- [x] **Project Model Extended (`backend/models/Project.js`):** Supported `status` (`draft`, `published`, `closed`), `eligibilityRules`, `requiredEvidence`, `boundary` (GeoJSON), `boundaryVersion`.
- [x] **Submission Model Created (`backend/models/Submission.js`):** Linked to `Project`, tracking statuses.
- [x] **Backend API Endpoints:** `GET /api/projects?status=published`, `PATCH /api/projects/:id/publish`, `POST /api/projects/:projectId/submissions`.
- [x] **Frontend Refactor:** Tabbed Contributor Directory vs NGO Admin Workspace.

---

## Session 4: Day 4 — Local Evidence Image Uploads

**Date:** 2026-10-13  
**Milestone:** Day 4 — Local Image Uploads & Metadata Persistence (Multer upload middleware, server-side validation, static serving, frontend multi-image preview, and evidence galleries)

### What Works & Verification Results
- [x] **Upload Middleware & Storage (`backend/middleware/upload.js`):** Multer storage in `backend/uploads/` with safe filenames and 5 MB / 5-image limits.
- [x] **Submission Model Update (`backend/models/Submission.js`):** Defined typed subdocuments in `evidenceFiles`.
- [x] **Frontend Multi-Image Selector & Gallery:** Immediate previews with remove buttons; persistent gallery on submission cards.

---

## Session 5: Day 5 — NGO/Admin Submission Review Workflow

**Date:** 2026-10-13  
**Milestone:** Day 5 — Review Decision Workflow (Global submission auditing, approval, rejection with mandatory reason, field review flagging, and review notes)

### What Works & Verification Results
- [x] **Submission Model Extended (`backend/models/Submission.js`):**
  - Updated `reviewStatus` enum to `['pending', 'approved', 'rejected', 'field_review']`.
  - Added `reviewNote`: optional/required string for decision notes and rejection reasons.
  - Added `reviewedAt`: timestamp recorded at decision time.
  - Added `reviewedBy`: string indicating reviewer identity (`NGO Reviewer (Demo)`).
- [x] **Backend API Endpoints:**
  - `GET /api/submissions`: returns all submissions across projects with populated `projectId` (`name`, `location`, `status`), sorted newest first; supports `?reviewStatus=...` filter.
  - `PATCH /api/submissions/:id/review`:
    - Validates status is `approved`, `rejected`, or `field_review`.
    - Enforces that `rejected` decisions must include a non-empty `reviewNote` (rejection reason), returning `400 Bad Request` if omitted.
    - Returns `404 Not Found` for nonexistent submissions.
    - Returns `400 Bad Request` for invalid statuses.
    - Records `reviewedAt` timestamp, preserves existing evidence files, coordinates, AI status, and location status.
- [x] **Frontend Review Dashboard (`frontend/src/App.jsx` & `frontend/src/index.css`):**
  - Added dedicated navigation tab: **NGO Review Dashboard**.
  - Review status filters: `All`, `Pending`, `Field Review`, `Approved`, `Rejected` with live counts.
  - Submissions cards display project name, contributor handle, activity description, attached evidence photo gallery, coordinates, and status badges.
  - Review action buttons:
    - **✓ Approve Submission**: saves approval status with optional note.
    - **✕ Reject Submission**: requires rejection reason input before confirmation.
    - **🔍 Flag for Field Review**: provides note input for ground audit instructions.
  - Loading states prevent duplicate clicks while an update is in progress.
  - Displays decision history box with reviewer identity, decision date, and review note.
- [x] **Build & API Verification:**
  - Frontend production build succeeded (`vite build` finished in 732ms with 0 errors).
  - Backend API tested via Node script:
    - `GET /api/submissions`: returned all submissions with populated project details.
    - Rejection without reason: rejected with `400 Bad Request` (`"A rejection reason is required when rejecting a submission."`).
    - Rejection with reason: succeeded with `200 OK`, saved `reviewNote`.
    - Flag for field review: succeeded with `200 OK`, status set to `field_review`.
    - Approval: succeeded with `200 OK`, status set to `approved`.
    - Invalid status: rejected with `400 Bad Request` (`"Invalid review status..."`).
    - Non-existent submission ID: rejected with `404 Not Found`.
  - Live browser agent verified end-to-end:
    - Rejection validation error displayed on empty reject attempt.
    - Entered `"Evidence photos missing required sapling tags."` &rarr; status badge updated to `rejected`.
    - Flagged for field review with note `"Irregular tree spacing observed on slope; ground audit required."` &rarr; status badge updated to `field_review`.
    - Page reload (`F5`) confirmed all decisions, notes, and counts persisted directly from MongoDB.

### Project Structure Created / Modified
```text
CODE/
├── DAY1_PROJECT_GUIDE.md     # Reference guide and multi-week roadmap
├── PROGRESS.md               # Updated with Session 5 memory log
├── README.md                 # Updated with Day 5 review workflow and endpoints
├── .gitignore                # Git ignore rules
├── backend/
│   ├── .env                  # Local MongoDB connection URI (ignored by git)
│   ├── .env.example          # Sample environment config placeholder
│   ├── package.json          # Express, CORS, dotenv, mongoose, multer
│   ├── server.js             # API with /api/submissions and /api/submissions/:id/review
│   ├── config/
│   │   └── db.js             # Mongoose connection manager
│   ├── middleware/
│   │   └── upload.js         # Multer configuration & disk cleanup
│   ├── models/
│   │   ├── Project.js        # Project schema and model
│   │   └── Submission.js     # Extended with reviewNote, reviewedAt, reviewedBy, field_review
│   └── uploads/              # Local evidence image uploads
└── frontend/
    ├── .env.example          # Frontend env config
    ├── index.html            # Main HTML entry point
    ├── package.json          # React, Vite
    ├── vite.config.js        # Vite config with /api and /uploads dev proxies
    └── src/
        ├── App.jsx           # App with Contributor, Project Admin, and NGO Review Dashboard tabs
        ├── index.css         # Styling for review panel, decision dialogs, and badges
        └── main.jsx          # React DOM entry point
```

### Constraints Honored
- No AI image classification, Python, blockchain, Solidity, Hardhat, token issuance, IPFS, geolocation, polygon validation, or demo scenario buttons added today.
- No fake AI predictions or fake carbon-credit quantities generated.
- No insecure authentication claims made; explicitly presented as prototype demo workflow.
- All Day 1–4 features preserved intact.

### Known Issues & Unresolved Items
- None. Day 5 acceptance criteria are 100% satisfied and verified.

### Next Exact Task (Day 6–7 / Next Milestone)
- End of Week 1 Milestone: Final application review, bug fixes, edge-case hardening, or preparation for Week 2 (AI classification service integration).
- Note: Await user instruction before proceeding.
