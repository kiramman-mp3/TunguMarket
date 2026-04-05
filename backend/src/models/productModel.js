import pool from '../config/db.js';

class ProductModel {
  /**
   * Crea un nuevo producto
   * @param {object} productData - {seller_id, category_id, title, description, price, stock}
   * @returns {object} Producto creado
   */
  static async create(productData) {
    const { seller_id, category_id, title, description, price, stock = 1 } = productData;

    const query = `
      INSERT INTO products (seller_id, category_id, title, description, price, stock, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'activo')
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      seller_id,
      category_id,
      title,
      description,
      price,
      stock
    ]);

    return rows[0];
  }

  /**
   * Obtiene todos los productos activos con paginación
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Desplazamiento
   * @returns {object} {products, total}
   */
  static async findAll(limit = 20, offset = 0) {
    const countQuery = `SELECT COUNT(*)::integer as count FROM products WHERE status = 'activo'`;
    const dataQuery = `
      SELECT
        p.*,
        c.name as category_name,
        u.name as seller_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'activo'
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery),
      pool.query(dataQuery, [limit, offset])
    ]);

    return {
      products: dataResult.rows,
      total: countResult.rows[0].count
    };
  }

  /**
   * Obtiene productos por categoría
   * @param {string} categoryId - ID de la categoría
   * @param {number} limit - Límite
   * @param {number} offset - Desplazamiento
   * @returns {object} {products, total}
   */
  static async findByCategory(categoryId, limit = 20, offset = 0) {
    const countQuery = `
      SELECT COUNT(*)::integer as count FROM products
      WHERE category_id = $1 AND status = 'activo'
    `;
    const dataQuery = `
      SELECT
        p.*,
        c.name as category_name,
        u.name as seller_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.category_id = $1 AND p.status = 'activo'
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [categoryId]),
      pool.query(dataQuery, [categoryId, limit, offset])
    ]);

    return {
      products: dataResult.rows,
      total: countResult.rows[0].count
    };
  }

  /**
   * Obtiene productos del vendedor
   * @param {string} sellerId - ID del vendedor
   * @param {number} limit - Límite
   * @param {number} offset - Desplazamiento
   * @returns {object} {products, total}
   */
  static async findBySeller(sellerId, limit = 20, offset = 0) {
    const countQuery = `
      SELECT COUNT(*)::integer as count FROM products
      WHERE seller_id = $1
    `;
    const dataQuery = `
      SELECT
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [sellerId]),
      pool.query(dataQuery, [sellerId, limit, offset])
    ]);

    return {
      products: dataResult.rows,
      total: countResult.rows[0].count
    };
  }

  /**
   * Obtiene un producto por ID
   * @param {string} id - ID del producto
   * @returns {object} Datos del producto
   */
  static async findById(id) {
    const query = `
      SELECT
        p.*,
        c.name as category_name,
        u.name as seller_name,
        u.email as seller_email
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Actualiza un producto
   * @param {string} id - ID del producto
   * @param {object} updates - Campos a actualizar
   * @returns {object} Producto actualizado
   */
  static async update(id, updates = {}) {
    const allowedFields = ['title', 'description', 'price', 'stock', 'status', 'is_flagged', 'blocked_reason'];
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
      UPDATE products
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  /**
   * Bloquea un producto
   * @param {string} id - ID del producto
   * @param {string} reason - Razón del bloqueo
   * @returns {object} Producto bloqueado
   */
  static async blockProduct(id, reason) {
    return this.update(id, {
      status: 'bloqueado',
      is_flagged: true,
      blocked_reason: reason
    });
  }

  /**
   * Elimina (soft delete) un producto
   * @param {string} id - ID del producto
   * @returns {boolean} Éxito
   */
  static async delete(id) {
    const query = `
      DELETE FROM products
      WHERE id = $1
      RETURNING id
    `;

    const { rows } = await pool.query(query, [id]);
    return rows.length > 0;
  }

  /**
   * Busca productos por título o descripción
   * @param {string} searchTerm - Término de búsqueda
   * @param {number} limit - Límite
   * @param {number} offset - Desplazamiento
   * @returns {object} {products, total}
   */
  static async search(searchTerm, limit = 20, offset = 0) {
    const searchPattern = `%${searchTerm}%`;

    const countQuery = `
      SELECT COUNT(*)::integer as count FROM products
      WHERE status = 'activo'
        AND (title ILIKE $1 OR description ILIKE $1)
    `;

    const dataQuery = `
      SELECT
        p.*,
        c.name as category_name,
        u.name as seller_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'activo'
        AND (p.title ILIKE $1 OR p.description ILIKE $1)
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [searchPattern]),
      pool.query(dataQuery, [searchPattern, limit, offset])
    ]);

    return {
      products: dataResult.rows,
      total: countResult.rows[0].count
    };
  }

  /**
   * Obtiene productos destacados (mejor rating)
   * @param {number} limit - Límite
   * @returns {array} Productos destacados
   */
  static async getFeatured(limit = 10) {
    const query = `
      SELECT
        p.*,
        c.name as category_name,
        u.name as seller_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'activo' AND p.average_rating > 0
      ORDER BY p.average_rating DESC, p.review_count DESC
      LIMIT $1
    `;

    const { rows } = await pool.query(query, [limit]);
    return rows;
  }
}

export default ProductModel;
