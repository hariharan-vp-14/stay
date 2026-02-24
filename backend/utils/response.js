/**
 * Centralized response helpers — keeps every controller consistent.
 *
 * Usage:
 *   const { ok, fail } = require('../utils/response');
 *   return ok(res, 200, 'Property created', { property });
 *   return fail(res, 400, 'Validation error');
 */

exports.ok = (res, statusCode = 200, message = 'Success', data = {}) =>
  res.status(statusCode).json({ success: true, message, ...data });

exports.fail = (res, statusCode = 400, message = 'Error', data = {}) =>
  res.status(statusCode).json({ success: false, message, ...data });
