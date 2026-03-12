import { Router } from 'express';
const router = Router();
import User from '../models/User.js';
import { genSalt, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Signup Route
router.post('/', async (req, res) => {
  try {
    const username = (req.body?.username || '').trim();
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password || '';

    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'Username, email, and password are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      const usernameTaken = existingUser.username === username;
      const emailTaken = existingUser.email === email;

      if (usernameTaken && emailTaken) {
        return res.status(400).json({ msg: 'Username and email already exist' });
      }

      if (usernameTaken) {
        return res.status(400).json({ msg: 'Username already exists' });
      }

      if (emailTaken) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
    }

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });

    return res.json({ 
      user: {
        _id: user._id,       
        id: user._id,
        username: user.username,
        email: user.email
      },
      token, 
      isNew: true
    });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern) {
      if (err.keyPattern.username && err.keyPattern.email) {
        return res.status(400).json({ msg: 'Username and email already exist' });
      }
      if (err.keyPattern.username) {
        return res.status(400).json({ msg: 'Username already exists' });
      }
      if (err.keyPattern.email) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
      return res.status(400).json({ msg: 'Account already exists' });
    }

    console.error(err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
