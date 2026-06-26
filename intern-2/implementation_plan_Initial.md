# Phase 5 — Implementation Plan
## Batch Traceability, QR Management, and Dispatch Intelligence System
**Project**: HimShakti Food Processing — Intern 2  
**Version**: 1.1.0  
**Date**: 2026-06-25 *(Updated from 2026-06-11)*
**Author**: Documentation Lead  
**Timeline**: 6 Weeks (Standard Internship Window)
**Status**: Week 4 Complete — Backend API Implemented

---

## 1. Executive Summary

This document defines the complete execution roadmap for building the Batch Traceability, QR Management, and Dispatch Intelligence System. It translates all requirements from the SRS, Planning Report, and System Design into concrete, time-boxed development tasks.

The plan is structured around the principle that **working software is delivered incrementally**, not all at once. Each week ends with a verifiable, testable deliverable — not just completed code files.

**Core implementation priority order:**
1. Database foundation and schema
2. Backend REST API (auth, batches, QR engine)
3. Frontend Manager Dashboard
4. Public Traceability Page
5. AI Advisory Layer (Gemini integration)
6. Testing, deployment, and documentation polish

---

## 2. Pre-Conditions Before Development Starts

The following must be in place before Week 1 coding begins:

| Pre-Condition | Owner | Verification |
| :--- | :--- | :--- |
| MongoDB Atlas cluster created (shared with Intern 1) | Both Interns | Confirm cluster URL is accessible from local machine |
| `.env` file template agreed upon between Intern 1 and Intern 2 | Both Interns | Shared `env.example` committed to a common reference doc |
| `products` collection schema confirmed with Intern 1 | Intern 1 | At least 3 seed product records must exist with `baseShelfLifeDays` populated |
| Google Gemini API key acquired | Intern 2 | Test `curl` call returns a valid text response |
| Git repository initialized with `.gitignore` | Intern 2 | `node_modules/` and `.env` are confirmed excluded |
| Deployment platform account created (Render for backend, Vercel for frontend) | Intern 2 | Login confirmed, free tier active |

---

## 3. Repository and Folder Structure

```
himshakti-intern2/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, env validation
│   │   ├── models/          # Mongoose schemas: Batch, ScanEvent, AiAudit
│   │   ├── controllers/     # Route handler logic
│   │   ├── routes/          # Express router definitions
│   │   ├── middleware/       # Auth guard, error handler
│   │   ├── services/        # QR generator, Gemini service, priority calculator
│   │   └── utils/           # Date helpers, ip-hash utility
│   ├── tests/               # Unit and integration tests
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client and API call wrappers
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages (Dashboard, AddBatch, Trace, Analytics)
│   │   ├── context/         # Auth context (React Context API)
│   │   └── utils/           # Date formatters, status badge helpers
│   ├── public/
│   └── vite.config.js
│
└── README.md
```

**Why this structure?**
- Clean separation of concerns between `services/` (business logic) and `controllers/` (request routing).
- `services/` is independently testable without HTTP overhead.
- Frontend `api/` layer centralizes all Axios calls, making mock injection in tests straightforward.

---

## 4. Week-by-Week Build Plan

---

### WEEK 1 — Foundation: Environment, Database, and Backend Skeleton

**Goal**: A working Node.js server connected to MongoDB Atlas with confirmed schema setup and seed data.

**Deliverable at Week End**: Backend server starts without error. Calling `GET /api/v1/products` returns at least 3 product records from the shared database.

#### Task Breakdown

