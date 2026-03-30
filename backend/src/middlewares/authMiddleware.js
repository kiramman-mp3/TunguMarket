import jwt from 'jsonwebtoken';
import SessionModel from '../models/sessionModel.js';
import UserModel from '../models/userModel.js';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 1. Check if session exists in DB
    const session = await SessionModel.findByToken(token);
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalidated' });
    }

    // 2. Check if user is banned
    const user = await UserModel.findById(decoded.id);
    if (!user || user.is_banned) {
      // Security: if user is banned, invalidate current session
      await SessionModel.deleteSession(token);
      return res.status(403).json({ error: 'ACCOUNT_BANNED' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
};

export { authMiddleware, isAdmin };
