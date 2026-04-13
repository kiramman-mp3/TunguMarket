import express from 'express';
import OrderController from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import paymentUpload from '../middlewares/paymentUploadMiddleware.js';

const router = express.Router();

/**
 * RUTAS DE ÓRDENES
 */

// Rutas de Admin (DEBEN IR PRIMERO - rutas específicas)
router.get('/admin/payments', authMiddleware, OrderController.getAllPayments);
router.get('/admin/payments/pending', authMiddleware, OrderController.getPendingPayments);
router.patch('/admin/payments/:paymentId/approve', authMiddleware, OrderController.approvePayment);
router.patch('/admin/payments/:paymentId/reject', authMiddleware, OrderController.rejectPayment);
router.get('/filter/status/:status', authMiddleware, OrderController.getOrdersByStatus);

// Rutas de Vendedor (específicas debe ir antes de genéricas)
router.get('/seller/sales', authMiddleware, OrderController.getSellerSales);
router.put('/seller/status/:itemId', authMiddleware, OrderController.updateSellerItemStatus);

// Rutas de Comprador (GENERALES - van al final)
router.get('/', authMiddleware, OrderController.getOrders);
router.get('/stats/user', authMiddleware, OrderController.getUserStats);
router.post('/checkout', authMiddleware, paymentUpload.single('receipt'), OrderController.checkout);
router.post('/:id/validate-payment', authMiddleware, OrderController.validatePayment);
router.put('/:id/confirm', authMiddleware, OrderController.confirmOrder);
router.put('/:id/cancel', authMiddleware, OrderController.cancelOrder);
router.put('/:id/status', authMiddleware, OrderController.updateStatus);
router.delete('/:id', authMiddleware, OrderController.deleteOrder);
router.get('/:id', authMiddleware, OrderController.getOrderById);

export default router;
