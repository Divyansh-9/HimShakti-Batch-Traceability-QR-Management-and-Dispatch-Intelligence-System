# HimShakti — Project Tracker

> Living document. Updated after every development session.
> Organized by: **Epic → Story → Task** (Jira-style).
> Status key: `✅ Done` · `🔄 In Progress` · `⏳ Planned` · `❌ Blocked` · `🚫 Descoped`
> **Last updated:** 2026-08-07 · v2.10.0

---

## How to Read This File

| Field | Meaning |
|---|---|
| **Epic** | A large feature area or product goal (e.g., Settings Centre, RBAC) |
| **Story** | A user-facing capability within the Epic |
| **Task** | A specific technical change required to deliver the Story |
| **Priority** | 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low |

---

---

## EPIC-01 · 4-Tier RBAC & User Management

> **Goal:** Enforce role-based access across the full stack with an immutable Super Admin tier and a safe soft-delete recycle bin.
> **Released:** v2.3.0 — 2026-08-03 | **Status:** ✅ Done

---

### STORY-01-01 · Tier 0 Super Admin ("GOD" Badge) ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-001 | Add `isSuperAdmin` field to `User.model.js` | ✅ | 🔴 | `backend/src/models/User.model.js` |
| T-002 | Detect Super Admin from email/username in auth middleware | ✅ | 🔴 | `backend/src/middleware/auth.js` |
| T-003 | GOD gold-shimmer badge + OWNER tag in Navbar | ✅ | 🟠 | `frontend/src/components/Navbar.jsx` |
| T-004 | GOD badge in Admin Panel user roster | ✅ | 🟠 | `frontend/src/pages/Dashboard.jsx` |
| T-005 | `setSuperAdmin.js` migration script | ✅ | 🔴 | `backend/scripts/setSuperAdmin.js` |

---

### STORY-01-02 · Tier 2 Manager Role ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-006 | Add `manager` to User schema enum | ✅ | 🟠 | `backend/src/models/User.model.js` |
| T-007 | `requireManagerOrAbove` middleware | ✅ | 🔴 | `backend/src/middleware/requireAdmin.js` |
| T-008 | Lock destructive admin routes to `requireAdminOrAbove` | ✅ | 🔴 | `backend/src/routes/auth.routes.js` |
| T-009 | Read-only User Roster view for Manager | ✅ | 🟠 | `frontend/src/pages/Dashboard.jsx` |

---

### STORY-01-03 · Soft-Delete & Recycle Bin ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-010 | Add `isDeleted`, `deletedBy`, `deletedAt`, `deleteNote` to User model | ✅ | 🔴 | `backend/src/models/User.model.js` |
| T-011 | `deleteUser`, `listDeletedUsers`, `restoreUser` controller endpoints | ✅ | 🔴 | `backend/src/controllers/auth.controller.js` |
| T-012 | Recycle Bin tab in Dashboard (Super Admin only) | ✅ | 🟠 | `frontend/src/pages/Dashboard.jsx` |
| T-013 | Hard-delete with typed username confirmation dialog | ✅ | 🟠 | `frontend/src/pages/Dashboard.jsx` |
| T-014 | Write `docs/RBAC.md` permission matrix | ✅ | 🟡 | `docs/RBAC.md` |

---

---

## EPIC-02 · Settings Centre

> **Goal:** A polished, cross-device settings panel covering profile, theme, security, and role-based notifications.
> **Status:** ✅ Done (Phase 1, Phase 2, and Phase 3 completed)

---

