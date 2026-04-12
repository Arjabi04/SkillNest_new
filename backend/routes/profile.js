import { Router } from "express";
import { randomBytes } from 'crypto';
import multer, { memoryStorage } from "multer";
import { createTransport } from 'nodemailer';
import { hash, compare } from 'bcryptjs';
import cloudinary from "../config/cloudinary.js";
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import { createReadStream } from "streamifier"; 

const router = Router();

// Multer memory storage
const storage = memoryStorage();
const upload = multer({ storage });

const createMailTransport = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null;
  }

  return createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const getBackendBaseUrl = () => {
  return (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '');
};

const getFrontendBaseUrl = () => {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
};

const sendVerificationEmail = async ({ email, token }) => {
  const transporter = createMailTransport();
  if (!transporter) {
    throw new Error('Email service is not configured');
  }

  const verificationUrl = `${getBackendBaseUrl()}/api/profile/verify-email/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your SkillNest email',
    html: `<p>We received a request to update your SkillNest email address.</p><p>Please verify this address by clicking <a href="${verificationUrl}">this verification link</a>. The link expires in 1 hour.</p><p>If you did not request this change, you can ignore this email.</p>`,
  });
};

const formatUserResponse = (user) => ({
  _id: user._id,
  id: user._id,
  username: user.username,
  email: user.pendingEmail || user.email,
  currentEmail: user.email,
  pendingEmail: user.pendingEmail || '',
  emailVerified: user.emailVerified !== false,
  bio: user.bio || '',
  profileImage: user.profileImage || '',
  headerImage: user.headerImage || '',
  interests: Array.isArray(user.interests) ? user.interests : [],
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    return res.json({ user: formatUserResponse(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const nextUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : user.username;
    const nextEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : user.email;

    if (!nextUsername) {
      return res.status(400).json({ msg: 'Name is required' });
    }

    const emailChanged = nextEmail !== user.email && nextEmail !== user.pendingEmail;

    if (emailChanged) {
      const emailInUse = await User.findOne({
        email: nextEmail,
        _id: { $ne: user._id },
      });

      if (emailInUse) {
        return res.status(400).json({ msg: 'Email already exists' });
      }

      const verificationToken = randomBytes(32).toString('hex');

      user.pendingEmail = nextEmail;
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = Date.now() + 60 * 60 * 1000;
      user.emailVerified = false;
      user.username = nextUsername;

      await user.save();
      await sendVerificationEmail({ email: nextEmail, token: verificationToken });

      return res.json({
        msg: 'Profile updated. Verification email sent.',
        verificationRequired: true,
        user: formatUserResponse(user),
      });
    }

    user.username = nextUsername;
    user.emailVerified = user.pendingEmail ? user.emailVerified : true;

    if (user.pendingEmail && nextEmail === user.email) {
      user.pendingEmail = '';
      user.emailVerificationToken = '';
      user.emailVerificationExpires = undefined;
      user.emailVerified = true;
    }

    await user.save();

    return res.json({
      msg: 'Profile updated',
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/me/resend-verification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({ msg: 'There is no email address waiting for verification' });
    }

    const verificationToken = randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 60 * 60 * 1000;
    user.emailVerified = false;
    await user.save();

    await sendVerificationEmail({ email: user.pendingEmail, token: verificationToken });

    return res.json({ msg: 'Verification email resent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user || !user.pendingEmail) {
      return res.redirect(`${getFrontendBaseUrl()}/settings?verification=invalid`);
    }

    const emailAlreadyTaken = await User.findOne({
      email: user.pendingEmail,
      _id: { $ne: user._id },
    });

    if (emailAlreadyTaken) {
      return res.redirect(`${getFrontendBaseUrl()}/settings?verification=taken`);
    }

    user.email = user.pendingEmail;
    user.pendingEmail = '';
    user.emailVerificationToken = '';
    user.emailVerificationExpires = undefined;
    user.emailVerified = true;
    await user.save();

    return res.redirect(`${getFrontendBaseUrl()}/settings?verification=success`);
  } catch (err) {
    console.error(err);
    return res.redirect(`${getFrontendBaseUrl()}/settings?verification=error`);
  }
});

// GET /api/profile/:userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ msg: "User ID missing" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({
      username: user.username,
      bio: user.bio || "",       // we will add bio field
      profileImage: user.profileImage || "",
      headerImage: user.headerImage || "",
      interests: Array.isArray(user.interests) ? user.interests : [],
      email: user.pendingEmail || user.email,
      currentEmail: user.email,
      pendingEmail: user.pendingEmail || '',
      emailVerified: user.emailVerified !== false,
      
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


// POST /api/profile/upload
router.post("/upload", upload.single("profileImage"), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ msg: "User ID missing" });
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    // Find user first
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Upload to Cloudinary using stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "skillnest_profiles" },
      async (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ msg: "Cloudinary upload failed", error });
        }

        // Save the URL in the user document
        user.profileImage = result.secure_url;
        await user.save();

        return res.json({ msg: "Profile image uploaded", url: result.secure_url });
      }
    );

    // Pipe the file buffer to Cloudinary
    createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/profile/upload-header
router.post("/upload-header", upload.single("headerImage"), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ msg: "User ID missing" });
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "skillnest_headers" },
      async (error, result) => {
        if (error) return res.status(500).json({ msg: "Cloudinary upload failed", error });

        user.headerImage = result.secure_url;
        await user.save();

        res.json({ msg: "Header image uploaded", url: result.secure_url });
      }
    );

    createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/profile/bio
router.post("/bio", async (req, res) => {
  try {
    const { userId, bio } = req.body;
    if (!userId) return res.status(400).json({ msg: "User ID missing" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.bio = bio;  // update bio
    await user.save();

    res.json({ msg: "Bio updated", bio: user.bio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/profile/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ msg: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ msg: 'New password and confirmation do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Get user and verify current password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Hash and save new password
    const hashedPassword = await hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
