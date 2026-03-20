import { Router } from 'express';
import { getOrders, getOrderById, createOrder, updateOrderStatus, updateOrder } from '../controllers/order.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.patch('/:id/status', roleMiddleware(['SUPER_ADMIN']), updateOrderStatus);

export default router;
