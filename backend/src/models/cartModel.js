import pool from '../config/db.js';

class CartModel {
  
  static async getCart(userId) {
    const query = `
      SELECT * FROM carts 
      WHERE user_id = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [userId]);
    
    if (rows.length > 0) {
      return rows[0];
    }
    
     const createQuery = `
       INSERT INTO carts (user_id, total_price)
       VALUES ($1, $2)
       RETURNING *
     `;
     const created = await pool.query(createQuery, [userId, 0]);
     return created.rows[0];
  }


  static async getCartWithItems(cartId) {
    const query = `
      SELECT 
        c.id,
        c.user_id,
        c.total_price,
        c.created_at,
        c.updated_at,
        json_agg(json_build_object(
          'id', ci.id,
          'product_id', ci.product_id,
          'quantity', ci.quantity,
          'price_at_purchase', ci.price_at_purchase
        )) as items
      FROM carts c
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      WHERE c.id = $1
      GROUP BY c.id, c.user_id, c.total_price, c.created_at, c.updated_at
    `;
    const { rows } = await pool.query(query, [cartId]);
    return rows[0] || null;
  }

  static async addItemToCart(cartId, productId, quantity, priceAtPurchase) {
   
    const checkQuery = `
      SELECT * FROM cart_items 
      WHERE cart_id = $1 AND product_id = $2
    `;
    const { rows: existing } = await pool.query(checkQuery, [cartId, productId]);

    if (existing.length > 0) {
      const updateQuery = `
        UPDATE cart_items 
        SET quantity = quantity + $1
        WHERE cart_id = $2 AND product_id = $3
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [quantity, cartId, productId]);
      await this.updateCartTotal(cartId); 
      return result.rows[0];
    }
    const insertQuery = `
      INSERT INTO cart_items (cart_id, product_id, quantity, price_at_purchase)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [cartId, productId, quantity, priceAtPurchase]);
    await this.updateCartTotal(cartId);
    return result.rows[0];
  }

  static async updateItemQuantity(cartItemId, newQuantity) {
    if (newQuantity <= 0) {
      // Si la cantidad es 0 o menor, eliminar el item
      return this.removeItemFromCart(cartItemId);
    }

    const query = `
      UPDATE cart_items 
      SET quantity = $1
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [newQuantity, cartItemId]);
    
    // Obtener el cartId para recalcular el total
    const cartQuery = `SELECT cart_id FROM cart_items WHERE id = $1`;
    const cartRes = await pool.query(cartQuery, [cartItemId]);
    if (cartRes.rows.length > 0) {
      await this.updateCartTotal(cartRes.rows[0].cart_id);
    }
    
    return rows[0];
  }

  static async removeItemFromCart(cartItemId) {
    // Primero obtener el cart_id antes de eliminar
    const getCartQuery = `SELECT cart_id FROM cart_items WHERE id = $1`;
    const cartRes = await pool.query(getCartQuery, [cartItemId]);
    
    const query = `
      DELETE FROM cart_items 
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [cartItemId]);
    
    // Recalcular el total del carrito
    if (cartRes.rows.length > 0) {
      await this.updateCartTotal(cartRes.rows[0].cart_id);
    }
    
    return rows[0];
  }

  static async updateCartTotal(cartId) {
    const query = `
      UPDATE carts 
      SET total_price = (
        SELECT COALESCE(SUM(quantity * price_at_purchase), 0)
        FROM cart_items
        WHERE cart_id = $1
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [cartId]);
    return rows[0];
  }


  static async clearCart(cartId) {
    const query = `
      DELETE FROM cart_items 
      WHERE cart_id = $1
    `;
    await pool.query(query, [cartId]);

    return this.updateCartTotal(cartId);
  }


  static async deleteCart(cartId) {
    const query = `
      DELETE FROM carts 
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await pool.query(query, [cartId]);
    return rows[0];
  }

  static async getCartItemCount(cartId) {
    const query = `
      SELECT COUNT(*) as count, 
             COALESCE(SUM(quantity), 0) as total_items
      FROM cart_items 
      WHERE cart_id = $1
    `;
    const { rows } = await pool.query(query, [cartId]);
    return rows[0];
  }
}

export default CartModel;