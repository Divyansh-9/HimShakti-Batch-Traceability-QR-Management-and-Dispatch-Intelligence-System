# Software Requirements Specification (SRS)

## Project: Batch Traceability, QR Management, and Dispatch Intelligence System
**Version**: 1.0.0  
**Date**: 2026-06-11  
**Author**: Documentation Lead  

---

## 1. Introduction

### 1.1. Purpose
This document specifies the software requirements for the **Batch Traceability, QR Management, and Dispatch Intelligence System** (Intern 2 System) designed for HimShakti Food Processing. It serves as the single source of truth for the development, QA, and deployment phases.

### 1.2. Scope
This system manages the digitizing of packaged production batches. It retrieves product data and predictions from Intern 1's system, calculates expiry timelines, generates physical QR label URLs, tracks consumer scan counts, and calls Google Gemini API to compile dispatch safety logs.

### 1.3. Definitions, Acronyms, and Abbreviations
* **FEFO**: First-Expired, First-Out (inventory rotation strategy prioritizing older stock).
* **SKU**: Stock Keeping Unit (identifying code for distinct product models).
* **ML**: Machine Learning.
* **SRS**: Software Requirements Specification.
* **FSSAI**: Food Safety and Standards Authority of India.

---

## 2. Overall System Description

### 2.1. Product Perspective
The application functions as the operations portal for HimShakti's processing facility. It operates in tandem with Intern 1's Shelf Life Prediction application, sharing a single MongoDB Atlas instance.

```
┌────────────────────────────────────────────────────────┐
│               HimShakti Enterprise System              │
├──────────────────────────┬─────────────────────────────┤
│   Intern 1 Application   │     Intern 2 Application    │
│  (Recipe Shelf Life AI)  │ (Traceability & Dispatch)   │
└────────────┬─────────────┴──────────────┬──────────────┘
             │                            │
             └─────────────┬──────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │ Shared MongoDB Atlas  │
               └───────────────────────┘
```

### 2.2. User Classes and Characteristics
1. **Factory Manager**: Highly active user, inputs batch parameters, prints labels, and acts on AI dispatch advice. Needs a simple, clear interface with minimal typing.
2. **Dispatch Operator**: Scanning-oriented user, flags crates as loaded for shipping. Requires mobile-responsive layout.
3. **B2B Buyer & Consumer**: Casual users scanning QR codes. Requires zero sign-in, mobile optimization, fast page loads, and clear data transparency.

### 2.3. Operating Environment
* **Web Client**: Verified on Google Chrome (v110+), Safari (v16+), and mobile browsers (iOS/Android Safari & Chrome).
* **Backend Server**: Node.js environment (v18 or higher) deployed on PaaS (Render, Railway).
* **Database**: MongoDB Atlas Cluster (v6.0+).

---

## 3. Data Requirements

### 3.1. Collection Definitions & Fields

#### `products` Collection (Read-Only reference)
* `_id` (`ObjectId`, Primary Key)
* `productName` (`String`, Required, Unique)
* `sku` (`String`, Required, Unique)
* `category` (`String`, Required, enum: `["snack", "juice", "pickle"]`)
* `unitSize` (`String`, Required)
* `baseShelfLifeDays` (`Number`, Required)
* `predictedShelfLifeDays` (`Number`, Nullable)
* `predictedExpiryTemplate` (`String`, Required)
* `riskLevel` (`String`, Nullable, enum: `["LOW", "MEDIUM", "HIGH"]`)
* `isActive` (`Boolean`, Required)

#### `batches` Collection (Owned by Intern 2)
* `_id` (`ObjectId`, Primary Key)
* `batchCode` (`String`, Required, Unique)
* `productId` (`ObjectId`, Required)
* `productName` (`String`, Required)
* `sku` (`String`, Required)
* `sourceLotCode` (`String`, Required)
* `farmerName` (`String`, Required)
* `village` (`String`, Required)
* `packDate` (`Date`, Required)
* `expiryDate` (`Date`, Required)
* `dataSource` (`String`, Required, enum: `["predicted", "fallback"]`)
* `shelfLifeSource` (`String`, Required, enum: `["predicted", "base", "manual"]`)
* `quantityProduced` (`Number`, Required)
* `unit` (`String`, Required, enum: `["Kg", "Units", "Liters"]`)
* `yieldPercent` (`Number`, Required)
* `status` (`String`, Required, enum: `["READY", "WARNING", "URGENT", "DISPATCHED", "EXPIRED"]`)
* `priorityScore` (`Number`, Required)
* `qrCodeDataUrl` (`String`, Required)
* `qrAbsoluteUrl` (`String`, Required)
* `dispatchDate` (`Date`, Nullable)
* `buyerName` (`String`, Nullable)
* `traceabilityNote` (`String`, Required)
* `createdBy` (`String`, Required)

#### `scanEvents` Collection (Owned by Intern 2)
* `_id` (`ObjectId`, Primary Key)
* `batchId` (`ObjectId`, Required)
* `scannedAt` (`Date`, Required)
* `source` (`String`, Required, enum: `["factory", "buyer", "QA"]`)
* `deviceType` (`String`, Required, enum: `["Mobile", "Tablet", "Desktop", "Unknown"]`)
* `ipHash` (`String`, Required)

