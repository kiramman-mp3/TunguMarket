import express from 'express';
import UserController from '../controllers/userController.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js';
import { uploadAvatars } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// --- RUTAS PÚBLICAS ---

// Obtener información pública de un vendedor
router.get('/seller/:id', UserController.getSellerInfo);

// --- RUTAS PROTEGIDAS (USUARIO) ---

// Actualización general del perfil (nombre)
router.put('/profile', authMiddleware, UserController.updateProfile);

// Actualizar avatar (foto de perfil)
router.post('/profile/avatar', authMiddleware, uploadAvatars.single('avatar'), UserController.updateAvatar);

// Cambiar contraseña
router.put('/change-password', authMiddleware, UserController.changePassword);

// Actualizar perfil de vendedor (nombre y bio)
router.put('/seller-profile', authMiddleware, UserController.updateSellerProfile);

// Obtener sesiones activas
router.get('/sessions', authMiddleware, UserController.getSessions);

// Obtener logs de inicio de sesión
router.get('/logs', authMiddleware, UserController.getLogs);

// Cerrar sesión específica (Cierre remoto)
router.delete('/sessions/:token', authMiddleware, UserController.remoteLogout);

// --- RUTAS DE ADMINISTRADOR ---

// Listar todos los usuarios
router.get('/admin/users', authMiddleware, isAdmin, UserController.adminListUsers);

// Banear/Desbanear usuario
router.patch('/admin/users/:id/status', authMiddleware, isAdmin, UserController.adminToggleUserStatus);

export default router;
