import pool from '../config/db.js';

class AddressModel {
  static async findByUserId(userId) {
    const query = 'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC';
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM user_addresses WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async countByUserId(userId) {
    const query = 'SELECT COUNT(*) FROM user_addresses WHERE user_id = $1';
    const { rows } = await pool.query(query, [userId]);
    return parseInt(rows[0].count, 10);
  }

  static async create(addressData) {
    const { 
      userId, city, mainStreet, secondaryStreet, neighborhood, houseNumber, postalCode, isDefault 
    } = addressData;

    // Verificar límite de 4
    const count = await this.countByUserId(userId);
    if (count >= 4) {
      throw new Error('Haz alcanzado el límite máximo de 4 direcciones. Elimina una para agregar otra.');
    }

    if (!postalCode || postalCode.trim().length === 0) {
      throw new Error('El código postal es requerido.');
    }

    // Si es la primera o se marca como default, quitar default a las otras
    if (isDefault || count === 0) {
      await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
    }

    const query = `
      INSERT INTO user_addresses (
        user_id, city, main_street, secondary_street, neighborhood, house_number, postal_code, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      userId, city, mainStreet, secondaryStreet, neighborhood || null, 
      houseNumber || null, postalCode || null, (isDefault || count === 0)
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(id, userId) {
    const query = 'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING *';
    const { rows } = await pool.query(query, [id, userId]);
    return rows.length > 0;
  }

  static async setDefault(id, userId) {
    await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
    const query = 'UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *';
    const { rows } = await pool.query(query, [id, userId]);
    return rows[0];
  }
}

export default AddressModel;
