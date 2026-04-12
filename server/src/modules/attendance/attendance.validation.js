// ─────────────────────────────────────────────────────────
// Attendance Validation – express-validator chains
// ─────────────────────────────────────────────────────────

import { body } from 'express-validator';
import { handleValidationErrors } from '../auth/auth.validation.js';

export const createSessionValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('date').optional().isISO8601().withMessage('Date must be valid ISO format'),
  body('expiresInMinutes').optional().isInt({ min: 5, max: 480 }).withMessage('Expiry must be 5–480 minutes'),
  handleValidationErrors
];

export const markAttendanceValidation = [
  body('qrCode').trim().notEmpty().withMessage('QR code / attendance code is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  handleValidationErrors
];

export const manualMarkValidation = [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('status').isIn(['present', 'absent', 'late']).withMessage('Status must be present, absent, or late'),
  handleValidationErrors
];
