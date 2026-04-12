import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import { getNotifications, markAsRead, markAllAsRead } from './notification.controller.js';

const router = Router();

// All notification routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
