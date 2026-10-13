# AI-Assisted Blockchain Framework for MRV-Based Carbon Credit Issuance
## Persistent Project Brief + Day 1 Build Guide

**Developer setup:** Antigravity IDE + Gemini 3.8 Flash coding agent  
**Current status:** Starting from scratch  
**Review target:** Within one month  
**Working rule:** Build a small, reliable end-to-end demonstration. Do not attempt to build a production carbon-credit marketplace in one month.

---

## 1. Project idea

The project demonstrates how AI-assisted evidence review, human verification, and blockchain record-keeping can work together in a prototype Monitoring, Reporting, and Verification (MRV) workflow.

A contributor submits a restoration/conservation project with basic details, coordinates, and an image. An AI model later classifies the image and returns a confidence score. Low-confidence cases are flagged for human field review. An NGO/admin reviewer makes the final approval or rejection decision. Only approved projects can proceed to a smart contract that records a **demonstration token issuance** on a local blockchain. The interface shows project status and transaction history.

### Intended demo flow

1. Contributor submits a project.
2. The system stores project details and an evidence image.
3. Later, an AI service returns a class and confidence score.
4. Low-confidence predictions are flagged for field review.
5. NGO/admin approves or rejects the project.
6. An approved project may issue a demo token through a smart contract.
7. The dashboard displays status, issuance result, and transaction hash.

### Important scope and honesty rules

- AI image classification is **not** a measurement of carbon removal.
- A model confidence score is **not** a carbon-credit quantity.
- A GPS point alone does not define a land boundary or calculate area.
- Prototype tokens are **not certified or tradable carbon credits**.
- Any sample quantity must be labelled as demonstration data, never as a verified environmental outcome.
- Blockchain can make recorded transactions traceable; it cannot prove that the original image or claim is true.
- Do not claim regulatory compliance, verified carbon reductions, or production-grade security.

---

## 2. Recommended stack

Use this stack unless a real blocker appears. Keep the first day smaller than the full stack.

| Component | Choice | When |
|---|---|---|
| Frontend | React + Vite | Day 1 |
| Styling | Tailwind CSS | Day 1 only if setup is straightforward; otherwise plain CSS first |
| Backend | Node.js + Express | Day 1 |
| Database | MongoDB | After frontend/backend connectivity works |
| AI | Python + pretrained image classifier | Week 2 |
| Blockchain | Solidity + Hardhat local network | Week 3 |
| Evidence storage | Local uploads for the prototype | After basic API works |
| GIS/map | Coordinates first; simple visualization if time permits | Later, only after core flow works |

**Day 1 does not need:** MongoDB, Python, AI model, Solidity, Hardhat, IPFS, Docker, cloud deployment, authentication, marketplace, payment gateway, satellite imagery, or complex GIS.

---

## 3. What to do

- Work in small, verifiable increments.
- Inspect the existing project files before creating or changing files.
- Prefer the simplest implementation that satisfies the current milestone.
- Keep frontend and backend responsibilities clear.
- Use environment variables for configuration and never commit secrets.
- Make errors visible and actionable.
- Run the relevant development commands after changes.
- Ask the coding agent to report what it changed, what it ran, and what remains unverified.
- Commit working milestones to Git if Git is available.
- Keep a small `README.md` with setup/run instructions as the project grows.
- Use prepared sample images and records for a repeatable panel demo.
- Implement approval and duplicate-issuance rules on the server/contract, not only by hiding UI buttons.

## 4. What not to do

- Do not ask the coding agent to build the entire project in one enormous prompt.
- Do not add libraries or architecture “just in case.”
- Do not introduce multiple backend frameworks.
- Do not train a custom AI model from scratch unless the pretrained approach genuinely fails and there is enough time.
- Do not implement trading, payments, ownership marketplace, IPFS, satellite processing, or many role-specific dashboards before the core demo works.
- Do not hardcode fake transaction hashes or display a database update as if it were a blockchain transaction.
- Do not let a user issue tokens simply by changing frontend state.
- Do not expose private keys, API keys, database credentials, or `.env` contents.
- Do not claim a command, test, or feature works unless it was actually run or otherwise verified.
- Do not overwrite existing files blindly; inspect them first.
- Do not treat a prediction as proof of real-world environmental impact.

---

## 5. One-month implementation roadmap

### Week 1 — Application foundation
- Day 1: Scaffold React/Vite frontend and Express backend; verify they communicate.
- Day 2: Add MongoDB and save/list project records.
- Day 3: Add a basic project form and project list.
- Day 4: Add image upload and project detail view.
- Day 5: Add review status and NGO/admin screen.
- Days 6–7: Fix bugs and test persistence.

**Milestone:** A project can be submitted, saved, listed, and reviewed.

### Week 2 — AI + MRV workflow
- Integrate a small Python prediction service with a pretrained classifier.
- Return predicted class and confidence score.
- Save predictions with the project.
- Use a configurable confidence threshold to flag uncertain results.
- Add field-review notes/status and NGO approval/rejection.

**Milestone:** The app displays an actual model result and a working review flow.

### Week 3 — Blockchain issuance
- Create a small Solidity contract with an authorized issuer.
- Run it on a local Hardhat network.
- Enforce approval before issuance and prevent duplicate issuance.
- Call the contract from the backend.
- Show the real transaction hash returned by the local blockchain.

