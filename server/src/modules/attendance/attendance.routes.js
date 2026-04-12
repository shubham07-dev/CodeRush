// ─────────────────────────────────────────────────────────
// Attendance Routes
// ─────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import {
  createSession,
  getSessions,
  getSessionRecords,
  markAttendance,
  manualMark,
  getMyAttendance
} from './attendance.controller.js';
import {
  createSessionValidation,
  markAttendanceValidation,
  manualMarkValidation
} from './attendance.validation.js';

const router = Router();

// Teacher / Admin routes
router.post('/sessions', protect, authorize('teacher', 'admin'), createSessionValidation, createSession);
router.get('/sessions', protect, authorize('teacher', 'admin'), getSessions);
router.get('/sessions/:id/records', protect, authorize('teacher', 'admin'), getSessionRecords);
router.put('/manual', protect, authorize('teacher', 'admin'), manualMarkValidation, manualMark);

// Student routes
router.post('/mark', protect, authorize('student'), markAttendanceValidation, markAttendance);
router.get('/my', protect, authorize('student'), getMyAttendance);

export default router;
