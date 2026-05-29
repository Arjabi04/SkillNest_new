import jwt from 'jsonwebtoken';

/**
 * Middleware to verify admin authentication
 * Checks for admin token in Authorization header or x-admin-token header
 */
export const verifyAdmin = (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: "Server misconfigured: JWT_SECRET is missing" });
    }

    // Get token from Authorization header or x-admin-token header
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-admin-token'];
    
    if (!token) {
      return res.status(401).json({ 
        msg: "Admin permission required. Please login as admin." 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token has admin flag
      if (!decoded.isAdmin) {
        return res.status(403).json({ 
          msg: "Admin permission required. You are not authorized to perform this action." 
        });
      }

      // Attach admin info to request
      req.admin = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ 
        msg: "Invalid or expired admin token. Please login again." 
      });
    }
  } catch (err) {
    console.error("Admin auth middleware error:", err);
    res.status(500).json({ msg: "Server error during authentication" });
  }
};