**Milestone:** Approved projects can issue a demo token; unapproved/duplicate issuance fails.

### Week 4 — Integration, testing, presentation
- Connect all steps into one flow.
- Add basic coordinates/location display if time permits.
- Test rejected projects, low-confidence cases, duplicate issuance, and blockchain errors.
- Prepare a few sample projects and a short demo script.
- Reserve the final two days for bug fixes and rehearsal.

**Milestone:** The full workflow can be demonstrated reliably from a clean start.

---

## 6. Day 1: exact goal

**Goal:** Create the smallest working frontend/backend project and verify that the frontend can call the backend.

### Suggested folder layout

```text
mrv-carbon-demo/
  frontend/
  backend/
  .gitignore
  README.md
  DAY1_PROJECT_GUIDE.md
```

The coding agent may use a slightly different layout if it has a clear reason, but it should explain that reason before making a major structural change.

### Day 1 tasks

1. Inspect the current folder and available Node/npm versions.
2. Create a React + Vite frontend.
3. Create a Node.js + Express backend.
4. Add a simple health endpoint such as `GET /api/health`.
5. Show a small frontend page with:
   - Project title
   - Short one-sentence explanation
   - Backend connection status
   - A button to check the backend again
6. Configure the frontend API URL through an environment variable or a Vite development proxy. Do not scatter hardcoded URLs through the app.
7. Add a basic `.gitignore` for dependencies, environment files, uploads, and generated build output.
8. Add concise run instructions to `README.md`.
9. Run frontend and backend and verify the health endpoint and browser UI.
10. Stop. Do not start MongoDB, AI, or blockchain today.

### Day 1 acceptance checklist

- [ ] Frontend starts without errors.
- [ ] Backend starts without errors.
- [ ] `GET /api/health` returns a small JSON success response.
- [ ] Frontend can fetch the health endpoint and display “Connected” or a useful error.
- [ ] The UI can retry the health check.
- [ ] Run commands and ports are documented in the README.
- [ ] No secrets are committed.
- [ ] The agent reports the actual commands and outcomes.

If Node.js is not installed, report that clearly and provide the official installation steps rather than pretending the project ran.

---

## 7. Copy-paste prompt for Gemini 3.8 Flash in Antigravity

Paste this prompt into the coding agent from the project workspace:

> You are helping me build a final-year prototype titled **“An AI-Assisted, Blockchain Framework for MRV-Based Carbon Credit Issuance.”** I am developing solo in Antigravity IDE, and the review is within one month. My priority is a reliable working demo, not a production marketplace.
>
> **First task: Day 1 scaffold only.**
>
> Before changing anything:
> 1. Inspect the current workspace files and folders.
> 2. Check whether Node.js and npm are available using terminal commands if terminal access is available.
> 3. Briefly state the proposed file changes and commands.
> 4. Preserve existing work; do not overwrite files blindly.
>
> Build only:
> - A React + Vite frontend in `frontend/`.
> - A Node.js + Express backend in `backend/`.
> - A backend `GET /api/health` endpoint returning a small JSON response, for example `{ "status": "ok", "service": "mrv-carbon-demo-api" }`.
> - A simple frontend page showing the project title, a brief description, and backend connection status.
> - A “Check connection” button that calls the health endpoint and displays Connected or a useful error.
> - A clean way to configure the API URL (prefer a Vite development proxy or a documented environment variable; avoid scattering hardcoded URLs).
> - A root `.gitignore` and a concise `README.md` with exact install/run commands.
>
> **Constraints:**
> - Do not implement MongoDB, authentication, image upload, Python/AI, Solidity, Hardhat, IPFS, Docker, deployment, payment, or marketplace features today.
> - Keep dependencies minimal. Do not add a UI framework or extra libraries unless necessary.
> - Do not invent credentials or include secrets.
> - Do not create fake AI predictions or fake blockchain transactions.
> - Keep the code beginner-readable and modular, with clear error handling.
> - Do not silently change the requested stack.
>
> **Verification:**
> - Install dependencies only if the environment permits and the packages are required.
> - Run the frontend and backend checks that are available.
> - Test the health endpoint using a real request if possible.
> - Report the exact commands run and their actual results. If a command cannot be run, say so.
> - List created/modified files, unresolved issues, and the exact next command I should run.
> - Do not claim success unless verified.
>
> Stop after the Day 1 scaffold is complete. Do not continue into Day 2 without asking me.

---

## 8. How to work with the coding agent each day

At the start of a session, tell it the current milestone and ask it to inspect the workspace. Give it one focused task, then ask it to test the result before moving on.

If it proposes a large rewrite, extra services, or a feature outside the current milestone, tell it:

> Keep the current scope. Explain why this change is necessary before implementing it. Prefer the smallest safe change, preserve working code, and verify the result.

### End-of-session note template

Update this section or keep a separate `PROGRESS.md`:

```text
Date:
Milestone:
What works:
Files changed:
Commands/tests run:
Actual results:
Known issues:
Next smallest task:
```

**Definition of success:** a small demo that works consistently and clearly distinguishes AI-assisted review, human approval, and blockchain record-keeping from real-world carbon certification.
