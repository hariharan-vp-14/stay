const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config');
const { connectDB } = require('./db/db');
const { applySecurity } = require('./middleware/security.middleware');
const passport = require('./config/passport');
const errorHandler = require('./middleware/error.middleware');

// ── Route imports ──
const userRoutes = require('./routes/user.routes');
const ownerRoutes = require('./routes/owner.routes');
const authRoutes = require('./routes/auth.routes');
const propertyRoutes = require('./routes/property.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const uploadRoutes = require('./routes/upload.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ── Connect to MongoDB ──
connectDB();

// ── Trust proxy (required for Render / Heroku / load balancers) ──
if (config.IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

// ── CORS (must be before security middleware for preflight OPTIONS) ──
app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    credentials: true,
  }),
);

// ── Security middleware (helmet, rate-limiter, mongo-sanitize) ──
applySecurity(app);

// ── Body parsers & cookies ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Passport (for Google OAuth redirect flow) ──
app.use(passport.initialize());

// ── Static files ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'API is running', env: config.NODE_ENV });
});

// ── API routes ──
app.use('/api/users', userRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/owner', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// ── Centralized error handler (must be last) ──
app.use(errorHandler);

module.exports = app;