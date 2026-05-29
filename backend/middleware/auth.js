import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: "Server misconfigured: JWT_SECRET is missing" });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    if (user?.moderation?.isBanned) {
      return res.status(403).json({ msg: "Account banned. Please contact support." });
    }

    const suspendedUntil = user?.moderation?.suspendedUntil ? new Date(user.moderation.suspendedUntil) : null;
    if (suspendedUntil && suspendedUntil.getTime() > Date.now()) {
      return res.status(403).json({
        msg: `Account suspended until ${suspendedUntil.toISOString()}.`,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default auth;
