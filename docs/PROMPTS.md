# 🤖 PROMPTS.md — AI Prompt Engineering Log

**Feature:** AI Dispatch Audit (`GET /api/ai/audit`)  
**Models Used:** Google Gemini 2.5 Flash (primary) · NVIDIA LLaMA 3.1 70B Instruct (fallback)  
**File:** `backend/src/services/aiService.js`

---

## Overview

The **AI Audit** feature analyses all active warehouse batches (status: READY, WARNING, URGENT) and produces a structured advisory report covering urgent dispatch actions, quality risks, supply chain vulnerabilities, and a plain-English summary for the factory manager.

Getting a reliable, parseable response from a generative model required careful prompt engineering. Three distinct prompt strategies were tested before arriving at the final production prompt.

---

## System Role Used

All three variations used the same **role injection** at the start of the prompt:

```
You are a supply chain advisor for HimShakti Food Processing,
an organic food company in Uttarakhand, India.
```

**Why this role?**  
Without a specific role the model gave generic warehouse advice that ignored the context (Himalayan produce, small-batch organic processing, farmer traceability). Framing it as a "supply chain advisor" for a specific named company made responses more grounded, concise, and contextually relevant.

---

## Sample Input (used across all 3 variations)

The following 4-batch JSON was the test input during development:

```json
[
  {
    "batchCode": "HS-2026-06-020",
    "productName": "Apricot & Berry Himalayan Jam",
    "status": "URGENT",
    "daysUntilExpiry": 0,
    "quantity": 120,
    "unit": "jars",
    "yieldPercent": 82,
    "farmerName": "Ramesh",
    "village": "Munsiyari",
    "dataSource": "live"
  },
  {
    "batchCode": "HS-2026-06-017",
    "productName": "Wild Berry Juice Concentrate",
    "status": "WARNING",
    "daysUntilExpiry": 17,
    "quantity": 60,
    "unit": "bottles",
    "yieldPercent": 65,
    "farmerName": "Harish Negi",
    "village": "Munsiyari",
    "dataSource": "fallback"
  },
  {
    "batchCode": "HS-2026-06-019",
    "productName": "Kumaon Royal Multigrain Crackers",
    "status": "WARNING",
    "daysUntilExpiry": 18,
    "quantity": 200,
    "unit": "packets",
    "yieldPercent": 91,
    "farmerName": "Harish Negi",
    "village": "Munsiyari",
    "dataSource": "live"
  },
  {
    "batchCode": "HS-2026-06-016",
    "productName": "Apricot & Berry Himalayan Jam",
    "status": "READY",
    "daysUntilExpiry": 20,
    "quantity": 85,
    "unit": "jars",
    "yieldPercent": 77,
    "farmerName": "Bhavya Gogia",
    "village": "Bageshwar",
    "dataSource": "live"
  }
]
```

---

## Variation 1 — Free-Form Prose (Rejected) ❌

### Prompt

```
You are a supply chain advisor for HimShakti Food Processing, an organic food company in Uttarakhand, India.

Analyse these warehouse batches and give me a full advisory report:
[batch JSON]

Tell me which batches need urgent dispatch, any quality concerns,
supply chain risks, and your top 3 priorities.
```

### Output (truncated)

```
Based on my analysis of your current warehouse inventory, here are my key findings:

**Urgent Dispatch Required**
Batch HS-2026-06-020 (Apricot & Berry Jam) has reached its expiry date and needs
to be dispatched immediately or written off. This represents a financial loss risk...

**Quality Concerns**
The Wild Berry Juice Concentrate (HS-2026-06-017) shows a below-average yield of 65%,
which suggests potential issues with raw material quality from Harish Negi's farm...

(continued — ~600 more words of prose)
```

### Why This Was Rejected

The model returned rich, readable English prose — but it was completely unparseable by the frontend. The React dashboard needed to render this as structured cards (urgency badges, ranked priority lists, risk severity pills). Regex-parsing prose for structured data is fragile and breaks the moment the model rephrases. This approach was immediately discarded.

---

## Variation 2 — JSON Requested, No Schema (Partially Worked) ⚠️

### Prompt

```
You are a supply chain advisor for HimShakti Food Processing, an organic food company in Uttarakhand, India.

Analyse these warehouse batches and respond in JSON format:
[batch JSON]

Include: urgent batches, quality warnings, top priorities, supply chain risks, and a summary.
```

### Output

