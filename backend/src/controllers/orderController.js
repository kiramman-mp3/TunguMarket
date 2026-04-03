import OrderModel from '../models/orderModel.js';
import CartModel from '../models/cartModel.js';
import pool from '../config/db.js';

class OrderController {

  /**
   * GET /api/orders
   * Obtiene las órdenes del usuario autenticado
   */
  static async getOrders(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      // Validar página y límite
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      // Obtener órdenes
      const orders = await OrderModel.findByUserId(userId, limitNum, offset);
      const total = await OrderModel.countByUserId(userId);

      res.status(200).json({
        message: 'Órdenes obtenidas exitosamente',
        data: {
          orders,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/orders/:id
   * Obtiene los detalles de una orden específica
   */
  static async getOrderById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID de orden requerido' });
      }

      const order = await OrderModel.findById(id);

      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Verificar que la orden pertenece al usuario
      if (order.user_id !== userId && req.user.role_id !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta orden' });
      }

      res.status(200).json({
        message: 'Orden obtenida exitosamente',
        order
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/orders/checkout
   * Crea una nueva orden desde el carrito del usuario
   */
  static async checkout(req, res) {
    try {
      const userId = req.user.id;
      const { payment_method } = req.body;

      // Validar método de pago
      if (!payment_method) {
        return res.status(400).json({ error: 'Método de pago requerido' });
      }

      // Obtener carrito del usuario
      const cart = await CartModel.getCart(userId);

      if (!cart) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }

      // Verificar que el carrito tenga items
      if (cart.total_price <= 0) {
        return res.status(400).json({ error: 'El carrito está vacío' });
      }

      // Crear la orden
      const order = await OrderModel.createOrder(userId, cart.total_price, 'pendiente');

      // Guardar detalles del carrito en relación a la orden (opcional, para auditoría)
      // Por ahora solo movemos el carrito al estado de "checkout"

      res.status(201).json({
        message: 'Orden creada exitosamente. Pendiente de confirmación de pago.',
        order,
        payment_info: {
          order_id: order.id,
          amount: order.total_price,
          method: payment_method,
          status: 'pendiente'
        }
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/orders/:id/confirm
   * Confirma una orden (después de validar el pago)
   */
  static async confirmOrder(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID de orden requerido' });
      }

      const order = await OrderModel.findById(id);

      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Verificar permisos (solo admin o propietario de la orden)
      if (order.user_id !== userId && req.user.role_id !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para confirmar esta orden' });
      }

      // Confirmar la orden
      const confirmedOrder = await OrderModel.confirmOrder(id);

      // Limpiar carrito después de confirmar
      const cart = await CartModel.getCart(userId);
      if (cart) {
        await CartModel.clearCart(cart.id);
      }

      res.status(200).json({
        message: 'Orden confirmada exitosamente',
        order: confirmedOrder
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/orders/:id/cancel
   * Cancela una orden (solo si está en estado pendiente)
   */
  static async cancelOrder(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID de orden requerido' });
      }

      const order = await OrderModel.findById(id);

      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Verificar permisos
      if (order.user_id !== userId && req.user.role_id !== 1) {
        return res.status(403).json({ error: 'No tienes permiso para cancelar esta orden' });
      }

      // Cancelar la orden
      const cancelledOrder = await OrderModel.cancelOrder(id);

      res.status(200).json({
        message: 'Orden cancelada exitosamente',
        order: cancelledOrder,
        reason: reason || 'Sin especificar'
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/orders/:id/status
   * Actualiza el estado de una orden (solo para admin)
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Solo admin puede cambiar estado
      if (req.user.role_id !== 1) {
        return res.status(403).json({ error: 'Solo administradores pueden cambiar el estado' });
      }

      if (!id) {
        return res.status(400).json({ error: 'ID de orden requerido' });
      }

      if (!status) {
        return res.status(400).json({ error: 'Estado requerido' });
      }

      const order = await OrderModel.findById(id);

      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Actualizar estado
      const updatedOrder = await OrderModel.updateStatus(id, status);

      res.status(200).json({
        message: `Estado actualizado a "${status}"`,
        order: updatedOrder
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/orders/stats/user
   * Obtiene estadísticas de órdenes del usuario
   */
  static async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await OrderModel.getStats(userId);

      res.status(200).json({
        message: 'Estadísticas obtenidas exitosamente',
        stats
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/orders/filter/status/:status
   * Obtiene órdenes por estado (solo admin)
   */
  static async getOrdersByStatus(req, res) {
    try {
      // Solo admin
      if (req.user.role_id !== 1) {
        return res.status(403).json({ error: 'Solo administradores pueden filtrar órdenes por estado' });
      }

      const { status } = req.params;
      const { limit = 20 } = req.query;

      if (!status) {
        return res.status(400).json({ error: 'Estado requerido' });
      }

      const orders = await OrderModel.findByStatus(status, parseInt(limit, 10));

      res.status(200).json({
        message: `Órdenes en estado "${status}"`,
        status,
        total: orders.length,
        orders
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/orders/:id
   * Elimina una orden cancelada (solo admin)
   */
  static async deleteOrder(req, res) {
    try {
      // Solo admin
      if (req.user.role_id !== 1) {
        return res.status(403).json({ error: 'Solo administradores pueden eliminar órdenes' });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID de orden requerido' });
      }

      const deleted = await OrderModel.deleteOrder(id);

      if (deleted) {
        res.status(200).json({
          message: 'Orden eliminada exitosamente'
        });
      } else {
        res.status(404).json({ error: 'Orden no encontrada' });
      }

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default OrderController;
