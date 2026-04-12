import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import { getLiveClasses, getClassById, createLiveClass, endClass, deleteLiveClass } from './onlineClass.controller.js';

const router = Router();

// Everyone can view classes
router.get('/', protect, getLiveClasses);
router.get('/:id', protect, getClassById);

// Only teachers/admins can create/end/delete
router.post('/', protect, authorize('teacher', 'admin'), createLiveClass);
router.put('/:id/end', protect, authorize('teacher', 'admin'), endClass);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteLiveClass);

export default router;
