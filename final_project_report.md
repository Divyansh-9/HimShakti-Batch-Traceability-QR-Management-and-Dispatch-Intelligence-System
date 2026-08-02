# Final Project Report — HimShakti Batch Traceability, QR Management & Dispatch Intelligence System

> **Version**: 2.1.0 — Production  
> **Date**: 2026-08-02  
> **Author**: Divyansh Uniyal — Intern 2, TBI-GEU Summer Internship 2026  
> **Status**: ✅ LIVE & DEPLOYED  
> **Frontend**: https://himshakti2026-bb904.web.app  
> **Backend API**: https://him-shakti-batch-traceability-qr-ma.vercel.app

---

## 1. System Architecture and Design Overview

The system is a full-stack MERN application using a 3-tier architecture deployed across cloud platforms:

- **Frontend**: React 18 + Vite 5, hosted on Firebase Hosting
- **Backend**: Node.js + Express 5, deployed on Vercel Serverless
- **Database**: MongoDB Atlas (shared with Intern 1)

```
                  ┌─────────────────────────────────────────────┐
                  │   B2B Buyer / Consumer (Phone Camera Scan)  │
                  └───────────────────┬─────────────────────────┘
                                      │
                               [QR Scan URL]
                                      │
  ┌───────────────────────┐           ▼           ┌────────────────────────────┐
  │   Factory Manager     │  ┌─────────────────┐  │   Public Trace Page        │
  │   Dashboard           │  │   QR Code PNG   │  │  /trace/:batchCode         │
  │   (React 18 + Vite)   │  └─────────────────┘  │   (Mobile Optimized)       │
  └──────────┬────────────┘                        └────────────┬───────────────┘
             │  REST + Socket.IO                                │  REST
             ▼                                                  ▼
  ┌────────────────────────────────────────────────────────────────────────────┐
  │              Node.js / Express REST API (Vercel Serverless)                │
  ├────────────────────────────────────────────────────────────────────────────┤
  │  [JWT Auth + RBAC]  [Socket.IO]  [Gemini 2.5 Flash]  [Nodemailer SMTP]    │
  │  [QR Generator]     [Rate Limiter]  [Helmet]          [CORS Allowlist]     │
  └──────────────────────────────────┬─────────────────────────────────────────┘
                                     │ Mongoose ODM
                                     ▼
  ┌────────────────────────────────────────────────────────────────────────────┐
  │                       MongoDB Atlas (Shared DB)                            │
  ├────────────────────────────────────────────────────────────────────────────┤
  │  [users]  [accessRequests]  [batches]  [scanEvents]  [products (Intern 1)] │
  └────────────────────────────────────────────────────────────────────────────┘
```

### Deployment Architecture

| Component | Platform | URL |
|---|---|---|
| Frontend | Firebase Hosting | https://himshakti2026-bb904.web.app |
| Backend API | Vercel Serverless | https://him-shakti-batch-traceability-qr-ma.vercel.app |
| Database | MongoDB Atlas M0 | `himshakti` database |
| AI | Google Gemini 2.5 Flash | via `@google/generative-ai` SDK |
| Email | Gmail SMTP (Nodemailer) | App Password auth |

---

## 2. MongoDB Schema Design (v2.1.0 — Final)

### 2.1. `products` Collection (Shared — Read-Only for Intern 2)
Managed by Intern 1. Intern 2 reads `predictedShelfLifeDays`, `baseShelfLifeDays`, and `riskLevel` at batch creation time.

```javascript
const ProductSchema = new mongoose.Schema({
  productName:              { type: String, required: true, unique: true },
  sku:                      { type: String, required: true, unique: true },
  category:                 { type: String, enum: ['snack', 'juice', 'pickle'] },
  unitSize:                 { type: String },
  baseShelfLifeDays:        { type: Number, required: true },
  predictedShelfLifeDays:   { type: Number, default: null },
  predictedExpiryTemplate:  { type: String },
  riskLevel:                { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', null] },
  isActive:                 { type: Boolean, default: true }
}, { timestamps: true });
```

