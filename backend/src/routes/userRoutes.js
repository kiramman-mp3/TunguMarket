import express from 'express';
import pool from '../config/db.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';
import SessionModel from '../models/sessionModel.js';
import UserModel from '../models/userModel.js';
import SSEService from '../services/sseService.js';
import { uploadAvatars } from '../middlewares/uploadMiddleware.js';
import bcrypt from 'bcryptjs';
import EmailService from '../services/emailService.js';

const router = express.Router();

// --- PUBLIC ROUTES ---

// Get public info of a seller
router.get('/seller/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT id, name, seller_name, seller_bio, created_at, role_id FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// General profile update (name)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const updatedUser = await UserModel.updateProfile(userId, { name });

    // Notificar por correo
    try {
      await EmailService.sendProfileUpdateNotification(updatedUser.email, updatedUser.name, 'Nombre de Usuario');
    } catch (emailError) {
      console.error('Error enviando correo de actualización de nombre:', emailError);
    }

    res.json({ message: 'Perfil actualizado con éxito', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update avatar (profile picture)
router.post('/profile/avatar', authMiddleware, uploadAvatars.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const userId = req.user.id;
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

    const updatedUser = await UserModel.updateProfile(userId, { avatar_url: avatarUrl });
    res.json({ message: 'Foto de perfil actualizada', avatar_url: avatarUrl, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Ambas contraseñas son requeridas' });
    }

    const user = await UserModel.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await UserModel.updatePassword(userId, passwordHash);

    // Notificar alerta de seguridad por correo
    try {
      await EmailService.sendSecurityAlertEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Error enviando alerta de seguridad por contraseña:', emailError);
    }

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update seller profile (name and bio) - Mantener para compatibilidad
router.put('/seller-profile', authMiddleware, async (req, res) => {
  try {
    const { seller_name, seller_bio } = req.body;
    const userId = req.user.id;

    if (!seller_name) {
      return res.status(400).json({ error: 'El nombre de vendedor es requerido' });
    }

    const updatedUser = await UserModel.updateSellerProfile(userId, { seller_name, seller_bio });
    res.json({ message: 'Perfil de vendedor actualizado con éxito', user: updatedUser });
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
    const query = 'SELECT * FROM login_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50';
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
