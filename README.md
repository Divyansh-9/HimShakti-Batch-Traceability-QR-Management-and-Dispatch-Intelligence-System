<div align="center">

# 🌿 HimShakti — Batch Traceability & Dispatch Intelligence System

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live%20%26%20Active-22c55e?style=for-the-badge&logo=checkmarx&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Gemini%202.5%20Flash-FF6F00?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-8B5CF6?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</p>

<p align="center">
  <strong>Farm-to-shelf batch traceability for HimShakti Food Processing, Uttarakhand</strong><br/>
  Wild berries · Natural Himalayan salts · Fruit preserves
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-live-demo--screenshots">Screenshots</a> ·
  <a href="#-dashboard-features">Dashboard Features</a> ·
  <a href="#-api-reference">API Reference</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-changelog">Changelog</a>
</p>

</div>

---

## 🗂️ Table of Contents

- [What is this?](#-what-is-this)
- [Feature Highlights](#-feature-highlights)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Dashboard Features](#-dashboard-features)
- [API Reference](#-api-reference)
- [Architecture](#-architecture)
- [Security](#-security)
- [Database Design](#-database-design)
- [Frontend Structure](#-frontend-structure)
- [Backend Structure](#-backend-structure)
- [Seeding Demo Data](#-seeding-demo-data)
- [Troubleshooting](#-troubleshooting)
- [Changelog](#-changelog)

---

## 🌱 What is this?

**HimShakti Batch Traceability System** is a full-stack operations platform built for a Himalayan food processing company. It tracks every production batch from farmer intake → processing → QR code labelling → FEFO dispatch — all in one intelligent dashboard.

Key capabilities:

| What it does | How |
|---|---|
| 🔍 **Tracks every batch** | Unique `HS-YYYY-MM-NNN` batch codes, immutable audit trail |
| 📦 **QR Code generation** | Auto-generated QR per batch linking to a public trace page |
| 🚚 **FEFO dispatch queue** | Expiry-based priority scoring with urgency visualization |
| 🤖 **AI Audit advisory** | Gemini 2.5 Flash analyses all batches and gives structured recommendations |
| 👥 **Role-based access** | Admin, Manager, Factory Mgr, QA Inspector, Dispatch Coordinator |
| 📡 **Real-time updates** | Socket.IO pushes live batch changes to all connected dashboards |

---

## ✨ Feature Highlights

<details>
<summary><b>🏠 Overview Tab — Intelligence Hub</b></summary>

- **4 animated KPI cards**: Total Batches, Active Stock, Dispatched, Need Attention
- **Role distribution stacked bar** with clickable segment filters
- **Status Breakdown panel** with animated colour-segmented progress bar
- **Clickable status pills** — tap "Urgent 3" → lands on Batches tab pre-filtered to Urgent
- `View all batches →` shortcut links

</details>

<details>
<summary><b>📦 Batches Tab — Full Command Bar</b></summary>

- **Live search** across batch code, product name, farmer name
- **Status filter tabs**: All · Urgent · Warning · Ready · Dispatched — live counts
- **Sort dropdown**: Expiry soonest, Batch Code A→Z, Product A→Z, Status priority
- **Mini urgency progress bar** on expiry column (red ≤7d, amber ≤30d)
- **Row count footer** with active filter labels
- One-click Create Batch modal with form validation

</details>

<details>
<summary><b>🚚 FEFO Queue — Dispatch Intelligence</b></summary>

- **Status filter tabs**: All · Urgent · Warning · Ready — live counts
- **Urgency bar per row** — proportional, colour-coded by threshold
- **Priority rank badges** (#1 orange pill, #2 grey, rest plain)
- URGENT rows get a subtle red background tint
- Empty state with `Clear filter` button

</details>

<details>
<summary><b>📲 QR Code Centre</b></summary>

- **Status filter tabs**: All · Urgent · Warning · Ready — with scan count badges
- **Lazy-loaded QR images** per card — no base64 string bottleneck
- **Hover actions**: Copy link · View trace · Download PNG
- **Status-coloured borders** per card (red/amber/green)
- **Print sheet** mode — all QR codes on one printable page

</details>

<details>
<summary><b>🤖 AI Audit Tab</b></summary>

- Gemini 2.5 Flash analyses every active batch against expiry risk and FEFO compliance
- Response rendered as **structured glass cards** (not raw markdown)
- **4-hour intelligent cache** — no redundant API calls
- Refresh button + cache timestamp display
- Loading state with progress animation

</details>

<details>
<summary><b>🛡️ Admin Panel — System Intelligence</b></summary>

- **Upgraded KPI cards** with left accent borders and pending count badge
- **Role Distribution Bar** — stacked, clickable, filters Users Roster inline
- **Users Roster**: search + Active/Inactive toggle + role filter tabs + row count footer
- **Access Requests**: Pending · Approved · Rejected · All tabs with live pulse dot on pending
- Inline Approve / Reject flows with optional rejection note
- Invite link generation and one-click copy

</details>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB Atlas** account (or local MongoDB)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Your machine IP whitelisted in Atlas → Security → Network Access

### 1. Clone & Install

```bash
git clone https://github.com/Divyansh-9/HimShakti-Batch-Traceability-QR-Management-and-Dispatch-Intelligence-System.git
cd HimShakti-Batch-Traceability-QR-Management-and-Dispatch-Intelligence-System
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env     # then fill in your values — see table below
npm run dev
```

**Expected console output:**
```
✅ MongoDB Atlas connected — himshakti DB
🚀 Backend running at http://localhost:5001
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open → **http://localhost:5173**

### 4. (Optional) Seed Demo Data

```bash
cd backend
node src/scripts/seedRichData.js
```

This creates **20 realistic batches** with real QR codes across multiple urgency levels, products, and farmers — ready for a full demo.

---

## 🔑 Environment Variables

Create `backend/.env` from `backend/.env.example`:

| Variable | Example | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/himshakti` | Atlas connection string |
| `PORT` | `5001` | Must not conflict with Intern 1 (port 5000) |
| `NODE_ENV` | `development` | Controls Helmet strictness & error verbosity |
| `PUBLIC_BASE_URL` | `http://localhost:5001` | Embedded in every QR code URL |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowlist — only this origin accepted |
| `GEMINI_API_KEY` | `AIzaSy...` | Google AI Studio key for AI Audit |
| `JWT_SECRET` | `himshakti_super_secret_2026` | Signs all auth tokens (min 32 chars) |
| `GEMINI_CACHE_TTL_HOURS` | `4` | AI audit cache window in hours |

> ⚠️ **Never commit `.env` to version control.** The `.env.example` template is safe to commit.

---

## 📊 Dashboard Features

### Tab Overview

| Tab | Accent | Key Features |
|---|---|---|
| **🏠 Overview** | Amber | KPI cards · Status breakdown bar · Clickable filter pills · Cross-tab navigation |
| **📦 Batches** | Emerald | Search + sort + filter tabs · Urgency bars · Dispatch modal · Create batch |
| **🚚 FEFO Queue** | Red | Priority queue · Rank badges · Urgency bars · Filter tabs |
| **📲 QR Code Centre** | Blue | Lazy-loaded QR cards · Scan badges · Print sheet · Download |
| **🤖 AI Audit** | Teal | Gemini advisory · Glass card rendering · 4hr cache |
| **🛡️ Admin Panel** | Rose | Role distribution · User search/filter · Access request management |

### Cross-Tab Navigation

Clicking a **status pill** in the Overview tab (e.g. "Urgent 3") navigates directly to the Batches tab with the Urgent filter pre-applied. This is the flagship UX pattern across all tabs.

```
Overview → [Urgent 3 pill click] → Batches tab, filter=urgent
```

### Role-Based Access

| Role | Overview | Batches | FEFO | QR | AI Audit | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `factory-manager` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `quality-inspector` | ✅ | ✅ (read) | ✅ | ✅ | ❌ | ❌ |
| `dispatch-coordinator` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 📡 API Reference

### Authentication

```http
POST /auth/login
Content-Type: application/json

{ "username": "admin", "password": "himshakti2026" }
```

Returns:
```json
{ "token": "eyJhbGci...", "user": { "name": "...", "role": "admin" } }
```

All protected endpoints require:
```http
Authorization: Bearer <token>
```

### Endpoints

| # | Method | Endpoint | Auth | Description |
|---|---|---|:---:|---|
| 1 | `GET` | `/health` | — | Server health check |
| 2 | `POST` | `/auth/login` | — | Login, returns JWT |
| 3 | `POST` | `/auth/request-access` | — | Submit access request |
| 4 | `GET` | `/auth/users` | ✅ Admin | List all users + stats |
| 5 | `PATCH` | `/auth/users/:id/toggle` | ✅ Admin | Enable/disable user |
| 6 | `GET` | `/auth/requests` | ✅ Admin | List access requests |
| 7 | `POST` | `/auth/requests/:id/approve` | ✅ Admin | Approve + generate invite link |
| 8 | `POST` | `/auth/requests/:id/reject` | ✅ Admin | Reject with optional note |
| 9 | `GET` | `/api/products` | — | List all products |
| 10 | `GET` | `/api/products/:id` | — | Single product |
| 11 | `POST` | `/api/batches` | ✅ | Create batch (auto-generates QR + expiry) |
| 12 | `GET` | `/api/batches` | — | List batches (paginated, filterable) |
| 13 | `GET` | `/api/batches/:id` | — | Single batch with live days-to-expiry |
| 14 | `GET` | `/api/batches/:id/qr` | — | Lightweight QR image only (base64 PNG) |
| 15 | `PATCH` | `/api/batches/:id/dispatch` | ✅ | Record dispatch event |
| 16 | `GET` | `/api/dispatch/fefo` | — | FEFO priority queue (sorted by priority score) |
| 17 | `GET` | `/trace/:batchCode` | — | Public QR trace page (consumer-facing) |
| 18 | `GET` | `/api/qr/:batchCode/image` | — | QR PNG by batch code |
| 19 | `POST` | `/api/ai/dispatch-audit` | ✅ | Gemini AI advisory (4hr cached) |

### Response Format

All API responses follow a consistent envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                   │
│                                                                     │
│  ┌───────────────────────┐       ┌───────────────────────────────┐  │
│  │   Factory Dashboard   │       │   Public QR Trace Page        │  │
│  │   React 18 + Vite     │       │   (Consumer / B2B Buyer)      │  │
│  │   localhost:5173      │       │   /trace/:batchCode           │  │
│  └──────────┬────────────┘       └──────────────┬────────────────┘  │
└─────────────┼────────────────────────────────────┼──────────────────┘
              │ REST + Socket.IO                    │ REST
              ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER  (Port 5001)                         │
│                                                                     │
│  Express + Socket.IO  ·  JWT Middleware  ·  Rate Limiter           │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Auth    │  │  Batch   │  │  FEFO    │  │  AI Audit          │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  (Gemini 2.5 Flash │  │
│  │          │  │  + QR    │  │          │  │   4hr Cache)       │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘  │
│                                                                     │
│  Services: qrGenerator · expiryCalculator · geminiService          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ Mongoose
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   MongoDB Atlas — himshakti DB                      │
│                                                                     │
│  [users]  [accessRequests]  [products]  [batches]  [scanEvents]    │
│                                                                     │
│  ← Intern 1 owns: products (read-only for Intern 2)               │
│  ← Intern 2 owns: users, requests, batches, scanEvents            │
└─────────────────────────────────────────────────────────────────────┘
```

### Real-Time Flow

```
Browser A (creates batch)
        │
        ▼
POST /api/batches  ─────► MongoDB insert
        │
        └──► socket.io emit('batchCreated', data)
                                │
                          ┌─────┴──────┐
                          ▼            ▼
                    Browser B       Browser C
                    (auto-refresh) (auto-refresh)
```

---

## 🔒 Security

| Layer | Mechanism | Detail |
|---|---|---|
| **Authentication** | JWT HS256 | Issued on `/auth/login`, 30-day expiry |
| **Authorization** | RBAC middleware | Role checked server-side on every protected route |
| **Route protection** | `ProtectedRoute` (React) | Redirects unauthenticated users to `/login` |
| **Rate limiting** | `express-rate-limit` | 100 req/15min (API), 5 req/15min (AI endpoint) |
| **CORS** | Strict allowlist | Only `FRONTEND_URL` origin accepted |
| **Helmet** | HTTP security headers | CSP, HSTS, X-Frame-Options, X-Content-Type |
| **Token storage** | `localStorage` | Cleared on Sign Out |
| **AI abuse prevention** | 4hr server-side cache | Gemini calls cached by batch fingerprint |

### Default Credentials (Dev Only)

```json
{ "username": "admin",   "password": "himshakti2026" }
{ "username": "manager", "password": "himshakti2026" }
```

> ⚠️ Change all passwords before any production deployment.

---

## 🗄️ Database Design

### Collections & Ownership

| Collection | Owner | Intern 2 Access |
|---|---|---|
| `products` | Intern 1 | **READ ONLY** |
| `users` | **Intern 2** | Full read/write |
| `accessRequests` | **Intern 2** | Full read/write |
| `batches` | **Intern 2** | Full read/write |
| `scanEvents` | **Intern 2** | Full read/write |

> **Schema Contract**: Changes to `products` require 24hr written notice to the other intern. See [`shared/README.md`](./shared/README.md).

### Batch Schema (key fields)

```javascript
{
  batchCode:       "HS-2026-06-001",      // Auto-generated
  productId:       ObjectId,              // Ref → products
  farmerName:      "Ramesh Thakur",
  village:         "Munsiyari",
  quantityKg:      120,
  packagingDate:   Date,
  expiryDate:      Date,                  // Computed from product shelf life
  daysToExpiry:    Number,                // Virtual (live-computed)
  status:          "active|dispatched",
  qrCodeData:      "base64 PNG string",   // Generated on create
  priorityScore:   Number,               // FEFO sort key
  scanCount:       Number,               // Incremented on each /trace hit
  dispatchedAt:    Date,
  dispatchedBy:    String
}
```

---

## 🎨 Frontend Structure

```
frontend/
├── public/
│   ├── home-hero.png         ← Himalayan terraced fields
│   ├── about-hero.png        ← Himalayan landscape (About + AI tab)
│   ├── warehouse-bg.png      ← Artisan processing (Login + Batches tab)
│   ├── qr-bg.png             ← QR traceability scene
│   └── fefo-bg.png           ← Dispatch logistics scene
│
└── src/
    ├── pages/
    │   ├── Home.jsx           ← Parallax hero, animated stats, feature grid
    │   ├── About.jsx          ← Full-bleed hero, scroll-reveal sections
    │   ├── Login.jsx          ← Glassmorphic dual-flow (login + request access)
    │   ├── Dashboard.jsx      ← All 6 tabs, sidebar, modals, animations
    │   └── TracePage.jsx      ← Public consumer-facing QR scan page
    │
    ├── components/
    │   ├── Navbar.jsx         ← Scroll-aware transparent→solid, brand CTA
    │   ├── CreateBatchModal.jsx
    │   ├── DispatchModal.jsx
    │   └── ErrorBoundary.jsx
    │
    ├── hooks/
    │   ├── useAuth.js         ← JWT context, login/logout, persistence
    │   ├── useBatches.js      ← Batch CRUD + QR download
    │   ├── useDispatch.js     ← Dispatch flow
    │   ├── useAIAudit.js      ← Gemini audit trigger + display
    │   └── useSocket.js       ← Socket.IO real-time connection
    │
    └── api/
        └── client.js          ← Fetch wrapper with JWT interceptor
```

### Design System

| Token | Value | Purpose |
|---|---|---|
| `--brand` | `#ea580c` (orange) | Buttons, active states, links |
| `--surface` | `#1e2433` (dark) | Card backgrounds |
| `--surface-2` | `#252b3b` | Input backgrounds, table headers |
| `--text-primary` | `#f1f5f9` | Headings, body |
| `--text-muted` | `#64748b` | Labels, secondary text |
| `--border` | `rgba(255,255,255,0.08)` | Card/table borders |

### Tab Accent Colours

| Tab | Colour | Applied to |
|---|---|---|
| Overview | Amber `#f59e0b` | Banner bar, eyebrow, KPI border, bg tint |
| Batches | Emerald `#10b981` | Banner bar, filter tab active state |
| FEFO Queue | Red `#ef4444` | Banner bar, urgent row tint |
| QR Centre | Blue `#3b82f6` | Banner bar, QR card borders |
| AI Audit | Teal `#14b8a6` | Banner bar, analysis cards |
| Admin Panel | Rose `#f43f5e` | Banner bar, admin KPI borders |

---

## 🖥️ Backend Structure

```
backend/
├── server.js                     ← Express + Socket.IO entry (port 5001)
├── .env / .env.example
└── src/
    ├── config/
    │   └── db.js                 ← MongoDB Atlas connection
    │
    ├── models/
    │   ├── User.model.js
    │   ├── AccessRequest.model.js
    │   ├── Batch.model.js
    │   └── ScanEvent.model.js
    │
    ├── controllers/
    │   ├── auth.controller.js    ← Login, RBAC, user management, invite links
    │   ├── products.controller.js
    │   ├── batches.controller.js ← Create, list, dispatch, QR endpoint
    │   ├── dispatch.controller.js
    │   ├── qr.controller.js
    │   └── ai.controller.js      ← Gemini proxy with cache
    │
    ├── routes/                   ← Mirrors controllers
    │   ├── auth.routes.js
    │   ├── batches.routes.js     ← Includes /api/batches/:id/qr
    │   └── ...
    │
    ├── services/
    │   ├── expiryCalculator.js   ← FEFO scoring, predicted/fallback expiry
    │   ├── qrGenerator.js        ← qrcode library → Base64 PNG (300×300)
    │   └── geminiService.js      ← Gemini 2.5 Flash + 4hr in-memory cache
    │
    ├── middleware/
    │   ├── auth.js               ← JWT protect() + requireRole()
    │   ├── errorHandler.js
    │   └── rateLimiter.js
    │
    ├── utils/
    │   ├── batchCodeGenerator.js ← HS-YYYY-MM-NNN sequential format
    │   └── productContract.js    ← Validates Intern 1 product shape
    │
    └── scripts/
        └── seedRichData.js       ← Seeds 20 realistic batches with real QRs
```

---

## 🌱 Seeding Demo Data

The seed script generates **20 production-quality batches** with:
- Real QR codes (300×300 PNG, base64 encoded)
- Mixed products, farmers, and villages
- Dates spread across urgency tiers: Urgent (<7d) · Warning (<30d) · Ready (>30d) · Dispatched

```bash
cd backend
node src/scripts/seedRichData.js
```

Output:
```
🌱 Starting rich data seed...
✅ Seeded batch HS-2026-06-001 — Wild Berry Mix (7 days left)
✅ Seeded batch HS-2026-06-002 — Himalayan Salt (82 days left)
...
✅ 20 batches seeded successfully
```

> ⚠️ Running the seed script again will add batches on top of existing ones. Clear the `batches` collection first if you want a clean slate.

---

## 🔧 Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Could not connect to any servers` | IP not whitelisted in Atlas | Atlas → Security → Network Access → Add `0.0.0.0/0` |
| `products count: 0` | Intern 1 hasn't seeded products | Ask Intern 1 to run their seed script |
| `GEMINI_API_KEY undefined` | Missing env variable | Add to `.env`, get key from [AI Studio](https://aistudio.google.com/app/apikey) |
| `401 Unauthorized` on API calls | JWT expired or wrong secret | Sign out → sign back in; verify `JWT_SECRET` matches |
| Dashboard shows blank after login | Backend not running | `cd backend && npm run dev` |
| QR images not loading | `/api/batches/:id/qr` route missing | Pull latest — route was added in v1.3.0 |
| Socket.IO not connecting | CORS mismatch | Ensure `FRONTEND_URL` in `.env` matches your React dev port |
| AI Audit always shows loading | Gemini key invalid or quota exceeded | Check [AI Studio console](https://aistudio.google.com) for quota |

---

## 📋 Changelog

### v1.5.0 — Admin Panel Intelligence Upgrade
- 🆕 Role Distribution stacked bar with clickable legend
- 🆕 Users Roster: search + Active/Inactive toggle + role filter tabs + row count footer
- 🆕 Access Requests: status tabs (Pending/Approved/Rejected/All) with live pulse dot
- ⬆️ KPI cards: left accent borders, pending badge, "Review now →" deep link
- ⬆️ Refresh button on section nav
- ♿ Disabled users rendered at 60% opacity for visual distinction

### v1.4.0 — Cross-Tab Navigation & Smart Filters
- 🆕 **Overview**: 4 KPI cards + Status Breakdown panel with animated segmented bar
- 🆕 **Overview**: Clickable status pills navigate to Batches tab pre-filtered
- 🆕 **Batches**: Command bar (search + sort + filter tabs + New Batch button)
- 🆕 **Batches**: Mini urgency progress bar on Expiry column
- 🆕 **FEFO**: Filter tabs + urgency bars + rank badges + red URGENT row tint
- 🆕 `handleTabSwitch(tabId, filter)` — cross-tab programmatic navigation

### v1.3.0 — QR Code Centre Redesign
- 🆕 Lazy-loading QR images via `/api/batches/:id/qr` lightweight endpoint
- 🆕 Status filter tabs: All · Urgent · Warning · Ready with scan count badges
- 🆕 Hover actions: copy trace link, view in new tab, download PNG
- 🆕 Status-coloured card borders
- 🆕 Print sheet mode for all QR codes

### v1.2.0 — AI Audit Redesign
- 🆕 Structured glass card rendering (replaces raw markdown dump)
- 🆕 4-hour server-side Gemini response cache
- 🆕 Cache timestamp display + manual refresh
- 🆕 Loading progress animation
- 🐛 Fixed blank screen on Gemini API error

### v1.1.0 — Real-Time & Auth
- 🆕 Socket.IO integration — live batch updates across all tabs
- 🆕 Full RBAC — Admin, Manager, Factory Mgr, QA Inspector, Dispatch Coordinator
- 🆕 Access Request flow with admin approve/reject + invite link generation
- 🆕 Admin Panel with user roster and request management
- ⬆️ JWT token refresh on 401 response

### v1.0.0 — Initial Full-Stack Launch
- 🆕 React 18 + Vite dashboard with dark sidebar
- 🆕 Batch CRUD with auto QR generation
- 🆕 FEFO priority queue
- 🆕 Public `/trace/:batchCode` consumer page
- 🆕 Gemini 2.5 Flash AI audit (basic)
- 🆕 Rich seed data script with 20 batches

---

## 📄 Documentation Index

| Document | Purpose | Status |
|---|---|---|
| [`README.md`](./README.md) | System overview, setup, API reference | ✅ Current |
| [`CHANGELOG.md`](./CHANGELOG.md) | Full version history | ✅ Current |
| [`frontend/README.md`](./frontend/README.md) | Frontend architecture & component guide | ✅ Current |
| [`intern-2/srs.md`](./intern-2/srs.md) | Software Requirements Specification | ✅ Phase 4 |
| [`intern-2/planning_report.md`](./intern-2/planning_report.md) | Planning & design report | ✅ Phase 2 |
| [`final_project_report.md`](./final_project_report.md) | Final project report & schema design | ✅ Phase 3 |
| [`shared/README.md`](./shared/README.md) | Inter-intern DB schema contract | ✅ Active |
| [`docs/W3_Wireframes.md`](./docs/W3_Wireframes.md) | UI wireframes | ✅ Phase 3 |

---

<div align="center">

**HimShakti Food Processing — Batch Traceability & Dispatch Intelligence**

*Built with ❤️ for the Himalayan food ecosystem — Intern 2 · 2026*

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/Divyansh-9/HimShakti-Batch-Traceability-QR-Management-and-Dispatch-Intelligence-System)

</div>