### STORY-02-01 · Backend Settings Infrastructure ✅ (Phase 1)

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-020 | Add `phone` field to `User.model.js` | ✅ | 🟠 | `backend/src/models/User.model.js` |
| T-021 | Add `preferences` object to `User.model.js` (mode, palette, accent) | ✅ | 🟠 | `backend/src/models/User.model.js` |
| T-022 | Create `LoginEvent.model.js` with 30-day TTL index | ✅ | 🔴 | `backend/src/models/LoginEvent.model.js` |
| T-023 | Create `loginHistory.service.js` (UA parse + geo lookup, non-blocking) | ✅ | 🔴 | `backend/src/services/loginHistory.service.js` |
| T-024 | `GET /auth/me` — fetch own profile | ✅ | 🟠 | `backend/src/controllers/auth.controller.js` |
| T-025 | `PATCH /auth/me` — update name + phone | ✅ | 🟠 | `backend/src/controllers/auth.controller.js` |
| T-026 | `PATCH /auth/me/settings` — save preferences | ✅ | 🟠 | `backend/src/controllers/auth.controller.js` |
| T-027 | `POST /auth/me/change-password` — bcrypt-guarded | ✅ | 🔴 | `backend/src/controllers/auth.controller.js` |
| T-028 | `GET /auth/me/login-history` — last 10 events | ✅ | 🟠 | `backend/src/controllers/auth.controller.js` |
| T-029 | Register all 5 self-service routes in `auth.routes.js` | ✅ | 🔴 | `backend/src/routes/auth.routes.js` |
| T-030 | Hook `appendLoginEvent` — password login path | ✅ | 🔴 | `backend/src/controllers/auth.controller.js` |
| T-031 | Hook `appendLoginEvent` — Google OAuth path | ✅ | 🔴 | `backend/src/controllers/googleAuth.controller.js` |
| T-032 | **Bugfix:** Add `_id` to JWT payload so `req.user._id` resolves in protected routes | ✅ | 🔴 | `backend/src/controllers/auth.controller.js`, `backend/src/controllers/googleAuth.controller.js` |

---

### STORY-02-02 · Frontend Settings Infrastructure ✅ (Phase 1)

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-033 | Create `SettingsContext.jsx` (mode + palette + accent, localStorage + DB sync) | ✅ | 🔴 | `frontend/src/context/SettingsContext.jsx` |
| T-034 | Create `useSettingsMutation.js` (TanStack Query mutation) | ✅ | 🟠 | `frontend/src/hooks/useSettingsMutation.js` |
| T-035 | Wrap `main.jsx` with `<SettingsProvider>` inside `<QueryClientProvider>` | ✅ | 🔴 | `frontend/src/main.jsx` |
| T-036 | Add system-mode media queries + 8 palette CSS vars to `index.css` | ✅ | 🟠 | `frontend/src/index.css` |
| T-037 | **Bugfix:** `skipAuthRedirect: true` + `retry: false` on `/auth/me` query to prevent 401 redirect loop on login page | ✅ | 🔴 | `frontend/src/context/SettingsContext.jsx` |
| T-038 | Wire Settings tab into Dashboard sidebar | ✅ | 🟠 | `frontend/src/pages/Dashboard.jsx` |

---

### STORY-02-03 · Premium Settings Panel UI ✅ (Phase 1 Redesign — 2026-08-05)

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-039 | Full rewrite of `SettingsPanel.jsx` — compact left rail with icon + subtitle | ✅ | 🔴 | `frontend/src/components/SettingsPanel.jsx` |
| T-040 | Profile: avatar header summary + name/phone editable grid + readonly fields | ✅ | 🟠 | `frontend/src/components/SettingsPanel.jsx` |
| T-041 | Customisation: segmented Light/Dark/System + 3-stripe palette cards + Reset | ✅ | 🟠 | `frontend/src/components/SettingsPanel.jsx` |
| T-042 | Security: eye-reveal toggle on all password fields | ✅ | 🔴 | `frontend/src/components/SettingsPanel.jsx` |
| T-043 | Security: 4-bar password strength meter on new-password field | ✅ | 🟠 | `frontend/src/components/SettingsPanel.jsx` |
| T-044 | Security: icon-rich login history rows (location / browser / time / method) | ✅ | 🟠 | `frontend/src/components/SettingsPanel.jsx` |
| T-045 | Notifications: 4 role-based rows with Phase 3 badge (not empty placeholder) | ✅ | 🟡 | `frontend/src/components/SettingsPanel.jsx` |

---

### STORY-02-04 · ThemePicker Header Dropdown ✅ (2026-08-05)

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-046 | Create `ThemePicker.jsx` — 3-option popover (Light/Dark/System) via SettingsContext | ✅ | 🔴 | `frontend/src/components/ThemePicker.jsx` |
| T-047 | Replace `ThemeToggle` in Navbar (desktop, public nav, mobile) | ✅ | 🔴 | `frontend/src/components/Navbar.jsx` |
| T-048 | Add `animate-popover-in` CSS keyframe | ✅ | 🟡 | `frontend/src/index.css` |
| T-049 | Refactor `useTheme.js` → thin proxy over SettingsContext (one source of truth) | ✅ | 🔴 | `frontend/src/hooks/useTheme.js` |

