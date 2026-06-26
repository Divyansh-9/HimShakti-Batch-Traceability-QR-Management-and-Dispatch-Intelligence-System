# HimShakti Batch Traceability, QR Management & Dispatch Intelligence System

![Status](https://img.shields.io/badge/Status-Full--Stack%20Complete-success)
![Phase](https://img.shields.io/badge/Phase-8%20UI%2FUX%20Polish-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933)
![DB](https://img.shields.io/badge/Database-MongoDB%20Atlas-green)
![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange)

> **Project**: HimShakti Food Processing — Intern 2 System
> **Role**: Batch Traceability, QR Management, and Dispatch Intelligence
> **Last Updated**: 2026-06-26
> **Current Status**: Full-stack complete — Backend + React Frontend with immersive UI/UX

---

## System Overview

A full-stack batch traceability platform for **HimShakti Food Processing, Uttarakhand**, covering wild berry products, natural Himalayan salts, and fruit preserves. The system tracks every batch from farmer → processing → QR labelling → FEFO dispatch, with an AI-powered dispatch advisory layer powered by Gemini 2.5 Flash.

```
┌────────────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas — himshakti DB                    │
│                                                                    │
│  ┌──────────────────┐         ┌───────────────────────────────┐   │
│  │  products        │──READ──▶│  batches  (Intern  owns)     │   │
│  │  (Intern   owns) │         │  batchCode, packDate,         │   │
│  │  5 items seeded  │         │  expiryDate, QR, farmer, FEFO │   │
│  └──────────────────┘         └────────────────┬──────────────┘   │
│                                                │                  │
│                                                ▼                  │
│                               ┌───────────────────────────────┐   │
│                               │  scanEvents  (Intern   owns)  │   │
│                               │  QR scan logs, device,        │   │
│                               │  ipHash, source               │   │
│                               └───────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘

Intern 1 API : http://localhost:5000  (Shelf Life Prediction)
Intern 2 API : http://localhost:5001  (Batch Traceability)  ← This repo
Frontend     : http://localhost:5173  (React / Vite / Tailwind v4)
```

---

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env    # fill in your values
npm start
```
**Expected output:**
```
✅ MongoDB Atlas connected — himshakti DB
✅ Backend running at http://localhost:5001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open: http://localhost:5173

> ⚠️ **Prerequisite**: Your machine IP must be whitelisted in MongoDB Atlas → Security → Network Access. Add `0.0.0.0/0` for development.

---

## Application Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | **Home** | Immersive hero with parallax background, animated stats, feature showcase, minimal system overview |
| `/about` | **About** | Full-bleed Himalayan hero, scroll-reveal sections, mission, who we serve, what you get |
| `/login` | **Sign In / Request Access** | Glassmorphic dual-flow card — sign in (existing users) or request access (new users with role selection) |
| `/dashboard` | **Operations Dashboard** | Protected route — 5 tab panels, dark branded sidebar, full-bleed photo heroes |
| `/trace/:batchCode` | **Public Trace Page** | Consumer-facing QR scan page — batch provenance, farmer, product, expiry |

### Dashboard Tabs

| Tab | Photo Hero | Accent | Purpose |
|-----|------------|--------|---------|
| **Overview** | Himalayan terraced fields | Amber | KPI count-up cards, recent batches table |
| **Batch Registry** | Artisan processing warehouse | Emerald | Create/search/dispatch/QR-download batches |
| **FEFO Queue** | Dispatch logistics scene | Red | Priority queue sorted by expiry × risk score |
| **QR Code Centre** | QR traceability scene | Blue | Downloadable PNG QR cards per batch |
| **AI Dispatch Audit** | Himalayan landscape | Teal | Gemini 2.5 Flash advisory with 4hr cache |

---

## API Reference

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|:----:|---------|
| 1 | `GET` | `/health` | ❌ | Health check |
| 2 | `POST` | `/auth/login` | ❌ | Obtain JWT token |
| 3 | `GET` | `/api/products` | ❌ | List Intern 1 products |
| 4 | `GET` | `/api/products/:id` | ❌ | Fetch single product |
| 5 | `POST` | `/api/batches` | ✅ | Create batch + auto QR + expiry |
| 6 | `GET` | `/api/batches` | ❌ | List all batches (paginated, filterable) |
| 7 | `GET` | `/api/batches/:id` | ❌ | Fetch single batch with live days-to-expiry |
| 8 | `PATCH` | `/api/batches/:id/dispatch` | ✅ | Record dispatch event |
| 9 | `GET` | `/api/dispatch/fefo` | ❌ | FEFO priority queue |
| 10 | `GET` | `/trace/:batchCode` | ❌ | Public QR trace page |
| 11 | `GET` | `/api/qr/:batchCode/image` | ❌ | QR code Base64 PNG |
| 12 | `POST` | `/api/ai/dispatch-audit` | ✅ | Gemini AI advisory (4hr cache) |

**Dev credentials:**
```json
{ "username": "manager", "password": "himshakti2026" }
```

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| **Authentication** | JWT (HS256) — issued on `/auth/login`, verified via `protect()` middleware |
| **Route protection** | `ProtectedRoute` React component — redirects unauthenticated users to `/login` |
| **Rate limiting** | `express-rate-limit` — 100 req/15min (API), 5 req/15min (AI endpoint) |
| **CORS** | Strict allowlist — only `FRONTEND_URL` origin accepted |
| **Helmet** | HTTP security headers (CSP, HSTS, X-Frame-Options) |
| **Token storage** | `localStorage` — cleared on Sign Out |

---

## Frontend Architecture

```
frontend/
├── public/
│   ├── home-hero.png        ← Himalayan terraced fields (Home + Overview tab)
│   ├── about-hero.png       ← Himalayan landscape (About + AI Audit tab)
│   ├── warehouse-bg.png     ← Artisan processing (Login + Batches tab)
│   ├── qr-bg.png            ← QR traceability scene (QR tab)
│   └── fefo-bg.png          ← Dispatch logistics scene (FEFO tab)
└── src/
    ├── pages/
    │   ├── Home.jsx           ← Parallax hero, animated stats, feature grid
    │   ├── About.jsx          ← Full-bleed hero, scroll-reveal sections
    │   ├── Login.jsx          ← Glassmorphic dual-flow card, back-to-home link
    │   └── Dashboard.jsx      ← Protected — sidebar, tab panels, modals, animations
    ├── components/
    │   ├── Navbar.jsx         ← Scroll-aware transparent→solid, brand orange CTA
    │   ├── CreateBatchModal.jsx
    │   ├── DispatchModal.jsx
    │   └── ui/index.js
    ├── hooks/
    │   ├── useAuth.js         ← JWT context, login/logout, persistence
    │   ├── useBatches.js      ← Batch CRUD + QR download
    │   ├── useDispatch.js     ← Dispatch flow
    │   └── useAIAudit.js      ← Gemini audit trigger + display
    └── api/
        └── client.js          ← Axios instance with JWT interceptor
```

### Design System (CSS Variables)

| Token | Light Value | Purpose |
|-------|-------------|---------|
| `--brand-primary` | `#ea580c` | Buttons, active states, links |
| `--bg-primary` | `#f6f8fc` | Page background |
| `--bg-surface` | `#ffffff` | Cards, modals |
| `--text-primary` | `#172033` | Headings, body |
| `--text-muted` | `#667085` | Labels, secondary text |
| Dark mode | `data-theme="dark"` | Full dark token override |

### Key UI Patterns

- **Navbar**: Fixed with `HERO_ROUTES` list — transparent on hero pages, solid after 70px scroll
- **Hero pages**: Full-bleed background images, parallax scroll, scroll-aware navigation transition
- **Dashboard sidebar**: Dark `slate-900` gradient, mountain SVG watermark, colored active tab indicator dot
- **Tab banners**: Full-bleed 176px hero (negative margin trick: `-mx-4 sm:-mx-6 -mt-4 sm:-mt-6`) with real photography at 32% opacity, left-heavy dark gradient overlay, bottom fade to content, colored left accent bar (1px)
- **Tab animations**: `key={activeTab}` on content wrapper → CSS `dashTabIn` fade+slide-up (250ms cubic-ease)
- **KPI count-up**: `AnimatedStat` component with `requestAnimationFrame` cubic ease-out over 900ms
- **Tab color system**: Each tab has its own accent color (amber/emerald/red/blue/teal) applied to banner bar, eyebrow text, KPI card left border, and main-area 1.5% background tint

---

## Backend Structure

```
backend/
├── server.js                    ← Express entry (port 5001)
├── .env / .env.example
└── src/
    ├── config/db.js             ← Atlas connection
    ├── models/
    │   ├── Batch.model.js
    │   └── ScanEvent.model.js
    ├── controllers/
    │   ├── products.controller.js
    │   ├── batches.controller.js
    │   ├── dispatch.controller.js
    │   ├── qr.controller.js
    │   └── ai.controller.js
    ├── routes/ (mirrors controllers)
    ├── services/
    │   ├── expiryCalculator.js  ← FEFO scoring, predicted/fallback expiry
    │   ├── qrGenerator.js       ← qrcode → Base64 PNG
    │   └── geminiService.js     ← Gemini 2.5 Flash + 4hr in-memory cache
    ├── middleware/
    │   ├── auth.js              ← JWT protect() guard
    │   ├── errorHandler.js
    │   └── rateLimiter.js
    └── utils/
        ├── batchCodeGenerator.js ← HS-YYYY-MM-NNN format
        └── productContract.js    ← Asserts Intern 1 product shape
```

---

## Environment Variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `MONGODB_URI` | `mongodb+srv://...` | Shared Atlas cluster URI |
| `PORT` | `5001` | Must not conflict with Intern 1 (5000) |
| `NODE_ENV` | `development` | Helmet + error verbosity |
| `PUBLIC_BASE_URL` | `http://localhost:5001` | Embedded in every QR code |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowlist |
| `GEMINI_API_KEY` | `AIza...` | Google AI Studio key |
| `JWT_SECRET` | `himshakti_...` | Signs manager tokens |
| `GEMINI_CACHE_TTL_HOURS` | `4` | AI audit cache window |

---

## Database Ownership

| Collection | Owner | Access |
|------------|-------|--------|
| `products` | Intern 1 | Intern 2: **READ ONLY** |
| `batches` | **Intern 2** | Full read/write |
| `scanevents` | **Intern 2** | Full read/write |

> **Schema Contract**: Changes to `products` require 24hr written notice to the other intern. See [`shared/README.md`](./shared/README.md).

---

## Documentation Status

| Phase | Document | Status |
|-------|----------|--------|
| Phase 2 | [`intern-2/planning_report.md`](./intern-2/planning_report.md) | ✅ Complete |
| Phase 3 | [`final_project_report.md`](./final_project_report.md) | ✅ Complete |
| Phase 4 | [`intern-2/srs.md`](./intern-2/srs.md) | ✅ Complete |
| Phase 5 | Backend implementation | ✅ Complete |
| Phase 6–8 | Full-stack frontend + UI/UX polish | ✅ **Complete** |
| Next | User Guide (`intern-2/user_guide.md`) | 📋 Recommended |

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Could not connect to any servers` | IP not whitelisted | Atlas → Security → Network Access → Add `0.0.0.0/0` |
| `products count: 0` | Intern 1 hasn't seeded | Ask Intern 1 to run their seed script |
| `GEMINI_API_KEY undefined` | Not in `.env` | Get from [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `401 Unauthorized` | Token expired | Sign out and sign back in |
| Dashboard shows blank | Backend not running | `cd backend && npm start` |
| `Duplicate batch code` | Sequential code race | Restart server, retry POST |

---

*HimShakti Food Processing — Batch Traceability & Dispatch Intelligence | Intern 2 | 2026*
