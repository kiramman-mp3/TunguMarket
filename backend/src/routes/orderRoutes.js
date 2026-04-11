import express from 'express';
import OrderController from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import paymentUpload from '../middlewares/paymentUploadMiddleware.js';

const router = express.Router();

/**
 * RUTAS DE ÓRDENES
 */

// Rutas de Comprador
router.get('/', authMiddleware, OrderController.getOrders);
router.get('/stats/user', authMiddleware, OrderController.getUserStats);
router.get('/:id', authMiddleware, OrderController.getOrderById);
router.post('/checkout', authMiddleware, paymentUpload.single('receipt'), OrderController.checkout);
router.put('/:id/confirm', authMiddleware, OrderController.confirmOrder);
router.put('/:id/cancel', authMiddleware, OrderController.cancelOrder);
router.post('/:id/validate-payment', authMiddleware, OrderController.validatePayment);

// Rutas de Vendedor
router.get('/seller/sales', authMiddleware, OrderController.getSellerSales);
router.put('/seller/status/:itemId', authMiddleware, OrderController.updateSellerItemStatus);

// Rutas de Admin
router.get('/filter/status/:status', authMiddleware, OrderController.getOrdersByStatus);
router.put('/:id/status', authMiddleware, OrderController.updateStatus);
router.delete('/:id', authMiddleware, OrderController.deleteOrder);
router.put('/payments/:paymentId/approve', authMiddleware, OrderController.approvePayment);
router.put('/payments/:paymentId/reject', authMiddleware, OrderController.rejectPayment);

export default router;
