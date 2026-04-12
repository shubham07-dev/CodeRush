// ─────────────────────────────────────────────────────────
// Location Routes – admin-only campus location management
// ─────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  addLocation,
  deleteLocation,
  getLocations,
  updateLocation
} from './location.controller.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../auth/auth.validation.js';

const router = Router();

const locationValidation = [
  body('name').trim().notEmpty().withMessage('Location name is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('radiusMetres').optional().isInt({ min: 10, max: 5000 }).withMessage('Radius must be 10–5000m'),
  handleValidationErrors
];

// All routes require admin role
router.get('/', protect, getLocations);
router.post('/', protect, authorize('admin'), locationValidation, addLocation);
router.put('/:id', protect, authorize('admin'), updateLocation);
router.delete('/:id', protect, authorize('admin'), deleteLocation);

export default router;
