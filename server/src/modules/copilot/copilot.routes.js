// ─────────────────────────────────────────────────────────
// Copilot Routes
// ─────────────────────────────────────────────────────────

import { Router } from 'express';
import { chat } from './copilot.controller.js';
import { protect } from '../../middleware/auth.js';

const router = Router();

// POST /api/v1/copilot/chat  (auth required)
router.post('/chat', protect, chat);

export default router;
