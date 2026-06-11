# Planning Report: Batch Traceability, QR Management, and Dispatch Intelligence System

## 1. Project Overview
The **Batch Traceability, QR Management, and Dispatch Intelligence System** (Intern 2 System) is an enterprise-grade web application designed for **HimShakti Food Processing** in Uttarakhand, India. The system addresses a critical operational gap in the processing post-packaging phase: the absence of structured, digital batch records linked to raw material sources (farmers and villages) and dispatch workflows.

By capturing traceability data at the moment of packaging, dynamically calculating batch expiry dates through integration with Intern 1's AI-based predictions, auto-generating secure QR codes for inventory labels, and leveraging Google Gemini AI for advisory dispatch prioritization, this system modernizes HimShakti's supply chain. It transitions the factory from manual, paper-based records to a digital-first traceability model, reducing food waste and ensuring complete transparency from the Himalayan farm to the customer's table.

---

## 2. Business Problem
HimShakti Food Processing specializes in chemical-preservative-free millet snacks, fruit juices, and traditional pickles. The absence of an integrated digital batch management system creates three primary business threats:

1. **Spoilage and Financial Loss**: Without real-time visibility into exact shelf lives and batch production dates, dispatch staff lack a systematic way to apply First-Expired, First-Out (FEFO) logic. This results in older batches sitting in warehouses while newer batches are shipped, leading to product expiration and preventable inventory write-offs.
2. **Traceability and Quality Control Failures**: If a customer reports a quality issue or food-borne illness, HimShakti cannot trace the affected batch back to the supplying farmer or village. This lack of "one-step-back" traceability prevents localized recalls, exposing the brand to legal liabilities and widespread reputational damage.
3. **Information Asymmetry for B2B Buyers**: Modern organic and premium food retailers demand verifiable proof of product origin. Without a self-service way to verify batch provenance, HimShakti cannot charge premium pricing or satisfy strict supply-chain audits.

---

## 3. Stakeholders and User Personas

### Stakeholders
* **Executive Leadership (HimShakti Management)**: Focused on brand equity, regulatory compliance (FSSAI mandates), market expansion, and organic premium preservation.
* **Production Team (Intern 1 App Users)**: Needs a frictionless method to write predicted shelf lives into the shared database without manual data handoffs.
* **Distributors and Retailers (B2B Buyers)**: Require instant, transparent verification of product safety, batch origin, and shelf-life validity.

### User Personas
* **Factory Manager (Primary User)**
  * *Context*: Manages day-to-day factory runs, raw material receiving, packaging, and stock releases in rural Uttarakhand.
  * *Pain Points*: Fragmented supply logs, manually calculating shelf lives, and struggling to coordinate dispatch priorities among multiple distributors.
  * *Goal*: A single, clear interface to record raw supply inputs, print QR labels immediately upon packing, and view an AI-prioritized list of what batches must be shipped next.
* **Dispatch & Warehouse Operator (Secondary User)**
  * *Context*: Handles physical inventory loading and shipping.
  * *Pain Points*: Difficulty reading faded handwritten batch labels; lack of clarity on which crate to pick first.
  * *Goal*: Simple scanning verification and clear dispatch orders to ensure no expired stock leaves the warehouse.

---

## 4. System Scope

### In-Scope
1. **Manager Portal (Authenticated Access)**:
   * Batch creation form linking raw supply (source lot code, farmer, village, quantity produced, yield %) with product templates.
   * Auto-calculation of batch expiry dates based on Intern 1's ML shelf-life predictions in the shared database, with structured fallback handling.
   * Paginated, searchable batch catalog with status filters.
   * Manual dispatch recording (recording dispatch date and buyer name) which dynamically transitions batch state.
   * Explicit "Run AI Audit" workflow that triggers a structured prompt to the Gemini API and caches the analysis.
2. **Traceability Infrastructure**:
   * Dynamic, server-side generation of absolute QR URLs using environment variables.
   * Inline rendering and single-click download of QR code PNGs/SVGs for printing.
3. **Public Traceability Portal (Unauthenticated Access)**:
   * Read-only public web page displaying batch history, farmer/village origin, dates, and static safety recommendations.
   * Background scan telemetry logging (source, device type, timestamp) to the database.

### Out-of-Scope (for Version 1)
* **Real-time GPS Tracking**: Geo-location tracking for scans will rely on basic IP geolocation or will be omitted in v1 for simplicity.
* **Offline Database Sync**: The system assumes stable internet access at the factory. Retrying failed requests using local browser storage queues is deferred to future iterations.
* **Automatic Inventory Refills**: Integration with raw materials purchasing or farmer payment systems.

---

## 5. Assumptions and Constraints

### Assumptions
1. **Shared Database Consistency**: Intern 1's application will successfully write and maintain the `products` schema inside the shared MongoDB Atlas instance.
2. **Stable Connectivity**: The HimShakti factory in Uttarakhand has access to a reliable cellular data link or broadband connection during working hours.
3. **Hardware Availability**: The Factory Manager uses a modern smartphone or tablet and has access to a standard thermal/inkjet label printer.

### Constraints
1. **6-Week Timeline**: The project must be scaffolded, built, tested, and documented within a standard 6-week internship window.
2. **Gemini API Limits**: The Google Gemini API free-tier imposes rate limits (requests per minute/day). The architecture must prevent runaway API charges or rate limit exhaustion.
3. **Database Constraints**: Both systems must coexist within the same free-tier MongoDB Atlas cluster without schema conflicts.

---