```json
{
  "urgent": [
    { "batch": "HS-2026-06-020", "message": "Expires today — dispatch immediately" }
  ],
  "warnings": [
    { "batch": "HS-2026-06-017", "note": "Low yield 65%, fallback data source" }
  ],
  "priorities": ["HS-2026-06-020", "HS-2026-06-017", "HS-2026-06-019"],
  "risks": "Single-farmer dependency for Munsiyari sourcing is a concentration risk.",
  "summary": "Four batches analysed. One urgent, two at warning level."
}
```

### Why This Was Partially Useful, Then Rejected

The model produced JSON — a big improvement over Variation 1. However the key names were inconsistent across runs (`urgent` vs `urgentBatches`, `warnings` vs `qualityWarnings`), the `risks` field was a plain string instead of a structured array, and `priorities` was just an array of batch codes with no ranking metadata or reasoning. The frontend would need fragile defensive handling for every possible shape. Rejected in favour of a schema-driven approach.

---

## Variation 3 — JSON with Strict Schema + Rules ✅ (Production — Best)

### Prompt

```
You are a supply chain advisor for HimShakti Food Processing, an organic food company in Uttarakhand, India.

Analyse the following active warehouse batches:
[batch JSON]

Respond ONLY with valid JSON — no Markdown, no prose, no code fences.
Use this exact schema:
{
  "urgentBatches":    [{ "batchCode": "", "reason": "" }],
  "qualityWarnings":  [{ "batchCode": "", "concern": "" }],
  "top3Priorities":   [{ "rank": 1, "batchCode": "", "productName": "", "action": "", "reasoning": "" }],
  "supplyChainRisks": [{ "risk": "", "severity": "HIGH|MEDIUM|LOW", "recommendation": "" }],
  "summary":          "",
  "totalAnalyzed":    0,
  "analyzedAt":       ""
}

Rules:
- urgentBatches: only batches with status URGENT or EXPIRED. Empty array if none.
- qualityWarnings: batches with yieldPercent < 70 OR dataSource === "fallback". Empty array if none.
- top3Priorities: top 3 batches to dispatch next, ranked by urgency. Include reasoning tied to actual data.
- supplyChainRisks: systemic risks (e.g. single-product dependency, single-farmer sourcing). Max 4.
- summary: one paragraph, factual, under 80 words, for a non-technical factory manager.
- totalAnalyzed: number of batches you were given.
- Do NOT invent data not present in the input.
```

### Output

```json
{
  "urgentBatches": [
    {
      "batchCode": "HS-2026-06-020",
      "reason": "Expires today (0 days remaining). Immediate dispatch or write-off required to avoid total loss."
    }
  ],
  "qualityWarnings": [
    {
      "batchCode": "HS-2026-06-017",
      "concern": "Yield of 65% is below the 70% quality threshold and data source is 'fallback' — nutritional values may be estimated, not lab-verified."
    }
  ],
  "top3Priorities": [
    {
      "rank": 1,
      "batchCode": "HS-2026-06-020",
      "productName": "Apricot & Berry Himalayan Jam",
      "action": "Dispatch all 120 jars today",
      "reasoning": "Status is URGENT with 0 days until expiry. Any delay results in total write-off."
    },
    {
      "rank": 2,
      "batchCode": "HS-2026-06-017",
      "productName": "Wild Berry Juice Concentrate",
      "action": "Dispatch within 2 weeks and flag for QA review",
      "reasoning": "17 days to expiry combined with low yield (65%) and fallback data makes this a dual quality-and-time risk."
    },
    {
      "rank": 3,
      "batchCode": "HS-2026-06-019",
      "productName": "Kumaon Royal Multigrain Crackers",
      "action": "Schedule dispatch within 3 weeks",
      "reasoning": "18 days to expiry with healthy yield 91%. Lower priority but must not be overlooked."
    }
  ],
  "supplyChainRisks": [
    {
      "risk": "Single-farmer geographic concentration — Harish Negi supplies 2 of 4 active batches from Munsiyari",
      "severity": "HIGH",
      "recommendation": "Diversify sourcing across at least 2 districts for Wild Berry and Multigrain lines."
    },
    {
      "risk": "Fallback data source for HS-2026-06-017 means nutritional label accuracy is unverified",
      "severity": "MEDIUM",
      "recommendation": "Trigger a lab re-test before dispatch to confirm compliance."
    },
    {
      "risk": "Apricot Jam (SKU JAM-APR-500) has two active batches — overstock risk if demand softens",
      "severity": "LOW",
      "recommendation": "Coordinate sales order priority for oldest batch before promoting second batch."
    }
  ],
  "summary": "4 batches analysed. HS-2026-06-020 (Apricot Jam, 120 jars) expires today and needs immediate dispatch. HS-2026-06-017 (Wild Berry Juice) carries dual risk: 17-day shelf life and unverified fallback data. Sourcing is concentrated on a single farmer in Munsiyari — a supply disruption there affects two product lines simultaneously.",
  "totalAnalyzed": 4,
  "analyzedAt": "2026-07-05T12:30:00.000Z"
}
```

