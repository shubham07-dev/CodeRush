// ─────────────────────────────────────────────────────────
// Complaint Routes
// ─────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  addResponse,
  createComplaint,
  getComplaintById,
  getComplaints,
  updateStatus
} from './complaint.controller.js';
import {
  addResponseValidation,
  createComplaintValidation,
  updateStatusValidation
} from './complaint.validation.js';

const router = Router();

// Student raises a complaint
router.post('/', protect, authorize('student'), createComplaintValidation, createComplaint);

// List complaints (students see own, admin/teacher see all)
router.get('/', protect, getComplaints);

// Single complaint detail
router.get('/:id', protect, getComplaintById);

// Admin/Teacher updates complaint status
router.put('/:id/status', protect, authorize('teacher', 'admin'), updateStatusValidation, updateStatus);

// Admin/Teacher adds a response
router.post('/:id/responses', protect, authorize('teacher', 'admin'), addResponseValidation, addResponse);

export default router;
