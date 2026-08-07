# Changelog

All notable changes to the HimShakti Batch Traceability & Dispatch Intelligence System are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.9.0] — 2026-08-07

### The engineering layer under the features

The feature set was never the gap. 19,572 lines shipped with zero tests and zero CI, which is why the Vercel crash reached production with nothing to catch it. This release adds the floor.

#### Added
- **76 tests, and CI that runs them.** Vitest in both packages, `.github/workflows/ci.yml` gating every push and PR. Coverage is deliberately narrow — the pure logic whose failure mode is *silent*, where a wrong answer produces no error and no log entry:
  - `getBatchStatus` tier boundaries, asserted exactly (0 days is EXPIRED, 7 is URGENT, 8 is WARNING, 30 is WARNING, 31 is READY). A wrong boundary here ships a batch a day late and nothing notices.
  - `calculatePriorityScore`, pinning the actual `365 - days` formula. README and `docs/DATABASE.md` describe an older tiered 1000/500/200 scheme; the test locks in what the code really does so the discrepancy cannot be "fixed" in the wrong direction.
  - The full RBAC matrix, asserted in both directions — every role that must pass each guard, and every role that must be refused. The dangerous failure is the permissive one, which never throws.
  - `Message.expiresAtFor`, which alone decides whether a message is permanent audit evidence or expires in 90 days. Inverting it would silently delete the audit trail. Nothing else in the codebase enforced it.
  - `deriveTraceToken` determinism and key-dependence, plus the refusal to derive under no key at all.
  - `csvParser` against RFC 4180: quoted separators, doubled quotes, embedded newlines, CRLF, BOM, blank lines, short rows.

- **Nightly database backup.** `.github/workflows/backup.yml` runs `mongodump` at 01:00 IST, encrypts with AES-256 when `BACKUP_PASSPHRASE` is set, and stores the archive as a 90-day artifact. Restore drill documented in `docs/DEPLOYMENT.md`.

- **Optional shared store (`services/sharedStore.js`)** — Upstash Redis over HTTP, because a serverless function cannot hold a Redis socket open between invocations. Entirely optional: unconfigured or unreachable, every caller keeps its previous behaviour.

#### Fixed
- **Rate limiting did not work in production.** `express-rate-limit`'s default store is per-process, so on serverless each container kept its own counter and the configured 500-per-15-minutes was really 500 × N. The AI limiter mattered more: 5 per 15 minutes is what keeps the Gemini free tier (15 RPM / 1,500 RPD) from being burned through, and per-container it enforced nothing. Both now count in the shared store when one is configured, and fail *open* into the in-memory limiter when it is unreachable — a cache outage must not become an API outage.
- **The AI report cache almost never survived to be used.** A module-level variable dies with the container, so the 4-hour TTL rarely applied and most requests paid for a fresh Gemini call. Now cached in the shared store as well, with the local tier re-seeded on a shared hit.
- **README claimed the Atlas free tier provides "managed backups". It does not.** M0 has no automated backups at all — for a system built on an append-only audit trail and immutable snapshots, that was the single worst finding in the codebase. Claim corrected and a real backup added.

#### Known debt, stated rather than hidden
- The frontend carries **61 pre-existing lint errors** (40 unused variables, the rest react-hooks findings, none auto-fixable). CI gates them with a *budget* rather than pretending they are fixed: the build fails if the count rises above 61, and prints a notice to lower the cap when it falls. `continue-on-error` was rejected — it looks like a gate while being none.
- `npm audit` runs in CI but reports rather than blocks. There are known highs in both trees; a blocking gate would be red on arrival and get switched off within a week.

---

## [2.8.0] — 2026-08-07

### The public trace flow stops leaking the production record

Three changes to the QR scan path, all on the same seam: the endpoint was written as a convenience read and then left facing the open internet.

#### Fixed
- **The trace endpoint performed a database write on an unauthenticated GET.** It called `findByIdAndUpdate` to persist the recomputed status, which made a public read non-idempotent and handed anonymous callers a write amplifier on a guessable URL. It was also redundant — status is recomputed on every read path, so the stored value is decorative. Removed.
- **`source` was read straight from `req.query`**, so any caller could label their own scan `QA` and corrupt the scan record. It is now derived from which route resolved: a token scan came off a real printed label, a legacy scan did not.

