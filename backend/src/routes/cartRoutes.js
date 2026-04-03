import express from 'express';
import CartController from '../controllers/cartController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todos estos endpoints requieren autenticación
router.get('/', authMiddleware, CartController.getCart);
router.post('/items', authMiddleware, CartController.addToCart);
router.put('/items/:id', authMiddleware, CartController.updateItem);
router.delete('/items/:id', authMiddleware, CartController.removeItem);
router.delete('/', authMiddleware, CartController.clearCart);

export default router;