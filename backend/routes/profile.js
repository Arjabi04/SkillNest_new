import { Router } from "express";
const router = Router();
import multer, { memoryStorage } from "multer";
import cloudinary from "../config/cloudinary.js";
import User from '../models/User.js';
import { createReadStream } from "streamifier"; 
import auth from '../middleware/auth.js';

// Multer memory storage
const storage = memoryStorage();
const upload = multer({ storage });

// GET /api/profile/me
router.get("/me", auth, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio || "",
      profileImage: user.profileImage || "",
      headerImage: user.headerImage || "",
      interests: Array.isArray(user.interests) ? user.interests : [],
      notificationsEnabled: user.notificationsEnabled !== false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
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
      bio: user.bio || "",
      profileImage: user.profileImage || "",
      headerImage: user.headerImage || "",
      interests: Array.isArray(user.interests) ? user.interests : []
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

// PUT /api/profile/me
router.put("/me", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      username,
      email,
      bio,
      notificationsEnabled,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const nextUsername = typeof username === 'string' ? username.trim() : user.username;
    const nextEmail = typeof email === 'string' ? email.trim().toLowerCase() : user.email;

    if (!nextUsername) {
      return res.status(400).json({ msg: "Username is required" });
    }

    if (!nextEmail) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const duplicateUser = await User.findOne({
      _id: { $ne: userId },
      $or: [
        { username: nextUsername },
        { email: nextEmail }
      ]
    });

    if (duplicateUser) {
      if (duplicateUser.username === nextUsername && duplicateUser.email === nextEmail) {
        return res.status(400).json({ msg: "Username and email already exist" });
      }
      if (duplicateUser.username === nextUsername) {
        return res.status(400).json({ msg: "Username already exists" });
      }
      if (duplicateUser.email === nextEmail) {
        return res.status(400).json({ msg: "Email already exists" });
      }
    }

    user.username = nextUsername;
    user.email = nextEmail;

    if (typeof bio === 'string') {
      user.bio = bio;
    }

    if (typeof notificationsEnabled === 'boolean') {
      user.notificationsEnabled = notificationsEnabled;
    }

    await user.save();

    res.json({
      msg: "Settings updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        headerImage: user.headerImage,
        notificationsEnabled: user.notificationsEnabled,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


export default router;