### 2.2. `batches` Collection (Owned by Intern 2 — v2.1.0 Final Schema)

```javascript
const BatchSchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────────────────
  batchCode:       { type: String, required: true, unique: true },  // HS-YYYY-MM-NNN

  // ── Product Reference (Denormalized Snapshot) ─────────────────────
  productId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:     { type: String, required: true },  // Immutable after creation
  sku:             { type: String, required: true },   // Immutable after creation

  // ── Raw Material Traceability ─────────────────────────────────────
  sourceLotCode:   { type: String, required: true },
  farmerName:      { type: String, required: true },
  village:         { type: String, required: true },

  // ── Production Metrics ────────────────────────────────────────────
  quantityProduced: { type: Number, required: true, min: 1 },
  unit:             { type: String, enum: ['Kg', 'Units', 'Liters'] },
  yieldPercent:     { type: Number, min: 0, max: 100 },

  // ── Shelf Life & Dates ────────────────────────────────────────────
  packDate:        { type: Date, required: true },
  expiryDate:      { type: Date, required: true },   // Computed by expiryCalculator.js
  dataSource:      { type: String, enum: ['predicted', 'fallback'] },
  shelfLifeSource: { type: String, enum: ['predicted', 'base', 'manual'] },

  // ── FEFO Status ───────────────────────────────────────────────────
  status:          { type: String, enum: ['READY','WARNING','URGENT','DISPATCHED','EXPIRED'] },
  priorityScore:   { type: Number, default: 0 },

  // ── QR Code ──────────────────────────────────────────────────────
  qrCodeDataUrl:   { type: String },  // base64 PNG (300×300)
  qrAbsoluteUrl:   { type: String },  // Public trace URL

  // ── Dispatch ─────────────────────────────────────────────────────
  dispatchDate:    { type: Date, default: null },
  buyerName:       { type: String, default: null },

  // ── Audit Trail ──────────────────────────────────────────────────
  traceabilityNote: { type: String, default: '' },
  noteHistory: [{                     // Append-only — never truncated
    note:     { type: String },
    editedBy: { type: String },
    editedAt: { type: Date, default: Date.now }
  }],
  createdBy: { type: String },

  // ── Soft Delete (v2.0.0) ─────────────────────────────────────────
  isDeleted:  { type: Boolean, default: false },  // Soft archive flag
  deletedAt:  { type: Date, default: null },
  deletedBy:  { type: String, default: null },
  deleteNote: { type: String, default: null },

}, { timestamps: true });

// Indexes
BatchSchema.index({ status: 1, expiryDate: 1 });              // FEFO queries
BatchSchema.index({ isDeleted: 1, status: 1, expiryDate: 1 }); // Archive queries
BatchSchema.index({ sku: 1 });
BatchSchema.index({ productId: 1 });
```

**Key design decisions:**
- `productName` and `sku` are **denormalized snapshots** — the name at time of production is preserved even if the product catalog changes later (FDA/FSSAI audit trail requirement).
- `noteHistory[]` is append-only — every traceability note edit is permanently audited.
- `isDeleted` enables **soft delete** — batches are never hard-deleted. All QR scan history, note history, and metadata are preserved for regulatory compliance.

### 2.3. `users` Collection

```javascript
const UserSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, lowercase: true },
  passwordHash:   { type: String },                 // bcrypt 10 rounds
  name:           { type: String },
  email:          { type: String },
  googleEmail:    { type: String, sparse: true },   // SPARSE UNIQUE — Google SSO
  googleLinkedAt: { type: Date },
  role: {
    type: String,
    enum: ['admin', 'manager', 'factory-manager', 'quality-inspector', 'dispatch-coordinator']
  },
  isActive:       { type: Boolean, default: true }
}, { timestamps: true });
```

