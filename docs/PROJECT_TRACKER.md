# HimShakti — Project Tracker

> Living document. Updated after every development session.
> Organized by: **Epic → Story → Task** (Jira-style).
> Status key: `✅ Done` · `🔄 In Progress` · `⏳ Planned` · `❌ Blocked` · `🚫 Descoped`

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
> **Status:** 🔄 In Progress (Phase 1 complete; Phase 2 and 3 planned)

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
| T-063 | Quality inspection → notify `manager` | ⏸️ | 🟠 | No inspection controller in codebase yet — hook ready, trigger pending |
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

### STORY-03-02 · Settings Centre Production Deploy ⏳

| Task ID | Task | Status | Priority | Notes |
|---|---|---|---|---|
| T-072 | `npm run build` — verify clean Vite output | ⏳ | 🔴 | After Phase 2 complete |
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
| `backend/src/controllers/auth.controller.js` | Auth + RBAC + self-service profile/settings/password/history |
| `backend/src/controllers/googleAuth.controller.js` | Google OAuth token verification + login event hook |
| `backend/src/middleware/auth.js` | JWT `protect` guard + `generateToken` |
| `backend/src/middleware/requireAdmin.js` | Tiered role guards (requireSuperAdmin, requireAdminOrAbove, etc.) |
| `backend/src/routes/auth.routes.js` | All /auth/* route definitions |
| `backend/src/services/loginHistory.service.js` | Non-blocking UA parse + geo lookup + LoginEvent write |
| `backend/src/services/emailService.js` | OTP + invite emails via nodemailer |
| `backend/server.js` | Express entry point + Socket.io init |

### Frontend

| File | Purpose |
|---|---|
| `frontend/src/main.jsx` | App root — provider wrapping order matters here |
| `frontend/src/App.jsx` | Route definitions |
| `frontend/src/api/client.js` | Central fetch wrapper — 401 global handler |
| `frontend/src/context/SettingsContext.jsx` | Theme/palette/accent state + DB sync |
| `frontend/src/hooks/useAuth.js` | Login/logout + role checks (reads hs_token / hs_user) |
| `frontend/src/hooks/useTheme.js` | Thin proxy over SettingsContext (legacy compatibility) |
| `frontend/src/hooks/useSettingsMutation.js` | TanStack mutation for saving preferences |
| `frontend/src/components/Navbar.jsx` | Top navigation bar |
| `frontend/src/components/ThemePicker.jsx` | 3-option theme popover (Light/Dark/System) |
| `frontend/src/components/ThemeToggle.jsx` | Legacy binary toggle (kept; replaced by ThemePicker) |
| `frontend/src/components/SettingsPanel.jsx` | Full settings UI — Profile, Customisation, Security, Notifications |
| `frontend/src/components/ProtectedRoute.jsx` | JWT expiry guard for /dashboard |
| `frontend/src/pages/Dashboard.jsx` | Main dashboard — all tabs including Settings |
| `frontend/src/pages/Login.jsx` | Login, request access, forgot password, Google OAuth |
| `frontend/src/index.css` | Design tokens — light/dark/system + 8 palette CSS vars + animations |

### Config & Infra

| File | Purpose |
|---|---|
| `backend/.env` | Local secrets (never commit) |
| `backend/.env.example` | Documented env var template |
| `vercel.json` | Vercel routing + serverless function config |
| `firebase.json` | Firebase Hosting SPA rewrite rules |
| `.firebaserc` | Firebase project alias |

---

## Decision Log

> Architectural decisions with rationale. Helps with onboarding and avoids re-debating resolved choices.

| Date | Decision | Why |
|---|---|---|
| 2026-08-05 | Separate `LoginEvent` collection (not array inside `User`) | Correct MongoDB TTL pattern; no manual splice/cap; scales independently |
| 2026-08-05 | `SettingsContext` query uses `skipAuthRedirect: true` | Prevents 401 → hard reload loop when SettingsProvider wraps the whole app including /login |
| 2026-08-05 | Include `_id` in JWT payload | Required so `req.user._id` resolves in self-service endpoints without a DB lookup per request |
| 2026-08-05 | Replace binary ThemeToggle with ThemePicker popover | 3 options is standard UX; shows active mode to user; one source of truth via SettingsContext |
| 2026-08-05 | Store only city/country — discard raw IP after geo lookup | Privacy-first; compliant with GDPR intent; raw IP is not needed downstream |
| 2026-08-03 | 4-tier RBAC (SA / Admin / Manager / Operational roles) | Mirrors real org hierarchy; Manager gets audit visibility without destructive powers |

---

*Last updated: 2026-08-05 · Update this file at the end of every development session.*
