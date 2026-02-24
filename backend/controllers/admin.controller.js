/**
 * Admin Controller — register, login, Google auth, forgot/reset password,
 * property moderation, user/owner management, analytics, audit logs
 */
const User = require('../models/user.model');
const Owner = require('../models/owner.model');
const Property = require('../models/property.model');
const AuditLog = require('../models/auditLog.model');
const BlacklistToken = require('../models/blacklistToken.model');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const config = require('../config');

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// Helper: log admin action
async function logAction(adminId, action, targetType, targetId, details = '') {
  try {
    await AuditLog.create({ admin: adminId, action, targetType, targetId, details });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// ─── ADMIN REGISTRATION ───
module.exports.registerAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, contactNumber } = req.body;

    // Enforce max admin limit
    const adminCount = await User.countDocuments({ roles: 'admin' });
    if (adminCount >= config.MAX_ADMINS) {
      return res.status(403).json({
        success: false,
        message: `Maximum admin limit (${config.MAX_ADMINS}) reached.`,
      });
    }

    let user = await User.findOne({ email }).select('+password');

    if (user) {
      // User exists — check if already admin
      if (user.hasRole('admin')) {
        return res.status(400).json({ message: 'This email is already registered as admin' });
      }
      // Add admin role to existing user, update password for admin login
      user.roles.push('admin');
      user.password = await User.hashPassword(password);
      if (contactNumber && !user.contactNumber) user.contactNumber = contactNumber;
      await user.save();
    } else {
      // Create new user with admin role
      const hashedPassword = await User.hashPassword(password);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        contactNumber,
        roles: ['admin'],
      });
    }

    const token = user.generateAuthToken();
    res.cookie('token', token, config.COOKIE_OPTIONS);

    await logAction(user._id, 'ADMIN_REGISTER', 'User', user._id, `Admin registered: ${email}`);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        roles: user.roles,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── ADMIN LOGIN ───
module.exports.loginAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await User.findOne({ email, roles: 'admin' }).select('+password');

    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    if (admin.isBanned) {
      return res.status(403).json({ message: 'This admin account has been banned' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = admin.generateAuthToken();
    res.cookie('token', token, config.COOKIE_OPTIONS);

    await logAction(admin._id, 'ADMIN_LOGIN', 'User', admin._id, `Admin login: ${email}`);

    return res.status(200).json({
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        contactNumber: admin.contactNumber,
        roles: admin.roles,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── ADMIN GOOGLE LOGIN ───
module.exports.googleAuthAdmin = async (req, res) => {
  try {
    // Accept both field names: "token" (preferred) and "idToken" (legacy)
    const idToken = req.body.token || req.body.idToken;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google token is required (send as "token" or "idToken")' });
    }

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: config.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('[googleAuth-admin] verifyIdToken FAILED:', verifyErr.message);
      return res.status(401).json({
        success: false,
        message: 'Google token verification failed',
        error: verifyErr.message,
      });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email?.split('@')[0];

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not available from Google' });
    }

    let user = await User.findOne({ email });

    if (user) {
      // User exists — add admin role if not present
      if (!user.hasRole('admin')) {
        // Check admin limit before promoting
        const adminCount = await User.countDocuments({ roles: 'admin' });
        if (adminCount >= config.MAX_ADMINS) {
          return res.status(403).json({
            success: false,
            message: `Maximum admin limit (${config.MAX_ADMINS}) reached.`,
          });
        }
        user.roles.push('admin');
      }

      if (user.isBanned) {
        return res.status(403).json({ message: 'This account has been banned' });
      }

      if (!user.googleId) {
        user.googleId = googleId;
      }
      await user.save();
    } else {
      // New user — check admin limit
      const adminCount = await User.countDocuments({ roles: 'admin' });
      if (adminCount >= config.MAX_ADMINS) {
        return res.status(403).json({
          success: false,
          message: `Maximum admin limit (${config.MAX_ADMINS}) reached.`,
        });
      }

      const randomPassword = await User.hashPassword(`${Date.now()}-${googleId}`);
      user = await User.create({
        name,
        email,
        password: randomPassword,
        googleId,
        roles: ['admin'],
      });

      await logAction(user._id, 'ADMIN_REGISTER', 'User', user._id, `Admin Google register: ${email}`);
    }

    const token = user.generateAuthToken();
    res.cookie('token', token, config.COOKIE_OPTIONS);

    await logAction(user._id, 'ADMIN_LOGIN', 'User', user._id, `Admin Google login: ${email}`);

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        roles: user.roles,
      },
    });
  } catch (err) {
    console.error('Google Auth Error (admin):', err.message);
    return res.status(401).json({ success: false, message: 'Google authentication failed', error: err.message });
  }
};

// ─── ADMIN LOGOUT ───
module.exports.logoutAdmin = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (token) {
      await BlacklistToken.create({ token });
    }
    res.clearCookie('token', { httpOnly: true, secure: config.IS_PRODUCTION, sameSite: config.IS_PRODUCTION ? 'none' : 'lax' });
    return res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET PENDING PROPERTIES ───