#### Added
- **QR codes now encode an opaque trace token, not the batch code.** Batch codes are `HS-YYYY-MM-NNN` — sequential and trivially enumerable — and the trace endpoint is unauthenticated by design, so anyone could walk the sequence and harvest the whole production record: farmer names, villages, volumes, yields, lot codes. The QR now points at `/trace/t/<token>`, a 132-bit HMAC derived from the batch code under `TRACE_TOKEN_SECRET`.

  The token is derived rather than random so existing batches can be backfilled by recomputation, and the backfill is idempotent. It is still stored and indexed, because HMAC cannot be inverted — resolving a scan is a lookup, not a decode.

  **Already-printed labels keep working.** `/trace/:batchCode` still resolves, but returns only what is already visible on the physical package — product, expiry, freshness, batch code. Farmer, village, lot code, quantity and yield require the token. Enumeration remains possible and now returns almost nothing worth having. The reduced response carries `detailLevel: 'limited'`, and the page says so rather than silently showing less.

- **Consumers scanning a QR now see the quality verdict** — inspector, date, and rating — when the batch passed inspection. `FAILED` and `FLAGGED` verdicts are withheld from the public response entirely: such a batch should never have reached a consumer, and publishing an internal QA judgement about product already in distribution, with no context and no right of reply, is not a thing a public page should do. The verdict stays on the record for staff and auditors.

- **`Batch.qualityCheck`** — the verdict is snapshotted onto the batch when the inspection is filed, inside the same transaction. `Inspection` documents carry a 30-day TTL, so reading through to that collection would make a batch's quality history vanish exactly one month after it was verified — while the product is still on a shelf with a scannable QR on it. Same reasoning as the existing `productName`/`farmerName` denormalization: the batch keeps what was true at production time.

- **`src/scripts/backfillTraceTokens.js`** — idempotent migration that derives tokens, regenerates stored QR images, and recovers `qualityCheck` from surviving inspections. Supports `--dry-run`. Run against 28 existing batches: 28 tokens, 1 recoverable verdict (the rest had already expired under the TTL and cannot be recovered).

- **`TRACE_TOKEN_SECRET`** in `.env.example`. Optional — falls back to `JWT_SECRET` so existing deployments keep working — but set separately in production, because the two keys want opposite lifecycles: `JWT_SECRET` should be rotatable, this one should not be. Rotating alone does not break issued QR codes, since tokens are stored and resolved by lookup rather than re-derived per request; re-running the backfill under a new key is what would overwrite stored tokens and orphan printed labels.

#### Fixed (pre-existing, found during migration)
- **Every QR code in the database encoded `http://localhost:5001`.** `PUBLIC_BASE_URL` had never been set to a real host, so all 28 batches carried a QR that resolves to the scanning phone itself — unusable by any consumer. The regenerated codes now point at the Firebase frontend host, where the trace page actually lives. Pointing them at the API host would have returned raw JSON to someone scanning a crate.

#### Changed
- `useTrace` derives `loading` from whether state matches the requested identifier instead of flipping it via `setState` in the effect body, and cancels in-flight requests. Switching identifiers can no longer briefly render the previous batch's data as though it were the new one.

---

## [2.7.7] — 2026-08-06

### Backend deploy no longer crashes on Vercel

Every request to the deployed API returned Vercel's `FUNCTION_INVOCATION_FAILED` crash page. The cause was not a broken route — the app imports and runs cleanly with zero environment variables set. It was that a request which could not reach MongoDB **hung instead of failing**, and the platform killed the invocation before Express ever wrote a response.

