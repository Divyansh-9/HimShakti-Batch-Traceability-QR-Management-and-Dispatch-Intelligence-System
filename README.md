<div align="center">

# 🌿 HimShakti — Batch Traceability & Dispatch Intelligence System

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live%20%26%20Deployed-22c55e?style=for-the-badge&logo=checkmarx&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Gemini%202.5%20Flash-FF6F00?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-8B5CF6?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Frontend-Firebase%20Hosting-FF6000?style=for-the-badge&logo=firebase&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-Vercel%20Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<p align="center">
  <strong>Farm-to-shelf batch traceability for HimShakti Food Processing, Uttarakhand</strong><br/>
  Wild berries · Natural Himalayan salts · Fruit preserves
</p>

<p align="center">
  🌐 <strong>Live App:</strong> <a href="https://himshakti2026-bb904.web.app">himshakti2026-bb904.web.app</a>
  &nbsp;·&nbsp;
  🔌 <strong>API:</strong> <a href="https://him-shakti-batch-traceability-qr-ma.vercel.app">Vercel Backend</a>
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

## 🚀 Deployment & Infrastructure

### 🌐 Live URLs

| Layer | URL | Platform |
|---|---|---|
| **Frontend** | [himshakti2026-bb904.web.app](https://himshakti2026-bb904.web.app) | Firebase Hosting |
| **Backend API** | [him-shakti-batch-traceability-qr-ma.vercel.app](https://him-shakti-batch-traceability-qr-ma.vercel.app) | Vercel Serverless |
| **Health Check** | [/health](https://him-shakti-batch-traceability-qr-ma.vercel.app/health) | Vercel Serverless |

---

### 🏗️ Tech Stack Summary

| Category | Technology | Why chosen |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast HMR in dev, optimised production bundle |
| **Styling** | Vanilla CSS + CSS Variables | Zero runtime overhead, full design system control |
| **State / Data** | Custom hooks (`useBatches`, `useAuth`, `useAIAudit`) | Lightweight — no Redux overhead |
| **Real-time** | Socket.IO | Bi-directional events for live batch updates |
| **Backend** | Node.js + Express 5 | Familiar, flexible, great ecosystem |
| **Database** | MongoDB Atlas (M0 free tier) | Document model fits batch schema; managed hosting |
| **Authentication** | JWT HS256 + bcrypt | Stateless tokens, role-based access control |
| **AI** | Google Gemini 2.5 Flash | Best cost/quality ratio for structured advisory output |
| **QR Generation** | `qrcode` npm library | Offline, no third-party API dependency |
| **Frontend Deploy** | Firebase Hosting | Global CDN, zero cold-start, free SSL |
| **Backend Deploy** | Vercel Serverless Functions | Always-on free tier, zero cold-start on hobby plan |
| **Email (future)** | Gmail SMTP via `nodemailer` | SMTP credentials stored in Vercel env vars |

---

### ⚠️ Why We Switched from Render to Vercel (Backend)

> **Root cause: Gmail SMTP / email delivery was completely broken on Render's free tier.**

The backend originally deployed to **Render (free tier)**. During integration testing of the invite-link email flow (Admin approves access request → email sent to requester), every attempt failed with connection timeout errors from within Render's infrastructure. Investigation revealed:

| Problem | Detail |
|---|---|
| **SMTP port 587 blocked** | Render free-tier containers block outbound SMTP connections on ports 465 and 587 — the standard Gmail SMTP ports used by `nodemailer`. Emails never left the server. |
| **Cold-start latency** | Render free tier **spins down after 15 minutes of inactivity**. The first request after idle takes **30–60 seconds** to wake up the container — unacceptable for a production demo. |
| **No persistent processes** | Render's free tier kills long-running processes, which caused Socket.IO connections to drop unpredictably. |

**Migration to Vercel** resolved all three issues:
- Vercel Serverless Functions do **not** block SMTP ports — Gmail `nodemailer` email delivery works reliably.
- Vercel's hobby tier has **no spin-down** — endpoints respond in milliseconds.
- Serverless architecture is stateless by design, which pairs cleanly with Socket.IO using a separate connection manager.

---

### 🐢 Known Limitations on Free Tier

| Limitation | Detail | Workaround |
|---|---|---|
| **MongoDB Atlas M0 — 512 MB storage cap** | Free cluster allows max 512 MB data. Sufficient for demo scale (hundreds of batches + QR images). | Upgrade to M2 ($9/mo) for production scale. |
| **MongoDB Atlas M0 — 100 connection limit** | Shared cluster caps simultaneous connections. | Use connection pooling (already configured via Mongoose). |
| **Vercel Serverless — 10-second function timeout** | Hobby plan functions timeout after 10s. Gemini AI audit calls are cached (4hr) to avoid repeated slow calls. | Cache is the primary mitigation; upgrade to Pro ($20/mo) for 60s timeout. |
| **Vercel Serverless — No persistent Socket.IO** | Serverless functions are stateless; Socket.IO real-time requires a separate managed Socket layer in production. | For demo purposes, Socket.IO events are emitted per-request. In production, use Vercel + Ably/Pusher. |
| **Firebase Hosting — 10 GB/month egress** | Free Spark plan allows 10 GB/month data transfer. | Sufficient for demo; upgrade to Blaze (pay-as-you-go) for production. |
| **Gemini API — free tier rate limits** | Google AI Studio free tier: 15 RPM, 1,500 RPD. The 4-hour in-memory cache on the backend prevents hitting this limit under normal usage. | Cache is the primary mitigation. |

---

## 🗂️ Table of Contents

- [What is this?](#-what-is-this)
- [Feature Highlights](#-feature-highlights)
- [Batch Management Workflow](#-batch-management-workflow-v200)
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
- [Documentation Index](#-documentation-index)
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
<summary><b>📦 Batches Tab — Detail-Led Workflow</b></summary>

- **Click any row** to open the `BatchDetailDrawer` — full batch detail without leaving the page
- **Live search** across batch code, product name, farmer name
- **Status filter tabs**: All · Urgent · Warning · Ready · Dispatched — live counts
- **Sort dropdown**: Expiry soonest, Batch Code A→Z, Product A→Z, Status priority
- **Mini urgency progress bar** on expiry column (red ≤7d, amber ≤30d)
- **Row count footer** with active filter labels
- One-click Create Batch modal with form validation
- **Hover actions per row**: View Detail (eye), Download QR, Mark Dispatched

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

## 🗂️ Batch Management Workflow (v2.0.0)

HimShakti uses a **detail-led workflow** for batch management — the industry-standard pattern used by Shopify, Linear, and Stripe.

### How it works

```
Click any batch row → Drawer opens → Inspect → Annotate → Act
```

### BatchDetailDrawer

A slide-in panel with three tabs:

| Tab | What you see |
|---|---|
| **Overview** | Expiry urgency bar · Quick actions · Batch identity cards · Raw material source · QR preview · Scan analytics |
| **Notes** | Editable traceability note (role-gated) · Complete edit history timeline |
| **History** | Audit lifecycle events (creation, note edits, dispatch, archive) · Recent QR scans |

### Soft Delete (Audit-Safe Archiving)

Batches are **never hard-deleted**. Archiving sets `isDeleted: true` and preserves all records:

```
Admin types batch code → confirms → batch hidden from views
All scan history, note history, and metadata preserved
Admin can restore at any time via "Restore Batch"
```

### RBAC Summary

| Action | Roles |
|---|---|
| View drawer | All roles |
| Edit traceability note | `admin`, `manager`, `factory-manager` |
| Archive / Restore | `admin` only |
| Dispatch | `admin`, `manager`, `dispatch-coordinator` |

> 📖 Full documentation: [`docs/BATCH_MANAGEMENT.md`](docs/BATCH_MANAGEMENT.md)

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

Open → **[http://localhost:5173](https://qr-management-system-sigma.vercel.app/)**

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

> 📄 **Full reference**: [`docs/DATABASE.md`](./docs/DATABASE.md) — includes complete field specs, index strategy, design rationale, FEFO algorithm, and step-by-step Atlas setup.

### Why MongoDB?

| Requirement | Why MongoDB wins |
|---|---|
| **Immutable audit trail** | Denormalize product snapshot into each batch document — no JOIN drift |
| **Schema flexibility** | Different product types carry different attributes without sparse SQL columns |
| **QR storage** | 8–12 KB base64 PNG per batch — fits comfortably in a 16 MB document |
| **Operational simplicity** | Atlas free tier: managed backups, auto-scaling, connection pooling |

### Schema Diagram

![HimShakti MongoDB Schema Diagram](./docs/schema-diagram.png)

### Collections & Ownership

| Collection | Owner | Intern 2 Access | Purpose |
|---|---|---|---|
| `products` | **Intern 1** | Read-only | Source product catalog — shelf life, SKU |
| `users` | **Intern 2** | Full read/write | Platform users with RBAC roles |
| `batches` | **Intern 2** | Full read/write | Core traceability records |
| `scanEvents` | **Intern 2** | Append-only | QR scan audit log |
| `accessRequests` | **Intern 2** | Full read/write | Onboarding request & invite flow |

> ⚠️ **Schema Contract**: Changes to `products` require 24hr written notice. See [`shared/README.md`](./shared/README.md).

### Collection Schemas

<details>
<summary><b>📦 batches</b> — Core traceability record (click to expand)</summary>

```javascript
{
  batchCode:        "HS-2026-06-001",  // UNIQUE — auto-generated sequential
  productId:        ObjectId,          // Soft ref → products (Intern 1)
  productName:      "Wild Berry Mix",  // Denormalized snapshot (immutable)
  sku:              "WB-500G",         // Denormalized snapshot (immutable)
  sourceLotCode:    "LOT-WB-2026-045",
  farmerName:       "Ramesh Thakur",
  village:          "Munsiyari",
  quantityProduced: 120,
  unit:             "Kg",              // Enum: Kg | Units | Liters
  yieldPercent:     84.5,             // 0–100 processing efficiency
  packDate:         Date,
  expiryDate:       Date,             // Computed by expiryCalculator.js
  dataSource:       "predicted",      // Enum: predicted | fallback
  shelfLifeSource:  "predicted",      // Enum: predicted | base | manual
  status:           "URGENT",         // Enum: READY | WARNING | URGENT | DISPATCHED | EXPIRED
  priorityScore:    542,              // FEFO sort key — higher = dispatch sooner
  qrCodeDataUrl:    "data:image/png;base64,...",  // 300x300 PNG
  qrAbsoluteUrl:    "https://him-shakti-batch-traceability-qr-ma.vercel.app/trace/HS-2026-06-001",
  dispatchDate:     null,             // Set when dispatched
  buyerName:        null,             // Set when dispatched
  traceabilityNote: "Batch of Wild Berry Mix sourced from Ramesh Thakur...",
  createdBy:        "admin",
  createdAt:        Date,
  updatedAt:        Date
}
```
**Indexes**: `batchCode` (unique), `status+expiryDate` (compound — FEFO queries), `sku`, `productId`

</details>

<details>
<summary><b>👤 users</b> — Platform users with RBAC (click to expand)</summary>

```javascript
{
  username:       "priya.sharma",    // UNIQUE, lowercase
  passwordHash:   "$2b$10$...",      // bcrypt 10 rounds — never stored plain
  name:           "Priya Sharma",
  email:          "priya@himshakti.com",
  googleEmail:    "priya@gmail.com", // SPARSE UNIQUE — Google SSO link (optional)
  googleLinkedAt: Date,
  role:           "factory-manager", // admin | manager | factory-manager | quality-inspector | dispatch-coordinator
  isActive:       true,
  createdAt:      Date,
  updatedAt:      Date
}
```
**Indexes**: `username` (unique), `googleEmail` (sparse unique)

</details>

<details>
<summary><b>📡 scanEvents</b> — QR scan audit log, append-only (click to expand)</summary>

```javascript
{
  batchId:    ObjectId,    // Hard ref → batches._id
  batchCode:  "HS-2026-06-001",   // Denormalized for fast reads
  scannedAt:  Date,
  source:     "buyer",    // Enum: factory | buyer | QA
  deviceType: "Mobile",   // Enum: Mobile | Tablet | Desktop | Unknown
  ipHash:     "a3f5b2...", // SHA-256 hashed — never stored plain (NFR-2.3)
  createdAt:  Date
}
```
**Indexes**: `batchId` (single), `batchId+scannedAt` (compound — paginated history)

</details>

<details>
<summary><b>🔐 accessRequests</b> — Onboarding & invite flow (click to expand)</summary>

```javascript
{
  name:         "Divyansh Uniyal",
  email:        "divyansh@example.com",  // UNIQUE
  role:         "factory-manager",
  status:       "pending",      // Enum: pending | approved | rejected
  note:         "",             // Rejection reason
  inviteToken:  "sha256hash",   // SHA-256 hashed raw token
  inviteExpiry: Date,           // 72 hours from approval
  inviteUsed:   false,
  approvedBy:   "admin",
  createdAt:    Date,
  updatedAt:    Date
}
```
**Indexes**: `email` (unique)

</details>

### FEFO Priority Score

```
Days to expiry ≤ 0   → score 1000   (EXPIRED — emergency)
Days to expiry ≤ 7   → score 500+   (URGENT — dispatch now)
Days to expiry ≤ 30  → score 200+   (WARNING — dispatch soon)
Days to expiry > 30  → score 0–70   (READY — normal queue)
```

Higher score = dispatched first. Computed at batch creation by [`expiryCalculator.js`](./backend/src/services/expiryCalculator.js).

### Setting Up the Database

```bash
# 1. Create free cluster at cloud.mongodb.com (M0 — free tier)
# 2. Create DB user: himshakti-admin with readWriteAnyDatabase role
# 3. Whitelist IP: 0.0.0.0/0 for development
# 4. Copy connection string to backend/.env:

MONGODB_URI=mongodb+srv://himshakti-admin:<password>@cluster0.xxxxx.mongodb.net/himshakti

# 5. Start backend — Mongoose auto-creates collections + indexes:
cd backend && npm run dev
# ✅ [Intern 2] MongoDB Atlas connected — himshakti DB
```

> 📖 Full step-by-step Atlas guide: [`docs/DATABASE.md → Setting Up the Database`](./docs/DATABASE.md#-setting-up-the-database)

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

### v2.2.0 — Production Deployment
- 🚀 Frontend deployed to **Firebase Hosting**: [himshakti2026-bb904.web.app](https://himshakti2026-bb904.web.app)
- 🚀 Backend deployed to **Vercel Serverless**: [him-shakti-batch-traceability-qr-ma.vercel.app](https://him-shakti-batch-traceability-qr-ma.vercel.app)
- ⚙️ All production env vars configured (MongoDB, Gemini, JWT, Google OAuth, Gmail SMTP)
- 📄 All documentation updated to reflect deployed system

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

## 🔧 Troubleshooting

### "Invalid credentials" on login

The seeder runs only when the `users` collection is **empty**. If the DB already has users with old hashed passwords (from a previous `.env`), credentials will fail silently.

**Fix — run the inline reset script from `backend/`:**

```bash
node -e "
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User.model');
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const adminHash   = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12);
  const managerHash = await bcrypt.hash(process.env.SEED_MANAGER_PASSWORD, 12);
  await User.findOneAndUpdate({ username: 'admin' },   { passwordHash: adminHash,   isActive: true }, { upsert: true });
  await User.findOneAndUpdate({ username: 'manager' }, { passwordHash: managerHash, isActive: true }, { upsert: true });
  console.log('Done'); process.exit(0);
}
run();
"
```

### Default Development Credentials


> ⚠️ **Change all passwords before deploying to production. Do not commit credentials to version control.**

| Username | Role | Notes |
|---|---|---|
| `divyansh` | 👑 Super Admin | Primary system owner — Google OAuth linked |
| `admin` | ⚙️ Admin | Backup secondary admin |
| `manager` | 💼 Manager | Operations lead |
| `staff` | 🏭 Factory Manager | Warehouse staff |

> See [docs/RBAC.md](./docs/RBAC.md) for the full role hierarchy and permission matrix.

### Google Sign-In fails with "No account linked"

Google OAuth works by matching the returned Gmail address to a user's `googleEmail` field in MongoDB. If no match is found:

1. Log in with your **username + password** first
2. Go to your profile dropdown → **Google Account** section → click the link icon
3. From that point, your Gmail can be used to sign in directly

### Admin Panel shows a white screen

This was caused by a `u.name.split()` crash when any user in MongoDB had a null/undefined `name` field. Fixed in **v2.1.0**. If you still see it on an older version, ensure all user documents have a `name` field populated.

---

## 📄 Documentation Index

| Document | Purpose | Status |
|---|---|---|
| [`README.md`](./README.md) | System overview, setup, API reference | ✅ v2.3.0 |
| [`CHANGELOG.md`](./CHANGELOG.md) | Full version history | ✅ v2.3.0 |
| [`docs/RBAC.md`](./docs/RBAC.md) | Role hierarchy, permission matrix, promotion rules | ✅ **v2.3.0 New** |
| [`docs/USER_GUIDE.md`](./docs/USER_GUIDE.md) | End-user onboarding guide | ✅ **v2.3.0 Updated** |
| [`docs/BATCH_MANAGEMENT.md`](./docs/BATCH_MANAGEMENT.md) | Batch management workflow, drawer UI, RBAC, soft delete, API | ✅ v2.0.0 |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | Full database design, schema reference & Atlas setup | ✅ v2.1.0 |
| [`docs/schema-diagram.png`](./docs/schema-diagram.png) | Visual ER diagram — all collections & relationships | ✅ Current |
| [`frontend/README.md`](./frontend/README.md) | Frontend architecture & component guide | ✅ v2.2.0 |
| [`intern-2/srs.md`](./intern-2/srs.md) | Software Requirements Specification | ✅ v2.1.0 Final |
| [`intern-2/planning_report.md`](./intern-2/planning_report.md) | Planning & design report (pre-implementation reference) | 📌 Phase 2 |
| [`intern-2/implementation_plan_Initial.md`](./intern-2/implementation_plan_Initial.md) | Initial implementation plan (historical reference) | 📌 Phase 5 |
| [`final_project_report.md`](./final_project_report.md) | Final project report — deployed system architecture & design | ✅ v2.1.0 |
| [`docs/W3_Wireframes.md`](./docs/W3_Wireframes.md) | UI wireframes (design reference) | 📌 Phase 3 |
| [`docs/PROMPTS.md`](./docs/PROMPTS.md) | AI prompt engineering log — variations, inputs/outputs, dual-provider | ✅ Current |

---

<div align="center">

**HimShakti Food Processing — Batch Traceability & Dispatch Intelligence**

*Built with ❤️ for the Himalayan food ecosystem — By Divyansh · 2026*

🌐 **Live**: [himshakti2026-bb904.web.app](https://himshakti2026-bb904.web.app)

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com/Divyansh-9/HimShakti-Batch-Traceability-QR-Management-and-Dispatch-Intelligence-System)

</div>