module.exports.getPendingProperties = async (req, res) => {
  try {
    const properties = await Property.find({ status: 'pending' })
      .populate('owner', 'name email contactNumber')
      .sort('-createdAt');

    return res.json({ success: true, properties });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ALL PROPERTIES (all statuses) ───
module.exports.getAllProperties = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const properties = await Property.find(filter)
      .populate('owner', 'name email contactNumber')
      .sort('-createdAt');

    return res.json({ success: true, properties });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── APPROVE PROPERTY ───
module.exports.approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    property.status = 'approved';
    await property.save();

    await logAction(
      req.user._id,
      'APPROVE_PROPERTY',
      'Property',
      property._id,
      `Approved property: ${property.title}`
    );

    return res.json({ success: true, message: 'Property approved', property });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── REJECT PROPERTY ───
module.exports.rejectProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    property.status = 'rejected';
    await property.save();

    await logAction(
      req.user._id,
      'REJECT_PROPERTY',
      'Property',
      property._id,
      `Rejected property: ${property.title}`
    );

    return res.json({ success: true, message: 'Property rejected', property });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE PROPERTY (admin) ───
module.exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const title = property.title;
    await property.deleteOne();

    await logAction(
      req.user._id,
      'DELETE_PROPERTY',
      'Property',
      req.params.id,
      `Deleted property: ${title}`
    );

    return res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN ANALYTICS ───
module.exports.getAdminAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalOwners, totalAdmins, totalProperties, approvedCount, pendingCount, rejectedCount] =
      await Promise.all([
        User.countDocuments({ roles: 'user' }),
        Owner.countDocuments({}),
        User.countDocuments({ roles: 'admin' }),
        Property.countDocuments({}),
        Property.countDocuments({ status: 'approved' }),
        Property.countDocuments({ status: 'pending' }),
        Property.countDocuments({ status: 'rejected' }),
      ]);

    const bannedUsers = await User.countDocuments({ roles: 'user', isBanned: true });
    const bannedOwners = await Owner.countDocuments({ isBanned: true });

    return res.json({
      success: true,
      analytics: {
        totalUsers,
        totalOwners,
        totalAdmins,
        totalProperties,
        approvedCount,
        pendingCount,
        rejectedCount,
        bannedUsers,
        bannedOwners,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ALL USERS ───
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ roles: 'user' }).select('name email contactNumber isBanned roles createdAt').sort('-createdAt');
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET ALL OWNERS ───
module.exports.getAllOwners = async (req, res) => {
  try {
    const owners = await Owner.find({}).select('name email contactNumber isBanned createdAt').sort('-createdAt');
    return res.json({ success: true, owners });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── BAN USER ───
module.exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.hasRole('admin')) return res.status(403).json({ message: 'Cannot ban another admin' });

    user.isBanned = true;
    await user.save();

    await logAction(req.user._id, 'BAN_USER', 'User', user._id, `Banned user: ${user.email}`);

    return res.json({ success: true, message: 'User banned successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UNBAN USER ───
module.exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = false;
    await user.save();

    await logAction(req.user._id, 'UNBAN_USER', 'User', user._id, `Unbanned user: ${user.email}`);

    return res.json({ success: true, message: 'User unbanned successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── BAN OWNER ───
module.exports.banOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });

    owner.isBanned = true;
    await owner.save();

    await logAction(req.user._id, 'BAN_OWNER', 'Owner', owner._id, `Banned owner: ${owner.email}`);

    return res.json({ success: true, message: 'Owner banned successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UNBAN OWNER ───
module.exports.unbanOwner = async (req, res) => {
  try {
    const owner = await Owner.findById(req.params.id);
    if (!owner) return res.status(404).json({ message: 'Owner not found' });

    owner.isBanned = false;
    await owner.save();

    await logAction(req.user._id, 'UNBAN_OWNER', 'Owner', owner._id, `Unbanned owner: ${owner.email}`);

    return res.json({ success: true, message: 'Owner unbanned successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET AUDIT LOGS ───
module.exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find({})
        .populate('admin', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments({}),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── FORGOT PASSWORD (Admin) ───
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email, roles: 'admin' });
    if (!user) {
      // Don't reveal whether account exists
      return res.status(200).json({ message: 'If this admin email exists, a reset token has been generated.' });
    }

    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${config.CLIENT_ORIGIN}/admin/reset-password/${resetToken}`;

    // In production, send via email; in dev, return directly
    const responseData = {
      success: true,
      message: 'Reset token generated successfully',
    };
    if (!config.IS_PRODUCTION) {
      responseData.resetToken = resetToken;
      responseData.resetUrl = resetUrl;
    }

    return res.status(200).json(responseData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── RESET PASSWORD (Admin) ───
module.exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
      roles: 'admin',
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = await User.hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await logAction(user._id, 'PASSWORD_RESET', 'User', user._id, `Admin password reset: ${user.email}`);

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
