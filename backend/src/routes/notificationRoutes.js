import express from 'express';
import jwt from 'jsonwebtoken';
import SSEService from '../services/sseService.js';

const router = express.Router();

/**
 * SSE Endpoint for real-time notifications.
 * Browsers use EventSource which only supports query parameters for tokens.
 */
router.get('/stream', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'Token required for notifications' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Set SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx/Proxies

    // Flush headers immediately
    res.flushHeaders();

    // Register client
    SSEService.addClient(userId, res);

    // Clean up on connection close
    req.on('close', () => {
      SSEService.removeClient(userId, res);
      res.end();
    });

  } catch (error) {
    console.error('[SSE] Auth Error:', error.message);
    res.status(401).json({ error: 'Invalid notification token' });
  }
});

export default router;