#### Fixed
- **The database connect had no timeout budget.** `mongoose.connect()` ran with driver defaults, so an unreachable cluster — an Atlas IP allowlist that does not include Vercel's egress ranges being the usual reason — blocked for the full 30s server-selection window. That is longer than the function's limit, so the invocation was terminated and the caller got an opaque platform crash page rather than an error. Connection now fails fast (`serverSelectionTimeoutMS` 8s, `bufferCommands: false`) and surfaces as a real `503`. Reproduced against an unroutable host: previously hung past 12s, now answers in 8.0s.
- **Concurrent cold-start requests raced the connection.** `connectDB()` returned early on `readyState >= 1`, but readyState `2` means *connecting* — so a second request sailed past the gate and issued queries against a socket that was not up, which mongoose then buffered until the invocation expired. The in-flight connect promise is now cached and shared, and cleared on failure or disconnect so one transient error cannot poison a warm container.
- **`/health` was declared after the database gate**, so the one endpoint you need when diagnosing a bad deploy failed for exactly the reason you were trying to diagnose. It now sits ahead of the gate and reports `database` readyState and `dbConfigured` separately from process liveness.
- **The error handler could throw.** `Object.values(err.errors)` ran on any error named `ValidationError`, but only mongoose's carries an `errors` map — express-rate-limit raises one that does not. An exception inside the terminal error handler has nothing behind it in Express, so it destroyed the response and took the invocation with it. All branches are now defensive.
- **`X-Forwarded-For` was rejected on every request.** Without `trust proxy`, express-rate-limit logged `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` and bucketed all traffic behind the platform proxy into a single rate-limit key — one noisy visitor could exhaust the quota for everyone. Set to `1` (trust exactly one hop) rather than `true`, which would let a client spoof its own address.
- **Unknown paths returned platform HTML** instead of the `{ success, error }` envelope every client expects. Added a JSON 404.
- **A failed boot connect rejected silently** in process mode — the process stayed alive having never called `listen()`. It now logs and exits non-zero.

#### Changed
- **Vercel entry moved to `backend/api/index.js`** (a thin re-export of `server.js`) and `backend/vercel.json` migrated off the deprecated v2 `builds`/`routes` schema to `rewrites` + `functions`. The legacy schema silently ignores the `functions` block, so `maxDuration` and `memory` could not be raised off their defaults. Now 30s / 1024 MB. `server.js` still works unchanged as a process, a Firebase Function, and a Vercel Function.
- **Socket.io and the `http.Server` are no longer created on serverless.** There is no long-lived process to hold a WebSocket open there, so the listener was allocated, never used, and never closed. Every emit site already guards with `if (io)`, so the API degrades to REST-only — which is the documented production guarantee anyway.
- **Internal error messages are no longer returned to clients in production.** The fallback branch forwarded `err.message` verbatim, which leaks driver text, hostnames and connection-string fragments; a missing `MONGODB_URI` echoed the mongoose internals straight to the browser. Deliberate 4xx messages still pass through; unexpected 5xx are logged server-side and returned as a generic string.

#### Added
- `docs/DEPLOYMENT.md` — deploy runbook and a symptom-to-cause table for the failure modes above, including the Atlas allowlist step that no code change can substitute for.
- `.gitignore` now denies `.env.*` wholesale with `!.env.example` re-included, plus key material and `.vercel/`, so a new env variant cannot be committed by accident. `backend/.vercelignore` added.

---

## [2.7.6] — 2026-08-06

### Walkthrough works on a phone

#### Fixed
- **The sidebar drawer stayed open behind the tour.** On mobile the only route to Help & Walkthrough is the drawer, and starting a tour never closed it — so every spotlight highlighted content sitting underneath an open drawer and its backdrop. The trigger now closes the drawer before opening help.
- **The tour card was a fixed 340px box positioned beside its target.** On a phone there is no beside: the card overlapped the very thing it was pointing at and consumed most of the screen. Below `md` it is now a bottom sheet pinned above the tab bar, full width minus a gutter, capped at `52dvh` with its own scroll so a long step can never push Back and Next off-screen.
- **Targets were scrolled with `block: 'nearest'`**, which on mobile left them behind the sheet. They now centre in the space above it.
- **Progress dots compressed into slivers.** Nine dots plus Back and Next do not fit a phone footer. Mobile shows a `1 / 9` counter instead, and the dots no longer shrink on desktop either.