---

### STORY-02-05 · Additional Palettes ✅ (Phase 2 — 2026-08-05)

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-050 | Add palettes 9–25 to `index.css` (light + dark variants each) | ✅ | 🟠 | `frontend/src/index.css` |
| T-051 | Add palette metadata to `PALETTES` array in `SettingsPanel.jsx` | ✅ | 🟠 | `frontend/src/components/SettingsPanel.jsx` |

---

### STORY-02-06 · Advanced Customisation Controls ✅ (Phase 2 — 2026-08-05)

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-052 | Accent colour selector (17 swatches + Auto) | ✅ | 🟡 | `frontend/src/components/SettingsPanel.jsx`, `frontend/src/index.css` |
| T-053 | Font family selector (Inter, DM Sans, Outfit, Manrope) via Google Fonts | ✅ | 🟡 | `frontend/src/components/SettingsPanel.jsx`, `frontend/src/index.css`, `frontend/index.html` |
| T-054 | Density selector (Compact / Normal / Cozy) | ✅ | 🟡 | `frontend/src/components/SettingsPanel.jsx`, `frontend/src/index.css` |
| T-055 | Extend `SettingsContext` DEFAULTS + `applyPrefsToDOM` for font + density | ✅ | 🔴 | `frontend/src/context/SettingsContext.jsx` |

---

### STORY-02-07 · Role-Based Notifications ✅ (Phase 3 — 2026-08-05)

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-060 | Create `Notification.model.js` (role, type, message, read, 7-day TTL) | ✅ | 🔴 | `backend/src/models/Notification.model.js` |
| T-061 | Create `notificationService.js` (notify + notifyRoles, fire-and-forget) | ✅ | 🔴 | `backend/src/services/notificationService.js` |
| T-062 | Batch creation → notify `factory-manager` + `manager` | ✅ | 🟠 | `backend/src/controllers/batches.controller.js` |
| T-063 | Quality inspection → notify `manager` | ✅ | 🟠 | `backend/src/controllers/inspections.controller.js` (Completed) |
| T-064 | Dispatch → notify `manager` + `factory-manager` | ✅ | 🟠 | `backend/src/controllers/batches.controller.js` |
| T-065 | Admin approve/changeRole/deleteUser → notify `super-admin` | ✅ | 🟠 | `backend/src/controllers/auth.controller.js` |
| T-066 | Navbar bell icon + animated unread badge | ✅ | 🟠 | `frontend/src/components/Navbar.jsx` |
| T-067 | NotificationPanel dropdown (type icons, timestamps, refId) | ✅ | 🟠 | `frontend/src/components/NotificationPanel.jsx` |
| T-068 | Mark-one-read (on click) + mark-all-read + clear-read | ✅ | 🟡 | `frontend/src/components/NotificationPanel.jsx` |
| T-069 | Socket.io `role:X` room routing, `auth:join` event, super-admin → admin room | ✅ | 🔴 | `backend/server.js` |
| T-070 | REST endpoints: GET, GET /unread, PATCH /:id/read, PATCH /read-all, DELETE /clear | ✅ | 🟠 | `backend/src/controllers/notifications.controller.js`, `backend/src/routes/notifications.routes.js` |
| T-071 | `useNotifications` hook — socket singleton, optimistic updates, merge strategy | ✅ | 🔴 | `frontend/src/hooks/useNotifications.js` |
| T-072 | Settings panel Notifications tab — live active/pending status per event | ✅ | 🟡 | `frontend/src/components/SettingsPanel.jsx` |
| T-073 | `animate-pulse-once` badge animation keyframe | ✅ | 🟡 | `frontend/src/index.css` |

---

---

## EPIC-05 · Bulk Batch Import

> **Goal:** Enable factory managers to register an entire production run from a CSV spreadsheet with preview, validation, and atomic rollback.
> **Released:** v2.6.0 — 2026-08-06 | **Status:** ✅ Done

---

