# Role-Based Access Control (RBAC) Reference

**HimShakti Batch Traceability System — v2.3.0**

---

## Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 0 ── Super Admin  👑  (Divyansh · divyanshuniyal185@gmail.com) │
│           Immutable — identified by isSuperAdmin: true flag        │
│           Only one exists per system                               │
├─────────────────────────────────────────────────────────────────┤
│  TIER 1 ──── Admin      ⚙️  (Appointed by Super Admin)             │
│           Secondary administrators — multiple allowed             │
├─────────────────────────────────────────────────────────────────┤
│  TIER 2 ──────── Manager  💼  (Self-requestable via access form)   │
│           Senior operations role — full ops + read-only team view │
├─────────────────────────────────────────────────────────────────┤
│  TIER 3 ──────────── Factory Manager  🏭                          │
│               ──── Quality Inspector  🔍                          │
│               ──── Dispatch Coordinator  🚚                       │
│           Operational staff — self-requestable via access form    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permission Matrix

| Feature                          | Super Admin | Admin | Manager | Factory Mgr | QA Inspector | Dispatch Coord |
|----------------------------------|:-----------:|:-----:|:-------:|:-----------:|:------------:|:--------------:|
| Overview Dashboard               | ✅           | ✅    | ✅       | ✅           | ✅            | ✅              |
| Batch Registry (full)            | ✅           | ✅    | ✅       | ✅           | ❌ read-only | ✅              |
| FEFO Queue                       | ✅           | ✅    | ✅       | ✅           | ✅            | ✅              |
| QR Code Centre                   | ✅           | ✅    | ✅       | ✅           | ✅            | ✅              |
| AI Dispatch Audit                | ✅           | ✅    | ✅       | ❌           | ❌            | ❌              |
| Admin Panel (full)               | ✅           | ✅    | ❌       | ❌           | ❌            | ❌              |
| Admin Panel (read-only)          | ✅           | ✅    | ✅       | ❌           | ❌            | ❌              |
| Approve / Reject Access Requests | ✅           | ✅    | ❌       | ❌           | ❌            | ❌              |
| Enable / Disable Users           | ✅           | ✅*   | ❌       | ❌           | ❌            | ❌              |
| Promote Role (Tier 2–3)          | ✅           | ✅    | ❌       | ❌           | ❌            | ❌              |
| Promote to Admin (Tier 1)        | ✅           | ❌    | ❌       | ❌           | ❌            | ❌              |
| Soft-Delete Users                | ✅           | ✅*   | ❌       | ❌           | ❌            | ❌              |
| View Recycle Bin                 | ✅           | ❌    | ❌       | ❌           | ❌            | ❌              |
| Restore Deleted Users            | ✅           | ❌    | ❌       | ❌           | ❌            | ❌              |
| Hard-Delete Users (permanent)    | ✅           | ❌    | ❌       | ❌           | ❌            | ❌              |
| Modify Super Admin Account       | ❌           | ❌    | ❌       | ❌           | ❌            | ❌              |

> *Admin cannot act on other Admin or Super Admin accounts.

---

## Promotion Rules

### Who Can Promote Whom?

| Actor → Target     | Super Admin → Admin | Admin → Admin | Super Admin → Others | Admin → Others |
|--------------------|:-------------------:|:-------------:|:--------------------:|:--------------:|
| **Super Admin**    | ✅ (only one)        | ✅ Demote only | ✅                   | ✅              |
| **Admin**          | ❌ Forbidden         | ❌ Forbidden   | ❌ Cannot promote to Admin | ✅ Up to Manager |

### Role Promotion API
```http
PATCH /auth/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json

{ "role": "manager" }
```

Responses:
- `200 OK` — role changed, returns `{ previousRole, newRole, promotedBy }`
- `403 Forbidden` — actor lacks permission to make this change
- `400 Bad Request` — invalid role or self-role-change attempt

---

## Delete Behaviour — Recycle Bin Model

```
Admin deletes user
    → Soft delete: isDeleted: true, deletedBy, deletedAt stored
    → User disappears from all rosters
    → User appears in Super Admin's 🗑️ Recycle Bin tab

Super Admin (in Recycle Bin) sees soft-deleted users:
    → ↩ Restore — undoes the admin's delete, user becomes active again
    → 💀 Hard Delete — permanent, requires typing username to confirm

Super Admin deletes user directly (from main roster):
    → Hard delete immediately — requires typing username to confirm
    → No Recycle Bin step
```

### Guard Rules
| Delete Action               | Guard                                                         |
|-----------------------------|---------------------------------------------------------------|
| Admin soft-deletes SA       | ❌ Blocked — 403                                              |
| Admin soft-deletes Admin    | ❌ Blocked — 403                                              |
| SA hard-deletes themselves  | ❌ Blocked — 400                                              |
| SA hard-delete (any)        | ✅ Requires `{ confirm: "username" }` in body                 |

---

## Super Admin Setup

The Super Admin (`isSuperAdmin: true`) flag is set via a one-time migration script:

```bash
cd backend
node src/scripts/setSuperAdmin.js
```

This script:
1. Connects to MongoDB using `MONGODB_URI` from `.env`
2. Finds Divyansh's account by `googleEmail: divyanshuniyal185@gmail.com`
3. Falls back to `username: divyansh` if Google email is not yet linked
4. Sets `isSuperAdmin: true` and `role: 'admin'` on the matched account
5. Clears any existing `isSuperAdmin` flags (prevents duplicates)
6. Is idempotent — safe to run multiple times

> **⚠️ Important**: The `isSuperAdmin` field cannot be set through any API endpoint. It is protected server-side. Only the migration script or a direct MongoDB Atlas console edit can change it.

---

## Self-Requestable Roles

The public Request Access form only allows the following roles:

| Role                 | Can Self-Request? |
|----------------------|:-----------------:|
| Factory Manager      | ✅                |
| Quality Inspector    | ✅                |
| Dispatch Coordinator | ✅                |
| Manager              | ✅                |
| Admin                | ❌ (Super Admin appoints) |
| Super Admin          | ❌ (migration script only) |

Attempting to POST `role: 'admin'` to `/auth/request-access` returns:
```json
{ "success": false, "error": "The requested role cannot be self-assigned. Contact your Super Admin." }
```

---

## Middleware Reference

| Middleware              | Who Passes                        | Used On                               |
|-------------------------|-----------------------------------|---------------------------------------|
| `protect`               | Any authenticated user            | All protected routes                  |
| `requireAdminOrAbove`   | Admin + Super Admin               | Approve/reject requests, toggle users |
| `requireSuperAdmin`     | Super Admin only                  | Recycle Bin, restore, migration flag  |
| `requireManagerOrAbove` | Manager + Admin + Super Admin     | `GET /auth/users` (read-only allowed) |

---

## Audit Trail Fields (User Document)

| Field          | Type     | Set When                                         |
|----------------|----------|--------------------------------------------------|
| `promotedBy`   | String   | After any role change — stores actor's username  |
| `promotedAt`   | Date     | Timestamp of role change                         |
| `previousRole` | String   | Role before the last change                      |
| `deletedBy`    | String   | After admin soft-delete — stores actor's username|
| `deletedAt`    | Date     | Timestamp of soft-delete                         |
| `deleteNote`   | String   | Optional reason entered at delete time           |
| `isSuperAdmin` | Boolean  | Set by migration script — immutable via API      |