### 2.4. `scanEvents` Collection (Append-Only)

```javascript
const ScanEventSchema = new mongoose.Schema({
  batchId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  batchCode:  { type: String },           // Denormalized for fast reads
  scannedAt:  { type: Date, default: Date.now },
  source:     { type: String, enum: ['factory', 'buyer', 'QA'] },
  deviceType: { type: String, enum: ['Mobile', 'Tablet', 'Desktop', 'Unknown'] },
  ipHash:     { type: String }            // SHA-256 hash — never plain text
}, { timestamps: true });
```

### 2.5. `accessRequests` Collection

```javascript
const AccessRequestSchema = new mongoose.Schema({
  name:         { type: String },
  email:        { type: String, unique: true },
  role:         { type: String, enum: ['factory-manager', 'quality-inspector', 'dispatch-coordinator', 'manager', 'admin'] },
  status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  note:         { type: String },          // Rejection reason
  inviteToken:  { type: String },          // SHA-256 hashed raw token
  inviteExpiry: { type: Date },            // 72 hours from approval
  inviteUsed:   { type: Boolean, default: false },
  approvedBy:   { type: String }           // username of approving admin
}, { timestamps: true });
```

---

## 3. Database Optimizations: Indexes & Denormalization

### 3.1. Indexing Strategy

| Index | Collection | Purpose |
|---|---|---|
| `batchCode` (Unique) | `batches` | Fast single batch lookup, deduplication |
| `status + expiryDate` (Compound) | `batches` | FEFO queue query — filter by status, sort by expiry |
| `isDeleted + status + expiryDate` (Compound) | `batches` | Archive view queries |
| `sku` | `batches` | Product-type filtering |
| `productId` | `batches` | All batches for a given product |
| `batchId` | `scanEvents` | All scans for a batch |
| `batchId + scannedAt` (Compound) | `scanEvents` | Paginated scan history |
| `username` (Unique) | `users` | Login lookup |
| `googleEmail` (Sparse Unique) | `users` | Google SSO lookup |
| `email` (Unique) | `accessRequests` | Duplicate submission prevention |

### 3.2. Denormalization Strategy

`productName` and `sku` are copied from `products` into each `batches` document at creation time. This:
- Eliminates expensive `$lookup` (JOIN) operations when listing 100+ batches
- Guarantees historical accuracy — if a product name changes 6 months later, the batch label remains as-printed
- Matches real food safety audit requirements (FDA 21 CFR Part 11, FSSAI traceability mandates)

---

## 4. API Endpoints — Final (v2.1.0)

### 4.1. Authentication
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/auth/login` | — | Login with username + password → JWT |
| `POST` | `/auth/google/token` | — | Google OAuth token exchange → JWT |
| `POST` | `/auth/request-access` | — | Submit onboarding access request |
| `GET` | `/auth/users` | Admin | List all users |
| `PATCH` | `/auth/users/:id/toggle` | Admin | Enable/disable user |
| `GET` | `/auth/requests` | Admin | List access requests |
| `POST` | `/auth/requests/:id/approve` | Admin | Approve + generate invite link + send email |
| `POST` | `/auth/requests/:id/reject` | Admin | Reject with optional note |

### 4.2. Products (Read-Only)
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/products` | — | List all products |
| `GET` | `/api/products/:id` | — | Single product detail |

