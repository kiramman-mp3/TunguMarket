import pool from '../config/db.js';

class NotificationModel {
  /**
   * Crea una nueva notificación
   */
  static async create({ userId, title, message, type = 'info' }) {
    const query = `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, title, message, type]);
    return rows[0];
  }

  /**
   * Obtiene notificaciones de un usuario
   */
  static async getByUser(userId, limit = 50) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const { rows } = await pool.query(query, [userId, limit]);
    return rows;
  }

  /**
   * Marca una notificación como leída
   */
  static async markAsRead(id, userId) {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id, userId]);
    return rows[0];
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1
      RETURNING id
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows.length;
  }

  /**
   * Guarda una nueva suscripción Web Push para el usuario
   */
  static async savePushSubscription(userId, subscription) {
    const { endpoint, keys } = subscription;
    const p256dh = keys?.p256dh;
    const auth = keys?.auth;
    
    // Upsert on conflict by endpoint
    const query = `
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, endpoint) 
      DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, created_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [userId, endpoint, p256dh, auth]);
    return rows[0];
  }

  /**
   * Obtiene todas las suscripciones Push de un usuario
   */
  static async getPushSubscriptions(userId) {
    const query = `SELECT * FROM push_subscriptions WHERE user_id = $1`;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }
}

export default NotificationModel;
