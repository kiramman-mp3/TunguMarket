import express from 'express';
import pool from '../config/db.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';
import SessionModel from '../models/sessionModel.js';
import UserModel from '../models/userModel.js';
import SSEService from '../services/sseService.js';

const router = express.Router();

// --- PUBLIC ROUTES ---

// Get public info of a seller
router.get('/seller/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT id, name, created_at, role_id FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- USER SECURE ROUTES ---

// Get active sessions for the current user
router.get('/sessions', authMiddleware, async (req, res) => {
  console.log('[DEBUG /sessions] Entering handler. User ID:', req.user.id);
  console.log('[DEBUG /sessions] SessionModel type:', typeof SessionModel);
  console.log('[DEBUG /sessions] findActiveSessionsByUser type:', typeof SessionModel?.findActiveSessionsByUser);
  
  try {
    const sessions = await SessionModel.findActiveSessionsByUser(req.user.id);
    res.json(sessions);
  } catch (error) {
    console.error('[DATABASE ERROR /sessions]:', error);
    res.status(500).json({ error: 'Internal server error fetching sessions' });
  }
});

// Get login logs for the current user
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const query = 'SELECT * FROM login_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50';
    const { rows } = await pool.query(query, [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout specific session (Remote Logout)
router.delete('/sessions/:token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.params;
    // Security check: ensure the session belongs to the user
    const session = await SessionModel.findByToken(token);
    if (!session || session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    await SessionModel.deleteSession(token);
    res.json({ message: 'Session closed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN ROUTES ---

// List all users
router.get('/admin/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.name, u.email, u.is_verified, u.is_banned, u.role_id, r.name as role_name, u.created_at 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      ORDER BY u.created_at DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ban/Unban user
router.patch('/admin/users/:id/status', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;
    
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot ban yourself' });
    }

    const updatedUser = await UserModel.banUser(id, isBanned);
    
    // If banning, close all sessions and notify in real-time
    if (isBanned) {
      await SessionModel.deleteByUser(id);
      SSEService.sendToUser(id, { type: 'ACCOUNT_BANNED' });
    }

    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
