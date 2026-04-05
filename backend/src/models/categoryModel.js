import pool from '../config/db.js';

class CategoryModel {
  /**
   * Crea una nueva categoría
   * @param {string} name - Nombre de la categoría
   * @param {string} description - Descripción
   * @returns {object} Categoría creada
   */
  static async create(name, description = null) {
    const query = `
      INSERT INTO categories (name, description, is_active)
      VALUES ($1, $2, TRUE)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [name, description]);
    return rows[0];
  }

  /**
   * Obtiene todas las categorías activas
   * @returns {array} Lista de categorías
   */
  static async findAll() {
    const query = `
      SELECT * FROM categories
      WHERE is_active = TRUE
      ORDER BY name ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  /**
   * Obtiene una categoría por ID
   * @param {string} id - ID de la categoría
   * @returns {object} Datos de la categoría
   */
  static async findById(id) {
    const query = `
      SELECT * FROM categories
      WHERE id = $1 AND is_active = TRUE
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Obtiene una categoría por nombre
   * @param {string} name - Nombre de la categoría
   * @returns {object} Datos de la categoría
   */
  static async findByName(name) {
    const query = `
      SELECT * FROM categories
      WHERE name = $1
    `;
    const { rows } = await pool.query(query, [name]);
    return rows[0] || null;
  }

  /**
   * Actualiza una categoría
   * @param {string} id - ID de la categoría
   * @param {object} updates - Campos a actualizar {name, description}
   * @returns {object} Categoría actualizada
   */
  static async update(id, updates = {}) {
    const allowedFields = ['name', 'description', 'is_active'];
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
      UPDATE categories
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  /**
   * Desactiva una categoría (soft delete)
   * @param {string} id - ID de la categoría
   * @returns {object} Categoría actualizada
   */
  static async deactivate(id) {
    const query = `
      UPDATE categories
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  /**
   * Obtiene el conteo de productos en una categoría
   * @param {string} categoryId - ID de la categoría
   * @returns {number} Cantidad de productos
   */
  static async getProductCount(categoryId) {
    const query = `
      SELECT COUNT(*)::integer as count FROM products
      WHERE category_id = $1 AND status != 'vendido'
    `;
    const { rows } = await pool.query(query, [categoryId]);
    return rows[0].count;
  }
}

export default CategoryModel;
