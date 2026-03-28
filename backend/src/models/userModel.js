import pool from '../config/db.js';

class UserModel {
  static async createUser({ name, email, passwordHash, firebaseUid, roleId }) {
    const query = `
      INSERT INTO users (name, email, password_hash, firebase_uid, role_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [name, email, passwordHash, firebaseUid, roleId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async updateVerification(id, isVerified) {
    const query = 'UPDATE users SET is_verified = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id, isVerified]);
    return rows[0];
  }

  static async incrementLoginAttempts(email) {
    const query = 'UPDATE users SET login_attempts = login_attempts + 1, last_attempt = CURRENT_TIMESTAMP WHERE email = $1 RETURNING login_attempts';
    const { rows } = await pool.query(query, [email]);
    return rows[0]?.login_attempts;
  }

  static async resetLoginAttempts(email) {
    const query = 'UPDATE users SET login_attempts = 0, last_attempt = NULL WHERE email = $1';
    await pool.query(query, [email]);
  }

  static async banUser(id, isBanned) {
    const query = 'UPDATE users SET is_banned = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id, isBanned]);
    return rows[0];
  }
}

export default UserModel;
