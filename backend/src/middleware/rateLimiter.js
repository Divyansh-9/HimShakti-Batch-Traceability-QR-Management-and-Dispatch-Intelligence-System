/**
 * rateLimiter.js
 * ──────────────────────────────────────────────────────────────────
 * express-rate-limit's default store lives in process memory. On a
 * long-lived server that is correct. On serverless it silently stops
 * being a rate limit: every container keeps its own counter, so a
 * configured N-per-window is really N x (however many containers the
 * platform happens to be running).
 *
 * That is tolerable for the global API limiter, which exists to blunt
 * abuse. It is not tolerable for the AI limiter, whose entire job is
 * keeping the Gemini free tier (15 RPM / 1,500 RPD) from being burned
 * through — per-container, it enforces nothing at all.
 *
 * So when a shared store is configured, both limits are counted there
 * and are genuinely global. When it is not, the original in-memory
 * behaviour applies unchanged: local development and the long-lived
 * process both work with no extra infrastructure.
 */
const rateLimit = require('express-rate-limit');
const store     = require('../services/sharedStore');

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Build a limiter that counts in the shared store when one is
 * configured, and falls back to express-rate-limit otherwise.
 *
 * @param {object}  opts
 * @param {string}  opts.name     namespace for the counter key
 * @param {number}  opts.max      requests permitted per window
 * @param {string}  opts.message  body returned on refusal
 */
function buildLimiter({ name, max, message }) {
  const fallback = rateLimit({
    windowMs: WINDOW_MS,
    max,
    message: { success: false, error: message },
  });

  const windowSeconds = WINDOW_MS / 1000;

  return async function limiter(req, res, next) {
    if (!store.isEnabled()) return fallback(req, res, next);

    // req.ip is trustworthy because server.js sets `trust proxy` to 1.
    // Bucketing by fixed window rather than sliding: an extra request at
    // a window edge is a far smaller problem than the bookkeeping a
    // sliding window needs on every call.
    const bucket = Math.floor(Date.now() / WINDOW_MS);
    const key    = `rl:${name}:${req.ip}:${bucket}`;

    const count = await store.incrementWithin(key, windowSeconds);

    // Store unreachable — fail OPEN, into the in-memory limiter. A cache
    // outage must not become an outage of the whole API, and the local
    // limiter still catches the worst of a flood.
    if (count == null) return fallback(req, res, next);

    if (count > max) {
      res.setHeader('Retry-After', String(Math.ceil((WINDOW_MS - (Date.now() % WINDOW_MS)) / 1000)));
      return res.status(429).json({ success: false, error: message });
    }

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - count)));
    return next();
  };
}

const aiLimiter = buildLimiter({
  name:    'ai',
  max:     5,
  message: 'Too many AI requests. Wait 15 minutes.',
});

const apiLimiter = buildLimiter({
  name:    'api',
  max:     500,
  message: 'Too many requests. Please wait.',
});

module.exports = { aiLimiter, apiLimiter };
