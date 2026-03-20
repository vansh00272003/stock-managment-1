import { Router } from 'express';
import { getLocations, getLocationById, createLocation, updateLocation, deleteLocation } from '../controllers/location.controller.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware, getLocations);
router.get('/:id', authMiddleware, getLocationById);
router.post('/', authMiddleware, isAdmin, createLocation);
router.put('/:id', authMiddleware, isAdmin, updateLocation);
router.delete('/:id', authMiddleware, isAdmin, deleteLocation);

export default router;
