import pool from '../config/db.js';

class WithdrawalModel {
  /**
   * Crea una solicitud de retiro (versión antigua - mantener para compatibilidad)
   */
  static async create(userId, amount, bankInfo) {
    const query = `
      INSERT INTO withdrawals (user_id, amount, bank_info, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'pendiente', NOW(), NOW())
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, amount, bankInfo]);
    return rows[0];
  }

  /**
   * Crea una solicitud de retiro con cuenta bancaria guardada (nueva versión)
   */
  static async createWithBankAccount(userId, amount, bankAccountId) {
    const query = `
      INSERT INTO withdrawals (user_id, amount, bank_account_id, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'pendiente', NOW(), NOW())
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, amount, bankAccountId]);
    return rows[0];
  }

  /**
   * Obtiene retiros de un usuario
   */
  static async getByUser(userId) {
    const query = `
      SELECT w.*, sba.banco, sba.tipo_cuenta, sba.numero_cuenta, sba.titular
      FROM withdrawals w
      LEFT JOIN seller_bank_accounts sba ON w.bank_account_id = sba.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  /**
   * Obtiene un retiro por ID (con datos de banco)
   */
  static async findById(id) {
    const query = `
      SELECT w.*, sba.banco, sba.tipo_cuenta, sba.numero_cuenta, sba.titular, sba.cedula_ruc, sba.email_titular,
             u.email as user_email, u.name as user_name
      FROM withdrawals w
      LEFT JOIN seller_bank_accounts sba ON w.bank_account_id = sba.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Obtiene todos los retiros pendientes (para admin)
   */
  static async findPending() {
    const query = `
      SELECT w.*, sba.banco, sba.tipo_cuenta, sba.numero_cuenta, sba.titular, sba.cedula_ruc, sba.email_titular,
             u.email as user_email, u.name as user_name, u.id as user_id
      FROM withdrawals w
      LEFT JOIN seller_bank_accounts sba ON w.bank_account_id = sba.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.status = 'pendiente'
      ORDER BY w.created_at ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  /**
   * Obtiene retiros por estado (para admin)
   */
  static async findByStatus(status) {
    const query = `
      SELECT w.*, sba.banco, sba.tipo_cuenta, sba.numero_cuenta, sba.titular, sba.cedula_ruc, sba.email_titular,
             u.email as user_email, u.name as user_name, u.id as user_id
      FROM withdrawals w
      LEFT JOIN seller_bank_accounts sba ON w.bank_account_id = sba.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.status = $1
      ORDER BY w.created_at DESC
    `;
    const { rows } = await pool.query(query, [status]);
    return rows;
  }

  /**
   * Obtiene retiros con filtros (para admin)
   */
  static async findWithFilters(filters = {}) {
    let query = `
      SELECT w.*, sba.banco, sba.tipo_cuenta, sba.numero_cuenta, sba.titular, sba.cedula_ruc, sba.email_titular,
             u.email as user_email, u.name as user_name, u.id as user_id
      FROM withdrawals w
      LEFT JOIN seller_bank_accounts sba ON w.bank_account_id = sba.id
      LEFT JOIN users u ON w.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND w.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.userId) {
      query += ` AND w.user_id = $${paramCount}`;
      params.push(filters.userId);
      paramCount++;
    }

    if (filters.fromDate) {
      query += ` AND w.created_at >= $${paramCount}`;
      params.push(filters.fromDate);
      paramCount++;
    }

    if (filters.toDate) {
      query += ` AND w.created_at <= $${paramCount}`;
      params.push(filters.toDate);
      paramCount++;
    }

    query += ' ORDER BY w.created_at DESC';

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Actualiza el estado de un retiro (versión antigua)
   */
  static async updateStatus(id, status) {
    const query = `
      UPDATE withdrawals
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id, status]);
    return rows[0];
  }

  /**
   * Actualiza retiro con validación de admin
   */
  static async updateWithValidation(id, status, validatedBy, validationNotes = null) {
    const query = `
      UPDATE withdrawals
      SET status = $2, validated_by = $3, validation_notes = $4, validated_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id, status, validatedBy, validationNotes]);
    return rows[0];
  }
}

export default WithdrawalModel;
