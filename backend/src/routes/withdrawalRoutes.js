import express from 'express';
import WithdrawalController from '../controllers/withdrawalController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, WithdrawalController.getWithdrawals);
router.post('/request', authenticateToken, WithdrawalController.requestWithdrawal);

export default router;
