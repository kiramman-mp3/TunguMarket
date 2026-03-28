import pool from '../config/db.js';

class SessionModel {
  static async createSession({ userId, token, ipAddress, deviceInfo, expiresAt }) {
    const query = `
      INSERT INTO sessions (user_id, token, ip_address, device_info, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [userId, token, ipAddress, deviceInfo, expiresAt];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByToken(token) {
    const query = 'SELECT * FROM sessions WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP';
    const { rows } = await pool.query(query, [token]);
    return rows[0];
  }

  static async deleteSession(token) {
    const query = 'DELETE FROM sessions WHERE token = $1';
    await pool.query(query, [token]);
  }

  static async deleteByUser(userId) {
    const query = 'DELETE FROM sessions WHERE user_id = $1';
    await pool.query(query, [userId]);
  }

  static async findActiveSessionsByUser(userId) {
    const query = 'SELECT * FROM sessions WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP';
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }
}

export default SessionModel;
