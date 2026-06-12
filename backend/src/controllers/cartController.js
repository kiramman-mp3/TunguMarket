import CartModel from '../models/cartModel.js';
import pool from '../config/db.js';

class CartController {

  static async getCart(req, res) {
    try {
      const userId = req.user.id; 
      const cart = await CartModel.getCart(userId);
      if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
      
      const cartWithItems = await CartModel.getCartWithItems(cart.id);
      
      res.status(200).json({
        message: 'Carrito obtenido exitosamente',
        cart: cartWithItems
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async addToCart(req, res) {
    try {
      const userId = req.user.id; 
      const { product_id, quantity, price_at_purchase } = req.body;
      if (!product_id || !quantity || !price_at_purchase) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: product_id, quantity, price_at_purchase' 
        });
      }
      
      if (quantity <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
      }
      
      if (price_at_purchase <= 0) {
        return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
      }
      
      // Obtener o crear carrito del usuario
      const cart = await CartModel.getCart(userId);
      
      // Verificar que el producto existe y tiene stock
      const productQuery = `SELECT * FROM products WHERE id = $1 AND status = 'activo'`;
      const { rows: products } = await pool.query(productQuery, [product_id]);
      
      if (products.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado o no disponible' });
      }

      const product = products[0];
      
      // Verificar si ya existe en el carrito para sumar la cantidad
      const checkCartQuery = `SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`;
      const { rows: existingItems } = await pool.query(checkCartQuery, [cart.id, product_id]);
      
      const currentInCart = existingItems.length > 0 ? existingItems[0].quantity : 0;
      const totalRequested = currentInCart + quantity;

      if (totalRequested > product.stock) {
        return res.status(400).json({ 
          error: `No hay suficiente stock. Disponible: ${product.stock}, Ya en carrito: ${currentInCart}` 
        });
      }
      
      const item = await CartModel.addItemToCart(
        cart.id, 
        product_id, 
        quantity, 
        price_at_purchase
      );
      
      // Obtener carrito actualizado
      const cartWithItems = await CartModel.getCartWithItems(cart.id);
      
      res.status(201).json({
        message: 'Producto agregado al carrito exitosamente',
        item: item,
        cart: cartWithItems
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateItem(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ 
          error: 'La cantidad debe ser mayor a 0' 
        });
      }

      const checkQuery = `
        SELECT ci.* FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = $1 AND c.user_id = $2
      `;
      const { rows: items } = await pool.query(checkQuery, [id, userId]);
      
      if (items.length === 0) {
        return res.status(404).json({ 
          error: 'Item no encontrado o no pertenece a tu carrito' 
        });
      }

      // Verificar stock antes de actualizar
      const productQuery = `
        SELECT p.stock, p.title 
        FROM products p
        JOIN cart_items ci ON p.id = ci.product_id
        WHERE ci.id = $1
      `;
      const { rows: products } = await pool.query(productQuery, [id]);
      
      if (products.length > 0 && quantity > products[0].stock) {
        return res.status(400).json({ 
          error: `No hay suficiente stock para "${products[0].title}". Disponible: ${products[0].stock}` 
        });
      }

      const updatedItem = await CartModel.updateItemQuantity(id, quantity);
      
      const cart = await CartModel.getCartWithItems(items[0].cart_id);
      
      res.status(200).json({
        message: 'Item actualizado exitosamente',
        item: updatedItem,
        cart: cart
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  static async removeItem(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;  
      const checkQuery = `
        SELECT ci.*, c.id as cart_id FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE ci.id = $1 AND c.user_id = $2
      `;
      const { rows: items } = await pool.query(checkQuery, [id, userId]);
      
      if (items.length === 0) {
        return res.status(404).json({ 
          error: 'Item no encontrado o no pertenece a tu carrito' 
        });
      }
      
      const cartId = items[0].cart_id;
  
      const removedItem = await CartModel.removeItemFromCart(id);
      
  
      const cart = await CartModel.getCartWithItems(cartId);
      
      res.status(200).json({
        message: 'Item eliminado del carrito',
        removedItem: removedItem,
        cart: cart
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async clearCart(req, res) {
    try {
      const userId = req.user.id;
      
      // Obtener carrito del usuario
      const cart = await CartModel.getCart(userId);
      
      if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
      
      // Limpiar carrito
      await CartModel.clearCart(cart.id);
      
      // Obtener carrito vacío actualizado
      const clearedCart = await CartModel.getCartWithItems(cart.id);

      
      res.status(200).json({
        message: 'Carrito vaciado exitosamente',
        cart: clearedCart
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default CartController;
