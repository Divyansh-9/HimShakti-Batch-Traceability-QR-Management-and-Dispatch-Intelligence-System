const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory cache (FR-4.2)
let aiCache = { report: null, generatedAt: null };

async function runDispatchAudit(batches) {
  const cacheTTL = parseInt(process.env.GEMINI_CACHE_TTL_HOURS || '4') * 60 * 60 * 1000;

  if (aiCache.report && (Date.now() - aiCache.generatedAt) < cacheTTL) {
    return { report: aiCache.report, fromCache: true, cachedAt: new Date(aiCache.generatedAt) };
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
    dataSource:      b.dataSource
  }));

  const prompt = `
You are a supply chain advisor for HimShakti Food Processing, an organic food company in Uttarakhand, India.

Below is a JSON array of current active and warning batches in the warehouse:
${JSON.stringify(batchSummary, null, 2)}

Provide a concise dispatch advisory report covering:
1. Which batches must be dispatched IMMEDIATELY (URGENT/EXPIRED status) and why.
2. Which batches have quality concerns (low yield < 70% or fallback shelf life data).
3. Top 3 recommended dispatch priorities with reasoning.
4. Any supply chain risks to flag to management.

Keep the report factual, under 400 words, suitable for a factory manager with no technical background.
Do NOT invent or assume data not present in the JSON.
`;

async function callNvidiaFallback(prompt) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const modelName = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';
  
  if (!apiKey) {
    throw new Error('Fallback failed: NVIDIA_API_KEY is not configured.');
  }

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errData = await response.text();
    throw new Error(`NVIDIA API Error (${response.status}): ${errData}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

  let report = null;
  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    report = result.response.text();
  } catch (err) {
    // Catch rate limit, invalid key, or quota errors from Gemini
    console.warn(`[Intern 2] Primary AI (Gemini) failed: ${err.message}`);
    console.warn(`[Intern 2] Triggering NVIDIA Fallback...`);
    try {
      report = await callNvidiaFallback(prompt);
    } catch (nvidiaErr) {
      console.error(`[Intern 2] NVIDIA Fallback also failed: ${nvidiaErr.message}`);
      // Throw a combined error to be caught by the controller
      throw new Error(`429: Both Primary (Gemini) and Fallback (NVIDIA) AIs are currently unavailable. Wait and try again.`);
    }
  }

  aiCache = { report, generatedAt: Date.now() };

  return { report, fromCache: false, generatedAt: new Date() };
}

function clearAICache() {
  aiCache = { report: null, generatedAt: null };
}

module.exports = { runDispatchAudit, clearAICache };
