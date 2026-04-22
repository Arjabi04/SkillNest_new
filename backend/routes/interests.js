// routes/hobbies.js
import { Router } from "express";
const router = Router();
import User from '../models/User.js';
import auth from '../middleware/auth.js';

// POST /api/hobbies
router.post("/", auth, async (req, res) => {
  const { userId, interests } = req.body;

  try {
    if (!userId) return res.status(400).json({ msg: "User ID missing" });
    if (String(req.user._id) !== String(userId)) {
      return res.status(403).json({ msg: "You can only update your own interests" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.interests = interests; // update interests array
    await user.save();

    res.json({ msg: "Interests updated successfully", interests: user.interests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
