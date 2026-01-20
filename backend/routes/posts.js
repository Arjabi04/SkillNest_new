import { Router } from "express";
const router = Router();
import multer, { memoryStorage } from "multer";
import { createReadStream } from "streamifier";
import cloudinary from "../config/cloudinary.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

const storage = memoryStorage();
const upload = multer({ storage });

// CREATE POST
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { userId, text, tags } = req.body;
    if (!userId || !text) return res.status(400).json({ msg: "Missing user or text" });

    let tagArray = [];
    if (tags) {
      try {
        tagArray = Array.isArray(tags) ? tags : JSON.parse(tags);
      } catch (e) {
        tagArray = String(tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    let imageUrl = "";

    if (req.file) {
      // Upload to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "skillnest_posts" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          }
        );
        createReadStream(req.file.buffer).pipe(uploadStream);
      });

      imageUrl = await uploadPromise;
    }

    const post = new Post({
      user: user._id, // matches your schema
      text,
      image: imageUrl,
      tags: tagArray,
    });

    await post.save();

    res.json({ msg: "Post created", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET POSTS BY USER
router.get("/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/posts - fetch all posts with user info
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "username profileImage");
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  } 
});

export default router;