| Task ID | Task | Description | Priority |
| :--- | :--- | :--- | :--- |
| W1-T1 | Initialize backend project | `npm init`, install Express, Mongoose, dotenv, cors, bcrypt, jsonwebtoken, qrcode, @google/generative-ai | P0 |
| W1-T2 | Set up Express server scaffold | Create `server.js`, health check route `GET /health`, confirm port binding | P0 |
| W1-T3 | Configure MongoDB Atlas connection | Write `config/db.js` with proper connection string handling. Log success/failure. Verify Atlas whitelist. | P0 |
| W1-T4 | Define Mongoose schemas | Create `models/Batch.js`, `models/ScanEvent.js`, `models/AiAudit.js` — exactly matching the SRS field definitions | P0 |
| W1-T5 | Seed product data | Write a one-time `seed.js` script to insert 3+ HimShakti product records into `products` collection (coordinate with Intern 1 for schema alignment) | P0 |
| W1-T6 | Implement `GET /api/v1/products` | Query active products from shared `products` collection and return as JSON array | P1 |
| W1-T7 | Set up `.env.example` | Document all required keys: `MONGO_URI`, `JWT_SECRET`, `PORT`, `PUBLIC_BASE_URL`, `GEMINI_API_KEY` | P1 |

**Week 1 Checkpoint — PASS criteria:**
- [ ] `node server.js` starts without crash
- [ ] `GET /health` returns `{ status: "ok" }`
- [ ] `GET /api/v1/products` returns at least 3 product documents
- [ ] MongoDB Atlas connection confirmed via connection log message
- [ ] All schema fields match the SRS specification

---

### WEEK 2 — Core API: Batch CRUD, Expiry Logic, QR Engine

**Goal**: The most critical backend feature is complete. The system can create a batch record with correct expiry dates and generate a valid QR code.

**Deliverable at Week End**: Using Postman/Thunder Client, calling `POST /api/v1/batches` with valid payload returns a batch object containing `expiryDate`, `batchCode`, `qrAbsoluteUrl`, and `qrCodeDataUrl`.

#### Task Breakdown

| Task ID | Task | Description | Priority |
| :--- | :--- | :--- | :--- |
| W2-T1 | Implement Batch Code Generator | Write `utils/batchCodeGen.js` that auto-generates codes in the format `HS-[YYYY]-[MM]-[sequential-3digit]`. Use a counter query to determine the next index. | P0 |
| W2-T2 | Implement Expiry Calculation Service | Write `services/expiryCalculator.js`. Enforce the 3-branch decision tree (predicted → fallback → block). Return `{ expiryDate, dataSource, shelfLifeSource }`. | P0 |
| W2-T3 | Implement Priority Score Calculator | Write `services/priorityCalculator.js`. Apply the formula: `100 - min(100, daysRemaining * 2) + riskPenalty`. | P0 |
| W2-T4 | Implement QR Code Service | Write `services/qrService.js`. Read `PUBLIC_BASE_URL` from env, construct the trace URL, call `qrcode.toDataURL()`, return the base64 PNG string. | P0 |
| W2-T5 | Implement `POST /api/v1/batches` | Wire up all services. Validate input. Compute expiry. Generate batch code. Generate QR. Save and return document. Return `400` if both shelf life values are missing. | P0 |
| W2-T6 | Implement `GET /api/v1/batches` | Paginated query with filters for `status` and free-text search on `batchCode`, `farmerName`, `village`. Sort by `priorityScore` descending. | P1 |
| W2-T7 | Implement `GET /api/v1/batches/:id` | Fetch single batch by MongoDB ObjectId. Return 404 if not found. | P1 |
| W2-T8 | Implement `PATCH /api/v1/batches/:id/dispatch` | Validate request body contains `buyerName` and `dispatchDate`. Update `status` to `DISPATCHED`. Freeze status permanently. | P1 |
| W2-T9 | Implement dynamic status recalculation | On `GET /api/v1/batches`, apply the status recalculation logic against current date before returning data (do not write status back to DB on reads, compute on the fly). | P1 |

**Week 2 Checkpoint — PASS criteria:**
- [ ] `POST /api/v1/batches` with full valid payload returns a 201 with `expiryDate`, `qrCodeDataUrl`, `qrAbsoluteUrl`
- [ ] `POST /api/v1/batches` with missing shelf life product returns a 400 with clear error message
- [ ] `GET /api/v1/batches` returns paginated results sorted by `priorityScore`
- [ ] `PATCH /api/v1/batches/:id/dispatch` sets `status = "DISPATCHED"` permanently
- [ ] QR URL resolves to the correct trace path when pasted into a browser

---