### STORY-05-01 · Backend Import Pipeline ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-100 | `ImportJob.model.js` — audit record per import run with rollback manifest | ✅ | 🔴 | `backend/src/models/ImportJob.model.js` |
| T-101 | `import.controller.js` — validate (dry-run), commit (chunked), rollback, history, schema | ✅ | 🔴 | `backend/src/controllers/import.controller.js` |
| T-102 | `import.routes.js` mounted at `/api/import` | ✅ | 🔴 | `backend/src/routes/import.routes.js` |
| T-103 | `requireImporter` RBAC gate — factory-manager and above only | ✅ | 🔴 | `backend/src/middleware/requireAdmin.js` |
| T-104 | Contiguous batch-code pre-allocation per chunk (one query per chunk, not per row) | ✅ | 🟠 | `backend/src/controllers/import.controller.js` |
| T-105 | Duplicate detection on Source Lot + SKU + Pack Date (DB + in-file) | ✅ | 🟠 | `backend/src/controllers/import.controller.js` |
| T-106 | Rollback soft-deletes inserted batches; dispatched/archived rows keep own state | ✅ | 🟠 | `backend/src/controllers/import.controller.js` |
| T-107 | `batch_imported` notification type added to `Notification.model.js` | ✅ | 🟡 | `backend/src/models/Notification.model.js` |

---

### STORY-05-02 · Frontend Import Wizard ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-108 | `csvParser.js` — dependency-free RFC 4180 parser (quoted fields, BOM, delimiter detect) | ✅ | 🔴 | `frontend/src/utils/csvParser.js` |
| T-109 | `useImport.js` — TanStack Query hooks for validate/commit/rollback | ✅ | 🔴 | `frontend/src/hooks/useImport.js` |
| T-110 | `ImportPanel.jsx` — 4-step wizard: choose → map → preview → commit | ✅ | 🔴 | `frontend/src/components/ImportPanel.jsx` |
| T-111 | Per-row preview: `will import` / `skip` / `error` labels, filterable, downloadable error CSV | ✅ | 🟠 | `frontend/src/components/ImportPanel.jsx` |
| T-112 | Chunked live progress bar during commit | ✅ | 🟠 | `frontend/src/components/ImportPanel.jsx` |
| T-113 | Header auto-matching for common field name variants | ✅ | 🟡 | `frontend/src/utils/csvParser.js` |
| T-114 | Downloadable CSV template link | ✅ | 🟡 | `frontend/src/components/ImportPanel.jsx` |

---

---

## EPIC-06 · Guided Walkthrough — Full Rebuild

> **Goal:** Replace the static tab-listing tour with a role-aware, task-oriented guided experience that teaches workflows rather than naming screens.
> **Released:** v2.6.0 — 2026-08-06 | **Status:** ✅ Done

---

### STORY-06-01 · Walkthrough Engine Refactor ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-120 | Extract tour content to `config/walkthroughSteps.js` (separate engine from copy) | ✅ | 🔴 | `frontend/src/config/walkthroughSteps.js` |
| T-121 | Filter steps against tabs the signed-in role actually renders | ✅ | 🔴 | `frontend/src/context/WalkthroughContext.jsx` |
| T-122 | Poll for target DOM node instead of fixed 380 ms delay | ✅ | 🔴 | `frontend/src/components/WalkthroughTour.jsx` |
| T-123 | `ResizeObserver` for tour card height — prevent off-screen positioning | ✅ | 🟠 | `frontend/src/components/WalkthroughTour.jsx` |
| T-124 | Spotlight tracks target through scroll and resize | ✅ | 🟠 | `frontend/src/components/WalkthroughTour.jsx` |
| T-125 | Missing target centres card with descriptive message (no silent floating) | ✅ | 🟠 | `frontend/src/components/WalkthroughTour.jsx` |
| T-126 | Progress dots are clickable — jump to any step | ✅ | 🟡 | `frontend/src/components/WalkthroughTour.jsx` |
| T-127 | `?` keyboard shortcut opens Help anywhere (ignores active inputs) | ✅ | 🟡 | `frontend/src/context/WalkthroughContext.jsx` |
| T-128 | Remove floating `?` FAB — sidebar Help entry + `?` key replaces it | ✅ | 🟡 | `frontend/src/pages/Dashboard.jsx` |

---

