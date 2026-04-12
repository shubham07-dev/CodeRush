// ─────────────────────────────────────────────────────────
// Complaint Validation – express-validator chains
// ─────────────────────────────────────────────────────────

import { body } from 'express-validator';
import { handleValidationErrors } from '../auth/auth.validation.js';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUSES } from './complaint.model.js';

export const createComplaintValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(COMPLAINT_CATEGORIES).withMessage(`Category must be one of: ${COMPLAINT_CATEGORIES.join(', ')}`),
  handleValidationErrors
];

export const updateStatusValidation = [
  body('status').isIn(COMPLAINT_STATUSES).withMessage(`Status must be one of: ${COMPLAINT_STATUSES.join(', ')}`),
  handleValidationErrors
];

export const addResponseValidation = [
  body('message').trim().notEmpty().withMessage('Response message is required'),
  handleValidationErrors
];
