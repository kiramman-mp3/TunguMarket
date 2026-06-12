import pool from '../config/db.js';

class SellerBankAccountModel {
  // Crear nueva cuenta bancaria
  static async create(userId, bankData) {
    const { banco, tipo_cuenta, numero_cuenta, titular, cedula_ruc, email_titular } = bankData;
    try {
      const result = await pool.query(
        `INSERT INTO seller_bank_accounts (user_id, banco, tipo_cuenta, numero_cuenta, titular, cedula_ruc, email_titular, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
         RETURNING *`,
        [userId, banco, tipo_cuenta, numero_cuenta, titular, cedula_ruc, email_titular]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error al crear cuenta bancaria: ${error.message}`);
    }
  }

  // Obtener todas las cuentas de un vendedor
  static async findByUserId(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM seller_bank_accounts WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener cuentas bancarias: ${error.message}`);
    }
  }

  // Obtener cuenta por ID
  static async findById(accountId, userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM seller_bank_accounts WHERE id = $1 AND user_id = $2',
        [accountId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener cuenta bancaria: ${error.message}`);
    }
  }

  // Obtener cuenta predeterminada
  static async getDefault(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM seller_bank_accounts WHERE user_id = $1 AND is_default = true LIMIT 1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener cuenta predeterminada: ${error.message}`);
    }
  }

  // Actualizar cuenta bancaria
  static async update(accountId, userId, bankData) {
    const { banco, tipo_cuenta, numero_cuenta, titular, cedula_ruc, email_titular } = bankData;
    try {
      const result = await pool.query(
        `UPDATE seller_bank_accounts 
         SET banco = $1, tipo_cuenta = $2, numero_cuenta = $3, titular = $4, cedula_ruc = $5, email_titular = $6, updated_at = NOW()
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [banco, tipo_cuenta, numero_cuenta, titular, cedula_ruc, email_titular, accountId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al actualizar cuenta bancaria: ${error.message}`);
    }
  }

  // Marcar cuenta como predeterminada
  static async setDefault(accountId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Desmarcar todas las otras
      await client.query(
        'UPDATE seller_bank_accounts SET is_default = false WHERE user_id = $1',
        [userId]
      );
      
      // Marcar esta como predeterminada
      const result = await client.query(
        'UPDATE seller_bank_accounts SET is_default = true, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
        [accountId, userId]
      );
      
      await client.query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error al establecer cuenta predeterminada: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Eliminar cuenta bancaria
  static async delete(accountId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM seller_bank_accounts WHERE id = $1 AND user_id = $2 RETURNING *',
        [accountId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error al eliminar cuenta bancaria: ${error.message}`);
    }
  }

  // Verificar que no hay retiros pendientes en esta cuenta
  static async hasPendingWithdrawals(accountId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM withdrawals WHERE bank_account_id = $1 AND status = $2',
        [accountId, 'pendiente']
      );
      return result.rows[0].count > 0;
    } catch (error) {
      throw new Error(`Error al verificar retiros: ${error.message}`);
    }
  }
}

export default SellerBankAccountModel;
