require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');

// Ensure all models are loaded so Sequelize syncs their tables
require('./models/User');
require('./models/Venue');
require('./models/Booking');
require('./models/Review');
require('./models/AuditLog');

const authRoutes    = require('./routes/authRoutes');
const venueRoutes   = require('./routes/venueRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const uploadRoutes  = require('./routes/uploadRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const { initScheduler } = require('./services/schedulerService');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sanitizeMiddleware = require('./middleware/sanitizeMiddleware');
const morgan = require('morgan');
const logger = require('./utils/logger');

const app = express();

// ── Security Middleware ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(sanitizeMiddleware);  // Deep sanitization for XSS protection

// Request logging with Morgan (streaming to Winston)
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Brute-force protection for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes'
});
app.use('/api/auth', authLimiter);

// ── Standard Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Slightly reduced limit for safety

// ── Static: serve uploaded images ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/venues',   venueRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api/admin',    adminRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Serve Frontend in Production ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  app.get('/', (_req, res) => res.send('<h1>Connect API is Active</h1><p>The backend is running perfectly on port 5000.</p>'));
}

// ── Sync DB then start server ──────────────────────────────────────────────────
sequelize.sync()
  .then(() => {
    console.log('✅ Database synced');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      initScheduler(); // Start the 4h reminder background task
    });
  })
  .catch(err => console.error('❌ DB sync failed:', err.message));
