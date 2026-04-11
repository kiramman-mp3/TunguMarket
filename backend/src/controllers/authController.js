import AuthService from '../services/authService.js';

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, birthDate } = req.body;
      const user = await AuthService.register({ name, email, password, birthDate });
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const deviceInfo = req.headers['user-agent'];

      const { user, token } = await AuthService.login({ email, password, ipAddress, deviceInfo });

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role_name,
          birthDate: user.birth_date
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
      res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async remoteLogout(req, res) {
    try {
      const { userId } = req.body; // Only admin should access this
      await AuthService.logoutAllSessions(userId);
      res.status(200).json({ message: 'All sessions closed for user' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // --- New Handlers for Module 1 ---

  static async verifyEmail(req, res) {
    try {
      const { email, token } = req.body;
      const result = await AuthService.verifyEmail(email, token);
      res.status(200).json(result);
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
