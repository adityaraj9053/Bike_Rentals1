import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'bike_rentals_jwt_access_secret_production_key_2026';

/**
 * Middleware to verify JWT authentication token
 */
export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No bearer token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    const user = await UserModel.findById(decoded.id).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account has been suspended or deactivated.',
      });
    }

    const ownerEmail = (process.env.OWNER_EMAIL || 'gamedevelop06@gmail.com').trim().toLowerCase();
    const isOwner = user.email && user.email.toLowerCase() === ownerEmail;

    req.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: isOwner ? 'OWNER' : user.role,
      avatarUrl: user.avatarUrl,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
}

/**
 * Optional token verification: attaches req.user if valid token present, doesn't block otherwise
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      const user = await UserModel.findById(decoded.id).lean();
      if (user && user.isActive) {
        const ownerEmail = (process.env.OWNER_EMAIL || 'gamedevelop06@gmail.com').trim().toLowerCase();
        const isOwner = user.email && user.email.toLowerCase() === ownerEmail;

        req.user = {
          id: user._id.toString(),
          _id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          role: isOwner ? 'OWNER' : user.role,
        };
      }
    }
  } catch (err) {
    // Ignore invalid/expired token in optionalAuth
  }
  next();
}

/**
 * Middleware to enforce role-based access control
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}
