import { Router } from 'express';
import { getUsers, updateUser, updateUserRole, deleteUser } from '../controllers/user.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Only SUPER_ADMIN can manage users
router.use(authMiddleware, roleMiddleware(['SUPER_ADMIN']));

router.get('/', getUsers);
router.put('/:id', updateUser);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
