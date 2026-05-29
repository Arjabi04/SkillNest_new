import { Router } from 'express';
const router = Router();
import jwt from 'jsonwebtoken';

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin@gmail.com';
const ADMIN_PASSWORD = 'skillnestadmin@123';

// Admin Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: "Server misconfigured: JWT_SECRET is missing" });
    }

    // Validate credentials against hardcoded admin
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ msg: "Invalid admin credentials" });
    }

    // Generate admin token with admin flag
    const adminToken = jwt.sign(
      { 
        id: 'admin',
        username: ADMIN_USERNAME,
        isAdmin: true 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      token: adminToken,
      admin: {
        username: ADMIN_USERNAME,
        isAdmin: true
      },
      msg: "Admin login successful"
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Verify admin token (for checking if user is admin)
router.get('/verify', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ isAdmin: false, msg: "Server misconfigured: JWT_SECRET is missing" });
    }

    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-admin-token'];
    
    if (!token) {
      return res.status(401).json({ isAdmin: false, msg: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.isAdmin) {
        return res.json({ isAdmin: true, admin: decoded });
      } else {
        return res.status(403).json({ isAdmin: false, msg: "Not an admin token" });
      }
    } catch (err) {
      return res.status(401).json({ isAdmin: false, msg: "Invalid or expired token" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
