require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const { connectDB }     = require('./src/config/db');
const errorHandler      = require('./src/middleware/errorHandler');
const { apiLimiter }    = require('./src/middleware/rateLimiter');
const { generateToken } = require('./src/middleware/auth');

const productRoutes  = require('./src/routes/products.routes');
const batchRoutes    = require('./src/routes/batches.routes');
const dispatchRoutes = require('./src/routes/dispatch.routes');
const qrRoutes       = require('./src/routes/qr.routes');
const aiRoutes       = require('./src/routes/ai.routes');

const app  = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174'
  ],
  methods: ['GET', 'POST', 'PATCH', 'PUT'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(apiLimiter);

// Health
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    service:   'HimShakti Intern 2 — Batch Traceability API',
    port:      PORT,
    timestamp: new Date().toISOString()
  });
});

// Dev login — returns JWT
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'manager' && password === 'himshakti2026') {
    const token = generateToken({ name: 'manager', role: 'manager' });
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Public routes (no auth)
app.use('/trace',    qrRoutes);
app.use('/api/qr',   qrRoutes);

// API routes
app.use('/api/products', productRoutes);
app.use('/api/batches',  batchRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/ai',       aiRoutes);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ [Intern 2] Backend running at http://localhost:${PORT}`);
    console.log(`✅ Public trace: http://localhost:${PORT}/trace/HS-2026-06-001`);
    console.log(`✅ Health: http://localhost:${PORT}/health`);
  });
});
