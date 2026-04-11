import pool from '../config/db.js';

class WishlistModel {
  /**
   * Agrega un producto a la lista de deseos
   */
  static async add(userId, productId) {
    const query = `
      INSERT INTO wishlists (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, productId]);
    return rows[0];
  }

  /**
   * Elimina un producto de la lista de deseos
   */
  static async remove(userId, productId) {
    const query = `
      DELETE FROM wishlists
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, productId]);
    return rows[0];
  }

  /**
   * Obtiene todos los favoritos de un usuario
   */
  static async getByUser(userId) {
    const query = `
      SELECT w.*, p.title, p.price, p.stock, 
             (SELECT url FROM product_images WHERE product_id = p.id LIMIT 1) as image_url
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  /**
   * Verifica si un producto está en la lista de deseos
   */
  static async isFavorite(userId, productId) {
    const query = `SELECT 1 FROM wishlists WHERE user_id = $1 AND product_id = $2`;
    const { rows } = await pool.query(query, [userId, productId]);
    return rows.length > 0;
  }
}

export default WishlistModel;
