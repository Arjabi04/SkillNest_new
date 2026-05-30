import { Router } from 'express';
import { randomBytes } from 'crypto';
const router = Router();
import User from '../models/User.js';
import { genSalt, hash } from 'bcrypt';
import { createMailTransport } from '../utils/email.js';

// POST /api/forgot-password
router.post('/', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Email does not exist in DB
      return res.status(404).json({ msg: 'Email does not exist.' });
    }

    // Generate a token
    const token = randomBytes(32).toString('hex');

    // Store token and expiry in DB
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const transporter = createMailTransport();
    if (!transporter) {
      return res.status(500).json({ msg: 'Email service is not configured.' });
    }

    const resetUrl = `http://localhost:3000/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset - SkillNest',
      html: `<p>You requested a password reset. Click this <a href="${resetUrl}">link</a> to reset your password. This link is valid for 1 hour.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ msg: 'Reset link has been sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/reset-password/:token
router.post('/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired token.' });
    }

    // Hash new password
    const salt = await genSalt(10);
    user.password = await hash(password, salt);

    // Remove token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ msg: 'Password reset successful!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
