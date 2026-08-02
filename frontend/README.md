<div align="center">

# HimShakti Frontend — React Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Hosting-FF6000?style=for-the-badge&logo=firebase&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-Client-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
</p>

<p align="center">
  <strong>Live:</strong> <a href="https://himshakti2026-bb904.web.app">himshakti2026-bb904.web.app</a>
</p>

</div>

---

## Quick Start

```bash
npm install
npm run dev
```

Opens at **http://localhost:5173** — requires the backend running at port 5001.

### Production Build & Deploy

```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting (from project root)
firebase deploy --only hosting
```

**Live URL**: https://himshakti2026-bb904.web.app

---

## Project Structure

```
src/
├── pages/                     # Route-level page components
│   ├── Home.jsx               # Parallax hero, animated stats, feature grid
│   ├── About.jsx              # Full-bleed hero, scroll-reveal mission sections
│   ├── Login.jsx              # Glassmorphic dual-flow: sign in + Google OAuth + request access
│   ├── Dashboard.jsx          # All 6 tabs, sidebar, modals — the main app
│   └── TracePage.jsx          # Public consumer QR scan landing page
│
├── components/                # Reusable UI components
│   ├── Navbar.jsx             # Scroll-aware: transparent on hero, solid after 70px
│   ├── BatchDetailDrawer.jsx  # 3-tab slide-in detail panel (Overview · Notes · History)
│   ├── CreateBatchModal.jsx   # Form modal for batch creation
│   ├── DispatchModal.jsx      # Dispatch confirmation modal
│   └── ErrorBoundary.jsx      # React error boundary for AI Audit tab
│
├── hooks/                     # Custom React hooks
│   ├── useAuth.js             # JWT context — login, Google Sign-In, logout, persistence
│   ├── useBatches.js          # Batch CRUD, QR download, optimistic updates + rollback
│   ├── useDispatch.js         # Dispatch flow hook
│   ├── useAIAudit.js          # Gemini audit trigger and response state
│   └── useSocket.js           # Socket.IO live updates connection
│
└── api/
    └── client.js              # Fetch wrapper with automatic JWT Authorization header
```

---

## Dashboard Architecture

`Dashboard.jsx` is the main protected page. It uses a **tab-based architecture** where each tab is a self-contained function component defined inside the file.

### Tab Components (all in `Dashboard.jsx`)

| Component | Props | Purpose |
|---|---|---|
| `OverviewTab` | `batches`, `loading`, `onTabSwitch` | KPI cards, status breakdown, cross-tab navigation |
| `BatchesTab` | `batches`, `loading`, `onNewBatch`, `onDownloadQR`, `onDispatch`, `initialFilter` | Full batch table with filters, sort, search |
| `FEFOTab` | _(fetches own data)_ | FEFO priority queue with filter tabs |
| `QRTab` | `batches`, `loading`, `onDownloadQR` | QR card grid with lazy-loaded images |
| `AIAuditTab` | `batchCount` | Gemini advisory with structured card rendering |
| `AdminPanelTab` | _(fetches own data)_ | User management + access request workflow |

### BatchDetailDrawer

A slide-in panel component opened on batch row click. It contains **three tabs**:

| Tab | Content |
|---|---|
| **Overview** | Expiry urgency bar · Quick actions (Copy Link, Download QR, Dispatch) · Batch identity cards · Raw material source · QR preview · Scan analytics |
| **Notes** | Editable traceability note (role-gated) · Edit history timeline · Admin Danger Zone (archive/restore) |
| **History** | Lifecycle event log (creation, note edits, dispatch, archive) · Recent QR scan events |

### Cross-Tab Navigation

The `handleTabSwitch(tabId, filter)` function in the root `Dashboard` component enables smart navigation:

```jsx
// In OverviewTab — clicking "Urgent 3" status pill:
onTabSwitch('batches', 'urgent')

// Dashboard handles it:
function handleTabSwitch(tabId, filter = 'all') {
  if (tabId === 'batches') setBatchesFilter(filter);
  setActiveTab(tabId);
}
```

---

## Design System

### CSS Variables (defined in `index.css`)

```css
--brand:          #ea580c;       /* Orange — buttons, active states */
--brand-hover:    #c2410c;       /* Darker orange on hover */
--surface:        #1e2433;       /* Card / panel backgrounds */
--surface-2:      #252b3b;       /* Input fields, table headers */
--border:         rgba(255,255,255,0.08);
--text-primary:   #f1f5f9;
--text-muted:     #64748b;
--bg:             #141824;       /* Page background */
```

### Tab Accent System

Each tab has a unique accent colour applied consistently to:
1. Banner left accent bar (1px)
2. Eyebrow text (`OVERVIEW`, `BATCH REGISTRY`, etc.)
3. KPI card left border
4. Filter tab active underline
5. Main area background tint (~1.5% opacity)

| Tab | CSS Class | Hex |
|---|---|---|
| Overview | `text-amber-400` | `#f59e0b` |
| Batches | `text-emerald-400` | `#10b981` |
| FEFO Queue | `text-red-400` | `#ef4444` |
| QR Centre | `text-blue-400` | `#3b82f6` |
| AI Audit | `text-teal-400` | `#14b8a6` |
| Admin Panel | `text-rose-400` | `#f43f5e` |

### Key UI Patterns

- **Tab banners**: Full-bleed 176px hero with negative margin trick (`-mx-4 sm:-mx-6 -mt-4 sm:-mt-6`), real photography at 32% opacity, left-heavy dark gradient overlay
- **Tab animation**: `key={activeTab}` on content wrapper → CSS `.dash-tab-in` fade+slide-up (250ms cubic-ease)
- **Urgency progress bars**: `width` driven by `daysToExpiry` relative to a threshold; colour switches by CSS class
- **Status pills**: Inline `<span>` tags with dynamic class from a status→class map
- **Skeleton loaders**: `animate-pulse` divs matching the shape of real content

---

## State Management

No external state library is used. State is managed at the closest relevant scope:

| State | Location | Method |
|---|---|---|
| Auth / JWT | `useAuth` context (React Context) | `useState` + `localStorage` |
| Batches list | `useBatches` hook | `useState` + `useEffect` fetch |
| Real-time updates | `useSocket` hook | Socket.IO `on('batchCreated')` |
| Active tab | `Dashboard` root | `useState` |
| Tab filters | Each tab component | Local `useState` |
| Cross-tab filter | `Dashboard` root | `useState(batchesFilter)` |

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Vite dev server with HMR |
| Build | `npm run build` | Production bundle to `dist/` |
| Preview | `npm run preview` | Locally preview production build |
| Lint | `npm run lint` | ESLint check |

---

## Environment

### Local Development

Create `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Production

Create `frontend/.env.production` (already configured):
```
VITE_API_BASE_URL=https://him-shakti-batch-traceability-qr-ma.vercel.app
VITE_GOOGLE_CLIENT_ID=1030258260963-ps82fu0733pe64pbbnj38hhjm5olpqrf.apps.googleusercontent.com
```

> `VITE_API_BASE_URL` is used by `src/api/client.js` as the backend base URL.
> `VITE_GOOGLE_CLIENT_ID` is used by the Google Sign-In button in `Login.jsx`.

---

*HimShakti Food Processing — Frontend Dashboard · React 18 + Vite · Firebase Hosting · 2026*
*Live: https://himshakti2026-bb904.web.app*
