import pool from '../config/db.js';

class ReviewModel {
  /**
   * Crea una nueva reseña
   * @param {string} productId - ID del producto
   * @param {string} userId - ID del usuario
   * @param {number} rating - Calificación (1-5)
   * @param {string} comment - Comentario
   * @returns {object} Reseña creada
   */
  static async create(productId, userId, rating, comment = null) {
    const query = `
      INSERT INTO reviews (product_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [productId, userId, rating, comment]);
    return rows[0];
  }

  /**
   * Obtiene todas las reseñas de un producto
   * @param {string} productId - ID del producto
   * @param {number} limit - Límite
   * @param {number} offset - Desplazamiento
   * @returns {object} {reviews, total}
   */
  static async findByProductId(productId, limit = 10, offset = 0) {
    const countQuery = `
      SELECT COUNT(*)::integer as count FROM reviews
      WHERE product_id = $1
    `;

    const dataQuery = `
      SELECT
        r.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [productId]),
      pool.query(dataQuery, [productId, limit, offset])
    ]);

    return {
      reviews: dataResult.rows,
      total: countResult.rows[0].count
    };
  }

  /**
   * Obtiene reseñas de un usuario
   * @param {string} userId - ID del usuario
   * @param {number} limit - Límite
   * @param {number} offset - Desplazamiento
   * @returns {object} {reviews, total}
   */
  static async findByUserId(userId, limit = 10, offset = 0) {
    const countQuery = `
      SELECT COUNT(*)::integer as count FROM reviews
      WHERE user_id = $1
    `;

    const dataQuery = `
      SELECT
        r.*,
        p.title as product_title,
        p.id as product_id
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [userId]),
      pool.query(dataQuery, [userId, limit, offset])
    ]);

    return {
      reviews: dataResult.rows,
      total: countResult.rows[0].count
    };
  }

  /**
   * Obtiene una reseña específica
   * @param {string} id - ID de la reseña
   * @returns {object} Datos de la reseña
   */
  static async findById(id) {
    const query = `
      SELECT
        r.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        p.title as product_title
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.id = $1
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Obtiene la reseña de un usuario para un producto específico
   * @param {string} productId - ID del producto
   * @param {string} userId - ID del usuario
   * @returns {object} La reseña
   */
  static async findByProductAndUser(productId, userId) {
    const query = `
      SELECT * FROM reviews
      WHERE product_id = $1 AND user_id = $2
    `;

    const { rows } = await pool.query(query, [productId, userId]);
    return rows[0] || null;
  }

  /**
   * Actualiza una reseña
   * @param {string} id - ID de la reseña
   * @param {object} updates - {rating, comment}
   * @returns {object} Reseña actualizada
   */
  static async update(id, updates = {}) {
    const allowedFields = ['rating', 'comment'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `
      UPDATE reviews
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  /**
   * Elimina una reseña
   * @param {string} id - ID de la reseña
   * @returns {boolean} Éxito
   */
  static async delete(id) {
    const query = `
      DELETE FROM reviews
      WHERE id = $1
      RETURNING id
    `;

    const { rows } = await pool.query(query, [id]);
    return rows.length > 0;
  }

  /**
   * Obtiene estadísticas de reseñas de un producto
   * @param {string} productId - ID del producto
   * @returns {object} {total, average, distribution}
   */
  static async getProductStats(productId) {
    const query = `
      SELECT
        COUNT(*)::integer as total_reviews,
        ROUND(AVG(rating)::numeric, 2)::numeric as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END)::integer as five_stars,
        COUNT(CASE WHEN rating = 4 THEN 1 END)::integer as four_stars,
        COUNT(CASE WHEN rating = 3 THEN 1 END)::integer as three_stars,
        COUNT(CASE WHEN rating = 2 THEN 1 END)::integer as two_stars,
        COUNT(CASE WHEN rating = 1 THEN 1 END)::integer as one_star
      FROM reviews
      WHERE product_id = $1
    `;

    const { rows } = await pool.query(query, [productId]);

    return {
      total_reviews: rows[0].total_reviews,
      average_rating: rows[0].average_rating || 0,
      distribution: {
        five_stars: rows[0].five_stars,
        four_stars: rows[0].four_stars,
        three_stars: rows[0].three_stars,
        two_stars: rows[0].two_stars,
        one_star: rows[0].one_star
      }
    };
  }

  /**
   * Obtiene reseñas mejor valoradas de un producto
   * @param {string} productId - ID del producto
   * @param {number} limit - Límite
   * @returns {array} Reseñas ordenadas por rating
   */
  static async getTopReviews(productId, limit = 5) {
    const query = `
      SELECT
        r.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.rating DESC, r.created_at DESC
      LIMIT $2
    `;

    const { rows } = await pool.query(query, [productId, limit]);
    return rows;
  }

  /**
   * Verifica si un usuario puede dejar reseña (solo si compró el producto)
   * NOTA: Esto depende de tu lógica de órdenes. Por ahora permite si existe la reseña UNIQUE constraint
   * @param {string} productId - ID del producto
   * @param {string} userId - ID del usuario
   * @returns {boolean}
   */
  /**
   * Verifica si el usuario tiene una compra completada del producto
   */
  static async hasCompletedPurchase(productId, userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = $1 
        AND o.user_id = $2
        AND o.status = 'Envío completado'
    `;
    const { rows } = await pool.query(query, [productId, userId]);
    return parseInt(rows[0].count, 10) > 0;
  }
}

export default ReviewModel;
