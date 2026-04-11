import pool from '../config/db.js';

class WithdrawalModel {
  /**
   * Crea una solicitud de retiro
   */
  static async create(userId, amount, bankInfo) {
    const query = `
      INSERT INTO withdrawals (user_id, amount, bank_info)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, amount, bankInfo]);
    return rows[0];
  }

  /**
   * Obtiene retiros de un usuario
   */
  static async getByUser(userId) {
    const query = `
      SELECT * FROM withdrawals
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  /**
   * Actualiza el estado de un retiro (para Admin)
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE withdrawals
      SET status = $2
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id, status]);
    return rows[0];
  }
}

export default WithdrawalModel;
