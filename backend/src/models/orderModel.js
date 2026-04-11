import pool from '../config/db.js';

class OrderModel {
  
  /**
   * Crea una nueva orden para el usuario
   * @param {string} userId - ID del usuario
   * @param {number} totalPrice - Precio total de la orden
   * @param {string} status - Estado inicial (default: 'pendiente')
   * @returns {object} Orden creada
   */
  static async createOrder(userId, totalPrice, status = 'pendiente') {
    const query = `
      INSERT INTO orders (user_id, total_price, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, totalPrice, status]);
    return rows[0];
  }

  /**
   * Obtiene una orden por su ID con todos sus detalles (items, productos, vendedor)
   * @param {string} orderId - ID de la orden
   * @returns {object} Datos detallados de la orden
   */
  static async getOrderWithDetails(orderId) {
    const orderQuery = `
      SELECT o.*, u.name as buyer_name, u.email as buyer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const itemsQuery = `
      SELECT oi.*, p.title as product_title, p.price as current_price,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url,
             s.name as seller_name, s.email as seller_email
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN users s ON p.seller_id = s.id
      WHERE oi.order_id = $1
    `;
    
    const [orderRes, itemsRes] = await Promise.all([
      pool.query(orderQuery, [orderId]),
      pool.query(itemsQuery, [orderId])
    ]);

    if (orderRes.rows.length === 0) return null;

    return {
      ...orderRes.rows[0],
      items: itemsRes.rows
    };
  }

  static async findById(orderId) {
    const query = `
      SELECT * FROM orders
      WHERE id = $1
    `;
    const { rows } = await pool.query(query, [orderId]);
    return rows[0] || null;
  }

  /**
   * Lista todas las órdenes de un usuario
   * @param {string} userId - ID del usuario
   * @param {number} limit - Límite de resultados (default: 10)
   * @param {number} offset - Desplazamiento (default: 0)
   * @returns {array} Array de órdenes
   */
  static async findByUserId(userId, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const { rows } = await pool.query(query, [userId, limit, offset]);
    return rows;
  }

  /**
   * Obtiene el total de órdenes de un usuario
   * @param {string} userId - ID del usuario
   * @returns {number} Total de órdenes
   */
  static async countByUserId(userId) {
    const query = `
      SELECT COUNT(*) as count FROM orders
      WHERE user_id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    return parseInt(rows[0].count, 10);
  }

  /**
   * Actualiza el estado de una orden
   * Estados válidos: 'pendiente', 'confirmado', 'cancelado'
   * @param {string} orderId - ID de la orden
   * @param {string} newStatus - Nuevo estado
   * @returns {object} Orden actualizada
   */
  static async updateStatus(orderId, newStatus) {
    const validStatuses = [
      'pendiente', 
      'confirmado', 
      'cancelado', 
      'Pendiente de verificación', 
      'Pendiente de pago', 
      'Aceptado',
      'Envío completado'
    ];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`);
    }

    const query = `
      UPDATE orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [newStatus, orderId]);
    return rows[0];
  }

  /**
   * Obtiene órdenes por estado
   * @param {string} status - Estado a filtrar
   * @param {number} limit - Límite de resultados
   * @returns {array} Array de órdenes con ese estado
   */
  static async findByStatus(status, limit = 20) {
    const validStatuses = ['pendiente', 'confirmado', 'cancelado'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`);
    }

    const query = `
      SELECT * FROM orders
      WHERE status = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const { rows } = await pool.query(query, [status, limit]);
    return rows;
  }

  /**
   * Obtiene estadísticas de órdenes del usuario
   * @param {string} userId - ID del usuario
   * @returns {object} Estadísticas (total, confirmadas, pendientes, canceladas)
   */
  static async getStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN status = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as canceladas,
        SUM(total_price) as total_gastado
      FROM orders
      WHERE user_id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
    return {
      total: parseInt(rows[0].total || 0, 10),
      confirmadas: parseInt(rows[0].confirmadas || 0, 10),
      pendientes: parseInt(rows[0].pendientes || 0, 10),
      canceladas: parseInt(rows[0].canceladas || 0, 10),
      total_gastado: parseFloat(rows[0].total_gastado || 0)
    };
  }

  /**
   * Cancela una orden (solo si está en estado pendiente)
   * @param {string} orderId - ID de la orden
   * @returns {object} Orden actualizada
   */
  static async cancelOrder(orderId) {
    const order = await this.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (order.status !== 'pendiente') {
      throw new Error(`No puedes cancelar una orden en estado "${order.status}"`);
    }

    return this.updateStatus(orderId, 'cancelado');
  }

  /**
   * Confirma una orden (pago validado)
   * @param {string} orderId - ID de la orden
   * @returns {object} Orden actualizada
   */
  static async confirmOrder(orderId) {
    const order = await this.findById(orderId);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }
    
    if (order.status !== 'pendiente') {
      throw new Error(`La orden ya está en estado "${order.status}"`);
    }

    return this.updateStatus(orderId, 'confirmado');
  }

  /**
   * Elimina una orden (solo si está cancelada)
   * @param {string} orderId - ID de la orden
   * @returns {boolean} True si se eliminó
   */
  static async deleteOrder(orderId) {
    const order = await this.findById(orderId);
    if (!order) return false;
    
    // Solo permitir eliminar si ya está cancelada o rechazada
    if (order.status !== 'cancelado' && !order.status.toLowerCase().includes('rechazado')) {
      throw new Error('Solo se pueden eliminar órdenes canceladas o rechazadas');
    }

    const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [orderId]);
    return rowCount > 0;
  }

  /**
   * Obtiene todos los ítems vendidos por un vendedor específico
   * @param {string} sellerId - ID del vendedor
   * @returns {array} Array de ítems vendidos con info del comprador
   */
  static async findSalesBySellerId(sellerId) {
    const query = `
      SELECT 
        oi.*, 
        o.status as order_status, 
        o.created_at,
        o.shipping_info,
        p.title as product_title, 
        u.name as buyer_name,
        u.email as buyer_email,
        pm.payment_method
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON o.user_id = u.id
      LEFT JOIN payments pm ON o.id = pm.order_id
      WHERE p.seller_id = $1
      ORDER BY o.created_at DESC
    `;
    const { rows } = await pool.query(query, [sellerId]);
    return rows;
  }
}

export default OrderModel;