### WEEK 3 — Authentication, Public Trace API, and Scan Telemetry

**Goal**: The manager portal is protected. The public QR scan endpoint is live. Scan events are being logged.

**Deliverable at Week End**: JWT-protected routes reject unauthenticated requests. `GET /api/v1/public/batch/:id` returns a valid batch trace record and logs a scan event to the database.

#### Task Breakdown

| Task ID | Task | Description | Priority |
| :--- | :--- | :--- | :--- |
| W3-T1 | Implement `POST /api/v1/auth/login` | Validate credentials against a hardcoded manager record (stored as env variables for v1). Return a signed JWT with `{ role, name }` payload. | P0 |
| W3-T2 | Implement Auth Middleware | Write `middleware/authGuard.js`. Verify JWT from `Authorization: Bearer` header. Attach decoded user to `req.user`. Return 401 on failure. | P0 |
| W3-T3 | Apply auth middleware to all batch write routes | Protect `POST /api/v1/batches` and `PATCH /api/v1/batches/:id/dispatch` with `authGuard`. Leave `GET` routes accessible for now. | P0 |
| W3-T4 | Implement `GET /api/v1/public/batch/:id` | No auth required. Return a curated public-safe subset of batch fields. Trigger async scan event logging. Return 404 with a user-friendly message if batch does not exist. | P0 |
| W3-T5 | Implement scan event logging | Write `services/scanLogger.js`. Hash client IP using SHA-256 + server salt. Detect device type from `User-Agent`. Write to `scanEvents` collection asynchronously (non-blocking). | P1 |
| W3-T6 | Implement `GET /api/v1/analytics/scans` | Return total scan count per batch (aggregation using `$group` on `batchId`). Limit to top 10 most scanned. | P1 |
| W3-T7 | Implement global error handler middleware | Write `middleware/errorHandler.js`. Catch all unhandled errors. Return structured `{ status, message, code }` JSON response. | P0 |

**Week 3 Checkpoint — PASS criteria:**
- [ ] `POST /api/v1/batches` without a valid JWT returns `401 Unauthorized`
- [ ] `POST /api/v1/auth/login` with correct credentials returns a valid JWT
- [ ] `GET /api/v1/public/batch/:id` returns batch data without requiring a token
- [ ] Each call to the public batch endpoint creates a document in `scanEvents`
- [ ] IP addresses in `scanEvents` are stored as hashed strings, not plain text

---

### WEEK 4 — Frontend: Manager Dashboard and Add Batch Form

**Goal**: The React frontend is functional. The Factory Manager can log in, view the batch dashboard, and add a new batch using the form.

**Deliverable at Week End**: Functioning dashboard renders real data from the API. The Add Batch form successfully creates a batch and shows the generated QR code inline.

#### Task Breakdown

| Task ID | Task | Description | Priority |
| :--- | :--- | :--- | :--- |
| W4-T1 | Initialize React + Vite project | `npm create vite@latest frontend -- --template react`. Install `react-router-dom`, `axios`, `recharts` (for analytics graphs). | P0 |
| W4-T2 | Set up API client layer | Write `src/api/client.js` using Axios with base URL from `.env`. Attach JWT token automatically via request interceptor. | P0 |
| W4-T3 | Implement Auth Context and Login Page | `AuthContext` using React Context API. Store JWT in memory (not localStorage). Login form calls `POST /api/v1/auth/login`. Redirect on success. | P0 |
| W4-T4 | Implement Protected Route component | A wrapper that reads `AuthContext`. Redirects to `/login` if no token is present. | P0 |
| W4-T5 | Build Dashboard Overview Screen | Display 4 metric cards (Active, Urgent, Dispatched, Expired). Render batch table with columns: Batch Code, Product, Farmer, Village, Pack Date, Expiry, Days Left, Status, Actions. | P0 |
| W4-T6 | Implement batch status badge component | Visual badge with color coding: READY (green), WARNING (amber), URGENT (red), DISPATCHED (blue), EXPIRED (grey). | P0 |
| W4-T7 | Build Add New Batch form | Multi-field form. Product selection dropdown (from `GET /api/v1/products`). Auto-display computed expiry preview based on selected product. Show warning banner if `dataSource = "fallback"`. | P0 |
| W4-T8 | Display QR code after batch creation | On successful `POST /api/v1/batches`, render the returned `qrCodeDataUrl` as an `<img>` tag. Provide a download button that triggers an `<a download>` link. | P0 |
| W4-T9 | Implement dispatch modal | Clicking "Mark Dispatched" opens a modal form requesting `buyerName` and `dispatchDate`. On submit, calls `PATCH /api/v1/batches/:id/dispatch`. | P1 |
| W4-T10 | Implement search and filter controls | Text search input for batch code or farmer name. Status filter dropdown. Wire to API query parameters. | P1 |