### STORY-06-02 · Role Coverage Improvements ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-129 | Quality inspector tour: added Inspections tab steps (previously never shown) | ✅ | 🔴 | `frontend/src/config/walkthroughSteps.js` |
| T-130 | Factory manager tour: added QR Codes + Import Wizard steps (3 → 7 steps) | ✅ | 🟠 | `frontend/src/config/walkthroughSteps.js` |
| T-131 | Dispatch coordinator tour: added dispatch recording steps (3 → 5 steps) | ✅ | 🟠 | `frontend/src/config/walkthroughSteps.js` |
| T-132 | Manager tour: added Inspection log + Notification bell steps (5 → 9 steps) | ✅ | 🟠 | `frontend/src/config/walkthroughSteps.js` |
| T-133 | Admin/Super-admin tour: added Import + Notifications steps (6 → 9 steps) | ✅ | 🟠 | `frontend/src/config/walkthroughSteps.js` |
| T-134 | WelcomeChoiceModal step counts read from tour definition (removed hardcoded table) | ✅ | 🟡 | `frontend/src/components/WelcomeChoiceModal.jsx` |
| T-135 | QA inspector role tagline updated to mention inspections | ✅ | 🟡 | `frontend/src/components/WelcomeChoiceModal.jsx` |

---

---

## EPIC-04 · Code Quality & Architecture

> **Goal:** Eliminate anti-patterns, close security gaps, and maintain a clean codebase.
> **Status:** 🔄 In Progress

---

### STORY-04-01 · Auth Bug Fixes ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-080 | Fix Manager direct-action bug in User Roster (was bypassing read-only guard) | ✅ | 🔴 | `frontend/src/pages/Dashboard.jsx` |
| T-081 | Fix login redirect loop: SettingsContext `/auth/me` 401 → client.js hard reload loop | ✅ | 🔴 | `frontend/src/context/SettingsContext.jsx` |
| T-082 | Fix login history silent failure: JWT missing `_id` → `req.user._id` was undefined | ✅ | 🔴 | `backend/src/controllers/auth.controller.js`, `backend/src/controllers/googleAuth.controller.js` |

---

### STORY-04-02 · UI/UX Polish ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-083 | `overflow-x-clip` + `scrollbar-gutter: stable` on Dashboard `<main>` | ✅ | 🟡 | `frontend/src/pages/Dashboard.jsx` |
| T-084 | Themed thin scrollbars driven by palette tokens | ✅ | 🟡 | `frontend/src/index.css` |

---

### STORY-04-03 · Open Technical Debt ⏳

| Task ID | Task | Status | Priority | Notes |
|---|---|---|---|---|
| T-090 | Clean up old `theme` localStorage key (now superseded by `hs_prefs`) | ⏳ | 🟡 | `useTheme.js` proxies correctly but stale key may linger |
| T-091 | Verify `ua-parser-js` is in production `dependencies` not `devDependencies` | ⏳ | 🟠 | `backend/package.json` |
| T-092 | Vercel 10s timeout guard for long-running Gemini AI calls | ⏳ | 🟠 | Existing known constraint from README |

---

---

## EPIC-03 · Production Deployment

> **Goal:** Keep Firebase (frontend) and Vercel (backend) always in sync with the latest stable build.
> **Status:** 🔄 In Progress

---

### STORY-03-01 · Initial Go-Live ✅ (v2.2.0 — 2026-08-02)

| Task ID | Task | Status | Notes |
|---|---|---|---|
| T-070 | Firebase Hosting deploy | ✅ | https://himshakti2026-bb904.web.app |
| T-071 | Vercel serverless backend deploy | ✅ | https://him-shakti-batch-traceability-qr-ma.vercel.app |

---

### STORY-03-02 · Settings Centre + Phase 3 Production Deploy ⏳

| Task ID | Task | Status | Priority | Notes |
|---|---|---|---|---|
| T-072 | `npm run build` — verify clean Vite output | ⏳ | 🔴 | After Phase 3 + Import complete |
| T-073 | `firebase deploy --only hosting` | ⏳ | 🔴 | |
| T-074 | `git push` backend changes | ⏳ | 🔴 | |
| T-075 | Smoke-test on production URL after deploy | ⏳ | 🟠 | |

---

---

## EPIC-04 · Code Quality & Architecture

> **Goal:** Eliminate anti-patterns, close security gaps, and maintain a clean codebase.
> **Status:** 🔄 In Progress

---

### STORY-04-01 · Auth Bug Fixes ✅

