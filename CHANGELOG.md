# Changelog

All notable changes to the HimShakti Batch Traceability & Dispatch Intelligence System are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.3.0] — 2026-08-03

### 👑 4-Tier RBAC, Super-Admin "GOD" Badge & Recycle Bin

This release introduces a hardened **4-tier role-based access control (RBAC)** architecture with an immutable Tier-0 Super Admin role, an operations lead "Manager" role, and soft-delete / recycle-bin capabilities.

#### Added
- **Tier 0 Super Admin ("GOD" Badge)**:
  - Immutable system owner account (`divyanshuniyal185@gmail.com`) with full administrative privileges.
  - Premium **"⚡ GOD"** gold-shimmer animated badge and **"👑 OWNER"** shield tag displayed in the Admin Panel and top-right navigation bar.
  - Exclusive access to the **Recycle Bin** tab for restoring soft-deleted users or permanently hard-deleting records.
- **Tier 2 Manager Role**:
  - Full operations access across Overview, Batches, FEFO Queue, QR Codes, and AI Audit.
  - Read-only access to the Admin Panel (Users Roster) to view team members without destructive permissions.
- **Recycle Bin & Deletion Model**:
  - Soft-delete workflow (`isDeleted: true`, `deleteNote`, `deletedAt`, `deletedBy`) for secondary Administrators.
  - Hard-delete with typed username confirmation exclusively for Super Admin.
- **Scripts**:
  - `setSuperAdmin.js` migration script for setting the immutable Super Admin flag on the primary system owner account.
- **Documentation**:
  - Created [`docs/RBAC.md`](./docs/RBAC.md) with comprehensive permission matrix and security design notes.
  - Sanitised documentation across all `.md` files to remove plaintext/default login credentials.

#### Changed
- `User.model.js` — Added `isSuperAdmin`, `isDeleted`, `deletedBy`, `deletedAt`, `deleteNote`, `promotedBy`, `promotedAt`, and `previousRole` schema fields.
- `requireAdmin.js` — Tiered backend middleware exporting `requireSuperAdmin`, `requireAdminOrAbove`, `requireManagerOrAbove`, and `getTier`.
- `auth.controller.js` — Guarded destructive actions against Super Admin; added endpoints for role promotion, soft/hard deletion, deleted user listing, and account restoration.
- `Navbar.jsx` & `Dashboard.jsx` — Enhanced Admin Panel UI with role dropdowns, status toggles, recycle bin tab, and gold-shimmer GOD badge styling.

---

## [2.2.0] — 2026-08-02

### 🚀 Production Deployment — System Live

This release marks the **final production deployment** of the HimShakti Batch Traceability & Dispatch Intelligence System. The application is now fully live and accessible at the permanent production URLs below.

#### Deployed

**Frontend — Firebase Hosting**
- Live URL: **https://himshakti2026-bb904.web.app**
- Platform: Firebase Hosting (`himshakti2026-bb904` project)
- Build: `npm run build` → `frontend/dist/` → `firebase deploy`
- SPA routing: All paths rewrite to `/index.html` via `firebase.json`

**Backend API — Vercel Serverless**
- Live API: **https://him-shakti-batch-traceability-qr-ma.vercel.app**
- Platform: Vercel (Node.js Serverless Functions)
- Entry: `backend/index.js` → `server.js`
- All environment variables configured in Vercel dashboard

**Production Environment**
- `VITE_API_BASE_URL` → points to Vercel backend
- `PUBLIC_BASE_URL` → Vercel backend URL (embedded in every QR code)
- `FRONTEND_URL` → Firebase URL (CORS allowlist)
- `GOOGLE_CLIENT_ID` → OAuth 2.0 credential configured
- Gmail SMTP configured for branded invite emails

#### Changed
- `frontend/.env.production` — all production URLs configured
- `vercel.json` — Node.js routing for serverless deployment
- `firebase.json` — SPA rewrites configured

#### Documentation
- `intern-2/srs.md` — Updated to v2.1.0 reflecting complete deployed system
- `final_project_report.md` — Updated with actual deployed architecture and URLs
- `docs/DATABASE.md` — Updated batches schema with v2.0.0 soft-delete fields
- `frontend/README.md` — Updated with deployment, BatchDetailDrawer, Google OAuth
- `CHANGELOG.md` — This entry

