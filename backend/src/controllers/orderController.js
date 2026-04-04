import OrderModel from '../models/orderModel.js';
import CartModel from '../models/cartModel.js';
import paymentValidator from '../services/paymentValidator.js';
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
      if (order.user_id !== userId && req.user.role !== 'admin') {
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
      if (order.user_id !== userId && req.user.role !== 'admin') {
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
      if (order.user_id !== userId && req.user.role !== 'admin') {
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
      if (req.user.role !== 'admin') {
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
      if (req.user.role !== 'admin') {
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
      if (req.user.role !== 'admin') {
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

  /**
   * POST /api/orders/:id/validate-payment
   * Usuario envía comprobante de pago para validación
   * Body: {
   *   amount: number,
   *   paymentMethod: 'transferencia' | 'deposito' | 'tarjeta',
   *   receiptUrl: string,
   *   receiptData: { transferenceNumber?, depositNumber?, bankName?, last4Digits?, authCode?, etc },
   *   receiptDate: date
   * }
   */
  static async validatePayment(req, res) {
    try {
      const userId = req.user.id;
      const { id: orderId } = req.params;
      const { amount, paymentMethod, receiptUrl, receiptData, receiptDate } = req.body;

      // Validar que la orden exista
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Verificar que la orden pertenece al usuario
      if (order.user_id !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para validar esta orden' });
      }

      // Verificar que la orden esté en estado pendiente
      if (order.status !== 'pendiente') {
        return res.status(400).json({ 
          error: `No puedes validar pago de una orden ${order.status}` 
        });
      }

      // Ejecutar validaciones del PaymentValidator
      const validation = await paymentValidator.validatePayment({
        orderId,
        userId,
        amount: parseFloat(amount),
        paymentMethod,
        receiptUrl,
        receiptData,
        receiptDate,
        expectedAmount: parseFloat(order.total_price)
      });

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validación de pago fallida',
          errors: validation.errors
        });
      }

      // Guardar pago en BD con estado 'pendiente' (esperando aprobación admin)
      const result = await pool.query(
        `INSERT INTO payments 
         (order_id, user_id, amount, payment_method, receipt_url, receipt_hash, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
         RETURNING *`,
        [orderId, userId, amount, paymentMethod, receiptUrl, validation.data.receiptHash]
      );

      const payment = result.rows[0];

      res.status(201).json({
        message: 'Comprobante enviado para validación',
        data: {
          paymentId: payment.id,
          orderId: payment.order_id,
          status: payment.status,
          amount: payment.amount,
          message: 'Tu comprobante está siendo revisado por un administrador'
        }
      });

    } catch (error) {
      console.error('Error validating payment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/orders/payments/:paymentId/approve
   * Admin aprueba el pago y confirma la orden
   * Body: {
   *   validationNotes?: string
   * }
   */
  static async approvePayment(req, res) {
    try {
      // Solo admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden aprobar pagos' });
      }

      const adminId = req.user.id;
      const { paymentId } = req.params;
      const { validationNotes = '' } = req.body;

      if (!paymentId) {
        return res.status(400).json({ error: 'ID de pago requerido' });
      }

      // Obtener el pago
      const paymentResult = await pool.query(
        `SELECT * FROM payments WHERE id = $1`,
        [paymentId]
      );

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      const payment = paymentResult.rows[0];

      // Verificar que el pago esté en estado pendiente
      if (payment.status !== 'pendiente') {
        return res.status(400).json({ 
          error: `El pago ya fue ${payment.status}` 
        });
      }

      // Obtener la orden relacionada
      const orderResult = await pool.query(
        `SELECT * FROM orders WHERE id = $1`,
        [payment.order_id]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Orden asociada no encontrada' });
      }

      const order = orderResult.rows[0];

      // Actualizar pago a aprobado
      const updatePaymentResult = await pool.query(
        `UPDATE payments 
         SET status = 'aprobado', validated_by = $1, validation_notes = $2, validated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [adminId, validationNotes, paymentId]
      );

      const approvedPayment = updatePaymentResult.rows[0];

      // Confirmar la orden
      const updatedOrder = await OrderModel.confirmOrder(payment.order_id);

      res.status(200).json({
        message: 'Pago aprobado y orden confirmada',
        data: {
          payment: {
            id: approvedPayment.id,
            status: approvedPayment.status,
            validatedAt: approvedPayment.validated_at
          },
          order: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            totalPrice: updatedOrder.total_price
          }
        }
      });

    } catch (error) {
      console.error('Error approving payment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/orders/payments/:paymentId/reject
   * Admin rechaza el pago (la orden permanece pendiente)
   * Body: {
   *   rejectionReason: string (motivo del rechazo)
   * }
   */
  static async rejectPayment(req, res) {
    try {
      // Solo admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden rechazar pagos' });
      }

      const adminId = req.user.id;
      const { paymentId } = req.params;
      const { rejectionReason = '' } = req.body;

      if (!paymentId) {
        return res.status(400).json({ error: 'ID de pago requerido' });
      }

      // Obtener el pago
      const paymentResult = await pool.query(
        `SELECT * FROM payments WHERE id = $1`,
        [paymentId]
      );

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      const payment = paymentResult.rows[0];

      // Verificar que el pago esté en estado pendiente
      if (payment.status !== 'pendiente') {
        return res.status(400).json({ 
          error: `El pago ya fue ${payment.status}` 
        });
      }

      // Obtener la orden relacionada
      const orderResult = await pool.query(
        `SELECT * FROM orders WHERE id = $1`,
        [payment.order_id]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: 'Orden asociada no encontrada' });
      }

      // Actualizar pago a rechazado
      const updatePaymentResult = await pool.query(
        `UPDATE payments 
         SET status = 'rechazado', validated_by = $1, validation_notes = $2, validated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [adminId, rejectionReason, paymentId]
      );

      const rejectedPayment = updatePaymentResult.rows[0];

      // La orden permanece en estado "pendiente" para que el usuario pueda reintentarlo

      res.status(200).json({
        message: 'Pago rechazado. El usuario puede reintentarlo.',
        data: {
          payment: {
            id: rejectedPayment.id,
            status: rejectedPayment.status,
            rejectionReason: rejectedPayment.validation_notes,
            validatedAt: rejectedPayment.validated_at
          },
          order: {
            id: payment.order_id,
            status: 'pendiente',
            message: 'La orden permanece pendiente. El usuario puede enviar otro comprobante.'
          }
        }
      });

    } catch (error) {
      console.error('Error rejecting payment:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default OrderController;
