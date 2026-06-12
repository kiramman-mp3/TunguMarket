import express from 'express';
import jwt from 'jsonwebtoken';
import SSEService from '../services/sseService.js';
import NotificationController from '../controllers/notificationController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * SSE Endpoint for real-time notifications.
 */
router.get('/stream', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'Token required for notifications' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.flushHeaders();
    SSEService.addClient(userId, res);

    req.on('close', () => {
      SSEService.removeClient(userId, res);
      res.end();
    });
  } catch (error) {
    console.error('[SSE] Auth Error:', error.message);
    res.status(401).json({ error: 'Invalid notification token' });
  }
});

/**
 * API Endpoints for notification history
 */
router.get('/', authenticateToken, NotificationController.getNotifications);
router.put('/mark-read/:id', authenticateToken, NotificationController.markAsRead);
router.put('/mark-all-read', authenticateToken, NotificationController.markAllAsRead);
router.delete('/:id', authenticateToken, NotificationController.deleteNotification);
router.post('/subscribe', authenticateToken, NotificationController.subscribe);

export default router;
