import WithdrawalModel from '../models/withdrawalModel.js';
import UserModel from '../models/userModel.js';
import pool from '../config/db.js';

class WithdrawalController {
  static async requestWithdrawal(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userId = req.user.id;
      const { amount, bankInfo } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
      }

      // Intentar descontar saldo de forma atómica
      const updateResult = await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance',
        [amount, userId]
      );

      if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Saldo insuficiente para procesar el retiro' });
      }

      // Crear solicitud de retiro
      const withdrawal = await WithdrawalModel.create(userId, amount, bankInfo);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Solicitud de retiro enviada',
        data: withdrawal
      });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }

  static async getWithdrawals(req, res) {
    try {
      const userId = req.user.id;
      const withdrawals = await WithdrawalModel.getByUser(userId);
      res.status(200).json({ data: withdrawals });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default WithdrawalController;