---

## [2.1.0] — 2026-07-05

### Bug Fixes & Reliability Hardening

This release resolves a set of critical runtime bugs discovered during live QA, covering the archive visibility flow, database data integrity, Google OAuth linking, and the Admin Panel crash on first load.

---

#### Fixed — Archive & Restore Flow

**Backend: Silent auth failure on archived batch fetch**
- `GET /api/batches` is a public route — `req.user` is always `undefined`, so `includeDeleted=true` check silently failed and archived batches never returned
- **Fix:** Added a dedicated protected route `GET /api/batches/archived` with `protect` middleware — declared **before** `/:id` to prevent Express treating the string `"archived"` as a MongoDB ObjectId

**Frontend: Dead callback chain on archive**
- `onArchived` in `BatchDetailDrawer` only triggered `fetchBatches()` (active list) — no signal reached `BatchesTab`'s archived state, so the Archived tab never refreshed
- **Fix:** Threaded a proper `onArchived` callback from `BatchDetailDrawer → Dashboard → BatchesTab`, with an `archivedVersion` counter that forces `useEffect` re-run and auto-switches to the Archived filter tab

---

#### Fixed — Raw Material Editing

- Added `PATCH /api/batches/:id/raw-material` endpoint (admin + manager + factory-manager)
- Every update appends an entry to `noteHistory[]` with actor, timestamp, and change summary — immutable audit trail
- Frontend "Correct" button in `BatchDetailDrawer` Overview tab wired to the new endpoint with optimistic update and rollback

---

#### Fixed — User Role Data Corruption

- On initial seed, `admin` user was stored with role `lab_admin` (invalid), `manager` with role `admin`, `staff` with role `production_staff` (not in enum)
- All three roles caused incorrect UI behaviour: manager saw Admin Panel with "ADMINISTRATOR" badge, admin account couldn't access elevated APIs
- **Fix:** Corrected all roles directly in MongoDB: `admin → admin`, `manager → manager`, `staff → factory-manager`

---

#### Fixed — Google OAuth Account Linking

- Google Sign-In (`POST /auth/google/token`) validates the access token via Google's `/userinfo` endpoint then looks up users by `googleEmail` field
- No user had `googleEmail` populated, so all Google logins returned `NOT_LINKED` error
- **Fix:** Linked `divyanshuniyal185@gmail.com` to the `admin` / `divyansh` account in MongoDB

---

#### Fixed — Missing `divyansh` Admin Account

- The primary admin account (`username: divyansh`, `password: Uniyal@05`) was missing from MongoDB entirely — likely from a prior DB reset that skipped re-seeding this user
- **Fix:** Created the account with role `admin`, correct bcrypt hash, and Google email linked

---

#### Fixed — Admin Panel White Screen Crash

- `AdminPanelTab` rendered `u.name.split(' ')` — crashed with `TypeError: Cannot read properties of undefined (reading 'split')` when any user record had a `null` / `undefined` `name` field (the `staff` user was upserted without a name)
- **Fix:** Changed to `(u.name || u.username || '?').split(' ')` — safe fallback chain
- Also guarded `new Date(u.createdAt)` with a null check to prevent a secondary crash on users without timestamps
- **DB Fix:** Populated missing `name` and `email` fields for all four user records

---

#### Added — Password Reset Utility

- Inline Node.js reset script to re-hash and upsert `admin` + `manager` passwords from `.env` values directly into MongoDB — useful after any DB reset or `.env` change

#### Added — Comprehensive `.gitignore`

- Expanded root `.gitignore`: presentations (`*.pptx`, `~$*`), environment secrets (`.env`), `node_modules/`, build output (`dist/`, `.vite/`), OS junk (`.DS_Store`, `Thumbs.db`), IDE files — repository is now clean by default

---

#### Changed

