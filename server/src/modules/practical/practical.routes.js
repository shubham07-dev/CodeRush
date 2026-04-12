import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import { 
  createPractical, 
  getPracticals,
  getPracticalById,
  submitPractical,
  getSubmissionsForPractical
} from './practical.controller.js';

const router = Router();

// Get all practicals
router.get('/', protect, getPracticals);

// Get practical by ID
router.get('/:id', protect, getPracticalById);

// Teacher gets all submissions for a practical
router.get('/:id/submissions', protect, authorize('teacher', 'admin'), getSubmissionsForPractical);

// Teacher creates a practical
router.post('/', protect, authorize('teacher', 'admin'), createPractical);

// Student submits an execution for a practical
router.post('/:id/submit', protect, authorize('student'), submitPractical);

export default router;
