# Batch Management — Detail-Led Workflow

> **Version:** 2.1.0 · **Updated:** 2026-08-02 · **Author:** Intern 2

This document describes the Batch Management system. The detail-led drawer workflow was introduced in v2.0.0 and extended with raw material correction in v2.1.0. The system is live at [himshakti2026-bb904.web.app](https://himshakti2026-bb904.web.app).

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [BatchDetailDrawer](#batchdetaildrawer)
3. [RBAC Permissions](#rbac-permissions)
4. [Soft Delete & Audit Trail](#soft-delete--audit-trail)
5. [Traceability Note History](#traceability-note-history)
6. [API Reference](#api-reference)
7. [Schema Changes](#schema-changes)
8. [React Query Mutations](#react-query-mutations)
9. [File Reference](#file-reference)

---

## Design Philosophy

### Why Not Inline Edit/Delete Buttons?

The previous design scattered action icons across each table row — a pattern called **"icon soup"** that is hard to discover, easy to misclick, and provides zero context before acting.

For a **traceability system**, context-before-action is critical. Archiving a batch without seeing its farmer origin, shelf life, or QR scan count can cause operational errors.

### The Detail-Led Workflow

```
Click batch row
    ↓
Drawer opens with full context (Overview tab)
    ↓
Inspect: expiry, origin, QR scans, dispatch status
    ↓
Annotate: edit traceability note (role-gated)
    ↓
Act: dispatch, download QR, or archive (role-gated)
```

This pattern is used by **Shopify** (order detail sidebar), **Linear** (issue detail panel), and **Stripe** (payment detail drawer). It is cleaner, more teachable, and easier to maintain.

### What Is NOT Editable After Creation

Core traceability fields are **permanently sealed** after batch creation to maintain an immutable audit trail:

| Field | Editable After Creation? | Reason |
|---|---|---|
| `farmerName` | ❌ No | Core provenance fact |
| `village` | ❌ No | Core provenance fact |
| `packDate` | ❌ No | Immutable production record |
| `expiryDate` | ❌ No | Calculated from pack date + product |
| `sourceLotCode` | ❌ No | Traceability key |
| `yieldPercent` | ❌ No | Production measurement |
| `traceabilityNote` | ✅ Yes (role-gated) | Narrative annotation |

---

## BatchDetailDrawer

### Overview

The `BatchDetailDrawer` is a slide-in panel component that opens when a user clicks any batch row in the Batch Registry table.

- **Desktop:** 440px right-side panel
- **Mobile:** Full-screen bottom sheet with drag handle

### Three Tabs

#### Overview Tab
Displays all batch information in a structured, card-based layout:

- **Expiry urgency bar** — color-coded shelf-life remaining indicator (red/amber/green)
- **Quick actions** — Copy Trace Link, Download QR, Dispatch buttons
- **Batch identity cards** — Batch code (with copy button), product, SKU, dates, shelf life source, priority score
- **Raw material source** — Farmer, village, lot code, quantity, yield %, data source
- **Dispatch block** — Buyer name and dispatch date (only shown for DISPATCHED batches)
- **QR code preview** — Lazy-loaded on button click, shown in a white card
- **Scan analytics** — Total scans, mobile count, desktop count as mini-stat cards
- **Audit metadata** — Created by, created at

#### Notes Tab
Manages the editable traceability note with a full audit trail:

- **Current note** — Read-only by default; Edit button for authorized roles
- **Note editor** — Textarea with 1000-character limit, Save/Cancel controls
- **Edit history timeline** — Append-only log of all previous notes with actor and timestamp
- **Admin Danger Zone** — Archive/Restore controls (admin only)

#### History Tab
Shows the full lifecycle event log for the batch:

- **Lifecycle events** — Creation, note edits, dispatch, archive (sorted newest first)
- **Recent QR scans** — Last 5 scan events with device type, source, and timestamp

### Status Color Strip

A 4px color strip at the top of the drawer reflects the batch's current status:

| Status | Color |
|---|---|
| URGENT | Red (`bg-red-500`) |
| WARNING | Amber (`bg-amber-500`) |
| READY | Emerald (`bg-emerald-500`) |
| DISPATCHED | Blue (`bg-blue-500`) |
| EXPIRED | Rose (`bg-rose-700`) |

### Light & Dark Mode

All colors use Tailwind CSS design tokens (`bg-surface`, `text-text-primary`, `border-border`) defined in `index.css`. The drawer adapts automatically to whichever theme the app is using — no hardcoded hex values.

---

## RBAC Permissions

Role-Based Access Control is enforced at **both layers** — backend controller validation and frontend UI gating.

| Action | `admin` | `manager` | `factory-manager` | `dispatch-coordinator` | `quality-inspector` |
|---|:---:|:---:|:---:|:---:|:---:|
| View drawer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit traceability note | ✅ | ✅ | ✅ | ❌ | ❌ |
| Archive batch | ✅ | ❌ | ❌ | ❌ | ❌ |
| Restore batch | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dispatch batch | ✅ | ✅ | ❌ | ✅ | ❌ |

**Backend enforcement:** The `updateBatchNote` controller returns `403` if the user's role is not in `['admin', 'manager', 'factory-manager']`. The `softDeleteBatch` and `restoreBatch` controllers return `403` for any non-admin user.

**Frontend enforcement:** The "Edit" button, Danger Zone, and Dispatch button are conditionally rendered based on `user.role` from `localStorage`.

---

## Soft Delete & Audit Trail

### Why Soft Delete?

Hard-deleting a batch would:
1. Destroy its QR scan history permanently
2. Break referential integrity in analytics
3. Eliminate the audit trail required for food safety compliance
4. Make disaster recovery impossible

Soft delete **preserves everything** while hiding the record from normal views.

### How It Works

When an admin archives a batch:

```
Admin types batchCode to confirm
    ↓
PATCH /api/batches/:id → sets isDeleted: true
    ↓
deletedAt: new Date()
deletedBy: req.user.username
deleteNote: optional reason
    ↓
batch:deleted socket event → all connected sessions update instantly
    ↓
Batch disappears from all list views immediately (optimistic)
```

### Restoring a Batch

```
Admin clicks "Restore Batch" in the drawer
    ↓
PATCH /api/batches/:id/restore → clears all isDeleted fields
    ↓
batch:restored socket event → all sessions update
    ↓
Batch reappears in list views
```

### Typed Confirmation Pattern

Following the GitHub/Stripe/Vercel convention, archiving requires typing the exact batch code to confirm. This prevents accidental archives from a misclick.

---

## Traceability Note History

Every time a user saves a new traceability note, the **previous note** is pushed to `noteHistory[]` with:
- `note` — the old text
- `editedBy` — the username of the person making the change
- `editedAt` — timestamp of the edit

This creates an **append-only, auditable log** of every annotation on a batch. The log is visible in the Notes tab and the History tab.

```
Initial note: "Packed from Pauri harvest…"
    ↓
Manager edits → old note pushed to noteHistory
New note: "Packed from Pauri harvest. QA passed. Grade A."
    ↓
Admin edits → old note pushed to noteHistory
New note: "Packed from Pauri harvest. QA passed. Grade A. Extra drying applied."
```

The `noteHistory` array is **never truncated** — it is a permanent record.

---

## API Reference

### `PATCH /api/batches/:id/note`

Updates the traceability note on a batch. Appends the old note to history.

**Auth:** Required (Bearer token)  
**Roles:** `admin`, `manager`, `factory-manager`

**Request body:**
```json
{ "note": "Updated traceability annotation (max 1000 chars)" }
```

**Response:**
```json
{
  "success": true,
  "message": "Traceability note updated",
  "data": {
    "traceabilityNote": "Updated note text",
    "noteHistory": [{ "note": "old note", "editedBy": "manager", "editedAt": "..." }]
  }
}
```

---

### `PATCH /api/batches/:id/raw-material`

Corrects raw material sourcing fields on a batch. Appends a change summary to `noteHistory[]`.

**Auth:** Required (Bearer token)  
**Roles:** `admin`, `manager`, `factory-manager`  
**Added:** v2.1.0

**Request body:**
```json
{
  "farmerName": "Corrected Farmer Name",
  "village": "Corrected Village",
  "sourceLotCode": "LOT-WB-2026-045-REVISED"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Raw material data updated",
  "data": { /* updated batch */ }
}
```

---

### `DELETE /api/batches/:id`

Soft-deletes (archives) a batch. Record is preserved.

**Auth:** Required  
**Roles:** `admin` only

**Request body:**
```json
{ "reason": "Duplicate entry - merged with HS-2026-07-001" }
```

**Response:**
```json
{
  "success": true,
  "message": "Batch HS-2026-07-005 archived",
  "data": { "batchCode": "HS-2026-07-005" }
}
```

---

### `PATCH /api/batches/:id/restore`

Restores a soft-deleted batch.

**Auth:** Required  
**Roles:** `admin` only

**Response:**
```json
{
  "success": true,
  "message": "Batch HS-2026-07-005 restored",
  "data": { /* full batch object */ }
}
```

---

## Schema Changes

Fields added to `Batch.model.js` in v2.0.0:

```js
// Traceability Note History — append-only audit log
noteHistory: [{
  note:     { type: String, required: true },
  editedBy: { type: String, required: true },
  editedAt: { type: Date, default: Date.now },
}],

// Soft Delete fields
isDeleted:  { type: Boolean, default: false, index: true },
deletedAt:  { type: Date,    default: null },
deletedBy:  { type: String,  default: null },
deleteNote: { type: String,  default: null },
```

**New compound index:**
```js
BatchSchema.index({ isDeleted: 1, status: 1, expiryDate: 1 });
```

### Migration

All pre-existing batch documents that lacked the `isDeleted` field were backfilled via a one-time migration:

```js
await db.collection('batches').updateMany(
  { isDeleted: { $exists: false } },
  { $set: { isDeleted: false } }
);
// Result: 20 documents updated
```

The `getAllBatches` query uses `{ isDeleted: { $ne: true } }` instead of `{ isDeleted: false }` to ensure backward compatibility with any documents that might still lack the field.

---

## React Query Mutations

All batch mutations in `useBatches.js` use **optimistic updates with automatic rollback**:

### `updateBatchNote(id, note)`
```
Optimistic: updates note in cache immediately
On error:   restores previous cache snapshot
On settled: invalidates ['batches'] query → fresh fetch
```

### `softDeleteBatch(id, reason?)`
```
Optimistic: removes batch from list immediately
On error:   restores batch to list
On settled: invalidates ['batches'] query
```

### `restoreBatch(id)`
```
On settled: invalidates ['batches'] query → batch reappears
```

---

## File Reference

| File | Role |
|---|---|
| `frontend/src/components/BatchDetailDrawer.jsx` | The main drawer UI component |
| `frontend/src/hooks/useBatches.js` | React Query hook with all mutations |
| `frontend/src/pages/Dashboard.jsx` | Wires drawer state + passes props |
| `backend/src/controllers/batches.controller.js` | `updateBatchNote`, `updateRawMaterial`, `softDeleteBatch`, `restoreBatch` |
| `backend/src/routes/batches.routes.js` | `PATCH /:id/note`, `PATCH /:id/raw-material`, `DELETE /:id`, `PATCH /:id/restore` |
| `backend/src/models/Batch.model.js` | Schema with `noteHistory` + soft-delete fields |
| `docs/BATCH_MANAGEMENT.md` | This document |

---

*Document maintained by Intern 2 — HimShakti Batch Traceability & Dispatch Intelligence System*  
*Schema v2.1.0 · Live: https://himshakti2026-bb904.web.app*
