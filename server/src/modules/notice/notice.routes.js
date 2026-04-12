// ─────────────────────────────────────────────────────────
// Notice Routes – with file upload support
// ─────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import { noticeUploader } from '../../utils/upload.js';
import {
  createNotice,
  deleteNotice,
  getAllNotices,
  getNoticeById
} from './notice.controller.js';

const router = Router();

// Create notice – teacher / admin only, up to 5 file attachments
router.post(
  '/',
  protect,
  authorize('teacher', 'admin'),
  noticeUploader.array('attachments', 5),
  createNotice
);

// List all notices visible to current user's role
router.get('/', protect, getAllNotices);

// Get single notice (marks as read)
router.get('/:id', protect, getNoticeById);

// Delete notice – admin or author
router.delete('/:id', protect, deleteNotice);

export default router;
