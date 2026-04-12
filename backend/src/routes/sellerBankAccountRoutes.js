import express from 'express';
import SellerBankAccountController from '../controllers/sellerBankAccountController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear nueva cuenta bancaria
router.post('/', SellerBankAccountController.createBankAccount);

// Obtener todas las cuentas del vendedor
router.get('/', SellerBankAccountController.getBankAccounts);

// Actualizar cuenta bancaria
router.put('/:id', SellerBankAccountController.updateBankAccount);

// Marcar cuenta como predeterminada
router.put('/:id/default', SellerBankAccountController.setDefaultBankAccount);

// Eliminar cuenta bancaria
router.delete('/:id', SellerBankAccountController.deleteBankAccount);

export default router;
