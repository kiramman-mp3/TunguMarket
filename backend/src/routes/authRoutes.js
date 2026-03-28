import express from 'express';
import AuthController from '../controllers/authController.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleLogin);

// Protected routes (require valid token and session)
router.post('/logout', authMiddleware, AuthController.logout);

// Admin only routes
router.post('/remote-logout', authMiddleware, isAdmin, AuthController.remoteLogout);

export default router;
