import express from 'express';
import pool from '../config/db.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';
import SessionModel from '../models/sessionModel.js';
import UserModel from '../models/userModel.js';

const router = express.Router();

// --- USER SECURE ROUTES ---

// Get active sessions for the current user
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await SessionModel.findByUser(req.user.id);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    
    // If banning, close all sessions
    if (isBanned) {
      await SessionModel.deleteByUser(id);
    }

    res.json({ message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
