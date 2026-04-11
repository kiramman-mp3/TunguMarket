import WalletModel from '../models/walletModel.js';
import pool from '../config/db.js';

class WalletController {
  /**
   * GET /api/wallet/summary
   * Obtiene el resumen financiero del usuario logueado
   */
  static async getSummary(req, res) {
    try {
      const userId = req.user.id;
      const summary = await WalletModel.getWalletSummary(userId);
      res.status(200).json({
        message: 'Resumen de billetera obtenido',
        data: summary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/wallet/transactions
   * Obtiene el historial de transacciones
   */
  static async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const { transactions, total } = await WalletModel.getTransactionHistory(userId, limitNum, offset);

      res.status(200).json({
        message: 'Transacciones obtenidas',
        data: {
          transactions,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  static async clearDebt(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden saldar deudas.' });
      }

      const { userId } = req.params;
      const { amount } = req.body;

      if (!userId || !amount) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos.' });
      }

      // Restablece el balance sumando la cantidad pagada y desbloqueándolo
      await pool.query(
        'UPDATE users SET balance = balance + $1, blocked_for_debt = false WHERE id = $2',
        [amount, userId]
      );

      await WalletModel.createTransaction(
        userId,
        null,
        'debt_payment',
        amount,
        0,
        'Pago de deuda por saldo en efectivo (Liquidación de Administrador)'
      );

      res.status(200).json({ message: 'Deuda saldada, el usuario ha sido desbloqueado.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default WalletController;
