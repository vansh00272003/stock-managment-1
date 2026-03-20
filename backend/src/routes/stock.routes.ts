import { Router } from 'express';
import { 
  getStockLevels, 
  createStockMovement, 
  getLocations, 
  createLocation, 
  getStockMovements,
  updateStockLevel,
  deleteStockLevel
} from '../controllers/stock.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/levels', getStockLevels);
router.put('/levels/:id', roleMiddleware(['SUPER_ADMIN', 'STOCK_MANAGER']), updateStockLevel);
router.delete('/levels/:id', roleMiddleware(['SUPER_ADMIN', 'STOCK_MANAGER']), deleteStockLevel);
router.get('/movements', getStockMovements);
router.post('/movements', roleMiddleware(['SUPER_ADMIN', 'STOCK_MANAGER']), createStockMovement);
router.get('/locations', getLocations);
router.post('/locations', roleMiddleware(['SUPER_ADMIN']), createLocation);

export default router;
