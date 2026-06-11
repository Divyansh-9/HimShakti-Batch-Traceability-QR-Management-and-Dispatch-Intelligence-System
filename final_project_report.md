# Final Project Report & System Design: Batch Traceability, QR Management, and Dispatch Intelligence System

## 1. System Architecture and Design Overview
The system utilizes a 3-tier MVC architecture tailored for deployment in cloud environments. It provides separation between:
* **The Shared Persistence Layer (MongoDB Atlas)**: Used by both Intern 1 and Intern 2.
* **The Application Layer (Node.js/Express API)**: Resolves business rules, enforces safety gates, and manages external integrations.
* **The Presentation Layer (React client)**: Serving both the manager dashboard and public QR scan landing pages.

```
                  ┌─────────────────────────────┐
                  │   B2B Buyer/Consumer Phone  │
                  └──────────────┬──────────────┘
                                 │
                            [QR Scan Url]
                                 │
  ┌──────────────────────┐       ▼       ┌──────────────────────┐
  │   Factory Manager    │  ┌─────────┐  │   Public Trace Page  │
  │    (React Client)    │  │ QR Code │  │    (React Client)    │
  └──────────┬───────────┘  └─────────┘  └──────────┬───────────┘
             │                                      │
        [API Requests]                         [API Requests]
             │                                      │
             ▼                                      ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 Node.js / Express REST API                  │
  ├─────────────────────────────────────────────────────────────┤
  │  [Auth Mid]  [QR Generator]  [Gemini Agent]  [Cache Mgr]   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                         [Mongoose Queries]
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 MongoDB Atlas Database (Shared)              │
  ├─────────────────────────────────────────────────────────────┤
  │  collections: [products] , [batches] , [scanEvents]         │
  └─────────────────────────────────────────────────────────────┘
```

---

## 2. Refined MongoDB Schema Design (Mongoose Modeling)

### 2.1. `products` Collection (Shared Schema)
Managed primarily by Intern 1 (ml-predictions), read by Intern 2 (traceability).

```javascript
const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true, unique: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  category: { type: String, required: true, enum: ['snack', 'juice', 'pickle'] },
  unitSize: { type: String, required: true, trim: true }, // e.g., "200g Pouch", "500ml Bottle"
  baseShelfLifeDays: { type: Number, required: true, min: 1 },
  predictedShelfLifeDays: { type: Number, default: null }, // Written by Intern 1
  predictedExpiryTemplate: { type: String, default: "Best Before {days} Days from Packing" },
  riskLevel: { type: String, default: null, enum: ['LOW', 'MEDIUM', 'HIGH', null] }, // From Intern 1 AI
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```
* **Why `sku` is added**: Standardizes product codes for retail integration (e.g., `HS-MIL-SNK-01`).
* **Why `shelfLifeSource` is not in Products**: Shelf life source is batch-specific since one batch might use predicted and another fallback.

### 2.2. `batches` Collection (Owned by Intern 2)
Tracks physical batches produced at the HimShakti factory.

```javascript
const BatchSchema = new mongoose.Schema({
  batchCode: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g., HS-2026-06-001
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true }, // Denormalized snapshot
  sku: { type: String, required: true }, // Denormalized snapshot
  sourceLotCode: { type: String, required: true, uppercase: true, trim: true }, // Supplier farm code
  farmerName: { type: String, required: true, trim: true },
  village: { type: String, required: true, trim: true },
  packDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  dataSource: { type: String, required: true, enum: ['predicted', 'fallback'] },
  shelfLifeSource: { type: String, required: true, enum: ['predicted', 'base', 'manual'] },
  quantityProduced: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true, enum: ['Kg', 'Units', 'Liters'] },
  yieldPercent: { type: Number, required: true, min: 0, max: 100 },
  status: { type: String, required: true, enum: ['READY', 'WARNING', 'URGENT', 'DISPATCHED', 'EXPIRED'], default: 'READY' },
  priorityScore: { type: Number, default: 0 },
  qrCodeDataUrl: { type: String, required: true }, // Base64 data URL of the generated QR
  qrAbsoluteUrl: { type: String, required: true }, // Absolute target URL encoded in QR
  dispatchDate: { type: Date, default: null },
  buyerName: { type: String, default: null, trim: true },
  traceabilityNote: { type: String, default: "" },
  createdBy: { type: String, required: true } // Email or name of Manager who logged it
}, { timestamps: true });
```

