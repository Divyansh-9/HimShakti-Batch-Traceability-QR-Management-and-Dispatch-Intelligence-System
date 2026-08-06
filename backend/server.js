require('dotenv').config();
const http     = require('http');
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const { connectDB }     = require('./src/config/db');
const errorHandler      = require('./src/middleware/errorHandler');
const { apiLimiter }    = require('./src/middleware/rateLimiter');
const { seedUsers }     = require('./src/scripts/seedUsers');

const authRoutes     = require('./src/routes/auth.routes');
const productRoutes  = require('./src/routes/products.routes');
const batchRoutes    = require('./src/routes/batches.routes');
const dispatchRoutes = require('./src/routes/dispatch.routes');
const qrRoutes       = require('./src/routes/qr.routes');
const aiRoutes            = require('./src/routes/ai.routes');
const notificationRoutes  = require('./src/routes/notifications.routes');
const inspectionRoutes    = require('./src/routes/inspection.routes');
const importRoutes        = require('./src/routes/import.routes');
const messageRoutes       = require('./src/routes/messages.routes');

const app  = express();
const PORT = process.env.PORT || 5001;

/**
 * Serverless platforms (Vercel, Firebase Functions) hand the Express app
 * a request per invocation — there is no long-lived process to hold a
 * WebSocket open. Creating an http.Server and attaching Socket.io there
 * allocates an event-loop-bound listener that is never used and never
 * closed, which keeps the invocation from settling cleanly.
 *
 * So: real-time is wired up ONLY when this file runs as a process.
 * Every emit site already guards with `if (io)` / `app?.get('io')`, so
 * with sockets absent the API degrades to REST-only — which is exactly
 * the documented production guarantee.
 */
const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.FUNCTION_TARGET || process.env.K_SERVICE
);

/**
 * Vercel and Firebase both terminate TLS at a proxy and forward the
 * client address in X-Forwarded-For. Without this, express-rate-limit
 * cannot identify callers (it logs ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
 * and buckets every visitor together) and req.ip is the proxy's address.
 * `1` = trust exactly one hop, the platform proxy — not a blanket `true`,
 * which would let a client spoof its own IP by sending the header.
 */
app.set('trust proxy', 1);

const CORS_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://himshakti2026-bb904.web.app',
  'https://himshakti2026-bb904.firebaseapp.com',
  'https://him-shakti-batch-traceability-qr-ma.vercel.app',
];

// ── Socket.io — real-time updates + role rooms ─────────────────────
// Only in a long-lived process; see IS_SERVERLESS above.
let server = null;
let io     = null;

if (!IS_SERVERLESS) {
  server = http.createServer(app);
  io = new Server(server, {
    cors: { origin: CORS_ORIGINS, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

  /**
   * Clients emit 'auth:join' right after connecting with their role.
   * The server joins the socket to the role room so targeted
   * notifications reach only the correct role group.
   *
   * Client usage (in useNotifications hook):
   *   socket.emit('auth:join', { role: user.role, userId: user._id })
   */
    socket.on('auth:join', ({ role, userId } = {}) => {
      if (role) {
        socket.join(`role:${role}`);
        // Super admin also receives admin-tier notifications
        if (role === 'super-admin') socket.join('role:admin');
        console.log(`[Socket.io] ${socket.id} joined role:${role} (userId=${userId})`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Attach io to app so controllers can emit events.
  // Left unset on serverless — every emit site guards with `if (io)`.
  app.set('io', io);
}

// ── Express middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// ── Health ─────────────────────────────────────────────────────────
// Declared BEFORE the connectDB gate on purpose. A health check whose
// success depends on the database cannot tell you "the API is up but
// Mongo is unreachable" — the one answer you need when diagnosing a
// deployment. This endpoint reports process liveness; it also surfaces
// the driver's readyState so the distinction is visible at a glance.
app.get('/health', (_req, res) => {
  const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status:    'ok',
    service:   'HimShakti Batch Traceability API',
    env:       process.env.NODE_ENV || 'development',
    serverless: IS_SERVERLESS,
    database:  STATES[mongoose.connection.readyState] || 'unknown',
    dbConfigured: Boolean(process.env.MONGODB_URI),
    timestamp: new Date().toISOString(),
    realtime:  io ? 'socket.io enabled' : 'REST only (serverless)',
  });
});

// ── DB gate ────────────────────────────────────────────────────────
// Serverless containers do not run module-level init reliably, so the
// connection is established (or reused) per request. connectDB() fails
// fast rather than hanging past the invocation limit — see config/db.js.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Auth
app.use('/auth', authRoutes);

// Public QR trace
app.use('/trace',  qrRoutes);
app.use('/api/qr', qrRoutes);

// API
app.use('/api/products', productRoutes);
app.use('/api/batches',  batchRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inspections',   inspectionRoutes);
app.use('/api/import',        importRoutes);
app.use('/api/messages',      messageRoutes);

// ── 404 ────────────────────────────────────────────────────────────
// Without this, an unknown path falls through to the platform's own
// handler and returns HTML, which breaks clients that expect the
// { success, error } envelope on every response.
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

// ── Process-mode startup ───────────────────────────────────────────
// Only when run directly (`npm run dev` / `npm start`). Under Vercel or
// Firebase the platform invokes the exported app and nothing here runs.
if (require.main === module) {
  connectDB()
    .then(async () => {
      await seedUsers();
      server.listen(PORT, () => {
        console.log(`🚀 [HimShakti] Backend running at http://localhost:${PORT}`);
        console.log(`🔌 [HimShakti] Socket.io real-time enabled`);
        console.log(`📡 [HimShakti] Health: http://localhost:${PORT}/health`);
      });
    })
    .catch((err) => {
      // Previously unhandled: a failed boot connect rejected silently and
      // the process stayed alive without ever listening.
      console.error('❌ [HimShakti] Startup failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
