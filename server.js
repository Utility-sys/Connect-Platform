require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');

const authRoutes    = require('./routes/authRoutes');
const venueRoutes   = require('./routes/venueRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const uploadRoutes  = require('./routes/uploadRoutes');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ── Static: serve uploaded images ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/venues',   venueRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload',   uploadRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('<h1>Connect API is Active</h1><p>The backend is running perfectly on port 5000.</p>'));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Sync DB then start server ──────────────────────────────────────────────────
sequelize.sync()
  .then(() => {
    console.log('✅ Database synced');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ DB sync failed:', err.message));