### 2.3. `scanEvents` Collection (Owned by Intern 2)
Logs read-only analytical logs when public QR URLs are accessed.

```javascript
const ScanEventSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  scannedAt: { type: Date, default: Date.now, required: true },
  source: { type: String, required: true, enum: ['factory', 'buyer', 'QA'], default: 'buyer' },
  deviceType: { type: String, required: true, enum: ['Mobile', 'Tablet', 'Desktop', 'Unknown'] },
  ipHash: { type: String, required: true } // MD5/SHA256 hash of IP to prevent tracking personal data
});
```

---

## 3. Database Optimizations: Indexes & Denormalization

### 3.1. Indexing Strategy
To ensure dashboard scaling, we define the following indexes:
1. **`batches.batchCode` (Unique Index)**: Fast index lookup for single batch fetches and validations.
2. **`batches.productId` (Standard Index)**: Accelerates aggregations (e.g., retrieving all batches for a specific product type).
3. **`batches.expiryDate` + `batches.status` (Compound Index)**: Used by the FEFO algorithm. The query filters for active statuses (`READY`, `WARNING`, `URGENT`) and sorts ascending by `expiryDate`.
4. **`scanEvents.batchId` (Standard Index)**: Speeds up calculation of scan counts for dashboard analytics.

### 3.2. Denormalization Strategy
* **What is denormalized?**: `productName` and `sku` are copied from the `products` collection directly into the `batches` collection at the moment of creation.
* **Trade-off Analysis**:
  * *Pros*: Avoids expensive `$lookup` (JOIN) operations in MongoDB when listing 100+ batches. Dashboard lists load instantly with a single query.
  * *Cons*: If a product name is modified in `products`, the historical batch records will still show the old name.
  * *Justification*: In food safety auditing, historical batch records must represent the exact labeling printed on the package at the time of manufacturing. If a product's marketing name changes, the historical batch must not automatically update, as it would cause audit discrepancy.

---

## 4. API Endpoints Design

### 4.1. Authentication
* `POST /api/v1/auth/login` (Light validation returning a JWT).

### 4.2. Product Catalog (Read-Only access for Intern 2)
* `GET /api/v1/products` (Populates selection dropdowns).

### 4.3. Batch Management (Factory Manager Portal)
* `GET /api/v1/batches` (Paginated list: `?page=1&limit=20&status=READY&search=HS-2026`).
* `POST /api/v1/batches` (Creates batch, computes dates, generates QR, returns batch object).
* `GET /api/v1/batches/:id` (Fetches detail record).
* `PATCH /api/v1/batches/:id/dispatch` (Transition to `DISPATCHED`).
  * Request Body: `{ buyerName: "Himalayan Co-op Dehradun", dispatchDate: "2026-06-11" }`.

### 4.4. Public Traceability (No Auth)
* `GET /api/v1/public/batch/:id` (Returns batch information + logs a record to `scanEvents` asynchronously).

### 4.5. AI Dispatch Intelligence
* `POST /api/v1/ai/audit` (Triggers Gemini analysis, updates the AI cache).
* `GET /api/v1/ai/summary` (Reads current cached advisory reports).

---

## 5. UI/UX Flow & Screen List

The frontend React application is organized into two separate router boundaries:

### 5.1. Manager Portal (Authenticated)
1. **Dashboard Overview Screen**:
   * Metrics panel (Total Active, Urgent, Dispatched, Expired).
   * **Advisory Briefing Panel**: Displays the cached Gemini AI analysis, showing urgent dispatches and quality flags.
   * "Run AI Audit" button with progress loader.
   * Batch table with searching, filtering, and pagination.
2. **Add New Batch Screen**:
   * Interactive wizard form.
   * Displays warning indicators if a product is selected that relies on the "base shelf life fallback" or has a missing risk profile.
3. **Scan Analytics Screen**:
   * Graph of scans over time.
   * Top-scanned batches list to track market interest.

### 5.2. Public Traceability Page (No Auth)
* A high-end, clean consumer web page.
* Features a dynamic timeline showing: **Harvest & Source** (Farmer, Village) → **Packaged at HimShakti** (Pack Date) → **Safe Consumption Window** (Expiry Date) → **Current Status**.
* Includes a "Himalayan Promise" trust badge explaining the preservative-free processing of the product.

---

## 6. Batch Lifecycle, FEFO Logic, and Expiry calculations

