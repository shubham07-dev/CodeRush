import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.js';
import { getUsers, updateUser, deleteUser } from './user.controller.js';

const router = Router();

router.use(protect);
router.use(authorize('admin', 'teacher'));

router.get('/', getUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
