# Changelog

All notable changes to the HimShakti Batch Traceability & Dispatch Intelligence System are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.5.0] — 2026-06-29

### Admin Panel — Intelligence Upgrade

#### Added
- **Role Distribution Bar** — stacked proportional colour bar above the users table; each segment is clickable to filter the roster
- **Clickable role legend pills** — tap any role pill to instantly filter Users Roster
- **Users Roster search bar** — live search across name, email, and username
- **Active/Inactive status toggle** — three-way: All / Active / Inactive (colour-coded)
- **Role filter tabs** in Users Roster — All · Admin · Factory Mgr · QA Inspector · Dispatch Coordinator with live counts
- **Row count footer** on Users table — "Showing X of Y users · role: Factory Mgr · status: active"
- **Access Requests status tabs** — Pending (amber) · Approved (green) · Rejected (red) · All, with live pulse dot on Pending when count > 0
- **Refresh button** inline with section sub-nav (RefreshCw icon)
- **"Review now →" deep link** on Pending KPI card — navigates directly to Pending tab
- **Empty state** on Users Roster with one-click "Clear filters" reset

#### Changed
- KPI cards: replaced generic icon cards with **left-border accent cards** (brand colour per metric)
- Active status dot now **animates (pulses)** for currently active users
- Disabled users rendered at **60% opacity** for immediate visual distinction
- Approve/Reject actions now **only appear on pending cards** (cleaner resolved request view)
- History section removed — replaced by unified status-filtered card grid

---

## [1.4.0] — 2026-06-29

### Cross-Tab Navigation & Smart Filters

#### Added
- **Overview → Status Breakdown panel** — animated segmented colour bar showing split between Urgent / Warning / Ready / Dispatched
- **Overview → Clickable status pills** — e.g. "Urgent 3" navigates to Batches tab pre-filtered to Urgent
- **Overview → 4 KPI cards** — Total Batches, Active Stock, Dispatched, Need Attention (2×2 grid)
- **Batches → Command bar** — search + sort dropdown + New Batch button in one unified row
- **Batches → Status filter tabs** — All · Urgent · Warning · Ready · Dispatched with live counts and colour underlines
- **Batches → Sort options** — Expiry soonest, Batch Code A→Z, Product A→Z, Status priority
- **Batches → Mini urgency bar** on expiry column (red ≤7d, amber ≤30d, green >30d)
- **Batches → Row count footer** — "Showing X of Y batches · filtered by urgent"
- **FEFO → Filter tabs** — All · Urgent · Warning · Ready with live counts
- **FEFO → Urgency progress bar** per row (proportional, colour-coded)
- **FEFO → Priority rank badges** — #1 orange pill, #2 grey, rest plain text
- **FEFO → URGENT row tint** — subtle red background on highest-priority rows
- `handleTabSwitch(tabId, filter)` function in Dashboard — cross-tab programmatic navigation
- `batchesFilter` state in Dashboard — passed as `initialFilter` to BatchesTab

#### Changed
- BatchesTab now accepts `initialFilter` prop
- OverviewTab now accepts `onTabSwitch` prop
- Empty state in Batches/FEFO includes "Clear filter" button

---

## [1.3.0] — 2026-06-28

### QR Code Centre Redesign

#### Added
- **Status filter tabs**: All · Urgent · Warning · Ready (with scan count badges per card)
- **Lazy-loading QR images** via `/api/batches/:id/qr` endpoint — prevents base64 bottleneck in list
- **Hover actions** on QR cards: copy trace link, open trace in new tab, download PNG
- **Status-coloured borders** per QR card (red=urgent, amber=warning, green=ready)
- **Print sheet mode** — all visible QR codes on one printable page
- `GET /api/batches/:id/qr` lightweight endpoint returns image only (no full batch data)

#### Changed
- QR cards now use `<img src="/api/batches/:id/qr">` instead of inline base64 strings
- Scan count displayed as badge on each card

---

## [1.2.0] — 2026-06-27

### AI Audit Redesign

#### Added
- **Structured glass card rendering** — Gemini response parsed into sections displayed as distinct cards
- **4-hour server-side cache** — Gemini responses cached by batch fingerprint, no redundant API calls
- **Cache timestamp display** — shows when audit was last generated
- **Manual refresh button** — forces cache invalidation
- **Loading progress animation** with stage labels

#### Fixed
- Blank screen on Gemini API error — now shows error card with retry option
- Markdown leak into UI — raw `**bold**` and `##` no longer rendered as text

---

## [1.1.0] — 2026-06-26

### Real-Time & Auth Upgrade

#### Added
- **Socket.IO** server + `useSocket` client hook — live batch creation/update events broadcast to all connected dashboards
- **Full RBAC** — five roles: Admin, Manager, Factory Manager, QA Inspector, Dispatch Coordinator
- **Access Request flow** — new users submit access request with role; admin approves/rejects
- **Invite link generation** — approved requests produce a 48hr invite link
- **Admin Panel** (admin-only tab) — users roster, access request management, stat cards
- `requireRole(...roles)` middleware on all sensitive routes

#### Changed
- `protect()` middleware now validates role from JWT payload
- Admin-only nav tab hidden for non-admin users

---

## [1.0.0] — 2026-06-25

### Initial Full-Stack Launch

#### Added
- React 18 + Vite + Tailwind CSS v4 frontend
- Dark sidebar dashboard with 5 tab panels
- Tab banner heroes (full-bleed 176px) with real photography
- `key={activeTab}` CSS fade+slide-in animation on tab switch
- Batch CRUD — create, list, dispatch
- Auto QR code generation (300×300 PNG, base64 encoded) on batch creation
- FEFO priority queue (`GET /api/dispatch/fefo`) sorted by priority score
- Public `/trace/:batchCode` consumer page — batch provenance, farmer, product, expiry
- Gemini 2.5 Flash AI audit (basic markdown display)
- `seedRichData.js` — 20 realistic batches with real QR codes
- JWT authentication with `localStorage` persistence
- `express-rate-limit` — 100 req/15min (API), 5 req/15min (AI)
- Helmet security headers
- MongoDB Atlas connection with schema validation

---

*HimShakti Food Processing — Batch Traceability & Dispatch Intelligence · Intern 2 · 2026*