| Task ID | Task | Status | Priority | Files Affected |
|---|---|---|---|---|
| T-080 | Fix Manager direct-action bug in User Roster (was bypassing read-only guard) | ✅ | 🔴 | `frontend/src/pages/Dashboard.jsx` |
| T-081 | Fix login redirect loop: SettingsContext `/auth/me` 401 → client.js hard reload loop | ✅ | 🔴 | `frontend/src/context/SettingsContext.jsx` |
| T-082 | Fix login history silent failure: JWT missing `_id` → `req.user._id` was undefined | ✅ | 🔴 | `backend/src/controllers/auth.controller.js`, `backend/src/controllers/googleAuth.controller.js` |

---

### STORY-04-02 · Open Technical Debt ⏳

| Task ID | Task | Status | Priority | Notes |
|---|---|---|---|---|
| T-090 | Clean up old `theme` localStorage key (now superseded by `hs_prefs`) | ⏳ | 🟡 | `useTheme.js` proxies correctly but stale key may linger |
| T-091 | Verify `ua-parser-js` is in production `dependencies` not `devDependencies` | ⏳ | 🟠 | `backend/package.json` |
| T-092 | Vercel 10s timeout guard for long-running Gemini AI calls | ⏳ | 🟠 | Existing known constraint from README |

---

---

## Key File Index

> Quick reference to the most important files in the codebase.

### Backend

