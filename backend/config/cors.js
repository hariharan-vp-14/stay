/**
 * Production-ready CORS configuration.
 *
 * ── How it works ──
 * • In development  → allows localhost origins (ports 5173, 5174, 3000).
 * • In production   → allows only the URL(s) in FRONTEND_URL env var.
 * • Extra origins   → ALLOWED_ORIGINS env var (comma-separated) for staging, previews, etc.
 * • Credentials     → always enabled (cookies + Authorization header).
 * • Preflight       → cached for 1 hour (maxAge: 3600) to reduce OPTIONS round-trips.
 *
 * Required env vars (production):
 *   FRONTEND_URL   – primary frontend URL, e.g. https://stay-wm8p.vercel.app
 *   ALLOWED_ORIGINS – (optional) comma-separated extra origins
 */

const config = require('./index');

// ── Build the whitelist ────────────────────────────────────────────
const allowedOrigins = new Set();

if (config.IS_PRODUCTION) {
  // Primary frontend URL (required in production)
  if (config.FRONTEND_URL) {
    allowedOrigins.add(config.FRONTEND_URL.replace(/\/+$/, '')); // strip trailing slash
  }
  // Additional origins (staging, preview deploys, etc.)
  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean)
      .forEach((o) => allowedOrigins.add(o));
  }
} else {
  // Development origins
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://localhost:5174');
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://127.0.0.1:5173');
  allowedOrigins.add('http://127.0.0.1:5174');
}

// ── Origin validator ───────────────────────────────────────────────
/**
 * Called by the cors middleware for every request.
 * @param {string|undefined} origin – the Origin header (undefined for same-origin / non-browser)
 * @param {Function} callback
 */
function originValidator(origin, callback) {
  // Allow requests with no Origin header (server-to-server, Postman, mobile apps)
  if (!origin) return callback(null, true);

  if (allowedOrigins.has(origin)) {
    return callback(null, true);
  }

  // Reject with a descriptive error
  const msg = `CORS: origin "${origin}" is not allowed.`;
  console.warn(msg);
  return callback(new Error(msg), false);
}

// ── Allowed headers & methods ──────────────────────────────────────
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Cache-Control',
];

// ── Export the cors options object ─────────────────────────────────
const corsOptions = {
  origin: originValidator,
  credentials: true,                // Access-Control-Allow-Credentials
  methods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS,
  exposedHeaders: ['Set-Cookie'],   // let browser JS read Set-Cookie if needed
  maxAge: 3600,                     // preflight cache: 1 hour (seconds)
  optionsSuccessStatus: 204,        // some legacy browsers choke on 200 for OPTIONS
};

module.exports = { corsOptions, allowedOrigins };