### 6.1. Expiry Calculation Flow
During batch creation, the backend API enforces this logical block:
```
                    [Create Batch Requested]
                               │
                [Query Product from Database]
                               │
            ┌──────────────────┴──────────────────┐
     (ML Data Exists?)                    (ML Data Missing?)
            │                                     │
┌───────────▼───────────┐             ┌───────────▼───────────┐
│ expiry = packDate +   │             │ baseDays Exists?      │
│ predictedDays         │             └───────────┬───────────┘
│ dataSource=predicted  │                         │
│ shelfLifeSource=pred  │             ┌───────────┴───────────┐
└───────────────────────┘             │                       │
                                   [YES]                    [NO]
                                      │                       │
                          ┌───────────▼───────────┐   ┌───────▼──────┐
                          │ expiry = packDate +   │   │ Return 400   │
                          │ baseDays              │   │ Error:       │
                          │ dataSource=fallback   │   │ Validation   │
                          │ shelfLifeSource=base  │   │ Blocked      │
                          └───────────────────────┘   └──────────────┘
```

### 6.2. Status Lifecycle States
The system computes batch statuses based on the current date, using the following rules:
* **READY**: `currentDate < expiryDate` AND remaining days > 15 AND `status !== 'DISPATCHED'`.
* **WARNING**: Remaining days between 8 and 15 days.
* **URGENT**: Remaining days between 1 and 7 days.
* **EXPIRED**: `currentDate >= expiryDate` AND `status !== 'DISPATCHED'`.
* **DISPATCHED**: Manually marked by the Factory Manager. Once a batch is dispatched, its status is permanently frozen as `DISPATCHED` to preserve historical logs.

### 6.3. FEFO & Priority Logic
The backend determines the `priorityScore` using a normalized score (0 to 100):
$$\text{Days Remaining} = \frac{\text{ExpiryDate} - \text{CurrentDate}}{86400000}$$
If a batch is `EXPIRED` or `DISPATCHED`, its priority is set to 0. Otherwise, the formula is:
$$\text{Priority Score} = 100 - \min\left(100, \text{Days Remaining} \times 2\right) + \text{Risk Penalty}$$
*Where Risk Penalty = 20 if Product Risk is `HIGH`, 10 if `MEDIUM`, and 0 if `LOW`.*
This score ensures high-risk, near-expiry products surface at the top of the dashboard.

---

## 7. Barcode / QR Code Generation Flow
1. **Database Save**: When the batch is saved, MongoDB assigns it a unique ObjectId (e.g. `60d5ec40f19e`).
2. **Absolute Link Formulation**: The backend reads `process.env.PUBLIC_BASE_URL` (e.g., `https://trace.himshakti.com`) and constructs the URL: `https://trace.himshakti.com/trace/60d5ec40f19e`.
3. **Image Generation**: The backend passes the URL to `qrcode.toDataURL()` to generate a base64 encoded PNG image block.
4. **Storage**: The base64 block is stored in `qrCodeDataUrl` in the batch document, allowing the React app to display the image inline without making additional file requests.

---

## 8. AI Dispatch Intelligence and Caching

### 8.1. AI Prompt Payload Design
When the Factory Manager clicks "Run AI Audit", the backend compiles active batches into a structured JSON payload:
```json
{
  "auditDate": "2026-06-11",
  "activeBatches": [
    {
      "batchCode": "HS-2026-06-001",
      "productName": "Traditional Mango Pickle",
      "daysToExpiry": 5,
      "riskLevel": "HIGH",
      "yieldPercent": 68.5
    }
  ]
}
```
The prompt strictly enforces a JSON output structure:
```
You are an AI Supply Chain advisor for HimShakti. Analyze the input JSON active batches and return a JSON object containing:
1. "dispatchQueue": An array of batchCodes ordered by dispatch urgency.
2. "criticalAlerts": An array of warnings for batches with < 10 days remaining or yield < 70%.
3. "summaryAdvisory": A human-readable text recommendation for the weekly schedule.
Respond ONLY with this JSON block.
```

### 8.2. Caching Strategy
To remain within Gemini API free-tier limitations:
* **The Cache Collection**: We introduce a collection `ai_audits` containing the fields `lastAuditDate`, `reportData` (the JSON response), and `triggeredBy`.
* **Execution Boundary**: When the manager visits the dashboard, the system reads the last cached document. The dashboard only allows a manual refresh if the last cache update was more than **4 hours** ago, preventing rapid clicks from overloading the API.
