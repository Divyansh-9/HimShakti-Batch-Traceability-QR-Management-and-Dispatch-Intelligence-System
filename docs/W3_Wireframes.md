# UI Design Specification: Week 3 Wireframes

**Project:** HimShakti Batch Traceability, QR Management & Dispatch Intelligence System
**Document Type:** UI Design Specification
**Version:** 1.1.0
**Date:** 2026-06-19
**Status:** ✅ Implemented

---

## 1. Overview

This document defines the UI/UX design specification for the five core screens of the HimShakti system, as derived from the Software Requirements Specification (SRS v1.0.0). Each section describes **what** the screen contains, **how** it is structured, and **why** each design decision was made in relation to the system's requirements.

The five screens align directly with the primary user flows identified in SRS §2.2:

| Screen | User Class | SRS Reference |
| :--- | :--- | :--- |
| Dashboard | Factory Manager | FR-3.1, FR-3.2, FR-4.3 |
| Home / Landing | B2B Buyer, Consumer | FR-5.1 |
| Batch Detail | Factory Manager, Dispatch Operator | FR-2.1, FR-2.2, FR-5.2 |
| Login / Sign In | Factory Manager, Dispatch Operator | NFR-2.1, NFR-2.2 |
| AI Feature Screen | Factory Manager | FR-4.1, FR-4.2, FR-4.3 |

> **Design Standard:** All screens follow a desktop-first layout (1440 × 1024), with responsive support down to 768px (tablet) per NFR-3.2. A greyscale (lo-fi) wireframe approach was used to focus on structural hierarchy rather than visual styling during the design phase.

---

## 2. Design System Foundations

### 2.1 Why a Shared Design System

A consistent design language was established across all five screens to:
- Reduce cognitive load for the Factory Manager who switches between screens frequently.
- Ensure that the codebase can share a single component library (implemented under `frontend/src/components/ui/`).
- Maintain WCAG AA accessibility standards (NFR-3.1, NFR-3.2).

### 2.2 Typography

| Role | Font | Weight | Size |
| :--- | :--- | :--- | :--- |
| Page Heading | Inter / Roboto | 700 (Bold) | 32px |
| Section Heading | Inter / Roboto | 600 (Semi-Bold) | 24px |
| Card Label | Inter / Roboto | 500 (Medium) | 16px |
| Body / Data | Inter / Roboto | 400 (Regular) | 14px |
| Caption | Inter / Roboto | 400 (Regular) | 12px |

### 2.3 Component Library (Implemented)

The following reusable components were built and are available at `frontend/src/components/ui/`:

| Component | File | Purpose |
| :--- | :--- | :--- |
| `Button` | `Button.jsx` | Primary, secondary, and destructive action buttons |
| `Input` | `Input.jsx` | Form text fields and search inputs |
| `Modal` | `Modal.jsx` | Dialog overlays for confirmations and detail views |
| `Loader` | `Loader.jsx` | Async loading state indicator |
| `Badge` | `Badge.jsx` | Batch status indicators (READY, WARNING, URGENT, etc.) |
| `Card` | `Card.jsx` | General-purpose content containers |

All components are exported via `frontend/src/components/ui/index.js` for a single import path.

---

## 3. Screen Specifications

---

### Screen 1 — Dashboard (`01_Dashboard`)

**Frame:** 1440 × 1024 (Desktop) · **Route:** `/dashboard`

#### 3.1.1 What It Contains

The Dashboard is the primary operational interface for the **Factory Manager**. It presents:
- A persistent top navigation bar and a left sidebar for system-wide navigation.
- Three KPI cards summarising the current batch inventory state.
- A paginated data table listing all active batches with their status and key dates.
- An "AI Audit" trigger to invoke the Gemini advisory engine.

#### 3.1.2 How It Is Structured

```
┌──────────────────────────────────────────── Navbar (64px) ────────────────────────────────────────────┐
│ [Logo]                                                                  [🌙 Theme Toggle]  [Avatar]   │
├───────── Sidebar (240px) ─────────────┬────────────────────────── Main Content ────────────────────────┤
│  Dashboard  ◄ (Active)                │  Page Title: "Batch Dashboard"                                │
│  Batches                              │                                                                │
│  QR Management                        │  ┌── KPI Card ──┐  ┌── KPI Card ──┐  ┌── KPI Card ──┐       │
│  Dispatch                             │  │ Total Batches│  │  Dispatched  │  │  Pending QR  │       │
│  AI Generator                         │  └──────────────┘  └──────────────┘  └──────────────┘       │
│  Settings                             │                                                                │
│                                       │  ┌──── Data Table (Batch ID, Product, Status, QR, Date) ───┐ │
│                                       │  │  [Row]  [Row]  [Row]  [Row]  [Row]                      │ │
│                                       │  │                                         [Prev]  1/10  [Next]│
│                                       │  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────┴───────────────────────────────────────────────────────────────┘
```

