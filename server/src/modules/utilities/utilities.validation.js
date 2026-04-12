// ─────────────────────────────────────────────────────────
// Utilities Validation – express-validator chains
// ─────────────────────────────────────────────────────────

import { body } from 'express-validator';
import { handleValidationErrors } from '../auth/auth.validation.js';

// ── Notes ───────────────────────────────────────────────
export const createNoteValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  handleValidationErrors
];

// ── Lost & Found ────────────────────────────────────────
export const createLostFoundValidation = [
  body('type').isIn(['lost', 'found']).withMessage('Type must be "lost" or "found"'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  handleValidationErrors
];

// ── Discussion ──────────────────────────────────────────
export const createQuestionValidation = [
  body('question').trim().notEmpty().withMessage('Question is required').isLength({ max: 500 }),
  handleValidationErrors
];

export const addAnswerValidation = [
  body('body').trim().notEmpty().withMessage('Answer body is required'),
  handleValidationErrors
];
