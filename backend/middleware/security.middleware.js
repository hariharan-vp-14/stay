/**
 * Security middleware bundle — helmet, rate limiting, mongo-sanitize, hpp.
 * Import and use in app.js:
 *   const { applySecurity } = require('./middleware/security.middleware');
 *   applySecurity(app);
 */
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Apply all security middlewares to the Express app.
 */
function applySecurity(app) {
  // ── Helmet — sets various HTTP security headers ──
  // crossOriginOpenerPolicy  – allow Google Sign-In popup postMessage
  // crossOriginResourcePolicy – allow the frontend (different origin) to load
  //   images / static files served by this backend (e.g. uploaded photos)
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ── Global rate limiter — 200 requests per 15 min per IP ──
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' },
    }),
  );

  // ── Mongo injection protection — sanitize req.body, req.query, req.params ──
  app.use(mongoSanitize());
}

/**
 * Stricter rate limiter for auth endpoints (10 requests / 15 min).
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
});

module.exports = { applySecurity, authLimiter };
