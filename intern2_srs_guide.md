# Software Requirements Specification (SRS)
## HimShakti AI Product Description Generator Backend — Intern 2

**Version:** 1.0  
**Prepared For:** HimShakti AI-Assisted Full Stack Project  
**Prepared By:** Intern 2 Backend Team  
**Date:** 2026-06-25

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the backend requirements, system responsibilities, interfaces, data model, APIs, validation rules, AI integration requirements, testing scope, and deployment expectations for **Intern 2** working on the **HimShakti AI Product Description Generator** module.

This document is written in an organization-style, production-oriented format so that Intern 2 can directly start implementation without ambiguity.

### 1.2 Scope
Intern 2 is responsible for building the backend service for the **AI-assisted product description generation workflow**. This backend will:

- Read product information from the shared `products` collection created and owned by Intern 1.
- Generate AI-based e-commerce product descriptions using a Large Language Model (LLM) API.
- Store generated descriptions in Intern 2’s own `descriptions` collection.
- Expose REST APIs for description generation, retrieval, editing, and copy-tracking.
- Support frontend integration for a React/Vite-based admin interface.

This backend is not responsible for public product catalog CRUD, cart flows, or product seeding. Those are outside Intern 2’s ownership.

### 1.3 Document Objectives
This document aims to:

- Clearly define what Intern 2 must build.
- Separate shared ownership from independent ownership.
- Explain whether existing schemas should be reused or newly created.
- Define backend APIs, database schema, validation rules, and AI integration.
- Provide an implementation-ready reference for development, testing, and deployment.

### 1.4 Intended Audience
This document is intended for:

- Intern 2 (primary backend implementer)
- Project mentor / reviewer
- Intern 1 (for integration alignment)
- Frontend developer integrating with Intern 2’s APIs
- QA/testing reviewers

## 2. Project Context

### 2.1 Business Context
HimShakti wants to list products on Amazon and similar e-commerce platforms but lacks internal capacity to write consistent, keyword-rich, high-quality product descriptions.

The overall project introduces a lightweight AI feature into a full-stack application, where the primary engineering focus remains on frontend, backend, database integration, and deployment readiness.

### 2.2 Intern 2 Responsibility Summary
Intern 2 owns the backend for the AI description generator workflow and acts as a **consumer** of Intern 1’s product data.

Intern 2 must:

- Connect to the shared MongoDB Atlas database.
- Reuse the `products` collection in read-only mode.
- Create and own a new `descriptions` collection.
- Build REST APIs for the description generation lifecycle.
- Integrate the LLM provider (Gemini API or equivalent).
- Ensure secure, validated, and testable backend behavior.

## 3. Ownership and System Boundary

### 3.1 Shared Database Strategy
Intern 2 should **not create a separate MongoDB database** if the team architecture is based on a shared Atlas database.

Recommended approach:

- **Shared database name:** `himshakti`
- **Intern 1-owned collection:** `products`
- **Intern 2-owned collection:** `descriptions`

### 3.2 Collection Ownership Matrix

| Collection | Owner | Intern 2 Access | Notes |
|---|---|---|---|
| `products` | Intern 1 | Read-only | Reuse schema contract exactly; do not mutate |
| `analyses` | Intern 1 (if exists) | No access unless explicitly agreed | Out of scope |
| `descriptions` | Intern 2 | Full read/write | New collection created by Intern 2 |

### 3.3 Schema Reuse Decision
Intern 2 must **reuse** the schema contract of Intern 1’s `products` collection for reading data.

Intern 2 must **create a new schema** for the `descriptions` collection.

This means:

- Intern 2 creates a local Mongoose model for `products`, but uses it only for read operations.
- Intern 2 designs and owns the `descriptions` schema fully.
- Intern 2 does not duplicate product data into a separate product collection.
- Intern 2 stores a **snapshot** of relevant product fields inside each generated description record for long-term consistency and auditability.

## 4. Overall Description

### 4.1 Product Perspective
The Intern 2 backend is a modular backend service within the broader HimShakti full-stack system.

It sits between:

- The admin/frontend interface used to generate product descriptions.
- The shared database holding products.
- The external LLM service used to generate descriptions.

### 4.2 High-Level Workflow

1. Frontend requests available products.
2. Backend reads product list from shared `products` collection.
3. Admin selects a product and submits generation inputs.
4. Backend validates the request.
5. Backend fetches the selected product.
6. Backend builds a structured prompt.
7. Backend sends the prompt to the LLM provider.
8. Backend parses and validates the LLM response.
9. Backend stores the generated output in `descriptions`.
10. Frontend displays the output for editing/copying.
11. Backend stores edits or copy usage events when requested.