---

## [2.7.5] — 2026-08-06

### Batch list is usable on a phone

#### Fixed
- **Three columns of the batch table were unreachable on mobile.** The table had no scroll wrapper: it rendered 777px wide inside a 341px card whose `overflow` is `hidden` on both axes, so Expiry, Farmer/Village, Scans and Actions were clipped with no way to reach them. Below `md` the table is replaced by a stacked card list carrying every field; the table itself now renders from `md` up.
- **Row actions were hover-only.** View, Download QR and Dispatch lived behind `opacity-0 group-hover:opacity-100`, which never reveals on a touch screen — the actions were unreachable on mobile even where the column was visible. The card list shows them permanently.
- **"1 days left".** Day counts are now pluralised, and a past-due batch reads "expired 3 days ago" rather than a negative number.

---

## [2.7.4] — 2026-08-06

### Mobile layout fixed

#### Fixed
- **The dashboard reserved sidebar width on phones.** `<main>` carried `marginLeft: 14rem` as an inline style, which has no breakpoint, so it applied below `md` where the sidebar is translated off-screen. On a 375px viewport that left 151px of usable width and a wide empty band down the left. The offset is now a `--sidebar-w` custom property applied only from `md` up. Measured after: `marginLeft: 0px`, main width 375px, horizontal overflow 0.
- **The bottom bar rendered every visible tab.** Nine items at a 52px minimum needed 468px in a 375px bar, so they overflowed and the labels collided. It now shows four role-appropriate destinations plus **More**, which opens the sidebar drawer that already exists rather than introducing a second navigation surface to keep in sync.
- **Batch codes wrapped on their hyphens** — `HS-2026-06-022` broke across four lines in a narrow column. Now `whitespace-nowrap` in all four table renderings.
- **Duplicate primary action on phones.** Tabs that pass a banner action also carry the same control in their toolbar; on a narrow screen these read as two competing buttons. The banner action is now hidden below `sm`.

---

## [2.7.3] — 2026-08-06

### Chat redesigned around messaging-app mechanics

The thread was built on Slack's model — sender name and role on their own row above the bubble, timestamp on its own row below it. Four vertical zones per message group, which is what made it read as dated. Rebuilt on the mechanics messaging apps use.

#### Changed
- **Timestamp moved inside the bubble**, floated right so the final line of text wraps around it instead of claiming a row. This is the single biggest density gain.
- **Sender name moved inside the bubble**, tinted per person via a stable hash of the author id, with the role as muted text beside it. An earlier pass tinted by role, which is useless in a role channel — everyone there shares the role, so every name came out the same colour.
- **Tighter bubble geometry.** 10px radius with one squared corner, and a tail pseudo-element on the first message of each group. The previous `rounded-2xl` read as 2015-era chat.
- **Conversation canvas.** The message list is now its own surface — a tonal wash plus a faint dot grid, distinct from the panel holding it. A doodle wallpaper would be wrong for an operations tool; the texture does the same job in the right register. Painted on the non-scrolling wrapper, never the scroll container.
- **Own avatar removed.** You know who you are, and dropping it returns the gutter to the bubble.
- Max bubble width tightened to 68%, so long messages form a readable column instead of spanning the pane.

---

## [2.7.2] — 2026-08-06

### Material and motion pass

Applied a high-end visual-design audit to the Team surface, taking the parts that suit a dense operations dashboard and deliberately skipping the parts written for marketing pages.

#### Added
- **Motion vocabulary.** `--ease-out-quint` and `--ease-spring` tokens with `--dur-fast/base/slow`, replacing Tailwind's default easing on interactive surfaces. Decelerating curves read as mass; the default does not.
- **Double-bezel panels.** `.bezel` / `.bezel-core` — an outer tray carrying the hairline and a inner plate carrying the content, with the inner radius computed as outer minus tray padding so the curves are genuinely concentric. Applied to the Team panel.
- **Haptic press.** `.press` scales to `0.97` on `:active`. Transform only, so it never triggers layout.
- **Nested send control.** The composer's send button is now a pill containing its own icon well, which translates and scales on hover instead of swapping colour.
- **Focus discipline.** One `:focus-visible` rule across buttons, links, inputs and `[tabindex]`. Previously a handful of controls had rings and most inherited nothing.

