require('dotenv').config();
const http     = require('http');
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
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
const aiRoutes       = require('./src/routes/ai.routes');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5001;

const CORS_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

// ── Socket.io — real-time batch updates ────────────────────────────
const io = new Server(server, {
  cors: { origin: CORS_ORIGINS, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Attach io to app so controllers can emit events
app.set('io', io);

// ── Express middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: CORS_ORIGINS, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'], credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// Health
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'HimShakti Batch Traceability API',
    port:      PORT,
    timestamp: new Date().toISOString(),
    realtime:  'socket.io enabled',
  });
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
app.use('/api/ai',       aiRoutes);

app.use(errorHandler);

connectDB().then(async () => {
  await seedUsers();
  server.listen(PORT, () => {
    console.log(`🚀 [HimShakti] Backend running at http://localhost:${PORT}`);
    console.log(`🔌 [HimShakti] Socket.io real-time enabled`);
    console.log(`📡 [HimShakti] Health: http://localhost:${PORT}/health`);
  });
});
