import { Router } from 'express';
import { 
  getInvoices, 
  getInvoiceById, 
  createInvoice, 
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice 
} from '../controllers/invoice.controller.js';
import { authMiddleware, roleMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', roleMiddleware(['SUPER_ADMIN']), createInvoice);
router.put('/:id', roleMiddleware(['SUPER_ADMIN']), updateInvoice);
router.patch('/:id/status', roleMiddleware(['SUPER_ADMIN']), updateInvoiceStatus);
router.delete('/:id', roleMiddleware(['SUPER_ADMIN']), deleteInvoice);

export default router;
