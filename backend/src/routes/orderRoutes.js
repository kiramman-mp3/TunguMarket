import express from 'express';
import OrderController from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * RUTAS DE ÓRDENES
 * 
 * Todas las rutas requieren autenticación (JWT token)
 * 
 * RUTAS DE USUARIO:
 * GET    /api/orders              - Listar mis órdenes (con paginación)
 * GET    /api/orders/stats/user   - Ver estadísticas de mis órdenes
 * POST   /api/orders/checkout     - Crear nueva orden desde carrito
 * GET    /api/orders/:id          - Ver detalles de una orden
 * PUT    /api/orders/:id/confirm  - Confirmar orden (pago validado)
 * PUT    /api/orders/:id/cancel   - Cancelar orden (si está pendiente)
 * 
 * RUTAS DE ADMIN:
 * PUT    /api/orders/:id/status            - Cambiar estado de cualquier orden
 * GET    /api/orders/filter/status/:status - Listar órdenes por estado
 * DELETE /api/orders/:id                   - Eliminar orden cancelada
 */

// ===== RUTAS DE USUARIO =====

// GET /api/orders/stats/user - Estadísticas de órdenes del usuario
// Debe ir antes de /:id para evitar confusión de rutas
router.get('/stats/user', authMiddleware, OrderController.getUserStats);

// GET /api/orders/filter/status/:status - Filtrar órdenes por estado (ADMIN)
router.get('/filter/status/:status', authMiddleware, OrderController.getOrdersByStatus);

// GET /api/orders - Listar órdenes del usuario con paginación
// Query params: ?page=1&limit=10
// Ejemplo: GET /api/orders?page=1&limit=5
router.get('/', authMiddleware, OrderController.getOrders);

// POST /api/orders/checkout - Crear nueva orden desde carrito
// Body: { payment_method: "tarjeta" | "transferencia" | "efectivo" }
// Ejemplo:
// POST /api/orders/checkout
// { "payment_method": "tarjeta" }
router.post('/checkout', authMiddleware, OrderController.checkout);

// GET /api/orders/:id - Obtener detalles de una orden específica
// Ejemplo: GET /api/orders/550e8400-e29b-41d4-a716-446655440000
router.get('/:id', authMiddleware, OrderController.getOrderById);

// PUT /api/orders/:id/confirm - Confirmar orden (pago validado)
// Ejemplo: PUT /api/orders/550e8400-e29b-41d4-a716-446655440000/confirm
router.put('/:id/confirm', authMiddleware, OrderController.confirmOrder);

// PUT /api/orders/:id/cancel - Cancelar orden
// Body: { reason: "Cambié de opinión" }
// Ejemplo:
// PUT /api/orders/550e8400-e29b-41d4-a716-446655440000/cancel
// { "reason": "Cambié de opinión" }
router.put('/:id/cancel', authMiddleware, OrderController.cancelOrder);

// ===== RUTAS DE ADMIN =====

// PUT /api/orders/:id/status - Cambiar estado (SOLO ADMIN)
// Body: { status: "pendiente" | "confirmado" | "cancelado" }
// Ejemplo:
// PUT /api/orders/550e8400-e29b-41d4-a716-446655440000/status
// { "status": "confirmado" }
router.put('/:id/status', authMiddleware, OrderController.updateStatus);

// DELETE /api/orders/:id - Eliminar orden (SOLO ADMIN, solo si está cancelada)
// Ejemplo: DELETE /api/orders/550e8400-e29b-41d4-a716-446655440000
router.delete('/:id', authMiddleware, OrderController.deleteOrder);

export default router;