### 4.3. Batch Management
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/batches` | ✅ | Create batch (auto QR + expiry) |
| `GET` | `/api/batches` | — | List active batches (paginated) |
| `GET` | `/api/batches/archived` | ✅ Admin | List archived batches |
| `GET` | `/api/batches/:id` | — | Single batch with live daysToExpiry |
| `GET` | `/api/batches/:id/qr` | — | QR PNG only (lightweight endpoint) |
| `PATCH` | `/api/batches/:id/note` | ✅ | Update traceability note (appends to history) |
| `PATCH` | `/api/batches/:id/raw-material` | ✅ | Correct raw material data |
| `PATCH` | `/api/batches/:id/dispatch` | ✅ | Record dispatch |
| `DELETE` | `/api/batches/:id` | ✅ Admin | Soft-delete (archive) |
| `PATCH` | `/api/batches/:id/restore` | ✅ Admin | Restore archived batch |

### 4.4. FEFO & QR
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/dispatch/fefo` | — | FEFO priority queue |
| `GET` | `/api/qr/:batchCode/image` | — | QR PNG by batch code |
| `GET` | `/trace/:batchCode` | — | Public consumer trace page |

### 4.5. AI
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/ai/dispatch-audit` | ✅ | Gemini 2.5 Flash advisory (4hr cache) |

### 4.6. Utilities
| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `GET` | `/health` | — | Server health check |

---

## 5. RBAC — Role-Based Access Control

| Action | admin | manager | factory-manager | quality-inspector | dispatch-coordinator |
|---|:---:|:---:|:---:|:---:|:---:|
| View all tabs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create batch | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit traceability note | ✅ | ✅ | ✅ | ❌ | ❌ |
| Dispatch batch | ✅ | ✅ | ❌ | ❌ | ✅ |
| Archive batch | ✅ | ❌ | ❌ | ❌ | ❌ |
| Restore batch | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin Panel | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI Audit | ✅ | ✅ | ❌ | ❌ | ❌ |

RBAC is enforced at **both layers**:
- **Backend**: `requireRole(...roles)` middleware on every protected route — returns `403` on violation
- **Frontend**: Buttons and tabs conditionally rendered based on `user.role` from JWT payload

---

## 6. Batch Lifecycle & FEFO Logic

### 6.1. Expiry Calculation Flow (expiryCalculator.js)

```
             [Create Batch Requested]
                        │
            [Query Product from Database]
                        │
        ┌───────────────┴───────────────┐
 (predictedShelfLifeDays?)          (Missing?)
        │                               │
 expiryDate = packDate               (baseShelfLifeDays?)
 + predictedShelfLifeDays                 │
 dataSource = "predicted"        ┌───────┴────────┐
                               [YES]             [NO]
                                 │               │
                    expiryDate = packDate    Return 400
                    + baseShelfLifeDays      (Creation Blocked)
                    dataSource = "fallback"
```

### 6.2. Status Tiers

| Status | Days to Expiry | FEFO Priority Range | Dashboard Treatment |
|---|---|---|---|
| `URGENT` | ≤ 7 days | 500–570 | 🔴 Red row tint, top of queue |
| `WARNING` | 8–30 days | 200–310 | 🟡 Amber, mid-queue |
| `READY` | > 30 days | 0–70 | 🟢 Green, bottom of queue |
| `DISPATCHED` | — | 0 (frozen) | ✅ Removed from FEFO queue |
| `EXPIRED` | < 0 days | 1000 | 🚨 Emergency |

### 6.3. FEFO Priority Score Algorithm

```javascript
// backend/src/services/expiryCalculator.js
function computePriorityScore(daysToExpiry) {
  if (daysToExpiry <= 0)  return 1000;              // EXPIRED — maximum urgency
  if (daysToExpiry <= 7)  return 500 + (7 - daysToExpiry) * 10;  // URGENT
  if (daysToExpiry <= 30) return 200 + (30 - daysToExpiry) * 5;  // WARNING
  return Math.max(0, 100 - daysToExpiry);           // READY
}
```

Higher `priorityScore` → dispatched first. Score computed once at batch creation; FEFO queue sorts descending by this value.

---

## 7. QR Code Generation Flow

1. **Batch creation**: MongoDB assigns ObjectId; `batchCodeGenerator.js` creates sequential `HS-YYYY-MM-NNN` code.
2. **URL formulation**: `process.env.PUBLIC_BASE_URL + "/trace/" + batchCode` → e.g. `https://him-shakti-batch-traceability-qr-ma.vercel.app/trace/HS-2026-06-001`
3. **QR generation**: `qrcode.toDataURL(url, { width: 300, color: { dark: '#1a4731' } })` → base64 PNG
4. **Storage**: `qrCodeDataUrl` (full base64 PNG) + `qrAbsoluteUrl` (URL string) stored in batch document
5. **Consumer scan**: Phone camera reads QR → opens `TracePage.jsx` → batch info displayed + `scanEvent` logged asynchronously

