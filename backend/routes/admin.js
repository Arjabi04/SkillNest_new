import { Router } from 'express';
const router = Router();
import jwt from 'jsonwebtoken';
import { hash, compare } from "bcryptjs";
import AdminAccount from "../models/AdminAccount.js";
import { verifyAdmin } from "../middleware/adminAuth.js";

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin@gmail.com';
const ADMIN_PASSWORD = 'skillnestadmin@123';

const normalizeUsername = (value) => String(value || "").trim().toLowerCase();

// Admin Login Route
router.post('/login', async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: "Server misconfigured: JWT_SECRET is missing" });
    }

    // 1) Prefer DB-backed admin accounts.
    const account = await AdminAccount.findOne({ username, isActive: true }).select("username passwordHash").lean();
    if (account) {
      const ok = await compare(password, account.passwordHash);
      if (!ok) return res.status(401).json({ msg: "Invalid admin credentials" });

      const adminToken = jwt.sign(
        {
          id: String(account._id),
          username: account.username,
          isAdmin: true,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({
        token: adminToken,
        admin: {
          id: String(account._id),
          username: account.username,
          isAdmin: true,
        },
        msg: "Admin login successful",
      });
    }

    // 2) Fallback to hardcoded root admin for backwards compatibility.
    if (username !== normalizeUsername(ADMIN_USERNAME) || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ msg: "Invalid admin credentials" });
    }

    // Generate admin token with admin flag
    const adminToken = jwt.sign(
      { 
        id: 'root',
        username: normalizeUsername(ADMIN_USERNAME),
        isAdmin: true 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      token: adminToken,
      admin: {
        id: "root",
        username: normalizeUsername(ADMIN_USERNAME),
        isAdmin: true
      },
      msg: "Admin login successful"
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin: create a new admin account.
router.post("/accounts", verifyAdmin, async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({ msg: "username and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ msg: "Password must be at least 8 characters" });
    }

    const existing = await AdminAccount.findOne({ username }).select("_id").lean();
    if (existing) {
      return res.status(409).json({ msg: "Admin already exists" });
    }

    const passwordHash = await hash(password, 12);
    const created = await AdminAccount.create({
      username,
      passwordHash,
      createdBy: req.admin?.id || "admin",
      isActive: true,
    });

    res.status(201).json({
      msg: "Admin created",
      admin: {
        id: String(created._id),
        username: created.username,
        isActive: created.isActive,
        createdAt: created.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin: list admin accounts (excluding password hashes).
router.get("/accounts", verifyAdmin, async (_req, res) => {
  try {
    const accounts = await AdminAccount.find({})
      .select("username isActive createdAt updatedAt createdBy")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      admins: accounts.map((a) => ({
        id: String(a._id),
        username: a.username,
        isActive: a.isActive,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        createdBy: a.createdBy,
      })),
    });
  } catch (err) {
    console.error(err);
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
