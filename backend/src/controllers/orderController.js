import OrderModel from '../models/orderModel.js';
import CartModel from '../models/cartModel.js';
import NotificationModel from '../models/notificationModel.js';
import SSEService from '../services/sseService.js';
import EmailService from '../services/emailService.js';
import paymentValidator from '../services/paymentValidator.js';
import AddressModel from '../models/addressModel.js';
import WalletModel from '../models/walletModel.js';
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

      const order = await OrderModel.getOrderWithDetails(id);

      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Verificar que la orden pertenece al usuario O el usuario es vendedor de algún item
      const isSeller = order.items.some(item => item.seller_id === userId);
      
      if (order.user_id !== userId && req.user.role !== 'admin' && !isSeller) {
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userId = req.user.id;
      const { payment_method, address_id } = req.body;

      if (!payment_method) {
        return res.status(400).json({ error: 'Método de pago requerido' });
      }

      if (!address_id) {
        return res.status(400).json({ error: 'Dirección de envío requerida' });
      }

      // Validar que el usuario no esté bloqueado por deuda
      const userCheck = await client.query('SELECT blocked_for_debt FROM users WHERE id = $1', [userId]);
      if (userCheck.rows[0]?.blocked_for_debt) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Tu cuenta está suspendida por saldo negativo. Debes pagar tu saldo pendiente para comprar.' });
      }

      // 0. Obtener info de la dirección
      const address = await AddressModel.findById(address_id);
      if (!address || address.user_id !== userId) {
        return res.status(404).json({ error: 'Dirección de envío no válida' });
      }

      const shippingInfo = {
        city: address.city,
        main_street: address.main_street,
        secondary_street: address.secondary_street,
        neighborhood: address.neighborhood,
        house_number: address.house_number,
        postal_code: address.postal_code
      };

      // 1. Obtener carrito e items
      const cartResult = await client.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
      const cart = cartResult.rows[0];

      const itemsResult = await client.query('SELECT * FROM cart_items WHERE cart_id = $1', [cart.id]);
      const cartItems = itemsResult.rows;

      if (cartItems.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'El carrito está vacío' });
      }

      // Validar que ninguno de los vendedores de los productos esté bloqueado por deuda
      const productIds = cartItems.map(item => item.product_id);
      const sellersCheck = await client.query(`
        SELECT u.id, u.name, u.blocked_for_debt 
        FROM products p 
        JOIN users u ON p.seller_id = u.id 
        WHERE p.id = ANY($1) AND u.blocked_for_debt = true
      `, [productIds]);

      if (sellersCheck.rows.length > 0) {
        const blockedNames = sellersCheck.rows.map(s => s.name).join(', ');
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          error: `No se puede procesar la compra. Los siguientes vendedores están temporalmente suspendidos: ${blockedNames}` 
        });
      }

      // 2. Definir estado inicial según método de pago
      let orderStatus = 'pendiente';
      if (payment_method === 'tarjeta') orderStatus = 'Aceptado';
      else if (payment_method === 'efectivo') orderStatus = 'Aceptado';
      else if (payment_method === 'transferencia') orderStatus = 'Pendiente de verificación';

      // 3. Crear la Orden con información de envío
      const orderQuery = `
        INSERT INTO orders (user_id, total_price, status, shipping_info)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const { rows: orderRows } = await client.query(orderQuery, [userId, cart.total_price, orderStatus, JSON.stringify(shippingInfo)]);
      const order = orderRows[0];

      // 4. Mover items a order_items y reducir stock
      for (const item of cartItems) {
        // Migrar item
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) 
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, item.price_at_purchase]
        );

        // Reducir stock
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // 5. Preparar notificaciones a los vendedores ANTES de limpiar carrito
      const sellersResult = await client.query(`
        SELECT DISTINCT p.seller_id, u.email, u.name as seller_name, p.title
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        JOIN users u ON p.seller_id = u.id
        WHERE ci.cart_id = $1
      `, [cart.id]);

      // 6. Registrar el Pago
      let paymentStatus = 'pendiente';
      if (payment_method === 'tarjeta') paymentStatus = 'completado';
      
      let receiptUrl = null;
      if (payment_method === 'transferencia' && req.file) {
        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        receiptUrl = `${baseUrl}/uploads/payments/${req.file.filename}`;
      }

      await client.query(
        `INSERT INTO payments (order_id, user_id, amount, payment_method, status, receipt_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, userId, cart.total_price, payment_method, paymentStatus, receiptUrl]
      );

      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
      await client.query('UPDATE carts SET total_price = 0 WHERE id = $1', [cart.id]);

      await client.query('COMMIT');

      // 8. Enviar notificaciones (fuera de la transacción de escritura)
      try {
        for (const seller of sellersResult.rows) {
          const title = 'Nueva venta recibida';
          const message = `Has recibido una nueva orden para tu producto: ${seller.title}`;
          
          await NotificationModel.create({
            userId: seller.seller_id,
            title,
            message,
            type: 'sale'
          });

          SSEService.sendToUser(seller.seller_id, {
            type: 'NOTIFICATION',
            title,
            message
          });

          EmailService.sendNewSaleEmail(seller.email, seller.seller_name, seller.title, req.user.name).catch(console.error);
        }
      } catch (notifyError) {
        console.error('Error al notificar vendedores:', notifyError);
      }

      res.status(201).json({
        message: 'Orden procesada exitosamente',
        order_id: order.id,
        status: order.status,
        total: order.total_price
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Checkout error:', error);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
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

      // Notificar al comprador
      try {
        const buyerResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [order.user_id]);
        const buyer = buyerResult.rows[0];
        
        const title = 'Pago Confirmado';
        const message = `Tu pago para la orden #${order.id} ha sido confirmado.`;
        
        await NotificationModel.create({ userId: order.user_id, title, message, type: 'payment' });
        SSEService.sendToUser(order.user_id, { type: 'NOTIFICATION', title, message });
        EmailService.sendPaymentConfirmedEmail(buyer.email, buyer.name, order.id, order.total_price).catch(console.error);
      } catch (e) { console.error('Error al notificar comprador:', e); }

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

  /**
   * GET /api/orders/seller/sales
   * Obtiene las ventas realizadas por el vendedor
   */
  static async getSellerSales(req, res) {
    try {
      const sellerId = req.user.id;
      const sales = await OrderModel.findSalesBySellerId(sellerId);
      res.status(200).json({ data: sales });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/orders/seller/status/:itemId
   * Permitir al vendedor marcar un ítem como enviado
   */
  static async updateSellerItemStatus(req, res) {
    try {
      const sellerId = req.user.id;
      const { itemId } = req.params;
      const { status } = req.body; // 'Envío completado'

      if (status !== 'Envío completado') {
        return res.status(400).json({ error: 'Estado no permitido para vendedores' });
      }

      // Verificar que el item pertenece a un producto del vendedor
      const itemResult = await pool.query(`
        SELECT oi.*, p.seller_id, o.user_id as buyer_id, p.title as product_title, pay.payment_method
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN payments pay ON o.id = pay.order_id
        WHERE oi.id = $1
      `, [itemId]);

      if (itemResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ítem no encontrado' });
      }

      const item = itemResult.rows[0];

      if (item.seller_id !== sellerId) {
        return res.status(403).json({ error: 'No tienes permiso sobre este ítem' });
      }

      if (item.status === 'Envío completado') {
        return res.status(400).json({ error: 'Este ítem ya ha sido marcado como entregado.' });
      }

      // 1. Actualizar estado del ítem
      await pool.query('UPDATE order_items SET status = $1 WHERE id = $2', [status, itemId]);

      // 2. Transaccionar Billetera (Uber-style)
      const grossEarnings = parseFloat(item.price_at_purchase) * item.quantity;
      const commission = grossEarnings * 0.05;
      const netEarnings = grossEarnings - commission;

      if (item.payment_method === 'efectivo') {
        // En efectivo, deduce la comisión del saldo
        await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [commission, sellerId]);
        
        await WalletModel.createTransaction(
          sellerId,
          item.order_id,
          'debt_commission',
          commission * -1, // Monto deducido de la cuenta
          commission,
          `Comisión deducida por entrega en Efectivo (${item.product_title})`
        );

        // Notificación interna indicando que se ha descontado el saldo
        await NotificationModel.create({
          userId: sellerId,
          title: 'Venta en Efectivo Completa',
          message: `Has entregado "${item.product_title}". Revisa tu saldo, se ha descontado $${commission.toFixed(2)} por comisión de uso de TunguMarket.`,
          type: 'info'
        });

      } else {
        // En tarjeta/transferencia, abona el porcentaje al saldo
        await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [netEarnings, sellerId]);
        
        await WalletModel.createTransaction(
          sellerId,
          item.order_id,
          'earning',
          netEarnings,
          commission,
          `Ganancia por entrega (${item.product_title})`
        );
      }

      // 3. Notificar al comprador
      const buyerResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [item.buyer_id]);
      const buyer = buyerResult.rows[0];

      const title = '¡Tu pedido ha sido entregado!';
      const message = `El vendedor ha marcado tu producto "${item.product_title}" como "Envío completado". ¡Ya puedes calificar tu compra!`;
      
      await NotificationModel.create({ userId: item.buyer_id, title, message, type: 'shipping' });
      SSEService.sendToUser(item.buyer_id, { type: 'NOTIFICATION', title, message });
      EmailService.sendOrderShippedEmail(buyer.email, buyer.name, item.order_id).catch(console.error);

      // 4. Propagación de estado: ¿Están todos los ítems de la orden completados?
      const allItemsResult = await pool.query(
        'SELECT status FROM order_items WHERE order_id = $1',
        [item.order_id]
      );
      
      const allCompleted = allItemsResult.rows.every(row => row.status === 'Envío completado');
      
      if (allCompleted) {
        await pool.query(
          'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['Envío completado', item.order_id]
        );
      }

      res.status(200).json({ 
        message: 'Item marcado como completado y comprador notificado',
        orderCompleted: allCompleted
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/payments/pending
   * Obtiene los pagos pendientes de verificación
   */
  static async getPendingPayments(req, res) {
    try {
      // Verificar que es admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden ver pagos pendientes' });
      }

      const result = await pool.query(`
        SELECT 
          p.id,
          p.order_id,
          p.user_id,
          p.amount,
          p.payment_method,
          p.receipt_url,
          p.status,
          p.created_at,
          u.name as customer_name,
          u.email as customer_email,
          o.total_price as order_total,
          o.status as order_status
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN orders o ON p.order_id = o.id
        WHERE p.payment_method = 'transferencia' AND p.status = 'pendiente'
        ORDER BY p.created_at DESC
      `);

      res.status(200).json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/admin/payments/:paymentId/approve
   * Aprueba un pago pendiente
   */
  static async approvePayment(req, res) {
    try {
      // Verificar que es admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden aprobar pagos' });
      }

      const { paymentId } = req.params;

      // Actualizar pago a aprobado
      const result = await pool.query(
        `UPDATE payments 
         SET status = 'aprobado', validated_by = $1, validated_at = NOW(), validation_notes = 'Aprobado por administrador'
         WHERE id = $2
         RETURNING *`,
        [req.user.id, paymentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      const payment = result.rows[0];

      // Actualizar estado de la orden a pagado
      await pool.query(
        `UPDATE orders 
         SET status = 'pagado', updated_at = NOW()
         WHERE id = $1`,
        [payment.order_id]
      );

      // Enviar notificación al usuario
      await NotificationModel.create({
        user_id: payment.user_id,
        type: 'payment_approved',
        title: 'Pago Aprobado',
        message: `Tu pago para la orden #${payment.order_id} ha sido aprobado. Tu orden será procesada pronto.`,
        related_order_id: payment.order_id
      });

      // Enviar email
      try {
        await EmailService.sendPaymentApprovalEmail(payment.user_id, payment.order_id);
      } catch (e) {
        console.error('Error enviando email:', e);
      }

      res.status(200).json({
        message: 'Pago aprobado exitosamente',
        payment: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/admin/payments/:paymentId/reject
   * Rechaza un pago pendiente
   */
  static async rejectPayment(req, res) {
    try {
      // Verificar que es admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden rechazar pagos' });
      }

      const { paymentId } = req.params;
      const { rejection_reason } = req.body;

      if (!rejection_reason) {
        return res.status(400).json({ error: 'Motivo de rechazo requerido' });
      }

      // Actualizar pago a rechazado
      const result = await pool.query(
        `UPDATE payments 
         SET status = 'rechazado', validated_by = $1, validated_at = NOW(), validation_notes = $2
         WHERE id = $3
         RETURNING *`,
        [req.user.id, `Rechazado: ${rejection_reason}`, paymentId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      const payment = result.rows[0];

      // Actualizar estado de la orden a pago rechazado
      await pool.query(
        `UPDATE orders 
         SET status = 'pago_rechazado', updated_at = NOW()
         WHERE id = $1`,
        [payment.order_id]
      );

      // Enviar notificación al usuario
      await NotificationModel.create({
        user_id: payment.user_id,
        type: 'payment_rejected',
        title: 'Pago Rechazado',
        message: `Tu pago para la orden #${payment.order_id} ha sido rechazado. Motivo: ${rejection_reason}. Por favor, realiza una nueva transferencia.`,
        related_order_id: payment.order_id
      });

      // Enviar email
      try {
        await EmailService.sendPaymentRejectionEmail(payment.user_id, payment.order_id, rejection_reason);
      } catch (e) {
        console.error('Error enviando email:', e);
      }

      res.status(200).json({
        message: 'Pago rechazado. Usuario ha sido notificado',
        payment: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default OrderController;