### 4.3 Design Goals

- Minimize coupling with Intern 1’s implementation.
- Keep AI integration meaningful but not system-critical to unrelated flows.
- Maintain auditability of generated outputs.
- Make APIs stable and integration-friendly.
- Protect secrets and external API usage.

## 5. Technology Requirements

### 5.1 Required Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Validation:** express-validator
- **Security:** helmet, cors, rate limiting
- **LLM SDK:** `@google/generative-ai` (Gemini) or approved alternative
- **Environment Config:** dotenv
- **Development Runner:** nodemon
- **API Testing:** Postman / Thunder Client

### 5.2 Port and Environment Requirements

- Intern 1 backend may run on port `5000`
- Intern 2 backend should run on port `5001`
- Frontend dev server may run on `5173`

Required environment variables:

- `MONGODB_URI`
- `GEMINI_API_KEY`
- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`

## 6. Functional Requirements

### 6.1 Product Read APIs
The system shall provide APIs for reading products from the shared `products` collection.

#### FR-1: Get All Active Products
- Endpoint shall return all active products required by the frontend dropdown.
- Optional filtering by category may be supported.
- Products must be sorted in a predictable way (e.g., alphabetically by name).

#### FR-2: Get Product by ID
- Endpoint shall return a single product by MongoDB ObjectId.
- Invalid IDs shall return `400 Bad Request`.
- Missing products shall return `404 Not Found`.

### 6.2 Description Generation APIs

#### FR-3: Generate Product Description
The system shall expose an endpoint to generate an AI-assisted product description.

Input shall include:
- `productId`
- `keyIngredients[]`
- `weight`
- `featureList[]` (optional)
- `tone`
- `targetPlatform` (optional)

Behavior:
- Validate all fields before LLM invocation.
- Fetch product from `products` collection.
- Build prompt from product + user input.
- Call LLM provider.
- Parse provider output.
- Save generated content in `descriptions` collection.
- Return structured response to frontend.

#### FR-4: Description History
The system shall provide an endpoint to retrieve past generated descriptions for a product.

Supported query parameters:
- `product`
- `page`
- `limit`
- `tone` (optional)

#### FR-5: Edit Description
The system shall allow the frontend to save a manually edited version of a generated description.

#### FR-6: Mark as Copied
The system shall allow the frontend to record whether a generated or edited description was copied/used.

## 7. Non-Functional Requirements

### 7.1 Security
- The system shall never expose secret keys in source control.
- `.env` must not be committed.
- Rate limiting shall be applied to AI generation endpoints.
- Request payload size should be bounded.
- CORS must be restricted to approved frontend origins.

### 7.2 Reliability
- Backend should fail fast on invalid inputs.
- Backend should validate product existence before calling LLM.
- LLM timeouts must be handled gracefully.
- Parse failures from AI output must return controlled error responses.

### 7.3 Maintainability
- Codebase shall be layered into config, models, controllers, routes, middleware, services, utils, validators.
- Product access logic and AI logic must remain separated.
- Prompt construction must be isolated in a utility/module.

### 7.4 Performance
- Product list APIs should respond quickly for small datasets.
- AI endpoint latency may be longer but should have explicit timeout handling.
- Suggested timeout window for external AI call: 20–30 seconds.

### 7.5 Auditability
- Every generated description record must store enough context to understand what was generated and why.
- Product snapshot, tone, target platform, model version, and timestamps should be retained.

## 8. Data Requirements

### 8.1 Product Model (Read-Only Mirror)
Intern 2 shall define a read-only Mongoose model aligned to Intern 1’s schema contract.

Expected product fields may include:

| Field | Type | Notes |
|---|---|---|
| `productName` | String | Required |
| `sku` | String | Required, unique |
| `category` | String | Enum/category value |
| `unitSize` | String | Optional display/useful metadata |
| `baseShelfLifeDays` | Number | Optional |
| `predictedShelfLifeDays` | Number | Optional |
| `predictedExpiryTemplate` | String | Optional |
| `riskLevel` | String | Optional |
| `isActive` | Boolean | Used for filtering |

### 8.2 Description Model (New Schema Owned by Intern 2)
The `descriptions` collection shall contain:

| Field | Type | Required | Description |
|---|---|---|---|
| `productId` | ObjectId | Yes | Reference to product |
| `productSnapshot.productName` | String | Yes | Snapshot at generation time |
| `productSnapshot.sku` | String | Yes | Snapshot at generation time |
| `productSnapshot.category` | String | Yes | Snapshot at generation time |
| `productSnapshot.unitSize` | String | No | Optional snapshot |
| `inputData.keyIngredients` | [String] | Yes | User-entered ingredients |
| `inputData.weight` | String | Yes | e.g. 500g |
| `inputData.featureList` | [String] | No | User-entered features |
| `inputData.tone` | Enum | Yes | premium / traditional / health-focused |
| `generatedDescription` | String | Yes | Raw generated content |
| `editedDescription` | String | No | Manual edit saved by user |
| `finalDescription` | String | No | Final copied/used version |
| `isCopied` | Boolean | No | Usage tracking |
| `targetPlatform` | Enum/String | No | amazon / flipkart / meesho / website / other |
| `modelVersion` | String | No | LLM model used |
| `createdAt` | Date | Auto | Generation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

### 8.3 Recommended Indexes

- Index on `productId`
- Compound index on `productId + createdAt`
- Optional index on `inputData.tone`

## 9. API Specification

### 9.1 Product APIs

#### GET `/api/v1/products`
**Purpose:** Return all active products for dropdown selection.

**Response:**
- `200 OK`
- Payload contains `success`, `count`, and `data[]`

#### GET `/api/v1/products/:id`
**Purpose:** Return a single product.

**Responses:**
- `200 OK`
- `400 Bad Request` if invalid Mongo ID
- `404 Not Found` if missing

### 9.2 Description APIs

#### POST `/api/v1/descriptions/generate`
**Purpose:** Generate and store a new AI description.

**Sample Request Body:**
```json
{
  "productId": "<mongo-object-id>",
  "keyIngredients": ["Raw Mango", "Mustard Oil", "Turmeric"],
  "weight": "500g",
  "featureList": ["No artificial preservatives", "Handcrafted in small batches"],
  "tone": "premium",
  "targetPlatform": "amazon"
}
```

**Responses:**
- `201 Created` on success
- `400 Bad Request` for validation errors
- `404 Not Found` if product does not exist
- `429 Too Many Requests` if rate limited
- `500 Internal Server Error` for controlled provider/system failures

#### GET `/api/v1/descriptions/history`
**Purpose:** Get past generated descriptions by product.

**Query Params:**
- `product`
- `page`
- `limit`
- `tone` (optional)

#### PUT `/api/v1/descriptions/:id/edit`
**Purpose:** Save user-edited description text.

#### PUT `/api/v1/descriptions/:id/copy`
**Purpose:** Mark description as copied and optionally store final copied version.

## 10. Validation Rules

### 10.1 Request Validation
Intern 2 shall validate:

- `productId` must be a valid MongoDB ObjectId
- `keyIngredients` must be an array with 1–10 values
- each ingredient must be a non-empty string
- `weight` must be non-empty and bounded in length
- `featureList`, if provided, must be an array of strings
- `tone` must be one of:
  - `premium`
  - `traditional`
  - `health-focused`
- `targetPlatform`, if provided, must be from an approved set

### 10.2 Edit Validation
- edited description must not be empty
- edited description should have a minimum and maximum length

## 11. AI Integration Requirements

### 11.1 AI Integration Goal
The AI feature must remain a **limited enhancement** to the full-stack system, not the core dependency for unrelated product browsing or admin management.

### 11.2 Prompt Construction Rules
Prompt generation logic shall:

- combine product information with user inputs
- inject tone-specific writing instructions
- constrain output format
- prohibit hallucinated ingredients/claims where possible
- request structured JSON output

### 11.3 Supported Tones
The first release shall support:

- `premium`
- `traditional`
- `health-focused`

### 11.4 LLM Response Handling
The backend shall:

- call the provider SDK/API with a generated prompt
- enforce timeout protection
- parse output safely
- reject malformed/non-parseable responses
- save only validated result data

### 11.5 Recommended Structured Output
The AI response should ideally include:

- `title`
- `description`
- `bullet_points`
- `search_keywords`
- `word_count`

## 12. Error Handling Requirements

The backend shall provide controlled error responses for:

- validation failures
- invalid IDs
- product not found
- database connectivity issues
- LLM timeout
- malformed LLM responses
- duplicate key issues (if any unique fields are introduced)
- unknown internal errors

All error responses should use a consistent JSON structure.

## 13. Security and Secret Management

### 13.1 Required Practices
- `.env` must be ignored in Git
- `.env.example` shall be committed with placeholders only
- Atlas URI must be shared privately
- Gemini key must be owned individually by Intern 2
- API key must never appear in frontend code

### 13.2 CORS Requirements
Allow only:
- local dev frontend URL(s)
- approved deployed frontend URL(s)

### 13.3 Rate Limiting
Apply rate limiting to generation endpoints to reduce cost/quota abuse.

Recommended initial rule:
- 15 requests per IP per 15 minutes

## 14. Deployment Requirements

### 14.1 Local Development
- Backend runs on `localhost:5001`
- Frontend proxy points `/api` to `http://localhost:5001`
- Shared MongoDB Atlas database is used during development

