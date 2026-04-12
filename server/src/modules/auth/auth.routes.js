// ─────────────────────────────────────────────────────────
// Auth Routes – register, login, me, refresh, logout
// ─────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  login,
  logout,
  me,
  refreshAccessToken,
  register
} from './auth.controller.js';
import { protect } from '../../middleware/auth.js';
import {
  loginValidation,
  refreshValidation,
  registerValidation
} from './auth.validation.js';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);   // Create account
router.post('/login', loginValidation, login);             // Sign in
router.post('/refresh', refreshValidation, refreshAccessToken); // Refresh token

// Protected routes (require valid access token)
router.get('/me', protect, me);                            // Current user profile
router.post('/logout', protect, logout);                   // Invalidate refresh token

export default router;
