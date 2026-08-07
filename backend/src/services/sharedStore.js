/**
 * sharedStore.js — cross-invocation state for a serverless runtime
 * ──────────────────────────────────────────────────────────────────
 * Two features in this codebase were written against module-level
 * variables, which is correct for a long-lived process and wrong here:
 *
 *   - Rate limiting. express-rate-limit's default store is per-process.
 *     Serverless runs N containers, each with its own counter, so a
 *     configured 500-per-15-minutes is really 500 x N. The AI limiter
 *     matters more: 5 per 15 minutes is what keeps Gemini's free tier
 *     (15 RPM / 1,500 RPD) from being exhausted, and per-container it
 *     enforces nothing.
 *
 *   - The AI report cache. A module-level variable dies with the
 *     container, so the 4-hour TTL almost never survives to be used and
 *     most requests pay for a fresh Gemini call.
 *
 * Upstash is used because it speaks HTTP rather than a TCP socket —
 * a serverless function cannot hold a Redis connection open between
 * invocations, and connection-per-request against normal Redis
 * exhausts the server long before it helps.
 *
 * FALLBACK IS DELIBERATE: with no credentials configured this module
 * reports unavailable and callers keep their existing in-memory
 * behaviour. Local development needs no Redis, and a Redis outage
 * degrades the app to today's behaviour rather than breaking it.
 */

const URL_ENV   = 'UPSTASH_REDIS_REST_URL';
const TOKEN_ENV = 'UPSTASH_REDIS_REST_TOKEN';

/** Configured? Read per call — serverless env is not stable at import time. */
function isEnabled() {
  return Boolean(process.env[URL_ENV] && process.env[TOKEN_ENV]);
}

/**
 * Issue one Upstash REST command.
 * Never throws: every caller has a working degraded path, and a cache or
 * rate-limit backend must not be able to fail a user's request.
 *
 * @returns {Promise<any|null>} the command result, or null on any failure
 */
async function command(args, { timeoutMs = 1500 } = {}) {
  if (!isEnabled()) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(process.env[URL_ENV], {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${process.env[TOKEN_ENV]}`,
        'Content-Type': 'application/json',
      },
      body:   JSON.stringify(args),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error('[sharedStore] Upstash responded', res.status);
      return null;
    }
    const body = await res.json();
    return body?.result ?? null;
  } catch (err) {
    // Timeout, DNS, TLS, malformed JSON — all the same to the caller.
    console.error('[sharedStore] unavailable:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Read a JSON value. Returns null when absent, unparseable, or unavailable. */
async function getJSON(key) {
  const raw = await command(['GET', key]);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Write a JSON value with an expiry, in seconds. */
async function setJSON(key, value, ttlSeconds) {
  return command(['SET', key, JSON.stringify(value), 'EX', String(Math.max(1, Math.floor(ttlSeconds)))]);
}

/**
 * Increment a counter and return its value, setting the window expiry on
 * first use. Two round trips rather than a Lua script, because a lost
 * expiry is self-correcting on the next window and the simpler code is
 * easier to reason about at 2am.
 *
 * @returns {Promise<number|null>} count within the window, or null if unavailable
 */
async function incrementWithin(key, windowSeconds) {
  const count = await command(['INCR', key]);
  if (count == null) return null;
  if (Number(count) === 1) await command(['EXPIRE', key, String(windowSeconds)]);
  return Number(count);
}

module.exports = { isEnabled, getJSON, setJSON, incrementWithin, command };