#### Fixed
- **A deleted-only channel reserved a full-height pane.** Height keyed off row count, so a channel whose entire history was one soft-deleted tombstone opened a 620px scroll region to show one line of grey italic. It now keys off readable messages.

#### Not applied, deliberately
The audit's `py-24`–`py-40` macro-whitespace, its ban on Lucide icons, and its detached floating navbar are written for marketing sites. On a batch table the first yields roughly three visible rows; the second is a ~200-site icon migration to a library not in `package.json`; the third breaks a shell laid out against a fixed 72px header. Density and a working layout are the product here.

---

## [2.7.1] — 2026-08-06

### Design and accessibility pass

Audit against a design-quality checklist, applied to the existing stack. No framework or styling changes.

#### Fixed
- **Mobile viewport jump.** The dashboard shell used `h-screen` and `calc(100vh - 72px)`. Mobile Safari counts the collapsing URL bar in `vh`, so the layout shifted by roughly 60px on first scroll. Both now use `dvh`.
- **Proportional figures in data tables.** Digits have unequal widths in the body font, so columns of days-to-expiry and quantities never lined up. All table cells now use `font-variant-numeric: tabular-nums`, with a `.data-figures` utility for figures outside tables.
- **Unmatched URLs rendered a blank page.** Added a `*` catch-all route and a `NotFound` page with the attempted path, a back button and a route home.
- **No keyboard skip link.** Tabbing into any page meant walking the entire navigation first. Added a skip-to-content link — first tab stop, hidden until focused — anchored to the `<main>` landmark on every page.
- **Animations ignored motion preferences.** Card stagger, tab fades and the walkthrough pulse all ran regardless. Now suppressed under `prefers-reduced-motion: reduce`, using near-zero durations rather than `none` so fill-mode still applies and nothing sticks at `opacity: 0`.
- **Light scrollbar strip beside every dark page.** `<body>` carried `bg-gray-50 text-gray-900`, pinning the document surface to near-white in all themes. The scrollbar track is transparent, so that white showed through as a bright band down the right edge of Home and About. Body colours now come from `--bg-primary` / `--text-primary`.
- **Native browser chrome rendered light on dark pages.** `color-scheme` was never declared, so scrollbars, `<select>` popups, date pickers and autofill styling were painted by the OS in light mode regardless of theme — the same cause as the mismatched dropdown in the team directory. Now set to `light` on `:root` and `dark` under `[data-theme="dark"]`.

### 🔒 Security — user read paths over-shared

`GET /auth/users` filtered with a denylist (`.select('-passwordHash')`), so every field added to the schema afterwards shipped by default. Managers and above received 27 fields per user, including `resetToken`, `otpCode`, `otpExpiry`, `otpAttempts` and `googleEmail`.

`resetToken` is not an identifier. It is the signed JWT that `resetPassword()` accepts as the sole credential alongside a new password — no OTP, no current password. Any manager polling the roster could capture an in-flight reset token for **any** account, including admin and Super Admin, and complete the reset themselves. The field is only populated during a 5-minute window after the victim enters their OTP, so this was a race rather than an unconditional takeover, but manager tier should never have been able to win it.

- All multi-user read paths now use explicit allowlists: `USER_PUBLIC_FIELDS`, `USER_DELETED_FIELDS`, `USER_DIRECTORY_FIELDS`. Roster response went from 27 fields to 14.
- `GET /auth/me` and `PATCH /auth/me` were on the same denylist pattern and returned `resetTokenExpiry` and the OTP counters to the account owner. Both now use allowlists.
- `PATCH /auth/me` gained validation: name cannot be blanked, phone is bounded and format-checked (blank still allowed, so a number can be withdrawn).

### 💬 Messaging — record threads and role channels