**Week 4 Checkpoint — PASS criteria:**
- [ ] Login page authenticates and redirects to dashboard
- [ ] Dashboard shows real batch data from the API
- [ ] Status badges render with correct colors
- [ ] Adding a new batch triggers a QR code to appear on screen
- [ ] QR image download saves a valid PNG file to the user's device
- [ ] "Mark Dispatched" modal updates the batch status in the table

---

### WEEK 5 — Public Trace Page, AI Advisory Panel, and Scan Analytics

**Goal**: The full system loop is closed. Scanning a QR code shows the public page. The AI audit panel is live. Scan analytics are visible to the manager.

**Deliverable at Week End**: Scanning a generated QR code with a phone opens the correct public batch page. Clicking "Run AI Audit" in the dashboard returns advisory text from Gemini.

#### Task Breakdown

| Task ID | Task | Description | Priority |
| :--- | :--- | :--- | :--- |
| W5-T1 | Build Public Traceability Page (`/trace/:id`) | Unauthenticated route. Renders: origin timeline (Farmer → HimShakti Factory → Consumer), product name, village, pack date, expiry date, status, and a "Himalayan Promise" food safety note. | P0 |
| W5-T2 | Mobile-optimize the Public Trace Page | Apply responsive CSS. Verify layout on 375px width (iPhone SE). Typography must be legible without zooming. | P0 |
| W5-T3 | Implement AI Advisory Panel on Dashboard | A card component that displays the last cached Gemini report. Sections: `criticalAlerts[]`, `dispatchQueue[]`, `summaryAdvisory` text. | P0 |
| W5-T4 | Implement "Run AI Audit" button | On click, calls `POST /api/v1/ai/audit`. Shows a spinner during API call. On response, updates the Advisory Panel in place. Disables the button and shows "Next audit available in X hours" if cache is still fresh. | P0 |
| W5-T5 | Implement backend `POST /api/v1/ai/audit` | Check `ai_audits` collection for the last record. If last audit was < 4 hours ago, return cached result. Otherwise, compile active batch payload, call Gemini API, store response, return fresh result. | P0 |
| W5-T6 | Implement backend `GET /api/v1/ai/summary` | Return the most recent document from `ai_audits` collection. Return `{ cached: true, reportData, lastAuditDate }`. | P1 |
| W5-T7 | Implement Gemini rate-limit fallback | If Gemini returns `429`, log the error, and return the last cached `ai_audits` record with a `rateLimited: true` flag. The frontend must display: `"AI advisory panel is currently rate-limited; displaying cached report from [timestamp]"`. | P0 |
| W5-T8 | Build Scan Analytics screen | Bar chart of scan counts per batch code (top 10). Data sourced from `GET /api/v1/analytics/scans`. Use `recharts` library. | P1 |
| W5-T9 | QR scan end-to-end validation | Physically scan the QR on a real smartphone. Verify the public page loads, data is correct, and the scan event appears in the database. | P0 |

**Week 5 Checkpoint — PASS criteria:**
- [ ] Physical phone scan of the QR code opens the correct `/trace/:id` URL
- [ ] Public trace page renders correctly on mobile (375px tested)
- [ ] "Run AI Audit" button triggers Gemini and displays `dispatchQueue`, `criticalAlerts`, and `summaryAdvisory`
- [ ] A second click within 4 hours shows cached result with a cooldown message
- [ ] Gemini rate-limit error shows cached report gracefully
- [ ] Scan Analytics chart displays scan counts for multiple batches

