# Software Requirements Specification (SRS)

## Project: Batch Traceability, QR Management, and Dispatch Intelligence System
**Version**: 2.1.0  
**Date**: 2026-08-02  
**Author**: Divyansh Uniyal — Intern 2  
**Status**: ✅ **DEPLOYED & LIVE** — Production deployment complete  
**Live URL**: [https://himshakti2026-bb904.web.app](https://himshakti2026-bb904.web.app)  
**API URL**: [https://him-shakti-batch-traceability-qr-ma.vercel.app](https://him-shakti-batch-traceability-qr-ma.vercel.app)

---

## 1. Introduction

### 1.1. Purpose
This document specifies the software requirements for the **Batch Traceability, QR Management, and Dispatch Intelligence System** (Intern 2 System) designed for HimShakti Food Processing. It serves as the authoritative specification for the development, QA, and deployment phases — and is updated to reflect the final, live production state of the system as of v2.1.0.

### 1.2. Scope
This system manages the digitalisation of packaged production batches from farm intake through dispatch. It retrieves product data from a shared MongoDB Atlas database, calculates expiry timelines, generates physical QR label URLs, tracks consumer scan counts, enforces role-based access control (RBAC), manages user onboarding via invite links, and calls the Google Gemini 2.5 Flash API to compile dispatch advisory reports.

### 1.3. Definitions, Acronyms, and Abbreviations
* **FEFO**: First-Expired, First-Out — inventory rotation strategy prioritizing older/expiring stock.
* **SKU**: Stock Keeping Unit — identifying code for distinct product types.
* **RBAC**: Role-Based Access Control — restricting system access based on user roles.
* **JWT**: JSON Web Token — signed stateless auth token.
* **SRS**: Software Requirements Specification.
* **FSSAI**: Food Safety and Standards Authority of India.
* **SSO**: Single Sign-On — third-party authentication (Google OAuth used here).
* **FEFO Score**: Computed numeric priority for dispatch ordering.

---

## 2. Overall System Description

### 2.1. Product Perspective
The application functions as the operations portal for HimShakti's processing facility. It operates in tandem with Intern 1's Shelf Life Prediction application, sharing a single MongoDB Atlas instance. The system is fully deployed across two platforms:

- **Frontend**: Firebase Hosting (`himshakti2026-bb904.web.app`)
- **Backend API**: Vercel Serverless (`him-shakti-batch-traceability-qr-ma.vercel.app`)

```
┌────────────────────────────────────────────────────────────────────┐
│                  HimShakti Enterprise System                        │
├──────────────────────────────┬─────────────────────────────────────┤
│   Intern 1 Application       │     Intern 2 Application            │
│  (Recipe Shelf Life AI)      │ (Traceability & Dispatch — LIVE)    │
└─────────────┬────────────────┴────────────────┬────────────────────┘
              │                                 │
              └──────────────┬──────────────────┘
                             │
                             ▼
               ┌──────────────────────────┐
               │  Shared MongoDB Atlas    │
               │  (himshakti database)    │
               └──────────────────────────┘
```

### 2.2. User Classes and Characteristics

| Role | Description | Key Access |
|---|---|---|
| `admin` | Full system access — user management, archiving, all operations | All tabs + Admin Panel |
| `manager` | Batch ops, dispatch, AI audit — no user admin | All tabs except Admin |
| `factory-manager` | Create and view batches, edit notes | Batches, FEFO, QR |
| `quality-inspector` | Read-only batch and QR access | Batches (read), QR |
| `dispatch-coordinator` | Dispatch operations | Batches, FEFO, QR |
| **B2B Buyer / Consumer** | Public QR scan landing page | `/trace/:batchCode` (no auth) |

### 2.3. Operating Environment
* **Web Client**: Chrome (v110+), Safari (v16+), Mobile Safari/Chrome (iOS/Android).
* **Backend**: Node.js v18+ deployed on Vercel Serverless Functions.
* **Frontend**: React 18 + Vite 5, hosted on Firebase Hosting.
* **Database**: MongoDB Atlas Cluster (v6.0+) — `himshakti` database.
* **Email**: Gmail SMTP via Nodemailer for invite emails.

---

## 3. Data Requirements

### 3.1. Collection Definitions & Fields

#### `products` Collection (Read-Only reference — owned by Intern 1)
* `_id` (`ObjectId`)
* `productName` (`String`, Required, Unique)
* `sku` (`String`, Required, Unique)
* `category` (`String`, Required, enum: `["snack", "juice", "pickle"]`)
* `unitSize` (`String`, Required)
* `baseShelfLifeDays` (`Number`, Required)
* `predictedShelfLifeDays` (`Number`, Nullable)
* `predictedExpiryTemplate` (`String`)
* `riskLevel` (`String`, Nullable, enum: `["LOW", "MEDIUM", "HIGH"]`)
* `isActive` (`Boolean`)

#### `batches` Collection (Owned by Intern 2 — v2.1.0 schema)
* `_id` (`ObjectId`)
* `batchCode` (`String`, Unique — format `HS-YYYY-MM-NNN`)
* `productId` (`ObjectId` — soft ref to products)
* `productName` (`String` — denormalized snapshot)
* `sku` (`String` — denormalized snapshot)
* `sourceLotCode` (`String`, Required)
* `farmerName` (`String`, Required)
* `village` (`String`, Required)
* `packDate` (`Date`, Required)
* `expiryDate` (`Date`, Required — computed by `expiryCalculator.js`)
* `dataSource` (`String`, enum: `["predicted", "fallback"]`)
* `shelfLifeSource` (`String`, enum: `["predicted", "base", "manual"]`)
* `quantityProduced` (`Number`, Required)
* `unit` (`String`, enum: `["Kg", "Units", "Liters"]`)
* `yieldPercent` (`Number`, 0–100)
* `status` (`String`, enum: `["READY", "WARNING", "URGENT", "DISPATCHED", "EXPIRED"]`)
* `priorityScore` (`Number` — FEFO sort key)
* `qrCodeDataUrl` (`String` — base64 PNG)
* `qrAbsoluteUrl` (`String` — public trace URL)
* `dispatchDate` (`Date`, Nullable)
* `buyerName` (`String`, Nullable)
* `traceabilityNote` (`String`)
* `noteHistory` (`Array` — append-only note audit log):
  * `note` (`String`)
  * `editedBy` (`String` — username)
  * `editedAt` (`Date`)
* `createdBy` (`String` — username)
* `isDeleted` (`Boolean`, default `false` — soft archive flag)
* `deletedAt` (`Date`, Nullable)
* `deletedBy` (`String`, Nullable — username of archiving admin)
* `deleteNote` (`String`, Nullable — archiving reason)
* `createdAt`, `updatedAt` (Mongoose timestamps)

**Indexes:**
- `batchCode` — unique
- `status + expiryDate` — compound (FEFO queries)
- `sku` — single
- `productId` — single
- `isDeleted + status + expiryDate` — compound (archived view queries)

#### `users` Collection (Owned by Intern 2)
* `_id` (`ObjectId`)
* `username` (`String`, Unique, lowercase)
* `passwordHash` (`String` — bcrypt 10 rounds)
* `name` (`String`)
* `email` (`String`)
* `googleEmail` (`String`, Sparse Unique — linked Google account for SSO)
* `googleLinkedAt` (`Date`)
* `role` (`String`, enum: `["admin", "manager", "factory-manager", "quality-inspector", "dispatch-coordinator"]`)
* `isActive` (`Boolean`)
* `createdAt`, `updatedAt`

#### `scanEvents` Collection (Owned by Intern 2 — append-only)
* `_id` (`ObjectId`)
* `batchId` (`ObjectId` — hard ref to batches)
* `batchCode` (`String` — denormalized)
* `scannedAt` (`Date`)
* `source` (`String`, enum: `["factory", "buyer", "QA"]`)
* `deviceType` (`String`, enum: `["Mobile", "Tablet", "Desktop", "Unknown"]`)
* `ipHash` (`String` — SHA-256 hashed, never plain text)
* `createdAt`

#### `accessRequests` Collection (Owned by Intern 2)
* `_id` (`ObjectId`)
* `name` (`String`)
* `email` (`String`, Unique)
* `role` (`String`, enum: `["factory-manager", "quality-inspector", "dispatch-coordinator", "admin"]`)
* `status` (`String`, enum: `["pending", "approved", "rejected"]`)
* `note` (`String` — rejection reason)
* `inviteToken` (`String` — SHA-256 hashed raw token)
* `inviteExpiry` (`Date` — 72 hours after approval)
* `inviteUsed` (`Boolean`)
* `approvedBy` (`String` — username)
* `createdAt`, `updatedAt`

---

## 4. Functional Requirements

### 4.1. Batch Provisioning and Expiry Logic
* **FR-1.1**: Retrieve active product configurations from shared `products` collection. ✅
* **FR-1.2**: On batch creation, compute expiry using `expiryCalculator.js`:
  * If `predictedShelfLifeDays` available → `expiryDate = packDate + predictedShelfLifeDays`, `dataSource = "predicted"`. ✅
  * If missing, use `baseShelfLifeDays` → `dataSource = "fallback"`. ✅
  * If both missing → block with `400 Bad Request`. ✅
* **FR-1.3**: Auto-generate batch code in `HS-YYYY-MM-NNN` sequential format. ✅
* **FR-1.4**: Compute `priorityScore` for FEFO ordering at creation time. ✅

### 4.2. QR Code Engine
* **FR-2.1**: Auto-generate unique public trace URL using `PUBLIC_BASE_URL` env variable. ✅
* **FR-2.2**: Convert URL to 300×300 base64 PNG QR code using `qrcode` npm library. ✅
* **FR-2.3**: Provide `GET /api/batches/:id/qr` lightweight endpoint — returns QR image only. ✅
* **FR-2.4**: Frontend supports one-click QR download as PNG. ✅

### 4.3. FEFO Priority Dashboard
* **FR-3.1**: Sort batches using dynamic FEFO priority queue (higher score = dispatch first). ✅
* **FR-3.2**: Dynamically recalculate batch status on retrieval based on current date. ✅
* **FR-3.3**: Manual dispatch recording — captures `buyerName`, `dispatchDate`, freezes status as `DISPATCHED`. ✅
* **FR-3.4**: Filter tabs in FEFO view: All · Urgent · Warning · Ready with live counts. ✅
* **FR-3.5**: Priority rank badges (#1 orange, #2 grey) and urgency progress bars per row. ✅

### 4.4. AI Advisory Auditing
* **FR-4.1**: Compile active batches into structured JSON and request dispatch advice from Gemini 2.5 Flash. ✅
* **FR-4.2**: Restrict live API calls using a 4-hour server-side in-memory cache. ✅
* **FR-4.3**: Display "Run AI Audit" button with manual refresh capability. ✅
* **FR-4.4**: Render Gemini response as structured glass cards (not raw markdown). ✅
* **FR-4.5**: Show cache timestamp and last-generated label. ✅

### 4.5. Public Traceability Portal
* **FR-5.1**: Public `/trace/:batchCode` endpoint accessible without authentication. ✅
* **FR-5.2**: Display batch timeline: farmer origin → packaging → expiry → current status. ✅
* **FR-5.3**: Log each scan event asynchronously — IP SHA-256 hashed, device type detected. ✅
* **FR-5.4**: Scan analytics visible in BatchDetailDrawer (total scans, mobile/desktop split). ✅

### 4.6. Authentication & Role-Based Access Control (RBAC)
* **FR-6.1**: JWT-based authentication — 30-day token, stored in `localStorage`. ✅
* **FR-6.2**: Google OAuth 2.0 Sign-In via `/auth/google/token` — links Gmail to `googleEmail` field. ✅
* **FR-6.3**: Five RBAC roles enforced at backend controller level and frontend UI level. ✅
* **FR-6.4**: Access Request flow — new users submit request, admin approves/rejects. ✅
* **FR-6.5**: On approval, SHA-256 hashed 72hr invite link generated and emailed via Gmail SMTP. ✅
* **FR-6.6**: Admin can toggle users Active/Inactive — inactive users cannot log in. ✅

### 4.7. Batch Detail Drawer (v2.0.0)
* **FR-7.1**: Click any batch row → slide-in `BatchDetailDrawer` opens (440px desktop, full-screen mobile). ✅
* **FR-7.2**: **Overview tab**: expiry urgency bar, quick actions, batch identity cards, raw material source, QR preview, scan analytics, audit metadata. ✅
* **FR-7.3**: **Notes tab**: editable traceability note (role-gated), edit history timeline, Admin Danger Zone. ✅
* **FR-7.4**: **History tab**: lifecycle event log + recent QR scans. ✅
* **FR-7.5**: Edit traceability note appends old note to `noteHistory[]` with actor + timestamp. ✅
* **FR-7.6**: Raw material correction (`PATCH /api/batches/:id/raw-material`) — appends to audit trail. ✅

### 4.8. Soft Delete & Audit Trail
* **FR-8.1**: Archiving a batch sets `isDeleted: true`, `deletedAt`, `deletedBy`, `deleteNote`. ✅
* **FR-8.2**: Archived batches hidden from all active views but fully restorable by admin. ✅
* **FR-8.3**: `GET /api/batches/archived` — protected route for admin to view archived batches. ✅
* **FR-8.4**: `PATCH /api/batches/:id/restore` — admin-only batch restoration. ✅
* **FR-8.5**: Typed batch-code confirmation required before archiving (prevents accidental deletion). ✅
* **FR-8.6**: `batch:deleted` and `batch:restored` Socket.IO events broadcast to all sessions. ✅

### 4.9. Admin Panel
* **FR-9.1**: Role Distribution stacked bar — clickable segments filter the Users Roster. ✅
* **FR-9.2**: Users Roster with live search (name/email/username), Active/Inactive toggle, role filter tabs. ✅
* **FR-9.3**: Access Requests with status tabs (Pending/Approved/Rejected/All) + live pulse dot on Pending. ✅
* **FR-9.4**: Inline Approve / Reject flows with optional rejection note. ✅
* **FR-9.5**: Invite link one-click copy to clipboard. ✅

### 4.10. Real-Time Updates
* **FR-10.1**: Socket.IO server broadcasts batch lifecycle events to all connected clients. ✅
* **FR-10.2**: Events: `batchCreated`, `batchUpdated`, `batch:deleted`, `batch:restored`. ✅

---

## 5. Non-Functional Requirements

### 5.1. Reliability and Performance
* **NFR-1.1**: Public batch detail page resolves under 500ms under normal network conditions. ✅
* **NFR-1.2**: Batch creation is atomic — QR generation and DB write complete together. ✅
* **NFR-1.3**: System enforces fallback rules if ML prediction data is unavailable. ✅
* **NFR-1.4**: 4-hour Gemini cache prevents redundant API calls and protects free-tier quota. ✅

### 5.2. Safety and Security
* **NFR-2.1**: Passwords hashed with bcrypt (10 salt rounds) — never stored or logged in plain text. ✅
* **NFR-2.2**: All write API endpoints require JWT Bearer token. ✅
* **NFR-2.3**: Consumer IP addresses SHA-256 hashed before write — GDPR/privacy compliant. ✅
* **NFR-2.4**: `express-rate-limit`: 100 req/15min (API), 5 req/15min (AI endpoint). ✅
* **NFR-2.5**: Helmet middleware sets HTTP security headers (CSP, HSTS, X-Frame-Options). ✅
* **NFR-2.6**: CORS strict allowlist — only `FRONTEND_URL` origin accepted. ✅
* **NFR-2.7**: Invite tokens SHA-256 hashed in DB — raw token only in email link. ✅
* **NFR-2.8**: Google OAuth access tokens verified via Google `/userinfo` endpoint before trust. ✅

### 5.3. Usability
* **NFR-3.1**: Public Traceability View fully mobile-optimized (iOS/Android). ✅
* **NFR-3.2**: Manager Portal responsive down to 768px (tablet). ✅
* **NFR-3.3**: All destructive actions (archive, dispatch) require explicit confirmation. ✅

### 5.4. Deployment & Infrastructure
* **NFR-4.1**: Frontend built via `npm run build` → static assets deployed to Firebase Hosting. ✅
* **NFR-4.2**: Backend deployed as Node.js serverless functions on Vercel. ✅
* **NFR-4.3**: Environment variables managed via Vercel dashboard (production) / `.env` (local dev). ✅

---

## 6. Interface Requirements

### 6.1. User Interfaces
* **Manager Dashboard**: 6-tab layout (Overview, Batches, FEFO Queue, QR Centre, AI Audit, Admin Panel).
* **BatchDetailDrawer**: Slide-in 3-tab panel (Overview, Notes, History).
* **Login Page**: Glassmorphic dual-flow — username/password login + Google Sign-In + Request Access.
* **Public Trace Page**: Mobile-first timeline page for B2B buyers and consumers.
* **Home & About pages**: Marketing landing pages with parallax hero sections.

### 6.2. Application Programming Interfaces (APIs)
* RESTful backend (Express 5) returning `{ success, data, message }` envelope.
* Integration with Google Gemini 2.5 Flash via `@google/generative-ai` SDK.
* Google OAuth via `googleapis` package — token exchange via `/auth/google/token`.
* Real-time events via Socket.IO (server on backend, client hook `useSocket.js`).

### 6.3. External Services
| Service | Purpose | Notes |
|---|---|---|
| MongoDB Atlas | Cloud database | `himshakti` DB, M0 free tier |
| Google Gemini 2.5 Flash | AI dispatch advisory | 4hr in-memory cache |
| Google OAuth 2.0 | Google Sign-In SSO | Linked via `googleEmail` field |
| Gmail SMTP (Nodemailer) | Invite email delivery | App password auth |
| Firebase Hosting | Frontend deployment | `himshakti2026-bb904.web.app` |
| Vercel | Backend API deployment | Serverless Node.js |

---

## 7. Security and Privacy Considerations
* **Data Minimization**: Public traceability portal collects no personal data (no name, email, or phone).
* **IP Hashing**: `ipHash` in `scanEvents` is SHA-256 of client IP + JWT_SECRET salt. Enables unique-location analytics without PII storage.
* **Invite Token Security**: Raw token sent only in email link; only SHA-256 hash stored in DB. Token expires in 72 hours and is one-use only.
* **Google OAuth Safety**: Access token validated against Google's `/userinfo` endpoint before any DB lookup. No user info stored beyond linked email.

---

## 8. Error Handling and Validation

### 8.1. API Validation Rules
* `yieldPercent` outside 0–100 → `400 Bad Request`.
* Batch code not matching `HS-[YYYY]-[MM]-[3-digit-counter]` → rejected.
* Note exceeding 1000 characters → `400 Bad Request`.
* Archive attempt without typed batch code confirmation → rejected client-side.

### 8.2. Upstream Failures
* Gemini API `429` rate-limit → fallback to last cached advisory with warning: `"AI advisory panel is currently rate-limited; displaying cached report from [timestamp]"`. ✅
* Products collection empty → batch creation blocked with descriptive `400` error. ✅
* MongoDB connection failure → backend returns `503` with structured error envelope. ✅

---

## 9. Acceptance Criteria

All criteria met as of v2.1.0 (2026-07-05):

| # | Criterion | Status |
|---|---|---|
| 1 | Factory Manager can add a batch → expiry computed, QR generated, visible on dashboard | ✅ |
| 2 | QR code resolves to correct public trace page when scanned by any smartphone | ✅ |
| 3 | "Run AI Audit" triggers Gemini, caches results, displays structured glass cards | ✅ |
| 4 | Fallback to base shelf life if ML prediction missing | ✅ |
| 5 | RBAC enforced — each role sees and can do only what is permitted | ✅ |
| 6 | Admin can approve/reject access requests and generate invite links | ✅ |
| 7 | Google Sign-In works for linked accounts | ✅ |
| 8 | BatchDetailDrawer opens on row click with full batch context | ✅ |
| 9 | Archiving a batch hides it from views but preserves all data | ✅ |
| 10 | Frontend deployed to Firebase, backend to Vercel — both live and connected | ✅ |

---

## 10. Implementation Status — Final (v2.1.0)

| Module | Endpoint / File | Status | Notes |
|--------|----------------|--------|-------|
| DB Connection | `src/config/db.js` | ✅ | MongoDB Atlas connected |
| Batch Model | `Batch.model.js` | ✅ | Full v2.1.0 schema with noteHistory, soft-delete |
| User Model | `User.model.js` | ✅ | RBAC roles, Google SSO fields |
| AccessRequest Model | `AccessRequest.model.js` | ✅ | Invite token flow |
| ScanEvent Model | `ScanEvent.model.js` | ✅ | IP hashing enforced |
| Auth — Login | `POST /auth/login` → JWT | ✅ | 30-day token |
| Auth — Google SSO | `POST /auth/google/token` | ✅ | Linked via googleEmail |
| Auth — Request Access | `POST /auth/request-access` | ✅ | |
| Auth — Approve/Reject | `POST /auth/requests/:id/approve|reject` | ✅ | Email invite sent |
| Auth — User Roster | `GET /auth/users`, `PATCH /auth/users/:id/toggle` | ✅ | |
| Products Read | `GET /api/products` | ✅ | Read-only from Intern 1 |
| Expiry Calculator | `expiryCalculator.js` | ✅ | Predicted → fallback → 400 |
| Batch CRUD | `POST/GET /api/batches` | ✅ | Full FEFO scoring |
| Batch Detail | `GET /api/batches/:id` | ✅ | daysUntilExpiry computed |
| QR Endpoint | `GET /api/batches/:id/qr` | ✅ | Lightweight image-only |
| Note Update | `PATCH /api/batches/:id/note` | ✅ | Appends to noteHistory |
| Raw Material Update | `PATCH /api/batches/:id/raw-material` | ✅ | Audit trail |
| Dispatch | `PATCH /api/batches/:id/dispatch` | ✅ | Status frozen |
| Soft Delete | `DELETE /api/batches/:id` | ✅ | isDeleted:true |
| Restore | `PATCH /api/batches/:id/restore` | ✅ | Admin only |
| Archived List | `GET /api/batches/archived` | ✅ | Protected route |
| FEFO Queue | `GET /api/dispatch/fefo` | ✅ | Priority sorted |
| Public Trace | `GET /trace/:batchCode` | ✅ | Async scan log |
| AI Audit | `POST /api/ai/dispatch-audit` | ✅ | 4hr cache |
| Socket.IO | `server.js` + `useSocket.js` | ✅ | Live batch events |
| Rate Limiter | `middleware/rateLimiter.js` | ✅ | API + AI limits |
| Email Invites | Nodemailer via Gmail SMTP | ✅ | Branded invite emails |
| Frontend Deploy | Firebase Hosting | ✅ | `himshakti2026-bb904.web.app` |
| Backend Deploy | Vercel Serverless | ✅ | `him-shakti-batch-traceability-qr-ma.vercel.app` |

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-11 | Documentation Lead | Initial SRS draft |
| 1.1.0 | 2026-06-25 | Intern 2 | Added Implementation Status §10. Backend Phase 5 complete. |
| 2.0.0 | 2026-07-04 | Intern 2 | Added RBAC, BatchDetailDrawer, soft delete, noteHistory, Google OAuth, access requests, email invites requirements |
| 2.1.0 | 2026-08-02 | Intern 2 | **Final production release.** Updated all sections to reflect deployed system. Firebase Hosting + Vercel deployment confirmed. All acceptance criteria met. |
