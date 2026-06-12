import AuthService from '../services/authService.js';

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, birthDate } = req.body;
      const user = await AuthService.register({ name, email, password, birthDate });
      res.status(201).json({ 
        message: 'Usuario registrado exitosamente', 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'usuario_general', // Default for register
          birthDate: user.birth_date,
          avatar_url: user.avatar_url
        } 
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const deviceInfo = req.headers['user-agent'];
      const isMobile = req.headers['x-client-type'] === 'mobile';

      const { user, token } = await AuthService.login({ email, password, ipAddress, deviceInfo, isMobile });

      res.status(200).json({
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role_name,
          birthDate: user.birth_date,
          avatar_url: user.avatar_url
        },
        token,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await AuthService.logout(token);
      }
      res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async remoteLogout(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden cerrar sesiones remotamente.' });
      }

      const { userId } = req.body; 
      await AuthService.logoutAllSessions(userId);
      res.status(200).json({ message: 'Todas las sesiones cerradas para el usuario' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // --- New Handlers for Module 1 ---

  static async verifyEmail(req, res) {
    try {
      const { email, token } = req.body;
      const isMobile = req.headers['x-client-type'] === 'mobile';
      const result = await AuthService.verifyEmail(email, token, isMobile);
      res.status(200).json({
        ...result,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role_name,
          birthDate: result.user.birth_date,
          avatar_url: result.user.avatar_url
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async resendVerification(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.resendVerificationEmail(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async validateResetToken(req, res) {
    try {
      const { email, token } = req.body;
      const result = await AuthService.validateResetToken(email, token);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email, token, password } = req.body;
      const result = await AuthService.resetPassword(email, token, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default AuthController;