---

## 4. Functional Requirements

### 4.1. Batch Provisioning and Expiry Logic
* **FR-1.1**: The system must retrieve active product configurations from the shared `products` collection.
* **FR-1.2**: Upon batch creation, the system must verify if `predictedShelfLifeDays` is available.
  * If available, it computes: `expiryDate = packDate + predictedShelfLifeDays` and sets `dataSource = "predicted"`.
  * If unavailable, it checks for `baseShelfLifeDays`. If present, it computes: `expiryDate = packDate + baseShelfLifeDays` and sets `dataSource = "fallback"`.
  * If both values are missing, it blocks the creation and returns status code `400 Bad Request`.

### 4.2. QR Code Engine
* **FR-2.1**: The backend must auto-generate a unique URL for each batch using the configuration parameter `PUBLIC_BASE_URL`.
* **FR-2.2**: The backend must convert the unique URL into a QR code image returned as a base64 encoded PNG data URL.
* **FR-2.3**: The Manager Portal must provide an instant file download action for the QR image.

### 4.3. FEFO Priority Dashboard
* **FR-3.1**: The dashboard must sort batches using a dynamic priority queue based on proximity to expiry and product risk level.
* **FR-3.2**: The system must dynamically recalculate the batch status on retrieval based on the current system time.
* **FR-3.3**: The system must support manual updates to record batch dispatches, capturing the `buyerName` and `dispatchDate` and freezing the batch status as `DISPATCHED`.

### 4.4. AI Advisory Auditing
* **FR-4.1**: The system must compile active, non-dispatched batches into a JSON structure and request dispatch advice from the Google Gemini API.
* **FR-4.2**: The backend must restrict Gemini calls using a database caching layer. Calls to the live API are allowed only once every 4 hours.
* **FR-4.3**: The frontend must display a "Run AI Audit" button to trigger the API call manually.

### 4.5. Public Traceability Portal
* **FR-5.1**: The public traceability endpoint must be accessible without authentication.
* **FR-5.2**: Scanning the QR code must display the batch history timeline and raw material source details.
* **FR-5.3**: The endpoint must log each scan event asynchronously without storing user IP addresses in plain text.

---

## 5. Non-Functional Requirements

### 5.1. Reliability and Performance
* **NFR-1.1**: The system must resolve the public batch detail page in under 500ms under normal network conditions.
* **NFR-1.2**: Database write transactions for batch creation must be atomic.
* **NFR-1.3**: The system must enforce fallback rules automatically if the ML prediction system goes offline.

### 5.2. Safety and Security
* **NFR-2.1**: Passwords for Manager Portal access must be hashed using a standard hashing function (e.g., bcrypt) before storage.
* **NFR-2.2**: Write API endpoints must require authentication tokens (JWT).
* **NFR-2.3**: Consumer IP addresses recorded during scan events must be hashed using MD5 or SHA-256 before write operations.

### 5.3. Usability
* **NFR-3.1**: The Public Traceability View must be optimized for mobile screens.
* **NFR-3.2**: The Manager Portal must support standard layout responsiveness down to tablet-sized resolutions (768px).

---

## 6. Interface Requirements

### 6.1. User Interfaces
* A private dashboard containing: Batch creation form, searchable data grid, dynamic AI advice widget, and scan analytics.
* A public mobile layout with an origin trace timeline.

### 6.2. Application Programming Interfaces (APIs)
* Standard RESTful backend design returning application JSON data payloads.
* Integration with the Google Gemini API using the official Google Gen AI SDK.

### 6.3. External Services
* **MongoDB Atlas**: Serves as the cloud database engine.
* **Google Gemini API**: Serves as the smart advisory agent.

---

## 7. Security and Privacy Considerations
* **Data Minimization**: The public traceability portal does not collect user names, email addresses, or phone numbers.
* **IP Hashing**: The `ipHash` field in `scanEvents` is generated by hashing the request's client IP with a server salt. This allows unique scan counts per geographic location without storing personally identifiable information (PII).

---

## 8. Error Handling and Validation

### 8.1. API Validation Rules
* If `yieldPercent` is less than 0 or greater than 100, the system must return a validation error.
* If a batch code format does not match `HS-[YYYY]-[MM]-[3-digit-counter]`, the request is rejected.

### 8.2. Upstream Failures
* If the Gemini API returns a rate limit error (e.g., HTTP 429), the backend must fallback to displaying the last cached advisory report and surface a warning: `"AI advisory panel is currently rate-limited; displaying cached report from [timestamp]"` on the frontend.

---

## 9. Acceptance Criteria
1. The Factory Manager can add a new batch, which calculates dates, generates a valid QR code, and shows it on the dashboard.
2. The generated QR code points to a valid public URL that displays correct batch trace timelines.
3. The "Run AI Audit" button triggers the Gemini API, caches the results, and displays advice on the dashboard.
4. If ML shelf-life data is missing from a product, the system falls back to base shelf-life or blocks the request.
5. All automated unit and API integration tests pass successfully.