## 6. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Upstream ML Data Missing** | High | Medium | Implement the deterministic fallback rule: use `baseShelfLifeDays` and mark the batch's `dataSource` as `"fallback"`. If both shelf lives are missing, block batch creation. |
| **Gemini API Downtime / Rate Limits** | Medium | High | Decouple AI from core database writes. Generate AI dispatch briefs on-demand using a "Run AI Audit" trigger and store the resulting text block in a database cache. |
| **Unreliable QR Resolution** | High | Low | Generate absolute URLs on the backend using a validated environment variable (`PUBLIC_BASE_URL` or `FRONTEND_URL`), ensuring QR codes resolve from any modern camera app. |

---

## 7. Dependency on Intern 1
The Batch Traceability system relies directly on the data output of the Shelf Life Prediction System (Intern 1). The integration boundary is defined at the database level:

```
┌──────────────────────────────────────────────────────────┐
│                 Shared MongoDB Atlas                     │
└────────────┬────────────────────────────────┬────────────┘
             │                                │
  [Writes Product Shelf Life]         [Reads Shelf Life & Risk]
             │                                │
    ┌────────▼────────┐              ┌────────▼────────┐
    │   Intern 1      │              │   Intern 2      │
    │  (Shelf Life)   │              │  (Traceability) │
    └─────────────────┘              └─────────────────┘
```

When Intern 2's application creates a new batch, it queries the shared `products` collection using the `productId`. 
* If `predictedShelfLifeDays` is present, it computes `expiryDate = packDate + predictedShelfLifeDays` and sets `dataSource = "predicted"`.
* If `predictedShelfLifeDays` is missing but `baseShelfLifeDays` exists, it uses the base value and sets `dataSource = "fallback"`.
* It also reads the `riskLevel` field to influence the batch's initial sorting and dispatch priority score.

---

## 8. High-Level Solution & Architecture

### Solution Overview
The solution is a three-tier web application using the MERN stack (MongoDB, Express, React, Node.js). 

1. **Database Layer (MongoDB Atlas)**: Serves as the shared single source of truth.
2. **Backend Application Layer (Node.js/Express)**:
   * Handles authenticated CRUD operations for batches.
   * Generates absolute QR URLs and outputs QR images.
   * Orchestrates prompt payloads sent to the Google Gemini API.
   * Enforces validation constraints.
3. **Frontend Presentation Layer (React + Vite)**:
   * **Manager Dashboard**: Secure dashboard to manage batches, trigger AI audits, and view analytics.
   * **Public Traceability View**: Lightweight, mobile-responsive, read-only landing page for QR scans.

### Technology Stack Justification

| Technology | Selection | Justification |
| :--- | :--- | :--- |
| **Database** | MongoDB Atlas | * Document-oriented structure allows easy storage of denormalized fields (like product details inside batches).<br>* Shared clustering is natively supported, allowing easy integration with Intern 1. |
| **Backend** | Node.js + Express | * Fast, non-blocking I/O ideal for handling API calls and barcode generation.<br>* Large ecosystem of packages (including `qrcode`). |
| **Frontend** | React + Vite | * Component-based architecture allows code reuse between the dashboard and public views.<br>* Vite offers near-instantaneous build and hot reload performance. |
| **AI Engine** | Google Gemini API | * State-of-the-art reasoning capabilities available on a free tier.<br>* Highly suited for turning structured batch records into human-readable text alerts. |
| **QR Library** | `qrcode` (npm) | * Industry-standard package that runs on the backend to output highly compatible PNG data URLs. |

---

## 9. Strategic Architectural Choices

### Why MongoDB is Suitable
MongoDB's schema flexibility is perfect for iterative development inside an internship. In a food traceability workflow, batch records must capture supply snapshots that should never change, even if the parent product configuration is modified later. MongoDB allows us to embed/denormalize snapshot fields (like `productName` or `sku` at the time of packing) directly into the batch document. This guarantees historical record integrity.

### Why QR-Based Traceability is Useful
Barcodes and QR codes are the global standard for logistics tracking. QR codes are chosen over standard 1D barcodes because they can encode full absolute URLs. This means the physical product packaging itself becomes the portal: any smartphone camera scanning the QR code immediately opens the web browser to display the batch details, removing the need for proprietary scanner hardware or custom client apps.

### Why AI is a Secondary Advisory Layer
In supply chain and food safety systems, safety critical decisions must be deterministic.
* Expiry dates, FEFO queues, and status transitions (e.g. `EXPIRED` status) are calculated using hardcoded, verified backend code.
* Google Gemini AI is restricted to providing advisory insights (e.g., suggesting shipping priorities based on logistics bottlenecks or summarizing batch quality profiles). This avoids the risk of AI hallucinations causing incorrect expiry labeling, which would violate food safety guidelines.

---

## 10. Success Criteria

### Quantitative Metrics
* **Scan Resolution Rate**: 100% of generated QR codes must resolve to the correct public batch detail page when scanned by standard Android or iOS cameras.
* **System Build Validity**: `npm run build` succeeds on both backend and frontend without warnings.
* **API Latency**: Average response time for fetching the batch list dashboard must remain under 300ms.
* **AI Cache Hits**: Gemini API is called only when the "Run AI Audit" workflow is triggered; page views must consume cached reports.

### Qualitative Metrics
* **Traceability Transparency**: B2B buyers can easily verify the origin village, supplying farmer, and packaging date of a batch.
* **Operational Flow**: The Factory Manager can successfully create a batch, download the QR, and record a dispatch in under 2 minutes.
* **Advisory Integrity**: AI recommendations correctly flags low-yield batches (<70%) and near-expiry batches (<15 days remaining) without generating false statements.