**Data Table Column Schema:**

| Column | Data Source | Notes |
| :--- | :--- | :--- |
| Batch ID | `batches.batchCode` | Format: `HS-YYYY-MM-NNN` |
| Product Name | `batches.productName` | |
| Status | `batches.status` | Rendered as a `Badge` component |
| QR Generated | `batches.qrCodeDataUrl` | Boolean indicator |
| Dispatch Date | `batches.dispatchDate` | Nullable; shows `—` if pending |
| Actions | — | View detail, Download QR |

**Status Badge Colour Mapping (per SRS §4.3 and `batches.status` enum):**

| Status | Visual |
| :--- | :--- |
| `READY` | Light grey background, black text |
| `WARNING` | Medium grey background, black text |
| `URGENT` | Dark grey background, white text |
| `DISPATCHED` | Dark background, white text |
| `EXPIRED` | Black background, white text |

#### 3.1.3 Why These Decisions Were Made

- **Sidebar navigation** was chosen over a top-only navbar because the system has six distinct functional areas (SRS §6.1), and sidebar navigation reduces navigation depth.
- **KPI Cards** directly surface the three most critical operational metrics, enabling the Factory Manager to act without running a query (FR-3.1).
- **FEFO-ordered table** is sorted by `priorityScore` descending by default, enforcing the First-Expired, First-Out dispatch logic without requiring the manager to manually sort (FR-3.2).
- **Pagination** prevents performance degradation as the `batches` collection grows, aligning with NFR-1.1 (sub-500ms page load).

---

### Screen 2 — Home / Landing (`02_Landing`)

**Frame:** 1440 × 1024 (Desktop) · **Route:** `/`

#### 3.2.1 What It Contains

The public-facing landing page for **B2B Buyers and Consumers**. It communicates the system's core value proposition and provides a direct entry point to trace a batch via QR scan.

#### 3.2.2 How It Is Structured

```
┌──────────────── Navbar (80px) ─────────────────────────────────────────────────┐
│  [Logo]          Home  |  Products  |  Trace a Batch  |  Login     [Get Started]│
├──────────────────────────────────────────────────────────────────────────────┤
│                          ── Hero Section (2-column) ──                       │
│  Left:                                │  Right:                              │
│  H1: "Trace Your Product..."          │  [Product Imagery Placeholder]       │
│  Subtitle: Quality & Transparency     │                                      │
│  [Trace a Batch] [Learn More]         │                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                    ── Features Section: "Why HimShakti?" ──                  │
│   [Icon] Immutable Records   [Icon] Real-Time QR   [Icon] FSSAI Compliance   │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Footer: Logo | Links | Copyright]                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.3 Why These Decisions Were Made

- **No authentication required** on this page, as per FR-5.1. The Consumer and B2B Buyer user classes must access trace data without a sign-in barrier.
- **"Trace a Batch" as the primary CTA** creates a direct call-to-action for QR scan behaviour, the most common consumer action.
- **Features Section** surfaces the three business differentiators (Immutable Records, Real-Time QR, FSSAI Compliance) identified in the project's planning report to build buyer trust.

---

### Screen 3 — Batch Detail (`03_BatchDetail`)

**Frame:** 1440 × 1024 (Desktop) · **Route:** `/batch/:batchCode`

#### 3.3.1 What It Contains

The detail view reached when a QR code is scanned. It displays full batch metadata and the traceability journey timeline. This screen is accessed by all three user classes.

#### 3.3.2 How It Is Structured

```
┌─── Breadcrumb: Dashboard > Batches > BAT-10421 ─── [← Back] ───────────────┐
├──── Left Panel (60%) ─────────────────┬──── Right Panel (40%) ──────────────┤
│  Batch Info Card                      │  QR Code Card                       │
│  ─────────────────                    │  ─────────────────                  │
│  Batch ID:       BAT-10421            │                                     │
│  Product Name:   [productName]        │   ┌──────────────────┐              │
│  Pack Date:      [packDate]           │   │   [QR Code PNG]  │              │
│  Expiry Date:    [expiryDate]         │   └──────────────────┘              │
│  Status:         [Badge]              │                                     │
│  Weight:         [unitSize]           │   [Download QR]  [Share Link]       │
│  Ingredients:    [...]                │                                     │
├───────────────────────────────────────┴─────────────────────────────────────┤
│                   ── Traceability Timeline ──                                │
│  ◉──────────────◉──────────────◉──────────────○                            │
│  Raw Material   Processing     QR Generated   Dispatched                    │
│  01 Jun ✓       05 Jun ✓       10 Jun ◄        TBD                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Timeline Step → Data Mapping:**

