// ─────────────────────────────────────────────────────────
// Utilities Routes – Notes, Lost & Found, Discussion
// ─────────────────────────────────────────────────────────

import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import { noteUploader } from '../../utils/upload.js';

import { createNote, deleteNote, getNotes } from './notes.controller.js';
import { createPost, getPosts, updatePost } from './lostfound.controller.js';
import { addAnswer, createQuestion, getDiscussions, toggleSolved } from './discussion.controller.js';
import {
  addAnswerValidation,
  createLostFoundValidation,
  createNoteValidation,
  createQuestionValidation
} from './utilities.validation.js';

const router = Router();

// ── Notes ───────────────────────────────────────────────
router.post('/notes', protect, noteUploader.single('file'), createNoteValidation, createNote);
router.get('/notes', protect, getNotes);
router.delete('/notes/:id', protect, deleteNote);

// ── Lost & Found ────────────────────────────────────────
router.post('/lostfound', protect, createLostFoundValidation, createPost);
router.get('/lostfound', protect, getPosts);
router.put('/lostfound/:id', protect, updatePost);

// ── Discussion ──────────────────────────────────────────
router.post('/discussions', protect, createQuestionValidation, createQuestion);
router.get('/discussions', protect, getDiscussions);
router.post('/discussions/:id/answers', protect, addAnswerValidation, addAnswer);
router.put('/discussions/:id/solved', protect, toggleSolved);

export default router;