**Lightweight QR endpoint** (`GET /api/batches/:id/qr`): Returns only the base64 PNG, not the full batch document — used by QR Centre tab for lazy-loaded card images to prevent base64 bottleneck on list views.

---

## 8. AI Dispatch Intelligence

### 8.1. Prompt Design (Gemini 2.5 Flash)

At audit trigger, the backend compiles all active non-dispatched batches into a structured JSON payload:

```json
{
  "auditDate": "2026-08-02",
  "totalActiveBatches": 12,
  "activeBatches": [
    {
      "batchCode": "HS-2026-06-001",
      "productName": "Wild Berry Mix",
      "daysToExpiry": 3,
      "status": "URGENT",
      "yieldPercent": 82.5,
      "priorityScore": 540
    }
  ]
}
```

System instruction enforces structured output with sections: `dispatchQueue`, `criticalAlerts`, `summaryAdvisory`, `qualityFlags`.

### 8.2. Dual-Provider Architecture (Gemini + NVIDIA Fallback)

```
Request → [Gemini 2.5 Flash]
               │ (if 429/error)
               ▼
         [NVIDIA NIM Fallback]
         (meta/llama-3.1-8b-instruct)
               │
               ▼
         [4hr In-Memory Cache]
```

- **Primary**: Google Gemini 2.5 Flash (`@google/generative-ai` SDK)
- **Fallback**: NVIDIA NIM API (`meta/llama-3.1-8b-instruct`)
- **Cache**: In-memory, 4-hour TTL keyed by batch fingerprint hash
- **Frontend**: Response rendered as structured glass cards — no raw markdown displayed

### 8.3. Caching Strategy

The 4-hour in-memory cache (`geminiService.js`) prevents:
- Free-tier quota exhaustion on repeated page visits
- Latency spikes from repeated LLM calls during a shift
- Redundant processing when batch state hasn't materially changed

Admin can force a cache refresh via the "Refresh Audit" button.

---

## 9. Security Architecture

| Layer | Mechanism | Detail |
|---|---|---|
| Authentication | JWT HS256 | 30-day expiry; signed with `JWT_SECRET` |
| Authorization | RBAC middleware | `requireRole()` on every protected route |
| Google SSO | OAuth 2.0 | Token validated against Google `/userinfo` |
| Route protection | `ProtectedRoute` (React) | Redirects to `/login` if no JWT |
| Rate limiting | `express-rate-limit` | 100 req/15min (API), 5 req/15min (AI) |
| CORS | Strict allowlist | Only `FRONTEND_URL` origin accepted |
| Security headers | Helmet | CSP, HSTS, X-Frame-Options, X-Content-Type |
| Password storage | bcrypt 10 rounds | Never stored or logged plain |
| IP addresses | SHA-256 hash | GDPR-compliant — no PII stored |
| Invite tokens | SHA-256 hash | Raw token only in email link; 72hr expiry |

---

## 10. Frontend Application Structure

### Pages
| Page | Route | Purpose |
|---|---|---|
| `Home.jsx` | `/` | Parallax hero, animated stats, feature grid |
| `About.jsx` | `/about` | Full-bleed hero, scroll-reveal mission sections |
| `Login.jsx` | `/login` | Glassmorphic dual-flow: sign in + Google OAuth + request access |
| `Dashboard.jsx` | `/dashboard` | 6-tab operations dashboard |
| `TracePage.jsx` | `/trace/:batchCode` | Public consumer QR scan landing page |