### 14.2 Production Readiness
For deployment, Intern 2 should prepare:

- environment variable setup
- CORS updates for deployed frontend
- production-safe logging
- robust health endpoint
- external provider timeout handling

### 14.3 Health Endpoint
A `/health` endpoint should return:
- service status
- timestamp
- database connection state
- service identifier

## 15. Recommended Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── products.controller.js
│   │   └── descriptions.controller.js
│   ├── middleware/
│   │   ├── cors.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── Product.model.js
│   │   └── Description.model.js
│   ├── routes/
│   │   ├── products.routes.js
│   │   └── descriptions.routes.js
│   ├── services/
│   │   └── geminiService.js
│   ├── utils/
│   │   └── promptBuilder.js
│   └── validators/
│       └── description.validator.js
├── tests/
├── server.js
├── package.json
├── .env
├── .env.example
└── .gitignore
```

## 16. Implementation Plan for Intern 2

### Phase 1 — Confirm Integration Contract
1. Obtain MongoDB Atlas URI from Intern 1 privately.
2. Confirm `products` collection name and schema fields.
3. Confirm shared database name.
4. Confirm development ports.

### Phase 2 — Set Up Backend Project
1. Create backend folder.
2. Initialize npm.
3. Install dependencies.
4. Create folder structure.
5. Add `.gitignore`, `.env`, `.env.example`.

### Phase 3 — Database and Models
1. Configure MongoDB connection.
2. Create read-only `Product.model.js`.
3. Create `Description.model.js` with indexes.

### Phase 4 — API Layer
1. Create validators.
2. Create controllers.
3. Create routes.
4. Add middleware.
5. Add health endpoint.

### Phase 5 — AI Layer
1. Create prompt builder.
2. Integrate Gemini SDK.
3. Add timeout handling.
4. Parse and validate output.

### Phase 6 — Manual Testing
1. Test `/health`
2. Test `/products`
3. Test `/products/:id`
4. Test `/descriptions/generate`
5. Test `/descriptions/history`
6. Test `/descriptions/:id/edit`
7. Test `/descriptions/:id/copy`

### Phase 7 — Frontend Integration
1. Configure Vite proxy.
2. Load products in dropdown.
3. Submit generation request.
4. Render generated output.
5. Save edits.
6. Record copy event.

## 17. Acceptance Criteria

Intern 2’s work shall be considered complete when:

- backend connects successfully to shared MongoDB Atlas database
- product list can be read from shared `products` collection
- Intern 2’s `descriptions` collection is created and populated correctly
- all required REST endpoints are implemented and tested
- AI generation works for all supported tones
- generated records store product snapshot and input data
- edited and copied states can be saved successfully
- environment variables and secrets are handled correctly
- frontend can integrate with the backend without contract ambiguity

## 18. Out of Scope
The following are out of scope for Intern 2:

- product CRUD ownership
- product seeding
- catalog storefront implementation
- checkout workflow
- public user authentication flows unless separately assigned
- changing Intern 1’s schema without explicit agreement

## 19. Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Intern 1 changes product schema unexpectedly | Integration breaks | Freeze schema contract or communicate changes in advance |
| LLM returns malformed output | API failure | Use strict prompt format + JSON parsing guard |
| API quota/rate issues | Generation failures | Add rate limiter and retry messaging |
| Shared DB misuse | Data corruption | Enforce read-only discipline on `products` |
| Secret leakage | Security issue | Use `.env`, `.gitignore`, private sharing only |

## 20. Final Guidance for Intern 2

### 20.1 Database Decision Summary
- Do **not** create a separate database if the architecture is shared.
- Do **reuse** Intern 1’s `products` schema as a read-only model.
- Do **create** a new `descriptions` schema and collection.

### 20.2 What Intern 2 Is Actually Doing
Intern 2 is **fetching product data from the shared database**, using that data to construct a prompt, calling an LLM API, and then **storing the generated outputs in Intern 2’s own MongoDB collection**.

### 20.3 First Development Order
Start in this exact order:

1. Confirm Atlas URI and collection names
2. Create Node/Express backend project
3. Set up `.env`
4. Connect MongoDB
5. Build models
6. Build routes/controllers
7. Integrate Gemini
8. Test with Postman
9. Connect frontend

---

**End of SRS**
