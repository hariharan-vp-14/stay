/**
 * Passport.js — Google OAuth 2.0 Strategy
 *
 * Handles server-side redirect flow via:
 *   GET /api/auth/google          → redirects to Google consent screen
 *   GET /api/auth/google/callback → Google redirects here with code
 *
 * After verification the user/owner/admin is upserted and a JWT is issued.
 */
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./index');
const User = require('../models/user.model');

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      passReqToCallback: true, // gives access to req (to read ?state=role)
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(null, false, { message: 'Email not available from Google' });

        const googleId = profile.id;
        const name = profile.displayName || email.split('@')[0];

        // Determine the requested role from query-state (default: 'user')
        const requestedRole = req.query.state || 'user';

        let user = await User.findOne({ email });

        if (user) {
          // Existing user — link Google ID if not yet linked
          if (!user.googleId) {
            user.googleId = googleId;
          }
          // Add role if not present (multi-role support)
          if (!user.roles.includes(requestedRole)) {
            // Admin limit check
            if (requestedRole === 'admin') {
              const adminCount = await User.countDocuments({ roles: 'admin' });
              if (adminCount >= config.MAX_ADMINS) {
                return done(null, false, { message: `Maximum admin limit (${config.MAX_ADMINS}) reached.` });
              }
            }
            user.roles.push(requestedRole);
          }
          if (user.isBanned) {
            return done(null, false, { message: 'Your account has been banned' });
          }
          await user.save();
        } else {
          // New user
          if (requestedRole === 'admin') {
            const adminCount = await User.countDocuments({ roles: 'admin' });
            if (adminCount >= config.MAX_ADMINS) {
              return done(null, false, { message: `Maximum admin limit (${config.MAX_ADMINS}) reached.` });
            }
          }
          const randomPassword = await User.hashPassword(`${Date.now()}-${googleId}`);
          user = await User.create({
            name,
            email,
            password: randomPassword,
            googleId,
            roles: [requestedRole],
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);

// Serialize / deserialize (only used within the OAuth redirect flow)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
