/**
 * traceToken.js — opaque public identifier for the QR trace flow
 * ──────────────────────────────────────────────────────────────────
 * Batch codes are `HS-YYYY-MM-NNN`: sequential, human-readable, and
 * trivially enumerable. The trace endpoint is unauthenticated by
 * design (the public scan flow depends on it), so a readable code in
 * the URL means anyone can walk the sequence and harvest the whole
 * production record — farmer names, villages, volumes, yields.
 *
 * The QR therefore encodes a derived token instead. The batch code
 * remains the human-facing label everywhere else; only the public URL
 * changes.
 *
 * Derivation is a keyed HMAC rather than a random value on purpose:
 *
 *   - It is deterministic, so existing batches can be backfilled by
 *     recomputation. No random values to generate, store and reconcile.
 *   - It is idempotent, so the backfill can be re-run safely.
 *   - It is not reversible or guessable without the key, which is the
 *     entire point — unlike a hash of the batch code alone, which an
 *     attacker could recompute for every code in the sequence.
 *
 * The token is still stored on the batch (indexed) because HMAC cannot
 * be inverted: resolving a scan means looking the token up, not
 * decoding it.
 */
const crypto = require('crypto');

/** Truncated to 22 base64url chars ≈ 132 bits. Far beyond guessing,
 *  short enough to keep the QR's error-correction margin comfortable. */
const TOKEN_LENGTH = 22;

/**
 * Resolve the signing key.
 *
 * Falls back to JWT_SECRET so the feature works on an existing
 * deployment without a new environment variable. Setting a dedicated
 * TRACE_TOKEN_SECRET is preferred: rotating JWT_SECRET would otherwise
 * invalidate every QR code already printed on a physical crate.
 */
function getSecret() {
  const secret = process.env.TRACE_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('DB_CONFIG: TRACE_TOKEN_SECRET (or JWT_SECRET) must be set to generate trace tokens.');
    err.statusCode = 503;
    throw err;
  }
  return secret;
}

/**
 * Derive the public trace token for a batch code.
 * Deterministic: same code + same secret always yields the same token.
 *
 * @param   {string} batchCode e.g. 'HS-2026-06-022'
 * @returns {string} url-safe token
 */
function deriveTraceToken(batchCode) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(String(batchCode).toUpperCase())
    .digest('base64url')
    .slice(0, TOKEN_LENGTH);
}

module.exports = { deriveTraceToken, TOKEN_LENGTH };
