import pool from '../config/db.js';

class WalletModel {
  /**
   * Crea una nueva transacción en la billetera
   * @param {string} userId - ID del vendedor/usuario
   * @param {string|null} orderId - ID de la orden vinculada (opcional)
   * @param {string} type - Tipo de transacción: 'earning', 'withdrawal', 'refund'
   * @param {number} amount - Monto neto para el vendedor
   * @param {number} commission - Comisión retenida por la plataforma
   * @param {string} description - Descripción o concepto
   * @param {string} status - Estado de la transacción
   */
  static async createTransaction(userId, orderId, type, amount, commission = 0, description = '', status = 'completed') {
    const query = `
      INSERT INTO wallet_transactions (user_id, order_id, type, amount, commission, description, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, orderId, type, amount, commission, description, status]);
    return rows[0];
  }

  /**
   * Obtiene el balance total y resumen de la billetera del usuario
   * @param {string} userId 
   */
  static async getWalletSummary(userId) {
    // 1. Obtener balance real desde la tabla users (fuente de verdad)
    const userBalanceQuery = 'SELECT balance FROM users WHERE id = $1';
    const { rows: userRows } = await pool.query(userBalanceQuery, [userId]);
    const currentBalance = parseFloat(userRows[0]?.balance || 0);

    // 2. Obtener estadísticas agregadas del historial
    const statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ('earning', 'debt_commission') AND status = 'completed' THEN amount ELSE 0 END), 0) as net_earnings,
        COALESCE(SUM(CASE WHEN type = 'withdrawal' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_withdrawals,
        COALESCE(SUM(commission), 0) as total_commission_paid
      FROM wallet_transactions
      WHERE user_id = $1 AND status = 'completed'
    `;
    const { rows: statsRows } = await pool.query(statsQuery, [userId]);
    const stats = statsRows[0];
    
    return {
      balance: currentBalance,
      totalEarnings: parseFloat(stats.net_earnings),
      totalWithdrawals: parseFloat(stats.total_withdrawals),
      totalCommissionPaid: parseFloat(stats.total_commission_paid)
    };
  }

  /**
   * Obtiene el historial de transacciones de un usuario
   * @param {string} userId 
   * @param {number} limit 
   * @param {number} offset 
   */
  static async getTransactionHistory(userId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM wallet_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await pool.query(query, [userId, limit, offset]);
    
    const countQuery = `SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1`;
    const { rows: countRows } = await pool.query(countQuery, [userId]);
    
    return {
      transactions: rows,
      total: parseInt(countRows[0].count, 10)
    };
  }
}

export default WalletModel;
