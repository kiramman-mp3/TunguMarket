import express from 'express';
import WalletController from '../controllers/walletController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/summary', authenticateToken, WalletController.getSummary);
router.get('/transactions', authenticateToken, WalletController.getTransactions);
router.post('/clear-debt/:userId', authenticateToken, WalletController.clearDebt);

export default router;
