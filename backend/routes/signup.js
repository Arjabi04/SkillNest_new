import { Router } from 'express';
const router = Router();
import User from '../models/User.js';
import { genSalt, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Signup Route
router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
    console.error(err.message);
    return res.status(500).send("Server error");
  }
});

export default router;
