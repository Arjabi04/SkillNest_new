import { Router } from 'express';
const router = Router();
import User from '../models/User.js';
import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Login Route
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ msg: "Server misconfigured: JWT_SECRET is missing" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Check if user has interests (old user) or not (new user)
    const hasInterests = user.interests && user.interests.length > 0;

    res.json({ 
      token, 
      user: { 
        _id: user._id,
        id: user._id, 
        username: user.username, 
        email: user.email 
      },
      hasInterests // Flag to indicate if user has selected interests
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

export default router;
