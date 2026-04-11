import express from 'express';
import AddressController from '../controllers/addressController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, AddressController.getAddresses);
router.post('/', authenticateToken, AddressController.createAddress);
router.delete('/:id', authenticateToken, AddressController.deleteAddress);
router.put('/:id/default', authenticateToken, AddressController.setDefaultAddress);

export default router;
