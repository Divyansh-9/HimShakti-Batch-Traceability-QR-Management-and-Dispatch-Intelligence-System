const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const store = require('./sharedStore');

// In-memory cache (FR-4.2).
//
// Kept as the fallback tier. On serverless it is nearly useless on its
// own — the variable dies with the container, so the 4-hour TTL rarely
// survives long enough to be read and most requests pay for a fresh
// Gemini call. When a shared store is configured the report is cached
// there too, and the TTL finally means what it says.
let aiCache = { report: null, generatedAt: null };

const CACHE_KEY = 'ai:dispatch-audit';

function cacheTTLms() {
  return parseInt(process.env.GEMINI_CACHE_TTL_HOURS || '4', 10) * 60 * 60 * 1000;
}

/**
 * The AI is instructed to return ONLY valid JSON — no Markdown prose.
 * This eliminates fragile regex parsing on the frontend and makes rendering trivial.
 *
 * @param {Array} batches - Enriched batch objects with daysUntilExpiry
 * @returns {{ report: object, fromCache: boolean, generatedAt: Date }}
 */
async function runDispatchAudit(batches) {
  const cacheTTL = cacheTTLms();

  // Process-local first — free, and correct when it hits.
  if (aiCache.report && (Date.now() - aiCache.generatedAt) < cacheTTL) {
    return { report: aiCache.report, fromCache: true, cachedAt: new Date(aiCache.generatedAt), provider: aiCache.provider || 'gemini' };
  }

  // Then the shared store, which survives the container. Returns null
  // when unconfigured or unreachable, in which case we simply generate.
  const shared = await store.getJSON(CACHE_KEY);
  if (shared?.report && (Date.now() - shared.generatedAt) < cacheTTL) {
    // Re-seed the local tier so repeat calls on this container skip the
    // network round trip entirely.
    aiCache = shared;
    return { report: shared.report, fromCache: true, cachedAt: new Date(shared.generatedAt), provider: shared.provider || 'gemini' };
  }

  const batchSummary = batches.map(b => ({
    batchCode:       b.batchCode,
    productName:     b.productName,
    sku:             b.sku,
    status:          b.status,
    daysUntilExpiry: b.daysUntilExpiry,
    quantity:        b.quantityProduced,
    unit:            b.unit,
    yieldPercent:    b.yieldPercent,
    farmerName:      b.farmerName,
    village:         b.village,
    dataSource:      b.dataSource,
  }));

  const prompt = `
You are a supply chain advisor for HimShakti Food Processing, an organic food company in Uttarakhand, India.

Analyse the following active warehouse batches:
${JSON.stringify(batchSummary, null, 2)}

Respond ONLY with valid JSON — no Markdown, no prose, no code fences.
Use this exact schema:
{
  "urgentBatches": [{ "batchCode": "", "reason": "" }],
  "qualityWarnings": [{ "batchCode": "", "concern": "" }],
  "top3Priorities": [{ "rank": 1, "batchCode": "", "productName": "", "action": "", "reasoning": "" }],
  "supplyChainRisks": [{ "risk": "", "severity": "HIGH|MEDIUM|LOW", "recommendation": "" }],
  "summary": "",
  "totalAnalyzed": 0,
  "analyzedAt": ""
}

Rules:
- urgentBatches: only batches with status URGENT or EXPIRED. Empty array if none.
- qualityWarnings: batches with yieldPercent < 70 OR dataSource === "fallback". Empty array if none.
- top3Priorities: top 3 batches to dispatch next, ranked by urgency. Include reasoning tied to actual data.
- supplyChainRisks: systemic risks (e.g. single-product dependency, single-farmer sourcing). Max 4.
- summary: one paragraph, factual, under 80 words, for a non-technical factory manager.
- totalAnalyzed: number of batches you were given.
- Do NOT invent data not present in the input.
`;

  async function callNvidiaFallback(p) {
    const apiKey = process.env.NVIDIA_API_KEY;
    const modelName = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';
    if (!apiKey) throw new Error('Fallback failed: NVIDIA_API_KEY is not configured.');

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: p }],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`NVIDIA API Error (${response.status}): ${errData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  function parseAIResponse(text) {
    // Strip any accidental markdown fences the model might add
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Ensure all required keys are present with safe defaults
    return {
      urgentBatches:    Array.isArray(parsed.urgentBatches)    ? parsed.urgentBatches    : [],
      qualityWarnings:  Array.isArray(parsed.qualityWarnings)  ? parsed.qualityWarnings  : [],
      top3Priorities:   Array.isArray(parsed.top3Priorities)   ? parsed.top3Priorities   : [],
      supplyChainRisks: Array.isArray(parsed.supplyChainRisks) ? parsed.supplyChainRisks : [],
      summary:          typeof parsed.summary      === 'string' ? parsed.summary          : '',
      totalAnalyzed:    typeof parsed.totalAnalyzed === 'number' ? parsed.totalAnalyzed  : batches.length,
      analyzedAt:       parsed.analyzedAt || new Date().toISOString(),
    };
  }

  let rawText = null;
  let provider = 'gemini';
  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    rawText = result.response.text();
  } catch (err) {
    console.warn(`[AI] Primary (Gemini) failed: ${err.message}`);
    console.warn(`[AI] Triggering NVIDIA Fallback...`);
    try {
      rawText = await callNvidiaFallback(prompt);
      provider = 'nvidia';
    } catch (nvidiaErr) {
      console.error(`[AI] NVIDIA Fallback also failed: ${nvidiaErr.message}`);
      throw new Error(`429: Both AI providers are currently unavailable. Please wait and try again.`);
    }
  }

  let report;
  try {
    report = parseAIResponse(rawText);
  } catch (parseErr) {
    console.error('[AI] JSON parse failed — raw response:', rawText);
    throw new Error('AI returned an unexpected format. Please try again.');
  }

  aiCache = { report, generatedAt: Date.now(), provider };

  // Not awaited: the caller already has their report, and a slow or
  // unreachable cache must never delay or fail the response.
  store.setJSON(CACHE_KEY, aiCache, cacheTTLms() / 1000)
    .catch(err => console.error('[AI] shared cache write failed:', err.message));

  return { report, fromCache: false, generatedAt: new Date(), provider };
}

function clearAICache() {
  aiCache = { report: null, generatedAt: null };
  // Clear the shared copy too, or a "regenerate" on one container is
  // undone by the next container reading the stale entry back.
  store.command(['DEL', CACHE_KEY])
    .catch(err => console.error('[AI] shared cache clear failed:', err.message));
}

module.exports = { runDispatchAudit, clearAICache };