### Why This Is The Best

The strict schema prompt was adopted as the production prompt for four reasons. First, it produces **deterministic key names** across every run — `urgentBatches`, `qualityWarnings`, `top3Priorities` — meaning the frontend can always destructure the same fields without defensive fallback handling. Second, the explicit `Rules:` clause prevents false positives, such as flagging a READY batch as urgent or hallucinating a quality warning when yield data is fine. Third, requiring a `reasoning` field forces the model to cite actual values from the input batch data rather than producing generic one-size-fits-all advice, making the audit genuinely traceable. Finally, the `"Respond ONLY with valid JSON — no Markdown, no code fences"` instruction — backed by a `parseAIResponse()` strip-and-parse function — makes the pipeline robust even on the rare occasion where the model adds an accidental backtick fence.

---

## Dual-Provider Architecture

The production service uses **Gemini 2.5 Flash as primary** with **NVIDIA LLaMA 3.1 70B Instruct as automatic fallback**. Both providers receive the exact same Variation 3 prompt.

```
GET /api/ai/audit
      │
      ▼
 Cache hit? ──YES──▶ Return cached (TTL: 4 hours)
      │NO
      ▼
 Gemini 2.5 Flash  ──✅──▶ parseAIResponse() ──▶ Cache ──▶ Return
      │❌ (rate limit / 503)
      ▼
 NVIDIA LLaMA 3.1 70B  ──✅──▶ parseAIResponse() ──▶ Cache ──▶ Return
      │❌
      ▼
 throw 429 — "Both providers unavailable"
```

### Why Two Providers?

| Provider | Role | Why |
|---|---|---|
| **Gemini 2.5 Flash** | Primary | Fastest response, strong instruction-following, native JSON accuracy |
| **NVIDIA LLaMA 3.1 70B** | Fallback | Catches Gemini free-tier rate-limit windows (15 req/min); OpenAI-compatible API shape makes it a drop-in replacement |

Both providers use **temperature: 0.2** to minimise hallucination and maximise schema consistency across runs.

---

## Key Prompt Engineering Decisions

| Decision | Rationale |
|---|---|
| **Schema-first instruction** | Eliminates key-name drift across runs; frontend destructures fixed fields |
| **Explicit `Rules:` clause** | Prevents false positives and controls array sizes |
| **`reasoning` field** | Forces model to cite real input values — audit is traceable, not a black box |
| **`Do NOT invent data`** | Critical for compliance — prevents hallucinated farmer names or batch codes |
| **80-word summary limit** | Fits a single dashboard card without truncation |
| **temperature: 0.2** | Low = consistent, factual, repeatable; high temperature causes schema drift |
| **4-hour cache TTL** | Avoids API cost on every page visit; configurable via `GEMINI_CACHE_TTL_HOURS` |

---

## Environment Variables Required

```env
# Primary AI provider — get key from https://aistudio.google.com/
GEMINI_API_KEY=your_google_ai_studio_key

# Fallback AI provider — get key from https://integrate.api.nvidia.com/
NVIDIA_API_KEY=your_nvidia_nim_api_key
NVIDIA_MODEL=meta/llama-3.1-70b-instruct

# Report cache duration (hours) — default 4
GEMINI_CACHE_TTL_HOURS=4
```

---

## References

| Resource | Link |
|---|---|
| Google AI Studio | https://aistudio.google.com/ |
| NVIDIA NIM API | https://integrate.api.nvidia.com |
| Gemini 2.5 Flash model card | https://deepmind.google/technologies/gemini/flash/ |
| LLaMA 3.1 70B on NVIDIA | https://catalog.ngc.nvidia.com/orgs/nvidia/teams/nim/containers/llama-3_1-70b-instruct |
| AI Service source | `backend/src/services/aiService.js` |
| AI Controller source | `backend/src/controllers/ai.controller.js` |

---

*Last updated: 2026-07-18 · Intern 2 — HimShakti Traceability Platform*
