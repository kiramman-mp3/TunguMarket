import express from 'express';
import WishlistController from '../controllers/wishlistController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, WishlistController.getFavorites);
router.post('/toggle', authenticateToken, WishlistController.toggleFavorite);

export default router;