### Key Components
| Component | Purpose |
|---|---|
| `Navbar.jsx` | Scroll-aware: transparent on hero → solid after 70px |
| `BatchDetailDrawer.jsx` | 3-tab slide-in panel: Overview · Notes · History |
| `CreateBatchModal.jsx` | Batch creation form modal with validation |
| `DispatchModal.jsx` | Dispatch confirmation modal |
| `ErrorBoundary.jsx` | React error boundary for AI Audit tab |

### Custom Hooks
| Hook | Purpose |
|---|---|
| `useAuth.js` | JWT context — login, Google Sign-In, logout, persistence |
| `useBatches.js` | Batch CRUD with optimistic updates and rollback |
| `useDispatch.js` | Dispatch mutation flow |
| `useAIAudit.js` | Gemini audit trigger and structured response state |
| `useSocket.js` | Socket.IO live event connection |

### Design System
| Token | Value | Purpose |
|---|---|---|
| `--brand` | `#ea580c` | Buttons, active states, links |
| `--surface` | `#1e2433` | Card backgrounds |
| `--surface-2` | `#252b3b` | Input fields, table headers |
| `--bg` | `#141824` | Page background |
| `--text-primary` | `#f1f5f9` | Headings, body |
| `--text-muted` | `#64748b` | Labels, secondary |
| `--border` | `rgba(255,255,255,0.08)` | Card/table borders |

---

## 11. Deployment Guide

### Local Development
```bash
# Backend
cd backend
npm install
cp .env.example .env   # Fill in your values
npm run dev            # http://localhost:5001

# Frontend
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### Production Deployment

**Backend → Vercel:**
```bash
cd backend
# Ensure vercel.json is configured
vercel --prod
# Set all env vars in Vercel Dashboard → Project Settings → Environment Variables
```

**Frontend → Firebase Hosting:**
```bash
cd frontend
npm run build           # Builds to frontend/dist/
cd ..                   # Return to project root
firebase deploy --only hosting
```

**Required Production Environment Variables:**

| Variable | Location | Purpose |
|---|---|---|
| `MONGODB_URI` | Vercel Dashboard | Atlas connection string |
| `JWT_SECRET` | Vercel Dashboard | Token signing key |
| `GEMINI_API_KEY` | Vercel Dashboard | Gemini 2.5 Flash |
| `PUBLIC_BASE_URL` | Vercel Dashboard | Embedded in QR codes |
| `FRONTEND_URL` | Vercel Dashboard | CORS allowlist |
| `GOOGLE_CLIENT_ID` | Vercel Dashboard | OAuth credential |
| `EMAIL_USER`, `EMAIL_PASS` | Vercel Dashboard | Gmail SMTP |
| `VITE_API_BASE_URL` | `frontend/.env.production` | Backend API URL |
| `VITE_GOOGLE_CLIENT_ID` | `frontend/.env.production` | OAuth client |

---

## 12. Known Limitations & Future Enhancements

| Limitation | Impact | Suggested Future Fix |
|---|---|---|
| AI cache is in-memory | Resets on server cold start | Use Redis or MongoDB cache collection |
| No email verification for access requests | Malformed emails accepted | Add email verification step |
| QR codes embed backend URL | If backend URL changes, old QRs break | Use short-URL redirect service |
| Gemini free-tier rate limits | AI audit may fail under heavy load | Implement request queue + retry |
| Single MongoDB Atlas cluster | No read replica | Upgrade to paid tier for read scaling |

---

*HimShakti Food Processing — Batch Traceability & Dispatch Intelligence*  
*Built by Divyansh Uniyal · TBI-GEU Summer Internship 2026*  
*Production: https://himshakti2026-bb904.web.app*
