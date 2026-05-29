import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (!origin) return;

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.header('Vary', 'Origin');
};

const auth = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      setCorsHeaders(req, res);
      return res.status(500).json({ msg: "Server misconfigured: JWT_SECRET is missing" });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      setCorsHeaders(req, res);
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      setCorsHeaders(req, res);
      return res.status(401).json({ msg: 'User not found' });
    }

    if (user?.moderation?.isBanned) {
      setCorsHeaders(req, res);
      return res.status(403).json({ msg: "Account banned. Please contact support." });
    }

    const suspendedUntil = user?.moderation?.suspendedUntil ? new Date(user.moderation.suspendedUntil) : null;
    if (suspendedUntil && suspendedUntil.getTime() > Date.now()) {
      setCorsHeaders(req, res);
      return res.status(403).json({
        msg: `Account suspended until ${suspendedUntil.toISOString()}.`,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    setCorsHeaders(req, res);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default auth;
