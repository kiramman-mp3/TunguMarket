import pool from '../config/db.js';

class ProductImageModel {
  /**
   * Crea una nueva imagen de producto
   * @param {string} productId - ID del producto
   * @param {string} imageUrl - URL de la imagen
   * @param {boolean} isPrimary - Es imagen principal
   * @param {number} displayOrder - Orden de visualización
   * @returns {object} Imagen creada
   */
  static async create(productId, imageUrl, isPrimary = false, displayOrder = 0) {
    // Si es imagen principal, desactivar otras imágenes principales
    if (isPrimary) {
      await pool.query(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = $1',
        [productId]
      );
    }

    const query = `
      INSERT INTO product_images (product_id, image_url, is_primary, display_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [productId, imageUrl, isPrimary, displayOrder]);
    return rows[0];
  }

  /**
   * Obtiene todas las imágenes de un producto ordenadas
   * @param {string} productId - ID del producto
   * @returns {array} Imágenes del producto
   */
  static async findByProductId(productId) {
    const query = `
      SELECT * FROM product_images
      WHERE product_id = $1
      ORDER BY is_primary DESC, display_order ASC
    `;

    const { rows } = await pool.query(query, [productId]);
    return rows;
  }

  /**
   * Obtiene una imagen específica por ID
   * @param {string} id - ID de la imagen
   * @returns {object} Datos de la imagen
   */
  static async findById(id) {
    const query = `
      SELECT * FROM product_images
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Obtiene la imagen principal de un producto
   * @param {string} productId - ID del producto
   * @returns {object} Imagen principal
   */
  static async getPrimaryImage(productId) {
    const query = `
      SELECT * FROM product_images
      WHERE product_id = $1 AND is_primary = TRUE
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [productId]);
    return rows[0] || null;
  }

  /**
   * Actualiza una imagen
   * @param {string} id - ID de la imagen
   * @param {object} updates - {image_url, is_primary, display_order}
   * @returns {object} Imagen actualizada
   */
  static async update(id, updates = {}) {
    const allowedFields = ['image_url', 'is_primary', 'display_order'];
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

    // Si se establece como imagen principal, desactivar otras
    if (updates.is_primary) {
      const image = await this.findById(id);
      if (image) {
        await pool.query(
          'UPDATE product_images SET is_primary = FALSE WHERE product_id = $1 AND id != $2',
          [image.product_id, id]
        );
      }
    }

    values.push(id);
    const query = `
      UPDATE product_images
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  /**
   * Elimina una imagen de producto
   * @param {string} id - ID de la imagen
   * @returns {boolean} Éxito
   */
  static async delete(id) {
    const query = `
      DELETE FROM product_images
      WHERE id = $1
      RETURNING id
    `;

    const { rows } = await pool.query(query, [id]);
    return rows.length > 0;
  }

  /**
   * Elimina todas las imágenes de un producto
   * @param {string} productId - ID del producto
   * @returns {number} Cantidad eliminada
   */
  static async deleteByProductId(productId) {
    const query = `
      DELETE FROM product_images
      WHERE product_id = $1
      RETURNING id
    `;

    const { rows } = await pool.query(query, [productId]);
    return rows.length;
  }

  /**
   * Cuenta imagenes de un producto
   * @param {string} productId - ID del producto
   * @returns {number} Cantidad de imágenes
   */
  static async countByProductId(productId) {
    const query = `
      SELECT COUNT(*)::integer as count FROM product_images
      WHERE product_id = $1
    `;

    const { rows } = await pool.query(query, [productId]);
    return rows[0].count;
  }
}

export default ProductImageModel;
