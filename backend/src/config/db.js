/**
 * db.js — MongoDB connection manager
 * ──────────────────────────────────────────────────────────────────
 * Serverless-safe. Every request passes through a middleware that
 * calls connectDB(), so this module must satisfy three constraints
 * that a long-lived process does not have:
 *
 *   1. The connection is cached across invocations that reuse a warm
 *      container, but a cold container must reconnect.
 *   2. Concurrent requests on the same container must share ONE
 *      in-flight connect. Checking `readyState >= 1` is not enough:
 *      readyState 2 means "connecting", so a second request would
 *      sail past and issue queries against a socket that is not up
 *      yet. Mongoose then buffers those queries and the invocation
 *      burns its whole time budget waiting.
 *   3. It must FAIL FAST. An unreachable cluster (an Atlas IP
 *      allowlist that does not include Vercel, say) blocks for the
 *      driver's 30s default server-selection window, which is longer
 *      than the function's limit — the platform kills the invocation
 *      and the caller gets an opaque FUNCTION_INVOCATION_FAILED page
 *      instead of a real error. Timing out under the function limit
 *      turns that crash into a readable 503.
 */
const mongoose = require('mongoose');

// Cached across warm invocations of the same container.
let connectionPromise = null;

/** Tuned to fail inside the serverless invocation budget, not after it. */
const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 8000,  // give up choosing a server after 8s
  socketTimeoutMS:          20000,
  connectTimeoutMS:         8000,
  maxPoolSize:              10,    // serverless: many containers, few sockets each
  minPoolSize:              0,
  bufferCommands:           false, // surface "not connected" instead of hanging
};

/**
 * Establish (or reuse) the MongoDB connection.
 * Safe to call on every request.
 */
async function connectDB() {
  // 1 = connected. Reuse immediately.
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  // 2 = connecting. Share the in-flight attempt rather than starting
  // another one or, worse, proceeding without a connection.
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    // Explicit and actionable — this is the single most common cause of
    // a working local build failing once deployed.
    const err = new Error(
      'DB_CONFIG: MONGODB_URI is not set. Add it to the deployment environment variables.'
    );
    err.statusCode = 503;
    throw err;
  }

  connectionPromise = mongoose
    .connect(uri, CONNECT_OPTIONS)
    .then((m) => {
      console.log('[db] MongoDB connected — himshakti');
      return m.connection;
    })
    .catch((err) => {
      // Clear the cache so the next request retries instead of being
      // permanently poisoned by one transient failure.
      connectionPromise = null;
      console.error('[db] MongoDB connection failed:', err.message);
      throw err;
    });

  return connectionPromise;
}

// A dropped connection must not leave a resolved promise cached.
mongoose.connection.on('disconnected', () => {
  connectionPromise = null;
});

module.exports = { connectDB };