| Step | Trigger | Status Logic |
| :--- | :--- | :--- |
| Raw Material | `batches.sourceLotCode` set | Always `Done` on creation |
| Processing | `batches.packDate` set | `Done` when batch record exists |
| QR Generated | `batches.qrCodeDataUrl` is not null | FR-2.2 |
| Dispatched | `batches.dispatchDate` is not null | FR-3.3 |

#### 3.3.3 Why These Decisions Were Made

- **Split-panel layout (60/40)** keeps batch metadata and the QR download action together without requiring scroll, enabling fast in-warehouse use (NFR-3.2).
- **Horizontal timeline** mirrors the physical journey of a batch from raw material to dispatch, making it immediately intuitive for a Consumer scanning a QR code (FR-5.2).
- **Public endpoint, no auth gate** fulfils FR-5.1 and the Data Minimization security principle (SRS §7).
- **Scan logging** is triggered server-side upon page load, logging to the `scanEvents` collection with a hashed IP (NFR-2.3, FR-5.3).

---

### Screen 4 — Login / Sign In (`04_Auth`)

**Frame:** 1440 × 1024 (Desktop) · **Route:** `/login`

#### 3.4.1 What It Contains

The authentication screen for the Factory Manager and Dispatch Operator to access the private management portal.

#### 3.4.2 How It Is Structured

```
┌─────────────────────── Full-screen light grey background ───────────────────────────┐
│                                                                                     │
│              ┌─────────────────── Auth Card (400px wide) ──────────────────────┐   │
│              │            [HimShakti Logo]                                      │   │
│              │                                                                  │   │
│              │            Sign In                                               │   │
│              │            ─────────────────────────────────────                │   │
│              │  Email     [ ______________________________ ]                   │   │
│              │  Password  [ ______________________________ ]  Forgot password? │   │
│              │                                                                  │   │
│              │            [────────── Sign In ──────────]                      │   │
│              │                      ── OR ──                                   │   │
│              │            [─────── Continue with Google ──]                    │   │
│              │                                                                  │   │
│              │            Don't have an account? Sign Up                       │   │
│              └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.4.3 Why These Decisions Were Made

- **Centred card on a plain background** is an established authentication pattern that focuses the user's attention on a single action and removes all navigational distractions.
- **"Forgot password?" link** positioned inline with the Password label reduces click distance, a usability best practice.
- **JWT-based authentication** is enforced on the server upon successful sign-in, fulfilling NFR-2.2. Passwords are never stored in plain text (NFR-2.1, bcrypt).
- **No signup form on this screen** — access is provisioned by the system administrator. The "Sign Up" link is reserved for a future self-service flow.

---

### Screen 5 — AI Advisory / Description Generator (`05_AIGenerator`)

**Frame:** 1440 × 1024 (Desktop) · **Route:** `/ai-generator`

#### 3.5.1 What It Contains

The AI-powered interface that calls the Google Gemini API to generate dispatch advisories and product descriptions. This screen is used exclusively by the **Factory Manager**.

#### 3.5.2 How It Is Structured

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Page Title: "AI Product Description Generator"                                 │
│  Subtitle:   "Generate marketing descriptions and dispatch advisories."         │
├──────────── Left Panel (Input Form) ───────────┬──── Right Panel (Output) ──────┤
│  Panel: "Product Details"                      │  Panel: "Generated Output"     │
│  ──────────────────────────────────────────    │  ──────────────────────────    │
│  Product Name:   [ _______________ ]           │                                │
│  Key Ingredients:                              │  ┌────────────────────────┐   │
│  [ _______________________________ ]           │  │                        │   │
│  [ _______________________________ ]           │  │  Generated text area   │   │
│  Weight / Quantity: [ ___________ ]            │  │  (read-only)           │   │
│  Key Features:                                 │  │                        │   │
│  [ _______________________________ ]           │  └────────────────────────┘   │
│                                                │                                │
│  Tone:  [Premium]  [Traditional ◄]  [Health]  │  450 / 800 characters         │
│                                                │                                │
│  [────── Generate Description ──────]          │  [↺ Regenerate] [⧉ Copy] [✎ Edit]│
└────────────────────────────────────────────────┴────────────────────────────────┘
```