---

### WEEK 6 — Testing, Deployment, Documentation, and Final Demo Prep

**Goal**: The application is deployed, tested, documented, and ready for presentation.

**Deliverable at Week End**: Live backend URL on Render, live frontend URL on Vercel, all acceptance criteria from the SRS verified, and user guide completed.

#### Task Breakdown

| Task ID | Task | Description | Priority |
| :--- | :--- | :--- | :--- |
| W6-T1 | Write unit tests for services | Test `expiryCalculator.js`, `priorityCalculator.js`, `qrService.js`, and `batchCodeGen.js` using Jest. See Test Strategy section. | P0 |
| W6-T2 | Write API integration tests | Use `supertest` to test critical endpoints: `POST /api/v1/batches` (happy path + missing shelf life path), `PATCH /api/v1/batches/:id/dispatch`, `GET /api/v1/public/batch/:id`. | P0 |
| W6-T3 | Deploy backend to Render | Configure environment variables. Validate health check and all API routes post-deployment. | P0 |
| W6-T4 | Deploy frontend to Vercel | Set `VITE_API_BASE_URL` to Render backend URL. Confirm all API calls succeed from the deployed domain. | P0 |
| W6-T5 | Generate production QR code with live URL | Create a test batch on the live system. Download the QR. Physically scan it. Verify it opens the Vercel-deployed public trace page. | P0 |
| W6-T6 | Run final acceptance criteria checklist | Walk through all 5 acceptance criteria from the SRS and mark each pass or fail. | P0 |
| W6-T7 | Write User Guide for Factory Manager | Simple markdown or PDF guide with: how to log in, how to create a batch, how to download a QR, how to mark a dispatch, how to read the AI advisory. Include screenshots. | P1 |
| W6-T8 | Write API Reference Sheet | Short reference listing all endpoints, request bodies, and example responses. | P1 |
| W6-T9 | Prepare demo script | 5-minute walkthrough script covering: login → add batch → QR generation → public trace scan → AI audit → dispatch. | P1 |
| W6-T10 | Final documentation review | Ensure all 5 documents (Planning Report, Final Project Report, SRS, Implementation Plan, User Guide) are complete, consistent, and professional. | P1 |

**Week 6 Checkpoint — PASS criteria:**
- [ ] All unit tests pass (`npm test`)
- [ ] All integration tests pass
- [ ] Backend is live and accessible at a public Render URL
- [ ] Frontend is live and accessible at a public Vercel URL
- [ ] All 5 SRS acceptance criteria pass on the live deployment
- [ ] User guide is written and legible for a non-technical manager

---

## 5. Testing Strategy

### 5.1. Testing Philosophy
Following the testing pyramid principle: the majority of tests are fast, isolated unit tests. A smaller set of integration tests verify API behavior. Manual verification confirms the user experience.

```
          ┌─────────────────────────┐
          │    Manual / E2E (few)   │  ← Full system QR scan test
          ├─────────────────────────┤
          │  Integration Tests (some)│  ← Supertest API route tests
          ├─────────────────────────┤
          │   Unit Tests (many)     │  ← Services, utilities, logic
          └─────────────────────────┘
```

### 5.2. Unit Test Cases (Jest)

#### `expiryCalculator.js`

| Test ID | Test Description | Input | Expected Output |
| :--- | :--- | :--- | :--- |
| UT-1 | Uses predicted shelf life when available | `{ predictedShelfLifeDays: 180, baseShelfLifeDays: 150, packDate: "2026-06-01" }` | `expiryDate = 2026-11-28`, `dataSource = "predicted"` |
| UT-2 | Falls back to base shelf life when ML prediction is missing | `{ predictedShelfLifeDays: null, baseShelfLifeDays: 90, packDate: "2026-06-01" }` | `expiryDate = 2026-08-30`, `dataSource = "fallback"` |
| UT-3 | Blocks creation when both values are missing | `{ predictedShelfLifeDays: null, baseShelfLifeDays: null }` | Throws a validation error |

