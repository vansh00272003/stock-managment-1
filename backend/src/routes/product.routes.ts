import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', roleMiddleware(['SUPER_ADMIN', 'STOCK_MANAGER']), createProduct);
router.put('/:id', roleMiddleware(['SUPER_ADMIN', 'STOCK_MANAGER']), updateProduct);
router.delete('/:id', roleMiddleware(['SUPER_ADMIN']), deleteProduct);

export default router;