- `Message.model.js` — one collection, two scopes. **Record threads** attach to a batch or inspection and are permanent; **role channels** carry shift-handover chatter and expire after 90 days. A single TTL index serves both, because Mongo skips documents whose `expiresAt` is null.
- **Discussion tab** in the batch detail drawer. Any signed-in user can post; the thread sits beside the batch it concerns and stays in the record. Distinct from Notes, which is the batch's own traceability text and role-gated.
- **Role channels** — one per role. Super Admin sees all five, matching the existing `role:admin` socket join. Everyone else sees exactly their own, so a manager cannot read what quality inspectors say about them.
- Edits are author-only and preserve the previous text in `editHistory`. **Admins cannot reword someone else's message** — an audit trail an administrator can rewrite is not an audit trail. Admins may soft-delete for moderation; the row survives with the body withheld.
- REST-first: 15-second polling while a thread is mounted, paused in background tabs, with sockets only invalidating. Works with the socket layer switched off, which is the situation on serverless.
- **No global channel**, deliberately. It duplicates the tools the team already has and pulls operational decisions out of the audit trail.

### 👥 Team directory

- `GET /auth/directory` (manager and above) — name, email, phone, role, grouped by role, searchable with regex metacharacters escaped.
- Its own projection, narrower than the Admin Panel's: a contact card needs a way to reach someone, not the promotion audit trail.
- New **Team** tab holding both channels and the directory. The directory sub-tab is hidden below manager and the panel handles a 403 regardless.
- Phone numbers are self-managed in Settings. Settings now states plainly that name, email and number appear in the directory, and that leaving the number blank keeps it out.
## [2.6.0] — 2026-08-06

### 📥 Bulk Batch Import

Register a whole production run from a spreadsheet instead of one form at a time. Every row is validated and previewed before anything is written, and any import can be undone.

#### Added

**Import wizard (Dashboard ▸ Import)**
- Four-step flow: choose file → map columns → preview → import.
- CSV is parsed **in the browser**. Nothing is uploaded until the preview is approved, and there is no multipart upload endpoint anywhere in the stack.
- Header auto-matching — `Lot No`, `Qty`, `UOM`, `Packed On` and similar variants resolve to the right field without manual mapping.
- Per-row preview labelling every row `will import` / `skip` / `error`, filterable, with a downloadable error report and a downloadable CSV template.
- Live chunked progress, so a multi-thousand-row file reports as it goes.

**Backend**
- `ImportJob.model.js` — audit record per import run, carrying the rollback manifest.
- `import.controller.js` — `validate` (dry run, writes nothing), `commit` (chunked), `rollback`, plus history and schema endpoints.
- `import.routes.js` mounted at `/api/import`.
- `requireImporter` RBAC gate — factory-manager and above. Quality inspectors and dispatch coordinators are excluded; neither creates batches.
- `csvParser.js` (frontend) — dependency-free RFC 4180 parser handling quoted fields, embedded commas and newlines, CRLF/LF/CR, UTF-8 BOM, and delimiter detection.

**Data handling**
- Batch codes are pre-allocated as a contiguous block, one query per chunk, instead of one query per row.
- Product resolution is fault-isolated per row, so a single catalogue contract violation reports as one bad row rather than failing the whole import with a 503.
- Duplicate detection on **Source Lot Code + Product SKU + Pack Date**, applied both against the database and within the file. Re-running the same file is safe.
- Unit spellings (`kgs`, `pcs`, `litres`), thousands separators, and both `DD/MM/YYYY` and `YYYY-MM-DD` dates are accepted.
- Imported batches carry their provenance in `noteHistory`.

**Undo**
- Rollback soft-deletes the batches an import inserted — they move to the Archived tab with a `deleteNote` naming the import, and stay restorable. Nothing is hard-deleted.
- Batches archived or dispatched by hand after an import keep their own state.

### 🧭 Walkthrough rebuilt

The guided tour was a table of contents — it named each tab without telling anyone how to do their job, and several roles were shown three steps covering a fraction of what they can reach.

