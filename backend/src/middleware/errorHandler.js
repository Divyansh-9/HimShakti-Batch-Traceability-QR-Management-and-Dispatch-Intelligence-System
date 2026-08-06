/**
 * errorHandler.js — terminal Express error middleware
 * ──────────────────────────────────────────────────────────────────
 * Maps internal failures onto the uniform { success, error } envelope.
 *
 * Two rules this file must never break:
 *
 *   - It must not throw. Express has nothing behind the last error
 *     handler, so an exception raised in here tears down the response
 *     and, on serverless, the whole invocation — the client sees an
 *     opaque platform crash page rather than an error. Every branch
 *     below is defensive for that reason.
 *   - It must not leak internals in production. Driver and validation
 *     messages routinely carry connection strings, hostnames and
 *     schema details.
 */
const IS_PROD = process.env.NODE_ENV === 'production';

function errorHandler(err, req, res, _next) {
  // Full detail always goes to the server log, never necessarily to the client.
  console.error('[error]', req.method, req.originalUrl, '—', err?.message, IS_PROD ? '' : err?.stack || '');

  // Response already started — hand back to Express to destroy the socket.
  if (res.headersSent) return _next(err);

  // ── Duplicate key (unique index — e.g. batchCode) ────────────────
  if (err?.code === 11000) {
    return res.status(409).json({ success: false, error: 'Duplicate — batch code already exists' });
  }

  // ── Cross-team products collection contract breach ───────────────
  if (typeof err?.message === 'string' && err.message.startsWith('DB_CONTRACT')) {
    return res.status(503).json({ success: false, error: err.message });
  }

  // ── Database unreachable / misconfigured ─────────────────────────
  // MongooseServerSelectionError, MongoNetworkError and the buffering
  // timeout all mean the same thing to a caller: the datastore is down.
  // 503 (not 500) so clients and uptime checks can retry correctly.
  if (
    err?.name === 'MongooseServerSelectionError' ||
    err?.name === 'MongoNetworkError' ||
    err?.name === 'MongoServerSelectionError' ||
    (typeof err?.message === 'string' && err.message.startsWith('DB_CONFIG'))
  ) {
    return res.status(503).json({
      success: false,
      error: 'Database unavailable. Please try again shortly.',
    });
  }

  // ── Mongoose schema validation ───────────────────────────────────
  // `err.errors` is only present on Mongoose's ValidationError. Other
  // libraries (express-rate-limit among them) raise errors with the
  // same `name` and no `errors` map, and the old unguarded
  // Object.values(err.errors) threw a TypeError on those.
  if (err?.name === 'ValidationError') {
    const messages = err.errors && typeof err.errors === 'object'
      ? Object.values(err.errors).map((e) => e?.message).filter(Boolean)
      : [];
    return res.status(400).json({
      success: false,
      error: messages.length ? messages.join('; ') : (err.message || 'Validation failed'),
    });
  }

  // ── Malformed ObjectId ───────────────────────────────────────────
  if (err?.name === 'CastError') {
    return res.status(400).json({ success: false, error: `Invalid ${err.path || 'identifier'}` });
  }

  // ── JWT ──────────────────────────────────────────────────────────
  if (err?.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  if (err?.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
  }

  // ── Malformed JSON body (express.json) ───────────────────────────
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Malformed JSON body' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Payload too large' });
  }

  // ── Fallback ─────────────────────────────────────────────────────
  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;

  // Deliberate messages (4xx we raised ourselves) are safe to forward.
  // Unexpected 5xx messages are not — they carry driver and host detail.
  const safeMessage = status < 500
    ? (err?.message || 'Request failed')
    : (IS_PROD ? 'Internal Server Error' : (err?.message || 'Internal Server Error'));

  return res.status(status).json({ success: false, error: safeMessage });
}

module.exports = errorHandler;
