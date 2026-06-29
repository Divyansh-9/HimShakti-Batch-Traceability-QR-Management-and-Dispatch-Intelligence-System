<div align="center">

# HimShakti Frontend — React Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-Client-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
</p>

</div>

---

## Quick Start

```bash
npm install
npm run dev
```

Opens at **http://localhost:5173** — requires the backend running at port 5001.

---

## Project Structure

```
src/
├── pages/                     # Route-level page components
│   ├── Home.jsx               # Parallax hero, animated stats, feature grid
│   ├── About.jsx              # Full-bleed hero, scroll-reveal mission sections
│   ├── Login.jsx              # Glassmorphic dual-flow: sign in + request access
│   ├── Dashboard.jsx          # All 6 tabs, sidebar, modals — the main app
│   └── TracePage.jsx          # Public consumer QR scan landing page
│
├── components/                # Reusable UI components
│   ├── Navbar.jsx             # Scroll-aware: transparent on hero, solid after 70px
│   ├── CreateBatchModal.jsx   # Form modal for batch creation
│   ├── DispatchModal.jsx      # Dispatch confirmation modal
│   └── ErrorBoundary.jsx      # React error boundary for AI Audit tab
│
├── hooks/                     # Custom React hooks
│   ├── useAuth.js             # JWT context — login, logout, getUser(), persistence
│   ├── useBatches.js          # Batch CRUD, QR download
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

The frontend expects the backend at `http://localhost:5001` by default.

To change the API base URL, update `src/api/client.js`:

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
```

Create a `.env` file in the `frontend/` directory:
```
VITE_API_URL=http://localhost:5001
```

---

*HimShakti Food Processing — Frontend Dashboard · React 18 + Vite · 2026*