#### Added
- `config/walkthroughSteps.js` — tour content split out of the engine, so copy can change without touching positioning.
- Every step now carries a **"try it"** instruction alongside the description. That is the difference between naming a screen and teaching the task.
- Steps are filtered against the tabs the signed-in role actually renders, so a tour can never spotlight something the user cannot open.
- New tour anchors: the notification bell, the import wizard, and the inspections panel.
- Progress dots are clickable — jump back to a step to re-read it.
- `?` anywhere opens Help & Walkthrough (ignored while typing in a field).

#### Fixed
- **Quality inspectors were never shown the Inspections tab** — the one screen that exists for their role. Their tour also pointed a step at the FEFO table while sitting on the Batches tab, so it spotlighted nothing.
- Factory managers were never shown QR codes or bulk import; dispatch coordinators were never told how to record a dispatch.
- Unknown roles fell back to the **admin** tour, promising an Admin Panel they cannot open.
- The tour waited a fixed 380 ms for a tab to render, then measured whatever was there. It now polls for the target and only gives up after a deadline.
- Card position assumed a fixed 200 px height, pushing longer steps off-screen when positioned above a target. Height is now measured with a `ResizeObserver`.
- A missing target produced a floating card pointing at nothing, silently. It now centres and says so.
- Spotlight now tracks its target through scroll and resize.
- Welcome modal step counts came from a hardcoded table that no longer matched the tours; they are read from the tour definition. Role taglines rewritten — the quality-inspector one never mentioned inspections.

Step coverage per role: factory-manager 3 → 7, quality-inspector 3 → 6, dispatch-coordinator 3 → 5, manager 5 → 9, admin/super-admin 6 → 9.

#### Removed
- The floating **"?"** button. It fired the same action as the sidebar's Help & Walkthrough entry, which already carries the NEW badge for first-time users, and it sat on top of the bottom-right corner of every table. The `?` key shortcut replaces it.

#### Changed
- `Notification.model.js` — added the `batch_imported` type.
- Dashboard `<main>` now uses `overflow-x-clip` with `scrollbar-gutter: stable`, removing a stray horizontal scrollbar caused by the KPI grid's decorative ambient glow (`inset: -40px`) registering as scrollable overflow.
- Themed, thin scrollbars across the app, driven by the existing palette tokens.

---

## [2.5.0] — 2026-08-05

### 🔔 Role-Based Notifications & Quality Inspection System

This release introduces a fully functional real-time notification system and a comprehensive Quality Inspection workflow, fulfilling Phase 3 of the Settings Centre and enabling the QA Inspector role.

#### Added

**Real-Time Notifications (Phase 3)**
- `Notification.model.js` — MongoDB collection for role-based notifications with a 7-day TTL.
- `notificationService.js` — Core service to trigger notifications across the system.
- Real-time Socket.io integration with `role:X` rooms for targeted broadcasting.
- Full UI integration: Navbar bell icon with pulse animation, and a NotificationPanel dropdown.
- REST endpoints for fetching unread count, marking read, and clearing history.
- `useNotifications` hook in frontend for optimistic updates and state merging.
- Event triggers added to batch creation (manager/factory-manager), dispatch, and admin actions.

**Quality Inspection System**
- Complete QA workflow enabling the `qa-inspector` role to log inspections on batches.
- Integration with notifications: triggers an alert to `manager` upon inspection completion.
- Full quality inspection suite including defect logging and status tracking.

---

## [2.4.0] — 2026-08-05

### 🎨 Settings Centre — Phase 1 & 2 (Profile · Customisation · Security · ThemePicker)

This release delivers the full **Settings Centre** across two phases, including a premium-redesigned settings panel, a 3-mode theme picker in every header, 25 handcrafted palettes, accent swatches, font selection, and density controls — all persisted cross-device via the backend.

#### Added

**Settings Infrastructure**
- `LoginEvent.model.js` — separate MongoDB collection for login history with a 30-day TTL index (auto-expiry, no manual cron required).
- `loginHistory.service.js` — non-blocking fire-and-forget service that resolves UA (browser/OS/device) and geolocation (city/country via `ip-api.com`) then writes a `LoginEvent` document after the HTTP response is already sent.
- `SettingsContext.jsx` — React context managing `mode`, `palette`, `accent`, `font`, and `density` with zero-flash localStorage initialisation and cross-device DB sync.
- `useSettingsMutation.js` — TanStack Query mutation hook for saving preference changes to the backend.
- `ThemePicker.jsx` — compact popover dropdown in every app header (Home, About, Dashboard) with **Light / Dark / System** options. Shows the active mode label + chevron; replaces the old binary sun/moon toggle.

