# 🌿 HimShakti Traceability System — User Guide

> **Live App:** https://himshakti2026-bb904.web.app  
> **Backend API:** https://him-shakti-batch-traceability-qr-ma.vercel.app

---

## 🚀 Option A — Login with Sample Credentials (Instant Access)

Use this to explore the dashboard immediately without waiting for admin approval.

1. Go to → **https://himshakti2026-bb904.web.app/login**
2. Click the **"Sign In"** tab
3. Enter the credentials:
   - **Username:**
   - **Password:** 
4. Click the **"Sign in to Dashboard"** button
5. You will land on the **Overview Dashboard** with full Manager-level access

---

## 📋 Option B — Request Access (New User Onboarding Flow)

This is the full self-service onboarding procedure for new staff members who do not have credentials yet.

### Step 1 — Submit an Access Request

1. Go to → **https://himshakti2026-bb904.web.app/login**
2. Click the **"Request Access"** tab at the top of the login card  
   *(or scroll down and click the **"Request Access →"** link at the bottom)*
3. Fill in the request form:
   - **Full Name** — your real name
   - **Email Address** — where the invite link will be sent
   - **Desired Role** — choose one:
     - `Factory Manager` — batch creation & FEFO access
     - `QA Inspector` — read-only batch view + FEFO
     - `Dispatch Coordinator` — batch dispatch + FEFO
     - `Manager` — all tabs except Admin panel
4. Click **Submit**
5. You will see a confirmation message:  
   *"Your access request has been submitted and is pending admin approval."*

---

### Step 2 — Admin Reviews and Approves the Request

*(Admin performs these steps)*

1. Admin logs in at **https://himshakti2026-bb904.web.app/login**
   - Username | Password
2. Goes to the **Dashboard**
3. Clicks the **🛡️ Admin Panel** tab in the left sidebar
4. Scrolls to the **"Access Requests"** section
5. Clicks the **"Pending"** tab — a live 🔴 pulse dot appears when requests are waiting
6. Finds the submitted request and clicks **Approve**
7. The system auto-generates a unique **invite link** (valid for 72 hours)
8. Admin clicks **Copy Link** and shares it with the new user via email or message

> The Admin can also **Reject** a request with an optional written rejection note.

---

### Step 3 — New User Sets Up Their Account

1. The new user receives the invite link from the Admin
2. They open the link in a browser (link expires in **72 hours**)
3. They are taken to the **Account Setup page**
4. They set their:
   - **Username** (lowercase, unique)
   - **Password**
5. Account is created — they can now log in normally via the **Sign In** tab

---

## 🗂️ What You Can Do After Login

### Manager Role (credentials above)

| Tab | Feature | Access |
|---|---|---|
| 🏠 **Overview** | KPI cards, batch status breakdown, clickable filter pills | ✅ Full |
| 📦 **Batches** | Search, filter, sort, create batch, download QR, mark dispatched | ✅ Full |
| 🚚 **FEFO Queue** | Dispatch priority order, urgency bars, rank badges | ✅ Full |
| 📲 **QR Code Centre** | View QR cards, copy trace links, download PNG, print all | ✅ Full |
| 🤖 **AI Audit** | Gemini 2.5 Flash analysis on all batches (4-hour cache) | ✅ Full |
| 🛡️ **Admin Panel** | User management, access requests | ❌ No access |

---

## 🔒 Role Permissions Summary

| Role | Overview | Batches | FEFO | QR | AI Audit | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `factory-manager` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `quality-inspector` | ✅ | 👁️ Read only | ✅ | ✅ | ❌ | ❌ |
| `dispatch-coordinator` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🤖 Using the AI Audit Feature

1. Log in as **Manager** or **Admin**
2. Click the **🤖 AI Audit** tab in the dashboard sidebar
3. Click **"Run Audit"** button
4. Gemini 2.5 Flash analyses all active batches for:
   - Expiry risk (urgent / warning / ready)
   - FEFO compliance issues
   - Dispatch priority recommendations
5. Results are displayed as structured glass cards
6. Results are **cached for 4 hours** — click **Refresh** to force a new analysis

---

## 📲 Using the QR Code Feature

1. Log in to the dashboard
2. Click the **📲 QR Code Centre** tab
3. Each batch has its own QR code card showing:
   - Product name and batch code
   - Urgency status (colour-coded border)
   - Scan count badge
4. **Hover** over a card to reveal action buttons:
   - 🔗 **Copy trace link** — shareable public URL
   - 👁️ **View trace page** — opens consumer-facing trace page
   - ⬇️ **Download PNG** — saves QR code image
5. Click **"Print Sheet"** to print all QR codes on one page

---

## 🚚 Using the FEFO Dispatch Queue

1. Click the **🚚 FEFO Queue** tab
2. Batches are sorted by **priority score** (highest = dispatch first)
3. Colour coding:
   - 🔴 **URGENT** — expiry ≤ 7 days (dispatch immediately)
   - 🟡 **WARNING** — expiry ≤ 30 days (dispatch soon)
   - 🟢 **READY** — expiry > 30 days (normal queue)
4. Use filter tabs (All / Urgent / Warning / Ready) to narrow the view
5. #1 rank shown with an orange badge

---

## 🌐 Key URLs

| | URL |
|---|---|
| **Live Frontend** | https://himshakti2026-bb904.web.app |
| **Login Page** | https://himshakti2026-bb904.web.app/login |
| **Backend API** | https://him-shakti-batch-traceability-qr-ma.vercel.app |
| **API Health Check** | https://him-shakti-batch-traceability-qr-ma.vercel.app/health |
| **GitHub Repository** | https://github.com/Divyansh-9/HimShakti-Batch-Traceability-QR-Management-and-Dispatch-Intelligence-System |

---

*HimShakti Food Processing — Batch Traceability & Dispatch Intelligence · Built by Divyansh · 2026*
