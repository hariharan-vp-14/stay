/**
 * Centralized configuration — all env vars are read here once.
 * Every other module should `require('./config')` instead of reading `process.env` directly.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  // ── Server ──
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: isProduction,

  // ── Database ──
  MONGO_URI: process.env.MONGO_URI,

  // ── JWT ──
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',

  // ── Google OAuth ──
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    (isProduction
      ? 'https://your-backend-domain.com/api/auth/google/callback'
      : 'http://localhost:5000/api/auth/google/callback'),

  // ── CORS ──
  FRONTEND_URL:
    process.env.FRONTEND_URL ||
    (isProduction ? 'https://stay-wm8p.vercel.app' : 'http://localhost:5173'),
  // Kept for backward-compat; prefer FRONTEND_URL
  CLIENT_ORIGIN:
    process.env.FRONTEND_URL ||
    process.env.CLIENT_ORIGIN ||
    (isProduction ? 'https://stay-wm8p.vercel.app' : 'http://localhost:5173'),

  // ── Cookies ──
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // ── Admin ──
  MAX_ADMINS: parseInt(process.env.MAX_ADMINS, 10) || 5,
};
