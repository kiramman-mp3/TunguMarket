import pool from '../config/db.js';

class UserModel {
  static async createUser({ name, email, passwordHash, firebaseUid, roleId, birthDate }) {
    const query = `
      INSERT INTO users (name, email, password_hash, firebase_uid, role_id, birth_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [name, email, passwordHash, firebaseUid ?? null, roleId, birthDate];
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

  // Verification Token Management
  static async createVerificationToken(userId, token) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes
    const query = 'INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *';
    const { rows } = await pool.query(query, [userId, token, expiresAt]);
    return rows[0];
  }

  static async findVerificationToken(token) {
    const query = 'SELECT * FROM verification_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP';
    const { rows } = await pool.query(query, [token]);
    return rows[0];
  }

  static async deleteVerificationToken(token) {
    const query = 'DELETE FROM verification_tokens WHERE token = $1';
    await pool.query(query, [token]);
  }

  static async deleteVerificationTokensByUser(userId) {
    const query = 'DELETE FROM verification_tokens WHERE user_id = $1';
    await pool.query(query, [userId]);
  }

  // Password Reset Token Management
  static async createPasswordResetToken(userId, token) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour
    const query = 'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *';
    const { rows } = await pool.query(query, [userId, token, expiresAt]);
    return rows[0];
  }

  static async findPasswordResetToken(token) {
    const query = 'SELECT * FROM password_resets WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP';
    const { rows } = await pool.query(query, [token]);
    return rows[0];
  }

  static async deletePasswordResetToken(token) {
    const query = 'DELETE FROM password_resets WHERE token = $1';
    await pool.query(query, [token]);
  }

  static async deletePasswordResetTokensByUser(userId) {
    const query = 'DELETE FROM password_resets WHERE user_id = $1';
    await pool.query(query, [userId]);
  }

  static async updatePassword(id, passwordHash) {
    const query = 'UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id, passwordHash]);
    return rows[0];
  }

  // Login Logs
  static async recordLoginLog({ userId, email, ipAddress, deviceInfo, status, message }) {
    const query = `
      INSERT INTO login_logs (user_id, email, ip_address, device_info, status, message)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [userId, email, ipAddress, deviceInfo, status, message];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async updateSellerProfile(id, { seller_name, seller_bio }) {
    const query = `
      UPDATE users 
      SET seller_name = $1, seller_bio = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING id, name, email, seller_name, seller_bio
    `;
    const { rows } = await pool.query(query, [seller_name, seller_bio, id]);
    return rows[0];
  }
}

export default UserModel;
