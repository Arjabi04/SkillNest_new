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
    const { userId, text, tags } = req.body || {};
    if (!userId || !String(text || "").trim()) return res.status(400).json({ msg: "Missing user or text" });

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
      text: String(text).trim(),
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
      .populate("user", "username profileImage")
      .populate("comments.user", "username profileImage")
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
      .populate("user", "username profileImage")
      .populate("comments.user", "username profileImage");
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  } 
});

// LIKE POST
router.post("/:postId/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const userIdStr = userId.toString();
    const alreadyLiked = post.likes.some(id => id.toString() === userIdStr);

    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userIdStr);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ msg: alreadyLiked ? "Like removed" : "Post liked", likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ADD COMMENT TO POST
router.post("/:postId/comment", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const { postId } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "Comment text is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    post.comments.push({
      user: userId,
      text: text.trim()
    });

    await post.save();
    await post.populate("comments.user", "username profileImage");
    res.json({ msg: "Comment added", comments: post.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE COMMENT FROM POST
router.delete("/:postId/comments/:commentIdx", async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId, commentIdx } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const commentIndex = parseInt(commentIdx);
    if (isNaN(commentIndex) || commentIndex < 0 || commentIndex >= post.comments.length) {
      return res.status(400).json({ msg: "Invalid comment index" });
    }

    const comment = post.comments[commentIndex];
    const commentUserId = typeof comment.user === 'string' ? comment.user : comment.user._id;
    const isCommentOwner = commentUserId.toString() === userId.toString();

    if (!isCommentOwner) {
      return res.status(403).json({ msg: "You can only delete your own comments" });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();
    await post.populate("comments.user", "username profileImage");
    res.json({ msg: "Comment deleted", comments: post.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE POST
router.put("/:postId", async (req, res) => {
  try {
    const { userId, text, tags } = req.body;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if user owns the post
    const postUserId = typeof post.user === 'string' ? post.user : post.user._id;
    if (postUserId.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "You can only edit your own posts" });
    }

    // Update post
    post.text = text;
    if (tags && Array.isArray(tags)) {
      post.tags = tags;
    }

    await post.save();
    await post.populate("user", "username profileImage");
    res.json({ msg: "Post updated", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE POST
router.delete("/:postId", async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if user owns the post
    const postUserId = typeof post.user === 'string' ? post.user : post.user._id;
    if (postUserId.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ msg: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;