#### `priorityCalculator.js`

| Test ID | Test Description | Input | Expected Output |
| :--- | :--- | :--- | :--- |
| UT-4 | High priority for 3 days remaining, HIGH risk | `{ daysRemaining: 3, riskLevel: "HIGH" }` | `priorityScore = 100 - min(100, 6) + 20 = 114` (capped behavior) |
| UT-5 | Low priority for 60 days remaining, LOW risk | `{ daysRemaining: 60, riskLevel: "LOW" }` | `priorityScore = 100 - min(100, 120) + 0 = 0` |
| UT-6 | DISPATCHED batches receive zero score | `{ status: "DISPATCHED" }` | `priorityScore = 0` |

#### `qrService.js`

| Test ID | Test Description | Input | Expected Output |
| :--- | :--- | :--- | :--- |
| UT-7 | Generates a valid base64 PNG string | Valid batch ObjectId + `PUBLIC_BASE_URL` set | Returned string starts with `data:image/png;base64,` |
| UT-8 | Absolute URL is correctly constructed | `batchId = "abc123"`, `PUBLIC_BASE_URL = "https://trace.test"` | `qrAbsoluteUrl = "https://trace.test/trace/abc123"` |

#### `batchCodeGen.js`

| Test ID | Test Description | Input | Expected Output |
| :--- | :--- | :--- | :--- |
| UT-9 | Generates first batch code in empty DB | Month=06, Year=2026, existing count=0 | `"HS-2026-06-001"` |
| UT-10 | Increments correctly on second batch | existing count=1 | `"HS-2026-06-002"` |

### 5.3. Integration Test Cases (Supertest)

| Test ID | Endpoint | Scenario | Expected HTTP Status | Expected Body |
| :--- | :--- | :--- | :--- | :--- |
| IT-1 | `POST /api/v1/batches` | Full valid payload with predicted shelf life product | 201 | Contains `batchCode`, `expiryDate`, `qrCodeDataUrl` |
| IT-2 | `POST /api/v1/batches` | Product with both shelf life fields null | 400 | `{ message: "Cannot create batch: no shelf life data available for this product" }` |
| IT-3 | `POST /api/v1/batches` | No JWT token in header | 401 | `{ message: "Unauthorized" }` |
| IT-4 | `PATCH /batches/:id/dispatch` | Valid dispatch request | 200 | `{ status: "DISPATCHED", dispatchDate, buyerName }` |
| IT-5 | `PATCH /batches/:id/dispatch` | Missing `buyerName` field | 400 | Validation error message |
| IT-6 | `GET /api/v1/public/batch/:id` | Valid batch ID | 200 | Batch data + no token required |
| IT-7 | `GET /api/v1/public/batch/:id` | Invalid / non-existent ID | 404 | `{ message: "Batch not found" }` |
| IT-8 | `POST /api/v1/ai/audit` | First audit call (no cache) | 200 | `{ dispatchQueue, criticalAlerts, summaryAdvisory }` |
| IT-9 | `POST /api/v1/ai/audit` | Second call within 4 hours | 200 | `{ cached: true, reportData, lastAuditDate }` |

### 5.4. Manual Acceptance Tests

| AC # | Acceptance Criterion | Test Procedure | Pass Condition |
| :--- | :--- | :--- | :--- |
| AC-1 | Factory Manager can create a batch with auto-calculated expiry and QR | Log in → Add Batch → Submit → View QR | QR appears, expiry date is correct relative to pack date |
| AC-2 | QR code resolves to correct public batch detail page | Download QR → Scan with phone camera | Browser opens `/trace/:id` with the correct batch record |
| AC-3 | AI Audit generates and caches Gemini advice | Click "Run AI Audit" → View panel → Click again within 4 hours | Second click shows cached result with timestamp |
| AC-4 | Fallback handling works when ML data is absent | Create batch for product with `predictedShelfLifeDays = null` | Batch created with `dataSource = "fallback"`, dashboard shows warning indicator |
| AC-5 | All automated tests pass | `npm test` in `/backend` | All unit and integration tests exit with code 0 |

