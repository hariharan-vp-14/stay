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

// ── Trust proxy (Render / Heroku / Load Balancers) ──
if (config.IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

/* =========================================================
   CORS CONFIGURATION (Production Safe)
========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://stay-wm8p.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Apply CORS before everything
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

/* =========================================================
   SECURITY MIDDLEWARE
========================================================= */

applySecurity(app);

/* =========================================================
   BODY PARSERS & COOKIES
========================================================= */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================================================
   PASSPORT (Google OAuth)
========================================================= */

app.use(passport.initialize());

/* =========================================================
   STATIC FILES
========================================================= */

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    env: config.NODE_ENV
  });
});

/* =========================================================
   API ROUTES
========================================================= */

app.use('/api/users', userRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/owner', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(errorHandler);

module.exports = app;