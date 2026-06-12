import express from 'express';
import AuthController from '../controllers/authController.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/validate-reset-token', AuthController.validateResetToken);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes (require valid token and session)
router.post('/logout', authMiddleware, AuthController.logout);

// Admin only routes
router.post('/remote-logout', authMiddleware, isAdmin, AuthController.remoteLogout);

export default router;
