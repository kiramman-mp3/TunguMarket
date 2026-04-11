import pool from '../config/db.js';

class OrderItemModel {
  /**
   * Crea un nuevo item para una orden
   */
  static async create({ order_id, product_id, quantity, price_at_purchase }) {
    const query = `
      INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [order_id, product_id, quantity, price_at_purchase]);
    return rows[0];
  }

  /**
   * Obtiene todos los items de una orden
   */
  static async findByOrderId(order_id) {
    const query = `
      SELECT oi.*, p.title, p.price as current_price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    const { rows } = await pool.query(query, [order_id]);
    return rows;
  }
}

export default OrderItemModel;