**Backend Self-Service Endpoints**
- `GET /auth/me` — fetch own profile including preferences.
- `PATCH /auth/me` — update name and phone number.
- `PATCH /auth/me/settings` — save theme/font/density preferences (persisted to `User.preferences`).
- `POST /auth/me/change-password` — bcrypt-guarded password change.
- `GET /auth/me/login-history` — last 10 `LoginEvent` records for the authenticated user.

**Settings Panel — Profile**
- Compact header summary block: avatar initials circle, name, email, role badge.
- Editable fields: Full Name, Mobile Number.
- Read-only fields: Username, Email, Role.

**Settings Panel — Customisation (Phase 2)**
- **25 palettes** — each individually tuned for light and dark mode, displayed as 3-stripe colour preview cards with checkmark on active selection:
  - Phase 1 (8): HimShakti, Midnight, Forest, Warm Sand, Copper, Mint, Plum, Nordic Frost.
  - Phase 2 (17): Rose, Slate, Ocean, Crimson, Olive, Lavender, Citrus, Aurora, Dusk, Sakura, Espresso, Cobalt, Jade, Storm, Saffron, Ember.
- **17 accent swatches + Auto** — circular colour pickers overriding `--brand-primary` for buttons, links, and highlights. Auto defers to the active palette.
- **4 font families** — Inter (default), DM Sans, Outfit, Manrope — loaded via Google Fonts, shown with live `Aa` preview at each card's typeface. Selection immediately updates `--font-body` CSS var.
- **3 density modes** — Compact / Normal / Cozy — adjusts padding, gap, and text-size spacing vars via `data-density` attribute on `<html>`.
- **Reset button** — single click restores all Customisation preferences to defaults.
- Segmented Light / Dark / System control (same logic as ThemePicker, in-context).

**Settings Panel — Security**
- Eye-reveal toggle on all password fields (Current Password, New Password, Confirm Password).
- 4-bar password strength meter on the New Password field (Weak → Fair → Good → Strong).
- Icon-rich login history: each sign-in row shows method badge (Google/Password), city/country, browser + OS, and timestamp.

**Settings Panel — Notifications (Phase 3 structure)**
- Four intentional notification rows with role-based descriptions and Phase 3 badges — not a blank placeholder.

#### Changed
- `User.model.js` — added `phone`, `preferences` (mode, palette, accent, font, density) schema fields.
- `auth.controller.js` — added `getMe`, `updateProfile`, `updateSettings`, `changePassword`, `getLoginHistory`; both `login()` and `googleLogin()` now call `appendLoginEvent` fire-and-forget after response.
- `auth.controller.js` + `googleAuth.controller.js` — JWT payload now includes `_id` so `req.user._id` resolves in all protected self-service routes.
- `index.css` — added system-mode media queries, 25 palette CSS variable blocks, `--font-body` var, `--density-*` spacing vars, `animate-popover-in` keyframe.
- `index.html` — added Google Fonts preconnect + stylesheet for Inter, DM Sans, Outfit, and Manrope.
- `Navbar.jsx` — replaced `ThemeToggle` (binary icon) with `ThemePicker` (3-option dropdown) in all 3 placement sites (dashboard header, public nav desktop row, mobile row).
- `useTheme.js` — refactored to thin proxy over `SettingsContext`; eliminates competing `localStorage('theme')` key.

#### Fixed
- **Login redirect loop** — `SettingsContext` `/auth/me` query now uses `skipAuthRedirect: true` + `retry: false`, preventing the 401 → hard reload → 401 cycle on the login page when `SettingsProvider` wraps the whole app.
- **Silent login history failure** — JWT token was missing `_id` in the payload; `req.user._id` was `undefined` in protected routes, causing login event writes to silently fail.

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
