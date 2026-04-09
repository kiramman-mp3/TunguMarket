import express from 'express';
import ReviewController from '../controllers/reviewController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET reseñas de un producto (público) - Paginado
router.get('/product/:productId', ReviewController.getProductReviews);

// GET reseñas mejor valoradas de un producto (público)
router.get('/product/:productId/top', ReviewController.getTopProductReviews);

// GET estadísticas de reseñas de un producto (público)
router.get('/product/:productId/stats', ReviewController.getProductReviewStats);

// GET reseñas de un usuario (público) - Paginado
router.get('/user/:userId', ReviewController.getUserReviews);

// GET reseña específica (público)
router.get('/:id', ReviewController.getReviewById);

// POST crear reseña (DEBE ESTAR AUTH)
router.post('/', authMiddleware, ReviewController.createReview);

// PUT actualizar reseña (autor o admin)
router.put('/:id', authMiddleware, ReviewController.updateReview);

// DELETE eliminar reseña (autor o admin)
router.delete('/:id', authMiddleware, ReviewController.deleteReview);

export default router;
