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
    const countQuery = `
      SELECT COUNT(*)::integer as count FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'activo' AND u.blocked_for_debt = false
    `;
    const dataQuery = `
      SELECT
        p.*,
        c.name as category_name,
        COALESCE(u.seller_name, u.name) as seller_name,
        u.avatar_url as seller_avatar,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'activo' AND u.blocked_for_debt = false
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
      SELECT COUNT(*)::integer as count FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.category_id = $1 AND p.status = 'activo' AND u.blocked_for_debt = false
    `;
    const dataQuery = `
      SELECT
        p.*,
        c.name as category_name,
        COALESCE(u.seller_name, u.name) as seller_name,
        u.avatar_url as seller_avatar,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.category_id = $1 AND p.status = 'activo' AND u.blocked_for_debt = false
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
        c.name as category_name,
        COALESCE(u.seller_name, u.name) as seller_name,
        u.avatar_url as seller_avatar,
        COUNT(oi.id)::integer as sales_count,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE p.seller_id = $1
      GROUP BY p.id, c.name, u.seller_name, u.name
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
        COALESCE(u.seller_name, u.name) as seller_name,
        u.email as seller_email,
        u.avatar_url as seller_avatar
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1 AND u.blocked_for_debt = false
    `;

    const { rows } = await pool.query(query, [id]);
    
    // Increment views asynchronously
    if (rows[0]) {
      pool.query('UPDATE products SET views = views + 1 WHERE id = $1', [id]).catch(console.error);
    }

    return rows[0] || null;
  }

  /**
   * Actualiza un producto
   * @param {string} id - ID del producto
   * @param {object} updates - Campos a actualizar
   * @returns {object} Producto actualizado
   */
  static async update(id, updates = {}) {
    const allowedFields = ['title', 'description', 'price', 'stock', 'status', 'is_flagged', 'blocked_reason', 'category_id'];
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
   * Busca productos por término y filtros avanzados
   * @param {string} searchTerm - Término de búsqueda
   * @param {number} limit - Límite
   * @param {number} offset - Desplazamiento
   * @param {object} filters - Filtros extras
   * @returns {object} {products, total}
   */
  static async search(searchTerm, limit = 20, offset = 0, filters = {}) {
    const { category_id, minPrice, maxPrice, minRating } = filters;
    const searchPattern = `%${searchTerm}%`;

    let countQuery = `
      SELECT COUNT(*)::integer as count FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'activo' AND u.blocked_for_debt = false
    `;
    let dataQuery = `
      SELECT
        p.*,
        c.name as category_name,
        COALESCE(u.seller_name, u.name) as seller_name,
        u.avatar_url as seller_avatar,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'activo' AND u.blocked_for_debt = false
    `;

    const queryParams = [];
    let paramCount = 1;

    if (searchTerm && searchTerm.trim() !== '') {
      countQuery += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      dataQuery += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      queryParams.push(searchPattern);
      paramCount++;
    }

    if (category_id) {
      countQuery += ` AND p.category_id = $${paramCount}`;
      dataQuery += ` AND p.category_id = $${paramCount}`;
      queryParams.push(category_id);
      paramCount++;
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      countQuery += ` AND p.price BETWEEN $${paramCount} AND $${paramCount + 1}`;
      dataQuery += ` AND p.price BETWEEN $${paramCount} AND $${paramCount + 1}`;
      queryParams.push(minPrice, maxPrice);
      paramCount += 2;
    } else if (minPrice !== undefined) {
      countQuery += ` AND p.price >= $${paramCount}`;
      dataQuery += ` AND p.price >= $${paramCount}`;
      queryParams.push(minPrice);
      paramCount++;
    } else if (maxPrice !== undefined) {
      countQuery += ` AND p.price <= $${paramCount}`;
      dataQuery += ` AND p.price <= $${paramCount}`;
      queryParams.push(maxPrice);
      paramCount++;
    }

    if (minRating !== undefined) {
      countQuery += ` AND p.average_rating >= $${paramCount}`;
      dataQuery += ` AND p.average_rating >= $${paramCount}`;
      queryParams.push(minRating);
      paramCount++;
    }

    dataQuery += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, queryParams),
      pool.query(dataQuery, [...queryParams, limit, offset])
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
        COALESCE(u.seller_name, u.name) as seller_name,
        u.avatar_url as seller_avatar,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
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

  /**
   * Obtiene estadísticas agregadas para un vendedor
   */
  static async getSellerStats(sellerId) {
    const query = `
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(AVG(average_rating), 0) as avg_rating,
        (
          SELECT COALESCE(SUM(oi.quantity), 0)
          FROM order_items oi
          JOIN products p2 ON oi.product_id = p2.id
          WHERE p2.seller_id = $1
        ) as total_sales
      FROM products
      WHERE seller_id = $1 AND status = 'activo'
    `;
    const { rows } = await pool.query(query, [sellerId]);
    return {
      activeProducts: parseInt(rows[0].total_products || 0, 10),
      totalSales: parseInt(rows[0].total_sales || 0, 10),
      totalViews: parseInt(rows[0].total_views || 0, 10),
      avgRating: parseFloat(rows[0].avg_rating || 0).toFixed(1)
    };
  }
}

export default ProductModel;