| File | Purpose |
|---|---|
| `backend/src/models/User.model.js` | User schema — roles, preferences, soft-delete fields |
| `backend/src/models/LoginEvent.model.js` | Login history — 30-day TTL index |
| `backend/src/models/AccessRequest.model.js` | Pending access requests |
| `backend/src/models/Notification.model.js` | Role-based notifications — 7-day TTL, read/unread state |
| `backend/src/models/Inspection.model.js` | Quality inspection records — verdict, rating, 8-item checklist, 30-day TTL |
| `backend/src/models/ImportJob.model.js` | Bulk import audit record with rollback manifest |
| `backend/src/controllers/auth.controller.js` | Auth + RBAC + self-service profile/settings/password/history |
| `backend/src/controllers/googleAuth.controller.js` | Google OAuth token verification + login event hook |
| `backend/src/controllers/notifications.controller.js` | REST endpoints for notification fetch, mark-read, clear |
| `backend/src/controllers/inspection.controller.js` | Append-only inspection CRUD; fires T-063 notification on submit |
| `backend/src/controllers/import.controller.js` | Validate (dry-run), commit (chunked), rollback, history |
| `backend/src/middleware/auth.js` | JWT `protect` guard + `generateToken` |
| `backend/src/middleware/requireAdmin.js` | Tiered role guards (requireSuperAdmin → requireQualityInspector) |
| `backend/src/routes/auth.routes.js` | All /auth/* route definitions |
| `backend/src/routes/notifications.routes.js` | /api/notifications routes |
| `backend/src/routes/inspection.routes.js` | /api/inspections routes |
| `backend/src/routes/import.routes.js` | /api/import routes |
| `backend/src/services/loginHistory.service.js` | Non-blocking UA parse + geo lookup + LoginEvent write |
| `backend/src/services/emailService.js` | OTP + invite emails via nodemailer |
| `backend/src/services/notificationService.js` | `notify()` + `notifyRoles()` fire-and-forget helpers |
| `backend/server.js` | Express entry point + Socket.io init + role-room routing |

### Frontend

| File | Purpose |
|---|---|
| `frontend/src/main.jsx` | App root — provider wrapping order matters here |
| `frontend/src/App.jsx` | Route definitions |
| `frontend/src/api/client.js` | Central fetch wrapper — 401 global handler |
| `frontend/src/context/SettingsContext.jsx` | Theme/palette/accent state + DB sync |
| `frontend/src/context/WalkthroughContext.jsx` | Tour state + role-filtered step list |
| `frontend/src/config/walkthroughSteps.js` | Tour content separated from engine (copy ≠ positioning) |
| `frontend/src/hooks/useAuth.js` | Login/logout + role checks (reads hs_token / hs_user) |
| `frontend/src/hooks/useTheme.js` | Thin proxy over SettingsContext (legacy compatibility) |
| `frontend/src/hooks/useSettingsMutation.js` | TanStack mutation for saving preferences |
| `frontend/src/hooks/useNotifications.js` | Socket singleton + optimistic updates + DB merge |
| `frontend/src/hooks/useInspections.js` | TanStack hooks for list/my/byBatch/submit inspections |
| `frontend/src/hooks/useImport.js` | TanStack hooks for validate/commit/rollback import jobs |
| `frontend/src/utils/csvParser.js` | Dependency-free RFC 4180 CSV parser (BOM, quoted fields, auto-detect delimiter) |
| `frontend/src/components/Navbar.jsx` | Top navigation bar |
| `frontend/src/components/ThemePicker.jsx` | 3-option theme popover (Light/Dark/System) |
| `frontend/src/components/NotificationPanel.jsx` | Bell icon + live notification dropdown |
| `frontend/src/components/SettingsPanel.jsx` | Full settings UI — Profile, Customisation, Security, Notifications |
| `frontend/src/components/InspectionModal.jsx` | 5-step QA inspection form (batch picker, checklist, rating, verdict, findings) |
| `frontend/src/components/ImportPanel.jsx` | 4-step bulk import wizard (choose, map, preview, commit) |
| `frontend/src/components/WalkthroughTour.jsx` | Tour card engine with spotlight, polling, ResizeObserver |
| `frontend/src/components/WelcomeChoiceModal.jsx` | First-time role selection modal |
| `frontend/src/components/ProtectedRoute.jsx` | JWT expiry guard for /dashboard |
| `frontend/src/pages/Dashboard.jsx` | Main dashboard — all tabs including Inspection and Import |
| `frontend/src/pages/Login.jsx` | Login, request access, forgot password, Google OAuth |
| `frontend/src/index.css` | Design tokens — light/dark/system + 25 palette CSS vars + animations |

### Config & Infra

| File | Purpose |
|---|---|
| `backend/.env` | Local secrets (never commit) |
| `backend/.env.example` | Documented env var template |
| `vercel.json` | Vercel routing + serverless function config |
| `firebase.json` | Firebase Hosting SPA rewrite rules |
| `.firebaserc` | Firebase project alias |
| `docs/PROJECT_TRACKER.md` | This file — Jira-style Epic/Story/Task tracker |
| `docs/RBAC.md` | Permission matrix for all roles |
| `docs/DATABASE.md` | MongoDB schema documentation |
| `docs/USER_GUIDE.md` | End-user documentation |
| `docs/DEPLOYMENT.md` | Deploy runbook + symptom → cause table for runtime deploy failures |

---

## Decision Log

> Architectural decisions with rationale. Helps with onboarding and avoids re-debating resolved choices.

| Date | Decision | Why |
|---|---|---|
| 2026-08-07 | Authorization reads the user from the DB on every request | A signed JWT proves who logged in, not that they should still be logged in. Deletion, deactivation and demotion previously took up to 8h to apply. Costs one indexed lookup per request; there is no version of "revocable" that avoids reading current state |
| 2026-08-07 | Revocation via `tokenVersion` counter, not a denylist | A denylist needs shared storage that must be available or auth fails open. A counter on the user document is checked by a lookup already being made |
| 2026-08-07 | Reactivating a user does not bump `tokenVersion` | Only bump on the way out. Killing the session of someone you just re-permitted is punishment without purpose |
| 2026-08-07 | Password change reissues the caller's own token | Ending other sessions should not sign you out of the tab you are standing in |
| 2026-08-07 | Tests cover silent-failure logic only, not breadth | A route that 500s reports itself. An off-by-one expiry tier does not. Coverage percentage would reward testing the loud paths |
| 2026-08-07 | CI gates lint with a budget, not pass/fail | 61 pre-existing errors, none auto-fixable. A hard gate means red forever or `continue-on-error`, which looks like a gate while being none. The budget only ratchets down |
| 2026-08-07 | Shared store (Upstash) is optional with in-memory fallback | Local dev and the long-lived process need no Redis, and an Upstash outage degrades to previous behaviour rather than failing requests |
| 2026-08-07 | Rate limiter fails **open** when the store is unreachable | A cache outage must not become an API outage; the in-memory limiter still catches the worst of a flood |
| 2026-08-07 | `react-router` advisory accepted, not patched | Only fix is a semver-major migration; the advisory is an RSC-mode CSRF bypass and this app does not use RSC mode, so exposure is nil against real upgrade risk |
| 2026-08-07 | QR encodes an HMAC trace token, not the batch code | Batch codes are sequential and the trace endpoint is unauthenticated by design; a readable code let anyone walk the sequence and harvest the whole production record |
| 2026-08-07 | Token derived (HMAC), not random | Deterministic, so existing batches backfill by recomputation and the migration is idempotent. Still stored and indexed because HMAC cannot be inverted |
| 2026-08-07 | Legacy `/trace/:batchCode` kept, at reduced detail | Labels already printed on physical stock must keep resolving. Returning only what is on the package makes enumeration pointless without breaking them |
| 2026-08-07 | FAILED/FLAGGED verdicts withheld from public trace | Such a batch should not be in consumer hands; publishing an internal QA judgement about distributed product, with no context or right of reply, is not a public-page decision |
| 2026-08-07 | `qualityCheck` snapshotted onto Batch | Inspections carry a 30-day TTL, so a batch would lose all evidence of inspection one month later — while still on a shelf with a scannable QR |
| 2026-08-07 | No status writeback on the public trace GET | An unauthenticated read must not write. Status is recomputed on every read path, so the persisted value was decorative |
| 2026-08-06 | Vercel entry is `backend/api/index.js`, a re-export of `server.js` | The legacy v2 `builds`/`routes` schema silently ignores the `functions` block, so `maxDuration`/`memory` could not be raised. The convention-based `api/` entry keeps one app serving process, Vercel and Firebase targets |
| 2026-08-06 | Mongo connect fails fast (8s) with `bufferCommands: false` | A hang is worse than an error on serverless: it outlives the invocation budget, so the platform kills the request and the caller sees an opaque crash page instead of a diagnosable 503 |
| 2026-08-06 | `connectDB()` caches the in-flight promise, not just `readyState` | `readyState >= 1` is true while *connecting*, so concurrent cold-start requests raced past the gate and queried a socket that was not up |
| 2026-08-06 | `/health` declared before the DB gate | A health check that needs the database cannot report "API up, database unreachable" — the one answer needed when diagnosing a deploy |
| 2026-08-06 | Socket.io not initialised under serverless | No long-lived process to hold a WebSocket; the listener was allocated, never used, never closed. Every emit site already guards with `if (io)` |
| 2026-08-06 | Internal error text withheld from clients in production | The fallback forwarded `err.message` verbatim, leaking driver text, hostnames and connection-string fragments |
| 2026-08-06 | CSV parsed in browser; no multipart upload endpoint | Eliminates file upload attack surface; preview is free (nothing written until user approves) |
| 2026-08-06 | ImportJob stores rollback manifest (list of `_id`s inserted) | Enables one-call atomic rollback without scanning the whole batch collection |
| 2026-08-06 | Walkthrought steps extracted to `walkthroughSteps.js` config | Copy changes should not require touching tour positioning engine |
| 2026-08-06 | Inspection model is append-only (no update/delete) | Audit integrity — re-inspection creates a new record; `isLatest` flag surfaced current state |
| 2026-08-06 | Inspection separate collection (not embedded in Batch) | Correct domain separation; separate TTL; efficient `isLatest` index without bloating Batch docs |
| 2026-08-05 | Separate `LoginEvent` collection (not array inside `User`) | Correct MongoDB TTL pattern; no manual splice/cap; scales independently |
| 2026-08-05 | `SettingsContext` query uses `skipAuthRedirect: true` | Prevents 401 → hard reload loop when SettingsProvider wraps the whole app including /login |
| 2026-08-05 | Include `_id` in JWT payload | Required so `req.user._id` resolves in self-service endpoints without a DB lookup per request |
| 2026-08-05 | Replace binary ThemeToggle with ThemePicker popover | 3 options is standard UX; shows active mode to user; one source of truth via SettingsContext |
| 2026-08-05 | Store only city/country — discard raw IP after geo lookup | Privacy-first; compliant with GDPR intent; raw IP is not needed downstream |
| 2026-08-03 | 4-tier RBAC (SA / Admin / Manager / Operational roles) | Mirrors real org hierarchy; Manager gets audit visibility without destructive powers |

---

*Last updated: 2026-08-07 · v2.10.0 · Update this file at the end of every development session.*