---

## 6. Deployment Strategy

### 6.1. Environment Variables

```bash
# Backend (.env)
MONGO_URI=mongodb+srv://...
PORT=5000
JWT_SECRET=himshakti_intern2_secret_key
PUBLIC_BASE_URL=https://trace.vercel.app  # Set to deployed frontend URL
GEMINI_API_KEY=AIza...
MANAGER_EMAIL=manager@himshakti.com       # Hardcoded v1 auth
MANAGER_PASSWORD_HASH=<bcrypt_hash>

# Frontend (.env)
VITE_API_BASE_URL=https://himshakti-intern2.onrender.com
```

### 6.2. Deployment Checklist

| Step | Action | Platform | Verify |
| :--- | :--- | :--- | :--- |
| 1 | Push backend to GitHub | GitHub | Repository visible |
| 2 | Create new Web Service on Render | Render.com | Connect GitHub repo, set build command: `npm install`, start command: `node src/server.js` |
| 3 | Set all backend environment variables in Render dashboard | Render.com | No env variable is hardcoded in source |
| 4 | Test backend health check on Render URL | Browser | `GET /health` returns `{ status: "ok" }` |
| 5 | Push frontend to GitHub | GitHub | Repository visible |
| 6 | Deploy frontend project on Vercel | Vercel.com | Set `VITE_API_BASE_URL` to Render URL |
| 7 | Set `PUBLIC_BASE_URL` in Render to the Vercel frontend URL | Render.com | New QR codes now encode the Vercel URL |
| 8 | Create one live batch in production | Browser | QR download → scan → trace page opens on Vercel |

### 6.3. Why These Platforms?

| Platform | Reason | Alternative (Not Chosen) |
| :--- | :--- | :--- |
| **Render** (Backend) | Free tier allows always-on Node.js services. Simple GitHub integration. No Docker required for v1. | Railway: Also viable but Render has a more generous free tier for web services. |
| **Vercel** (Frontend) | Native Vite/React support, automatic CI/CD on push, global CDN, free tier. | Netlify: Nearly identical capability, but Vercel has better Vite optimization. |
| **MongoDB Atlas** (Database) | Free M0 cluster, shared between interns, managed backups. | Self-hosted MongoDB: Would require a server and ongoing maintenance. |

---

## 7. Risk Register for Implementation Phase

| Risk | Trigger | Impact | Response Plan |
| :--- | :--- | :--- | :--- |
| Intern 1 schema not ready when Week 1 starts | Shared `products` collection is empty or schema mismatches | High — blocks Week 2 batch creation | Use a local seed script with mock product data and align with Intern 1 by end of Week 1 |
| Gemini API key exhausted during Week 5 | Free tier quota exceeded | Medium — AI panel blocked | Return hardcoded mock advisory JSON in development. Test AI integration with a single low-frequency call. |
| QR codes not resolving on physical phone | `PUBLIC_BASE_URL` misconfigured or Vercel not deployed | High — blocks AC-2 | Test QR resolution with `ngrok` tunnel before Vercel deployment |
| Render backend sleeping (cold start) | Free tier sleep after 15 minutes of inactivity | Low — 30 second delay on first request | Add a health check ping from the frontend on page load to wake the server early |

---

## 8. Definition of Done

A feature is considered **Done** only when all of the following are true:

- [ ] Code is committed to the repository.
- [ ] The feature works as described in the corresponding SRS functional requirement.
- [ ] The feature does not break any existing passing tests.
- [ ] Error and edge cases are handled (no unhandled promise rejections, no blank screens).
- [ ] The related unit or integration test has been written and passes.
- [ ] The API endpoint (if applicable) has been manually tested via Postman or the browser.

---

## 9. Document References

