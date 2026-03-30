import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import UserModel from '../models/userModel.js';
import SessionModel from '../models/sessionModel.js';
import EmailService from './emailService.js';
import admin from '../config/firebase.js';

class AuthService {
  static async register({ name, email, password, birthDate, roleId = 2 }) { // 2 = usuario_general
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Age validation (>= 18)
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new Error('Debes tener al menos 18 años para registrarte.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser({
      name,
      email,
      passwordHash,
      roleId,
      birthDate
    });

    // Generate 6-Digit Verification Token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[TEST] Verification Code for ${user.email}: ${token}`);
    await UserModel.createVerificationToken(user.id, token);

    // Send Email (Non-blocking for testing/slow networks)
    EmailService.sendVerificationEmail(user.email, user.name, token).catch(error => {
      console.error('Error sending verification email (background):', error);
    });

    return user;
  }

  static async login({ email, password, ipAddress, deviceInfo }) {
    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      await UserModel.recordLoginLog({ email, ipAddress, deviceInfo, status: 'failure', message: 'Usuario no encontrado' });
      throw new Error('Invalid credentials');
    }

    if (user.is_banned) {
      await UserModel.recordLoginLog({ userId: user.id, email, ipAddress, deviceInfo, status: 'failure', message: 'Usuario baneado' });
      throw new Error('Your account is banned. Please contact support.');
    }

    // STRICT VERIFICATION
    if (!user.is_verified) {
      await UserModel.recordLoginLog({ userId: user.id, email, ipAddress, deviceInfo, status: 'failure', message: 'Email no verificado' });
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    // Login attempts limit logic
    if (user.login_attempts >= 5 && (new Date() - new Date(user.last_attempt)) < 15 * 60 * 1000) {
      await UserModel.recordLoginLog({ userId: user.id, email, ipAddress, deviceInfo, status: 'failure', message: 'Demasiados intentos fallidos' });
      throw new Error('Too many login attempts. Try again in 15 minutes.');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await UserModel.incrementLoginAttempts(email);
      await UserModel.recordLoginLog({ userId: user.id, email, ipAddress, deviceInfo, status: 'failure', message: 'Contraseña incorrecta' });
      throw new Error('Invalid credentials');
    }

    await UserModel.resetLoginAttempts(email);
    await UserModel.recordLoginLog({ userId: user.id, email, ipAddress, deviceInfo, status: 'success', message: 'Inicio de sesión exitoso' });

    // Generate JWT
    const token = this.generateToken(user);

    // Create session in DB
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    await SessionModel.createSession({
      userId: user.id,
      token,
      ipAddress,
      deviceInfo,
      expiresAt,
    });

    return { user, token };
  }

  static async googleLogin({ idToken, ipAddress, deviceInfo }) {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, uid } = decodedToken;

    let user = await UserModel.findByEmail(email);

    if (!user) {
      // Create user if doesn't exist (assuming role 2)
      user = await UserModel.createUser({
        name,
        email,
        firebaseUid: uid,
        roleId: 2,
      });
      await UserModel.updateVerification(user.id, true); // Google emails are verified
    }

    if (user.is_banned) {
      await UserModel.recordLoginLog({ userId: user.id, email, ipAddress, deviceInfo, status: 'failure', message: 'Usuario baneado (Google)' });
      throw new Error('Your account is banned.');
    }

    await UserModel.recordLoginLog({ userId: user.id, email, ipAddress, deviceInfo, status: 'success', message: 'Inicio de sesión exitoso (Google)' });

    const token = this.generateToken(user);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await SessionModel.createSession({
      userId: user.id,
      token,
      ipAddress,
      deviceInfo,
      expiresAt,
    });

    return { user, token };
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static async logout(token) {
    await SessionModel.deleteSession(token);
  }

  static async logoutAllSessions(userId) {
    await SessionModel.deleteByUser(userId);
  }

  // --- New Methods for Module 1 ---

  static async verifyEmail(email, token) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('User not found');

    const verificationToken = await UserModel.findVerificationToken(token);
    if (!verificationToken || verificationToken.user_id !== user.id) {
      throw new Error('Código de verificación inválido o expirado.');
    }

    await UserModel.updateVerification(user.id, true);
    await UserModel.deleteVerificationToken(token);

    // After verification, we could return a session token or just a success message 
    // Usually, we want them to log in after verification or just log them in automatically 
    // Here, we'll log them in automatically for better UX
    const sessionToken = this.generateToken(user);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await SessionModel.createSession({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    return { message: 'Cuenta verificada e inicio de sesión exitoso', user, token: sessionToken };
  }

  static async resendVerificationEmail(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('User not found');
    if (user.is_verified) throw new Error('Esta cuenta ya está verificada.');

    // Delete old tokens
    await UserModel.deleteVerificationTokensByUser(user.id);

    // Generate new numeric token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[TEST] Resent Verification Code for ${user.email}: ${token}`);
    await UserModel.createVerificationToken(user.id, token);

    // Send Email (Non-blocking for testing/slow networks)
    EmailService.sendVerificationEmail(user.email, user.name, token).catch(error => {
      console.error('Error sending verification email (background):', error);
    });
    
    return { message: 'Código de verificación reenviado.' };
  }

  static async forgotPassword(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Security best practice: don't reveal if email exists, but we'll show it for now 
      // as requested by the specific recovery flow.
      throw new Error('User not found');
    }

    // Delete old reset tokens
    await UserModel.deletePasswordResetTokensByUser(user.id);

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[TEST] Password Reset Code for ${user.email}: ${token}`);
    await UserModel.createPasswordResetToken(user.id, token);

    // Send Email (Non-blocking for testing/slow networks)
    EmailService.sendPasswordResetEmail(user.email, user.name, token).catch(error => {
      console.error('Error sending password reset email (background):', error);
    });
    
    return { message: 'Código de recuperación enviado al correo.' };
  }

  static async validateResetToken(email, token) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('Usuario no encontrado.');

    const resetToken = await UserModel.findPasswordResetToken(token);
    if (!resetToken || resetToken.user_id !== user.id) {
      throw new Error('Código de recuperación inválido o expirado.');
    }

    return { message: 'Código válido.' };
  }

  static async resetPassword(email, token, newPassword) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('Usuario no encontrado.');

    const resetToken = await UserModel.findPasswordResetToken(token);
    if (!resetToken || resetToken.user_id !== user.id) {
      throw new Error('Código de recuperación inválido o expirado.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(user.id, passwordHash);
    await UserModel.deletePasswordResetToken(token);
    
    // Optional: close all active sessions for security after password change
    await SessionModel.deleteByUser(user.id);

    return { message: 'Contraseña restablecida con éxito.' };
  }
}

export default AuthService;
