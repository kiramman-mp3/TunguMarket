import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import UserModel from '../models/userModel.js';
import SessionModel from '../models/sessionModel.js';
import admin from '../config/firebase.js';

class AuthService {
  static async register({ name, email, password, roleId = 2 }) { // 2 = usuario_general
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return await UserModel.createUser({
      name,
      email,
      passwordHash,
      roleId,
    });
  }

  static async login({ email, password, ipAddress, deviceInfo }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.is_banned) {
      throw new Error('Your account is banned. Please contact support.');
    }

    // Login attempts limit logic
    if (user.login_attempts >= 5 && (new Date() - new Date(user.last_attempt)) < 15 * 60 * 1000) {
      throw new Error('Too many login attempts. Try again in 15 minutes.');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      await UserModel.incrementLoginAttempts(email);
      throw new Error('Invalid credentials');
    }

    await UserModel.resetLoginAttempts(email);

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
      throw new Error('Your account is banned.');
    }

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
}

export default AuthService;