- `backend/src/controllers/batches.controller.js` — archive, restore, and `updateRawMaterial` methods added
- `backend/src/routes/batches.routes.js` — `/archived` protected route added before `/:id`
- `frontend/src/hooks/useBatches.js` — `softDeleteBatch`, `restoreBatch`, `updateRawMaterial` mutations with optimistic updates
- `frontend/src/pages/Dashboard.jsx` — `onArchived` callback threaded through, `archivedVersion` state, Admin Panel null-safety guards
- `frontend/src/components/BatchDetailDrawer.jsx` — "Correct" raw material button, Danger Zone wired to callbacks
- `.gitignore` — expanded from 3 lines to comprehensive project-wide exclusion rules

---

## [2.0.0] — 2026-07-04


### Batch Management — Detail-Led Workflow

This release replaces the row-level icon toolbar with a professional **detail-led batch management workflow** — the industry-standard pattern used by Shopify, Linear, and Stripe for operational dashboards.

#### Added

**`BatchDetailDrawer` — New Component**
- **Slide-in drawer panel** opens on any batch row click (right-panel on desktop, full-screen bottom-sheet on mobile)
- **Three tabbed sections** within the drawer:
  - **Overview** — expiry urgency bar, quick action buttons, batch identity cards, raw material source, QR preview, scan analytics, audit metadata
  - **Notes** — editable traceability note (role-gated) with full edit history timeline
  - **History** — audit lifecycle timeline (creation, note edits, dispatch, archive) + recent QR scan events
- **Status color strip** at the top of the drawer matching batch status (red/amber/green/blue)
- **Breadcrumb navigation** in the drawer header
- **Quick action row**: Copy Trace Link, Download QR, Dispatch — directly accessible without leaving the drawer
- **Expiry urgency bar** with color-coded shelf-life-remaining indicator
- **InfoCard components** — themed icon + label + value cards replace the naked label/value grid
- **Full light + dark mode** support using CSS design tokens (no more hardcoded dark colors)
- **Admin Danger Zone** in the Notes tab — archived batch with typed batch-code confirmation

**Soft Delete & Audit Trail**
- Archiving sets `isDeleted: true`, `deletedAt`, `deletedBy`, `deleteNote` — record is preserved, not destroyed
- All archived batches are hidden from active warehouse views but fully restorable
- `PATCH /api/batches/:id/restore` endpoint for admin-only restore
- `batch:deleted` and `batch:restored` real-time socket events emitted on all state changes

**Traceability Note History**
- Editing the traceability note appends the old note to `noteHistory[]` with actor + timestamp
- Note history rendered as a timeline in the Notes tab
- History persists across sessions and is visible to all roles

**RBAC enforcement (backend + frontend)**

| Action | Allowed Roles |
|---|---|
| View drawer | All authenticated users |
| Edit traceability note | `admin`, `manager`, `factory-manager` |
| Archive batch | `admin` only |
| Restore batch | `admin` only |
| Dispatch batch | `admin`, `manager`, `dispatch-coordinator` |

**React Query Optimistic Updates**
- `updateBatchNote` — optimistic note update with automatic rollback on failure
- `softDeleteBatch` — optimistic removal from list with rollback
- `restoreBatch` — cache invalidation on restore

#### Changed
- **Batch table rows** — clicking anywhere on a row opens the detail drawer (previously no row-click handler)
- **Action column** — now contains 3 focused icons: View (eye), Download QR, Dispatch; no more edit/delete inline
- **`useBatches` hook** — added `updateBatchNote`, `softDeleteBatch`, `restoreBatch` mutations
- **`getAllBatches` query** — now filters `{ isDeleted: { $ne: true } }` to exclude archived batches from all list views

#### Fixed
- **Batches tab showing 0 results** — backfilled `isDeleted: false` on all 20 pre-existing batch documents that lacked the new field; updated MongoDB query to use `$ne: true` for backward compatibility
- **Login "Invalid credentials"** — fixed `staff` user with invalid role enum (`production_staff` → `factory-manager`) and missing `isActive` field; one-time migration applied
- **Duplicate Mongoose index warning** — removed explicit `BatchSchema.index({ batchCode: 1 })` which conflicted with `unique: true` on the schema field

#### Schema Changes (Batch model)

```js
// New fields added to Batch.model.js
noteHistory: [{ note: String, editedBy: String, editedAt: Date }]
isDeleted:   Boolean  // default: false
deletedAt:   Date     // null until archived
deletedBy:   String   // username of archiving admin
deleteNote:  String   // optional reason for archiving
```

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
