import UserModel from '../models/userModel.js';
import SessionModel from '../models/sessionModel.js';
import SSEService from '../services/sseService.js';
import EmailService from '../services/emailService.js';
import bcrypt from 'bcryptjs';

class UserController {
  /**
   * Obtiene la información pública de un vendedor
   */
  static async getSellerInfo(req, res) {
    try {
      const { id } = req.params;
      const seller = await UserModel.findSellerById(id);

      if (!seller) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(200).json(seller);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Actualiza el perfil general del usuario (Nombre)
   */
  static async updateProfile(req, res) {
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

      res.status(200).json({ 
        message: 'Perfil actualizado con éxito', 
        user: updatedUser 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Actualiza el avatar (foto de perfil)
   */
  static async updateAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
      }

      const userId = req.user.id;
      const port = process.env.PORT || 5000;
      const baseUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
      const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

      const updatedUser = await UserModel.updateProfile(userId, { avatar_url: avatarUrl });
      
      res.status(200).json({ 
        message: 'Foto de perfil actualizada exitosamente', 
        avatar_url: avatarUrl, 
        user: updatedUser 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Cambia la contraseña del usuario
   */
  static async changePassword(req, res) {
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

      res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Actualiza el perfil de vendedor (nombre comercial y bio)
   */
  static async updateSellerProfile(req, res) {
    try {
      const { seller_name, seller_bio } = req.body;
      const userId = req.user.id;

      if (!seller_name) {
        return res.status(400).json({ error: 'El nombre de vendedor es requerido' });
      }

      const updatedUser = await UserModel.updateSellerProfile(userId, { seller_name, seller_bio });
      
      res.status(200).json({ 
        message: 'Perfil de vendedor actualizado con éxito', 
        user: updatedUser 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene las sesiones activas del usuario
   */
  static async getSessions(req, res) {
    try {
      const sessions = await SessionModel.findActiveSessionsByUser(req.user.id);
      res.status(200).json(sessions);
    } catch (error) {
      console.error('[DATABASE ERROR /sessions]:', error);
      res.status(500).json({ error: 'Error interno del servidor al obtener las sesiones' });
    }
  }

  /**
   * Obtiene el historial de inicios de sesión
   */
  static async getLogs(req, res) {
    try {
      const logs = await UserModel.getLoginLogs(req.user.id);
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Cierra una sesión específica (Cierre remoto)
   */
  static async remoteLogout(req, res) {
    try {
      const { token } = req.params;
      
      const session = await SessionModel.findByToken(token);
      
      if (!session || session.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Permiso denegado. La sesión no existe o no le pertenece.' });
      }

      await SessionModel.deleteSession(token);
      res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * [ADMIN] Lista todos los usuarios registrado
   */
  static async adminListUsers(req, res) {
    try {
      const users = await UserModel.listAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * [ADMIN] Banear/Desbanear un usuario
   */
  static async adminToggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isBanned } = req.body;

      if (id === req.user.id) {
        return res.status(400).json({ error: 'No puedes banearte a ti mismo' });
      }

      const updatedUser = await UserModel.banUser(id, isBanned);

      // Si se banea, cerrar todas sus sesiones y notificar en tiempo real
      if (isBanned) {
        await SessionModel.deleteByUser(id);
        SSEService.sendToUser(id, { type: 'ACCOUNT_BANNED' });
      }

      res.status(200).json({ 
        message: `Usuario ${isBanned ? 'baneado' : 'desbaneado'} exitosamente`, 
        user: updatedUser 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default UserController;
