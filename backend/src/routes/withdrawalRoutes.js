import express from 'express';
import WithdrawalController from '../controllers/withdrawalController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Middleware para validar que es admin
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere permisos de administrador' });
  }
  next();
};

// ===== RUTAS PARA VENDEDORES =====

// Obtener retiros del vendedor
router.get('/', authenticateToken, WithdrawalController.getWithdrawals);

// Crear solicitud de retiro (nueva versión con bank_account_id)
router.post('/', authenticateToken, WithdrawalController.createWithdrawal);

// ===== RUTAS PARA ADMIN =====

// Obtener retiros pendientes
router.get('/admin/pending', authenticateToken, isAdmin, WithdrawalController.getPendingWithdrawals);

// Obtener todos los retiros con filtros
router.get('/admin/all', authenticateToken, isAdmin, WithdrawalController.getAllWithdrawals);

// Aprobar retiro
router.put('/admin/:id/approve', authenticateToken, isAdmin, WithdrawalController.approveWithdrawal);

// Rechazar retiro
router.put('/admin/:id/reject', authenticateToken, isAdmin, WithdrawalController.rejectWithdrawal);

// Marcar como transferido
router.put('/admin/:id/mark-transferred', authenticateToken, isAdmin, WithdrawalController.markTransferred);

export default router;