| Document | Purpose | Location |
| :--- | :--- | :--- |
| Planning Report | Business context, stakeholders, risks | `intern-2/planning_report.md` |
| Final Project Report & System Design | Architecture, schemas, API design, AI flow | `final_project_report.md` |
| Software Requirements Specification (SRS) | Functional and non-functional requirements | `intern-2/srs.md` |
| Implementation Plan (this document) | Build timeline, task breakdown, testing | `intern-2/implementation_plan_Initial.md` |
| User Guide | Manager-facing usage guide | `intern-2/user_guide.md` (to be created in Week 6) |

---

## 10. Actual Progress Log (Week 4 — 2026-06-25)

### 10.1. Backend Implementation — Completed Files

All 19 required backend source files have been implemented and committed.

| File | Purpose | Status |
| :--- | :--- | :--- |
| `backend/server.js` | Express entry point, port 5001, all middleware and routes wired | ✅ Done |
| `backend/.env` | 8 environment variables — all populated | ✅ Done |
| `backend/.env.example` | Safe template for version control | ✅ Done |
| `backend/.gitignore` | Excludes node_modules, .env, logs | ✅ Done |
| `src/config/db.js` | MongoDB Atlas connection with error handling | ✅ Done |
| `src/models/Batch.model.js` | Batch schema, 3 compound indexes | ✅ Done |
| `src/models/ScanEvent.model.js` | ScanEvent schema, IP hash enforcement | ✅ Done |
| `src/utils/productContract.js` | Asserts Intern 1 product contract fields | ✅ Done |
| `src/services/expiryCalculator.js` | Predicted/fallback expiry, FEFO status | ✅ Done |
| `src/utils/batchCodeGenerator.js` | Sequential HS-YYYY-MM-NNN code generator | ✅ Done |
| `src/services/qrGenerator.js` | QR code → Base64 PNG via `qrcode` lib | ✅ Done |
| `src/services/geminiService.js` | Gemini dispatch audit + 4hr in-memory cache | ✅ Done |
| `src/middleware/errorHandler.js` | Centralized error responses | ✅ Done |
| `src/middleware/rateLimiter.js` | API (100/15min) and AI (5/15min) rate limits | ✅ Done |
| `src/middleware/auth.js` | JWT `protect()` guard + `generateToken()` | ✅ Done |
| `src/controllers/products.controller.js` | Reads Intern 1's products — no writes | ✅ Done |
| `src/controllers/batches.controller.js` | Full CRUD + dispatch recording | ✅ Done |
| `src/controllers/dispatch.controller.js` | FEFO priority queue endpoint | ✅ Done |
| `src/controllers/qr.controller.js` | Public trace page + async scan logging | ✅ Done |
| `src/controllers/ai.controller.js` | Gemini audit trigger + cache response | ✅ Done |
| `src/routes/*.routes.js` (×5) | All 5 route files wired to controllers | ✅ Done |
| `src/scripts/seedTestBatch.js` | Dev utility to seed a batch for testing | ✅ Done |

### 10.2. Blockers

All blockers have been resolved as of 2026-06-25!

| Blocker | Type | Action Required | Owner |
| :--- | :--- | :--- | :--- |
| ~~MongoDB Atlas IP not whitelisted~~ | Network | ~~Add `0.0.0.0/0` in Atlas → Security → Network Access~~ (✅ Resolved) | Intern 1 (cluster admin) |
| ~~`products` seed data not confirmed~~ | Data | ~~Verify 5 product documents exist in `himshakti.products`~~ (✅ 5 items confirmed) | Intern 1 |
| ~~`GEMINI_API_KEY` not set~~ | Config | ~~Obtain key from aistudio.google.com and add to `.env`~~ (✅ Set) | Intern 2 |

### 10.3. Next Steps (Week 4 Remaining)

- [x] Receive Atlas IP whitelist confirmation from Intern 1
- [x] Run `npm run dev` and confirm `✅ MongoDB Atlas connected`
- [ ] Execute Postman Tests 1–10 from Week 4 guide
- [ ] Verify `batches` and `scanevents` collections in MongoDB Compass

---

## 11. Revision History

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-06-11 | Documentation Lead | Initial 6-week implementation plan |
| 1.1.0 | 2026-06-25 | Intern 2 | Added §10 actual progress log (Week 4 backend complete), §11 revision history. Updated header status. |
