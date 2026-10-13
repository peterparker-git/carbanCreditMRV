# AI-Assisted Blockchain Framework for MRV-Based Carbon Credit Issuance

Prototype demonstrating an end-to-end Monitoring, Reporting, and Verification (MRV) workflow with AI-assisted evidence review, human verification, and blockchain record-keeping.

---

## Current Architecture (Day 5 Milestone)

- **Frontend:** React + Vite (Port `3000`)
- **Backend:** Node.js + Express (Port `5000`)
- **Database:** MongoDB via Mongoose (tested on `mongodb://127.0.0.1:27017/mrv_carbon_demo`)
- **File Storage:** Local evidence uploads managed via Multer (`backend/uploads/`), served at `/uploads/*`
- **API & Upload Proxies:** Vite dev proxy forwards both `/api/*` and `/uploads/*` to `http://localhost:5000`
- **Workflow Model:** Shared project folder model. NGOs/Admins publish projects; contributors submit activity evidence records with field photos; NGO/Admins audit submissions across projects and record review decisions (`approved`, `rejected`, `field_review`).

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ or v20+ recommended, tested on v22.17.0)
- npm (tested on 11.8.0)
- **MongoDB**: Local MongoDB Windows service on port 27017 or MongoDB Atlas connection string.

---

## Environment Configuration

### Backend (`backend/.env`)
```env
PORT=5000
# Local MongoDB connection (default):
MONGO_URI=mongodb://127.0.0.1:27017/mrv_carbon_demo
```
> **Note:** `.env` and `backend/uploads/` are ignored by Git in `.gitignore` to prevent secret and media leakage.

---

## Installation & Setup

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Running the Project

Open two separate terminal windows:

### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```
*Backend server runs at:* `http://localhost:5000`  
*Health endpoint:* `http://localhost:5000/api/health`

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```
*Frontend app runs at:* `http://localhost:3000`

---

## Available API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns backend service and MongoDB connection state (`connected` / `disconnected`). |
| `GET` | `/api/projects` | Returns all projects (supports `?status=published` query filter). |
| `GET` | `/api/projects/:id` | Returns single project details by MongoDB ObjectId. |
| `POST` | `/api/projects` | NGO/Admin creates a project (`name`, `description`, `location`, `latitude`, `longitude`, `status`, `eligibilityRules`, `requiredEvidence`, `boundary`). |
| `PATCH` | `/api/projects/:id/publish` | Publishes a draft project. |
| `POST` | `/api/projects/:projectId/submissions` | Submits activity evidence with optional multipart images (`images`, max 5, <= 5 MB each). Enforces that project must be published. |
| `GET` | `/api/projects/:projectId/submissions` | Lists all submissions associated with a project (newest first). |
| `GET` | `/api/submissions` | Lists all submissions across projects with populated project details (supports `?reviewStatus=...` query filter). |
| `PATCH` | `/api/submissions/:id/review` | Updates a submission's review status (`approved`, `rejected`, `field_review`). Rejections require a documented reason. |
| `GET` | `/uploads/:filename` | Static file serving for verified evidence photos. |

---

## NGO/Admin Review Workflow (Day 5)

1. **Review Dashboard:**
   - Unified review workspace displaying contributor submissions across all projects.
   - Filterable by review status: `All`, `Pending`, `Field Review`, `Approved`, `Rejected`.
   - Displays project name, location, contributor identifier, submission timestamp, activity description, and attached evidence photo gallery.
2. **Review Decisions:**
   - **Approve:** Marks submission as `approved` with an optional reviewer note.
   - **Reject:** Enforces entry of a documented rejection reason before saving (`rejected`).
   - **Flag for Field Review:** Flags submission for in-person inspection with an explanation note (`field_review`).
3. **Data Integrity & Traceability:**
   - Records `reviewedAt` timestamp and reviewer metadata.
   - Preserves all original evidence image links, coordinates, AI statuses, and location-check statuses.
   - All review decisions persist across browser reloads from MongoDB.
