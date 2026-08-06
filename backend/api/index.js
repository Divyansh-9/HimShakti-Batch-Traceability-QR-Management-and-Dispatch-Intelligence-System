/**
 * api/index.js — Vercel serverless entry point
 * ──────────────────────────────────────────────────────────────────
 * Vercel discovers serverless functions by convention: every file under
 * `api/` becomes one. The previous deployment instead used the legacy v2
 * `builds` / `routes` schema to point at `server.js` directly, which
 * pins the project to a deprecated build pipeline and silently ignores
 * the `functions` block — so `maxDuration` and `memory` could not be
 * raised, and the invocation was capped at the default limit.
 *
 * This file is a thin re-export. All application wiring stays in
 * server.js, which continues to work unchanged as:
 *   - a long-lived process  (`npm start`, via require.main === module)
 *   - a Firebase Function   (../index.js)
 *   - a Vercel Function     (this file)
 */
module.exports = require('../server.js');