#### 3.5.3 Why These Decisions Were Made

- **Two-panel side-by-side layout** allows the Factory Manager to see the input and the AI-generated output simultaneously, enabling rapid iteration without scrolling.
- **Tone Selector** (Premium / Traditional / Health-Focused) passes a prompt context variable to the Gemini API call, allowing the system to tailor output for different market segments without requiring the manager to write prompts manually.
- **4-hour caching layer** (FR-4.2) is enforced on the backend. The frontend displays a timestamp of the last cached result if the live API call is blocked, preventing redundant API charges.
- **Character Count indicator** below the output area guides the manager on content length suitable for product labels and marketing copy.
- **"Run AI Audit" functionality** is co-located within this module. When triggered (FR-4.3), it compiles all non-dispatched batches and submits them to Gemini for FEFO-aware dispatch advice (FR-4.1).

---

## 4. Implemented File Structure

The following frontend files implement the design specifications above:

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Top navigation bar (all screens)
│   │   ├── Footer.jsx          # Public footer (Screen 2)
│   │   ├── Hero.jsx            # Landing page hero section (Screen 2)
│   │   ├── ThemeToggle.jsx     # Dark/Light mode toggle (all screens)
│   │   └── ui/
│   │       ├── index.js        # Central component export
│   │       ├── Button.jsx      # Action buttons
│   │       ├── Input.jsx       # Form input fields
│   │       ├── Modal.jsx       # Dialog overlays
│   │       ├── Loader.jsx      # Loading state indicator
│   │       ├── Badge.jsx       # Batch status badges
│   │       └── Card.jsx        # Content card containers
│   ├── pages/
│   │   ├── Home.jsx            # Screen 2: Landing
│   │   ├── Dashboard.jsx       # Screen 1: Dashboard
│   │   ├── Login.jsx           # Screen 4: Authentication
│   │   ├── About.jsx           # Secondary informational page
│   │   └── ComponentShowcase.jsx # Internal UI component reference
│   ├── hooks/
│   │   └── useTheme.js         # Dark/Light theme state and localStorage persistence
│   └── index.css               # Global design tokens and base styles
└── index.html                  # Application entry point
```

---

## 5. Traceability Matrix

| SRS Requirement | Screen | Implemented |
| :--- | :--- | :--- |
| FR-1.1, FR-1.2 — Batch Expiry Logic | Dashboard | ⏳ Backend (Pending) |
| FR-2.1, FR-2.2 — QR Code Generation | Batch Detail | ⏳ Backend (Pending) |
| FR-2.3 — QR Download | Batch Detail | ✅ UI Implemented |
| FR-3.1 — FEFO Priority Dashboard | Dashboard | ✅ UI Implemented |
| FR-3.2 — Dynamic Status Recalculation | Dashboard | ⏳ Backend (Pending) |
| FR-4.1, FR-4.2 — Gemini API + Cache | AI Generator | ⏳ Backend (Pending) |
| FR-4.3 — "Run AI Audit" Button | AI Generator | ✅ UI Implemented |
| FR-5.1 — Public Endpoint (No Auth) | Home, Batch Detail | ✅ UI Implemented |
| FR-5.2 — Trace Timeline | Batch Detail | ✅ UI Implemented |
| FR-5.3 — Async Scan Logging | Batch Detail | ⏳ Backend (Pending) |
| NFR-2.1 — Password Hashing (bcrypt) | Login | ⏳ Backend (Pending) |
| NFR-2.2 — JWT Auth | Login | ⏳ Backend (Pending) |
| NFR-3.1 — Mobile Optimization | Home, Batch Detail | ✅ UI Implemented |
| NFR-3.2 — Tablet Responsiveness (768px) | All Screens | ✅ UI Implemented |

---

*This document will be updated as backend implementation progresses. Refer to `intern-2/implementation_plan.md` for the phased build schedule.*
