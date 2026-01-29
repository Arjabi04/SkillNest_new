import { Router } from "express";
const router = Router();
import multer, { memoryStorage } from "multer";
import { createReadStream } from "streamifier";
import cloudinary from "../config/cloudinary.js";
import Community from "../models/Community.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { verifyAdmin } from "../middleware/adminAuth.js";
import { isCommunityAdmin, isCommunityAdminOrModerator } from "../middleware/communityAuth.js";

const storage = memoryStorage();
const upload = multer({ storage });

// ============================================================
// PILLAR 1: GATED COMMUNITY CREATION (Site Admin Approval)
// ============================================================

// CREATE COMMUNITY - Any user can request, status defaults to 'pending'
router.post("/", upload.single("coverImage"), async (req, res) => {
  try {
    const { name, description, creatorId, interests } = req.body;
    
    if (!name || !description || !creatorId) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Check if community name already exists
    const existing = await Community.findOne({ name });
    if (existing) {
      return res.status(400).json({ msg: "Community name already taken" });
    }

    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Upload cover image if provided
    let coverImageUrl = "";
    if (req.file) {
      try {
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "skillnest_communities" },
            (err, result) => {
              if (err) reject(err);
              else resolve(result.secure_url);
            }
          );
          createReadStream(req.file.buffer).pipe(uploadStream);
        });
        coverImageUrl = await uploadPromise;
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ msg: "Image upload failed" });
      }
    }

    // Parse interests
    let interestsArray = [];
    if (interests) {
      if (typeof interests === 'string') {
        interestsArray = interests.split(',').map(i => i.trim()).filter(i => i.length > 0);
      } else if (Array.isArray(interests)) {
        interestsArray = interests;
      }
    }

    // Create community with pending status
    const community = new Community({
      name,
      description,
      creator: creatorId,
      interests: interestsArray,
      members: [creatorId],
      admins: [creatorId], // Creator is default Community Admin
      moderators: [], // Empty initially
      coverImage: coverImageUrl,
      status: 'pending', // Requires Site Admin approval
      deletionRequested: false,
    });

    await community.save();
    await community.populate("creator", "username profileImage");

    res.json({ 
      msg: "Community creation request submitted. Waiting for admin approval.", 
      community 
    });
  } catch (err) {
    console.error("Community creation error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// GET ALL COMMUNITIES - Regular users only see approved, admins see all
router.get("/", async (req, res) => {
  try {
    const { userId, admin } = req.query;
    
    // Build query - regular users only see approved communities
    let query = {};
    if (admin !== 'true') {
      query = { status: 'approved', deletionRequested: false };
    }
    
    let communities = await Community.find(query)
      .populate("creator", "username profileImage")
      .populate("members", "username")
      .populate("admins", "username")
      .populate("moderators", "username")
      .sort({ createdAt: -1 });

    // Sort by user interests if userId provided
    if (userId && admin !== 'true') {
      const user = await User.findById(userId);
      if (user && user.interests && user.interests.length > 0) {
        communities = communities.sort((a, b) => {
          const aMatches = a.interests.filter(i => user.interests.includes(i)).length;
          const bMatches = b.interests.filter(i => user.interests.includes(i)).length;
          return bMatches - aMatches;
        });
      }
    }

    res.json(communities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET SINGLE COMMUNITY
router.get("/:communityId", async (req, res) => {
  try {
    const { userId } = req.query;
    const community = await Community.findById(req.params.communityId)
      .populate("creator", "username profileImage email")
      .populate("members", "username profileImage")
      .populate("admins", "username profileImage")
      .populate("moderators", "username profileImage")
      .populate("bannedUsers.user", "username")
      .populate("bannedUsers.bannedBy", "username");

    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    // Regular users can only see approved communities
    const isSiteAdmin = req.headers['x-admin-token'] || req.headers['authorization'];
    if (community.status !== 'approved' && !isSiteAdmin) {
      return res.status(403).json({ msg: "Community not available" });
    }

    res.json(community);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET PENDING REQUESTS (Site Admin Only)
router.get("/pending/all", verifyAdmin, async (req, res) => {
  try {
    const pendingCreations = await Community.find({ status: 'pending' })
      .populate("creator", "username profileImage email")
      .sort({ createdAt: -1 });

    const pendingDeletions = await Community.find({ 
      deletionRequested: true,
      status: 'approved'
    })
      .populate("creator", "username profileImage")
      .populate("deletionRequestedBy", "username email")
      .sort({ updatedAt: -1 });

    res.json({ 
      pendingCreations,
      pendingDeletions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// APPROVE COMMUNITY (Site Admin only)
router.post("/:communityId/approve", verifyAdmin, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) return res.status(404).json({ msg: "Community not found" });

    community.status = 'approved';
    
    // CRITICAL: Add the creator to admins and members list
    if (!community.admins.includes(community.creator)) {
      community.admins.push(community.creator);
    }
    if (!community.members.includes(community.creator)) {
      community.members.push(community.creator);
    }

    await community.save();
    res.json({ msg: "Community approved and creator promoted to Admin", community });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// SITE ADMIN REJECT COMMUNITY
router.post("/:communityId/reject", verifyAdmin, async (req, res) => {
  try {
    const community = await Community.findByIdAndUpdate(
      req.params.communityId, 
      { status: 'rejected' }, 
      { new: true }
    );

    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    res.json({ msg: "Community creation rejected", community });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// REQUEST COMMUNITY DELETION - Any user can request, needs Site Admin approval
router.post("/:communityId/request-deletion", async (req, res) => {
  try {
    const { userId } = req.body;
    const community = await Community.findById(req.params.communityId);

    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    if (community.status !== 'approved') {
      return res.status(400).json({ msg: "Only approved communities can be requested for deletion" });
    }

    community.deletionRequested = true;
    community.deletionRequestedBy = userId;
    await community.save();

    res.json({ msg: "Deletion request submitted. Waiting for admin approval." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// SITE ADMIN APPROVE DELETION
router.post("/:communityId/approve-deletion", verifyAdmin, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);

    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    if (!community.deletionRequested) {
      return res.status(400).json({ msg: "Community does not have a pending deletion request" });
    }

    // Delete all posts in the community
    await Post.deleteMany({ community: community._id });

    // Delete the community
    await Community.findByIdAndDelete(req.params.communityId);

    res.json({ msg: "Community and all its posts have been permanently deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// SITE ADMIN REJECT DELETION REQUEST
router.post("/:communityId/reject-deletion", verifyAdmin, async (req, res) => {
  try {
    const community = await Community.findByIdAndUpdate(
      req.params.communityId,
      { 
        deletionRequested: false,
        deletionRequestedBy: null
      },
      { new: true }
    );

    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    res.json({ msg: "Deletion request rejected. Community remains active.", community });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// PILLAR 2: OPEN MEMBERSHIP (No Join Request Approval)
// ============================================================

// JOIN COMMUNITY - Instant access for any user (if approved)
router.post("/:communityId/join", async (req, res) => {
  try {
    const { userId } = req.body;
    const community = await Community.findById(req.params.communityId);
    
    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    if (community.status !== 'approved') {
      return res.status(403).json({ msg: "Community is not yet approved" });
    }

    // Check if user is banned
    const isBanned = community.bannedUsers.some(b => {
      if (b.user.toString() !== userId) return false;
      if (b.banType === 'permanent') return true;
      if (b.banType === 'temporary' && b.expiresAt && new Date(b.expiresAt) > new Date()) return true;
      return false;
    });

    if (isBanned) {
      return res.status(403).json({ msg: "You are banned from this community" });
    }

    // Add to members if not already a member
    if (!community.members.some(m => m.toString() === userId)) {
      community.members.push(userId);
      await community.save();
    }

    res.json({ msg: "Joined community successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// LEAVE COMMUNITY - Any member can leave freely
router.post("/:communityId/leave", async (req, res) => {
  try {
    const { userId } = req.body;
    const community = await Community.findById(req.params.communityId);

    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    // Cannot remove the creator (they must transfer admin rights first)
    if (community.creator.toString() === userId) {
      return res.status(400).json({ 
        msg: "Community creator cannot leave. Please transfer admin rights first." 
      });
    }

    // Remove from members, moderators (but keep as admin if they are)
    community.members = community.members.filter(m => m.toString() !== userId);
    community.moderators = community.moderators.filter(m => m.toString() !== userId);
    
    // If they're an admin, remove from admins too (unless they're the creator)
    if (community.admins.some(a => a.toString() === userId) && 
        community.creator.toString() !== userId) {
      community.admins = community.admins.filter(a => a.toString() !== userId);
    }

    await community.save();
    res.json({ msg: "Left community successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET MEMBERS
router.get("/:communityId/members", async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId)
      .populate("members", "username profileImage")
      .populate("admins", "username profileImage")
      .populate("moderators", "username profileImage")
      .populate("bannedUsers.user", "username profileImage");

    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    res.json({
      members: community.members,
      admins: community.admins,
      moderators: community.moderators,
      bannedUsers: community.bannedUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// PILLAR 3: ROLE HIERARCHY (Admin > Moderator > Member)
// ============================================================

// PROMOTE TO MODERATOR (Community Admin only)
router.post("/:communityId/promote", isCommunityAdmin, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const community = await Community.findById(req.params.communityId);

    if (!targetUserId) {
      return res.status(400).json({ msg: "targetUserId is required" });
    }

    // Check if user is already a moderator
    if (community.moderators.some(m => m.toString() === targetUserId)) {
      return res.status(400).json({ msg: "User is already a moderator" });
    }

    // Check if user is a member
    if (!community.members.some(m => m.toString() === targetUserId)) {
      return res.status(400).json({ msg: "User must be a member to be promoted" });
    }

    community.moderators.push(targetUserId);
    await community.save();
    res.json({ msg: "User promoted to Moderator" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DEMOTE MODERATOR (Community Admin Only)
router.post("/:communityId/demote-moderator", isCommunityAdmin, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const community = req.community;

    if (!targetUserId) {
      return res.status(400).json({ msg: "targetUserId is required" });
    }

    // Remove from moderators (they remain as member)
    community.moderators = community.moderators.filter(m => m.toString() !== targetUserId);
    await community.save();

    res.json({ msg: "User demoted from moderator. They remain as a member." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// TRANSFER ADMIN RIGHTS (Community Admin Only)
router.post("/:communityId/transfer-admin", isCommunityAdmin, async (req, res) => {
  try {
    const { newAdminId } = req.body;
    const community = req.community;
    const currentAdminId = req.userId;

    if (!newAdminId) {
      return res.status(400).json({ msg: "newAdminId is required" });
    }

    // New admin must be a member
    if (!community.members.some(m => m.toString() === newAdminId)) {
      return res.status(400).json({ msg: "New admin must be a member first" });
    }

    // Add new admin
    if (!community.admins.some(a => a.toString() === newAdminId)) {
      community.admins.push(newAdminId);
    }

    // Remove current admin from admins (unless they're the creator - creator always stays)
    if (community.creator.toString() !== currentAdminId) {
      community.admins = community.admins.filter(a => a.toString() !== currentAdminId);
    }

    await community.save();
    res.json({ msg: "Admin rights transferred successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// EDIT COMMUNITY SETTINGS (Community Admin Only)
router.post("/:communityId/edit", isCommunityAdmin, upload.single("coverImage"), async (req, res) => {
  try {
    const { name, description, interests, rules } = req.body;
    const community = req.community;

    // Update fields
    if (name) community.name = name;
    if (description) community.description = description;
    if (rules !== undefined) community.rules = rules;
    
    if (interests) {
      if (typeof interests === 'string') {
        community.interests = interests.split(',').map(i => i.trim()).filter(i => i.length > 0);
      } else if (Array.isArray(interests)) {
        community.interests = interests;
      }
    }

    // Handle cover image upload
    if (req.file) {
      try {
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "skillnest_communities" },
            (err, result) => {
              if (err) reject(err);
              else resolve(result.secure_url);
            }
          );
          createReadStream(req.file.buffer).pipe(uploadStream);
        });
        community.coverImage = await uploadPromise;
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ msg: "Image upload failed" });
      }
    }

    await community.save();
    res.json({ msg: "Community settings updated", community });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// BAN USER (Community Admin or Moderator)
router.post("/:communityId/ban-user", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { targetUserId, banType, reason, expiresAt } = req.body;
    const community = req.community;
    const adminId = req.userId;

    if (!targetUserId) {
      return res.status(400).json({ msg: "targetUserId is required" });
    }

    // Cannot ban yourself
    if (targetUserId === adminId) {
      return res.status(400).json({ msg: "You cannot ban yourself" });
    }

    // Cannot ban community creator
    if (community.creator.toString() === targetUserId) {
      return res.status(400).json({ msg: "Cannot ban the community creator" });
    }

    // Check if already banned
    const existingBan = community.bannedUsers.find(b => b.user.toString() === targetUserId);
    if (existingBan) {
      return res.status(400).json({ msg: "User is already banned" });
    }

    // Add ban
    const banData = {
      user: targetUserId,
      bannedBy: adminId,
      banType: banType || 'permanent',
      reason: reason || '',
      bannedAt: new Date()
    };

    if (banType === 'temporary' && expiresAt) {
      banData.expiresAt = new Date(expiresAt);
    }

    community.bannedUsers.push(banData);

    // Remove from members and moderators (but not admins - admins must be demoted first)
    community.members = community.members.filter(m => m.toString() !== targetUserId);
    community.moderators = community.moderators.filter(m => m.toString() !== targetUserId);

    await community.save();
    res.json({ msg: "User banned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UNBAN USER (Community Admin or Moderator)
router.post("/:communityId/unban-user", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const community = req.community;

    if (!targetUserId) {
      return res.status(400).json({ msg: "targetUserId is required" });
    }

    // Remove ban
    community.bannedUsers = community.bannedUsers.filter(b => b.user.toString() !== targetUserId);
    await community.save();

    res.json({ msg: "User unbanned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ADD MEMBER (Community Admin or Moderator) - Add a user directly to the community
router.post("/:communityId/add-member", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const community = req.community;

    if (!targetUserId) {
      return res.status(400).json({ msg: "targetUserId is required" });
    }

    // Check if user exists
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if already a member
    if (community.members.some(m => m.toString() === targetUserId)) {
      return res.status(400).json({ msg: "User is already a member" });
    }

    // Check if banned
    const isBanned = community.bannedUsers.some(b => {
      if (b.user.toString() !== targetUserId) return false;
      if (b.banType === 'permanent') return true;
      if (b.banType === 'temporary' && b.expiresAt && new Date(b.expiresAt) > new Date()) return true;
      return false;
    });

    if (isBanned) {
      return res.status(400).json({ msg: "User is banned from this community" });
    }

    // Add to members
    community.members.push(targetUserId);
    await community.save();

    res.json({ msg: "Member added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// REMOVE MEMBER (Community Admin or Moderator) - Different from ban, just removes membership
router.post("/:communityId/remove-member", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const community = req.community;

    if (!targetUserId) {
      return res.status(400).json({ msg: "targetUserId is required" });
    }

    // Cannot remove community creator
    if (community.creator.toString() === targetUserId) {
      return res.status(400).json({ msg: "Cannot remove the community creator" });
    }

    // Remove from members and moderators (but keep admin status if they are)
    community.members = community.members.filter(m => m.toString() !== targetUserId);
    community.moderators = community.moderators.filter(m => m.toString() !== targetUserId);

    await community.save();
    res.json({ msg: "Member removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// POSTS IN COMMUNITY
// ============================================================

// GET POSTS IN COMMUNITY
router.get("/:communityId/posts", async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    
    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    if (community.status !== 'approved') {
      return res.status(403).json({ msg: "Community is not yet approved" });
    }

    const posts = await Post.find({ community: req.params.communityId })
      .populate("user", "username profileImage")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// CREATE POST IN COMMUNITY (Must be a member)
router.post("/:communityId/posts", upload.single("image"), async (req, res) => {
  try {
    const { userId, text, tags } = req.body;
    const community = await Community.findById(req.params.communityId);

    if (!userId || !text) {
      return res.status(400).json({ msg: "Missing user or text" });
    }

    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    if (community.status !== 'approved') {
      return res.status(403).json({ msg: "Community is not yet approved" });
    }

    // Check if user is a member
    if (!community.members.some(m => m.toString() === userId)) {
      return res.status(403).json({ msg: "You must be a member to post in this community" });
    }

    // Check if user is banned
    const isBanned = community.bannedUsers.some(b => {
      if (b.user.toString() !== userId) return false;
      if (b.banType === 'permanent') return true;
      if (b.banType === 'temporary' && b.expiresAt && new Date(b.expiresAt) > new Date()) return true;
      return false;
    });

    if (isBanned) {
      return res.status(403).json({ msg: "You are banned from this community" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Handle image upload
    let imageUrl = "";
    if (req.file) {
      try {
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
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ msg: "Image upload failed" });
      }
    }

    // Parse tags
    let tagArray = [];
    if (tags) {
      try {
        tagArray = Array.isArray(tags) ? tags : JSON.parse(tags);
      } catch (e) {
        tagArray = String(tags).split(",").map(t => t.trim()).filter(Boolean);
      }
    }

    // Create post
    const post = new Post({
      user: userId,
      text,
      image: imageUrl,
      tags: tagArray,
      community: req.params.communityId,
    });

    await post.save();
    await post.populate("user", "username profileImage");

    res.json({ msg: "Post created successfully", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE POST (Community Admin or Moderator)
router.delete("/:communityId/posts/:postId", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Verify post belongs to this community
    if (post.community.toString() !== req.params.communityId) {
      return res.status(400).json({ msg: "Post does not belong to this community" });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ msg: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
