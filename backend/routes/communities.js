import { Router } from "express";
const router = Router();
import multer, { memoryStorage } from "multer";
import { createReadStream } from "streamifier";
import cloudinary from "../config/cloudinary.js";
import Community from "../models/Community.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { verifyAdmin } from "../middleware/adminAuth.js";
import { isCommunityAdmin, isCommunityAdminOrModerator } from "../middleware/communityAuth.js";
import { getPublicPostQuery } from "../utils/moderation.js";

const storage = memoryStorage();
const upload = multer({ storage });

const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    createReadStream(buffer).pipe(uploadStream);
  });

const getActiveBanEntry = (community, userId) => {
  return community.bannedUsers.find((banEntry) => {
    if (banEntry.user.toString() !== userId.toString()) return false;
    if (banEntry.banType === "permanent") return true;
    return Boolean(
      banEntry.banType === "temporary" &&
        banEntry.expiresAt &&
        new Date(banEntry.expiresAt) > new Date()
    );
  });
};

const isUserCurrentlyBanned = (community, userId) => {
  return Boolean(getActiveBanEntry(community, userId));
};

const getCommunityStaffIds = (community) => {
  return Array.from(
    new Set(
      [...community.admins, ...community.moderators]
        .filter(Boolean)
        .map((id) => id.toString())
    )
  );
};

const banUserFromCommunity = async ({
  community,
  targetUserId,
  adminId,
  banType = "permanent",
  reason = "",
  expiresAt = null,
  sourcePostId = null,
}) => {
  if (targetUserId === adminId) {
    return { ok: false, status: 400, msg: "You cannot ban yourself" };
  }

  if (community.creator.toString() === targetUserId) {
    return { ok: false, status: 400, msg: "Cannot ban the community creator" };
  }

  const existingBan = getActiveBanEntry(community, targetUserId);
  if (existingBan) {
    return { ok: false, status: 400, msg: "User is already banned" };
  }

  if (!["temporary", "permanent"].includes(banType)) {
    return { ok: false, status: 400, msg: "Invalid ban type" };
  }

  const trimmedReason = String(reason || "").trim();
  const banData = {
    user: targetUserId,
    bannedBy: adminId,
    sourcePostId: sourcePostId || null,
    banType,
    reason: trimmedReason,
    bannedAt: new Date(),
    appealStatus: "none",
    appealMessage: "",
    appealedAt: null,
    appealReviewedBy: null,
    appealReviewedAt: null,
    appealReviewNote: "",
  };

  if (banType === "temporary") {
    if (!expiresAt) {
      return { ok: false, status: 400, msg: "Temporary bans require an expiry date" };
    }

    const expiryDate = new Date(expiresAt);
    if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return { ok: false, status: 400, msg: "Temporary ban expiry must be in the future" };
    }

    banData.expiresAt = expiryDate;
  }

  community.bannedUsers.push(banData);
  community.members = community.members.filter(
    (memberId) => memberId.toString() !== targetUserId
  );
  community.moderators = community.moderators.filter(
    (moderatorId) => moderatorId.toString() !== targetUserId
  );
  await community.save();

  try {
    await Notification.createNotification({
      recipient: targetUserId,
      sender: adminId,
      type: "community_ban",
      title: `Removed from ${community.name}`,
      message: trimmedReason
        ? `You were banned from \"${community.name}\". Reason: ${trimmedReason}`
        : `You were banned from \"${community.name}\" by the community staff.`,
      relatedCommunity: community._id,
      actionUrl: `/communities?communityId=${community._id}`,
      metadata: {
        reason: trimmedReason,
        banType,
        expiresAt: banData.expiresAt || null,
        sourcePostId: banData.sourcePostId || null,
      },
    });
  } catch (notificationError) {
    console.error("Community ban notification error:", notificationError);
  }

  return { ok: true, banData };
};

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

    try {
      await Notification.createNotification({
        recipient: community.creator,
        sender: community.creator,
        type: 'system',
        title: 'Community Approved',
        message: `Your community \"${community.name}\" has been approved by admin.`,
        relatedCommunity: community._id,
        actionUrl: '/communities'
      });
    } catch (notificationError) {
      console.error('Community approval notification error:', notificationError);
    }

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
    const isBanned = isUserCurrentlyBanned(community, userId);

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

// UPDATE COMMUNITY COVER IMAGE (Community Admin or Moderator)
router.post("/:communityId/cover-image", isCommunityAdminOrModerator, upload.single("coverImage"), async (req, res) => {
  try {
    const community = req.community;

    if (!req.file) {
      return res.status(400).json({ msg: "Cover image file is required" });
    }

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
      await community.save();

      return res.json({
        msg: "Community image updated successfully",
        coverImage: community.coverImage,
        community
      });
    } catch (uploadErr) {
      console.error("Community cover upload error:", uploadErr);
      return res.status(500).json({ msg: "Image upload failed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// UPDATE COMMUNITY RULES (Community Admin or Moderator)
router.post("/:communityId/rules", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { rules } = req.body;
    const community = req.community;

    if (typeof rules !== 'string') {
      return res.status(400).json({ msg: "Rules must be provided as text" });
    }

    community.rules = rules.trim();
    await community.save();

    res.json({ msg: "Community rules updated", rules: community.rules, community });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// BAN USER (Community Admin or Moderator)
router.post("/:communityId/ban-user", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { targetUserId, banType, reason, expiresAt, sourcePostId } = req.body;
    const community = req.community;
    const adminId = req.userId;

    if (!targetUserId) {
      return res.status(400).json({ msg: "targetUserId is required" });
    }

    const result = await banUserFromCommunity({
      community,
      targetUserId,
      adminId,
      banType: banType || 'permanent',
      reason: reason || '',
      expiresAt: expiresAt || null,
      sourcePostId: sourcePostId || null,
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ msg: result.msg });
    }

    res.json({ msg: "User banned successfully", bannedUsers: community.bannedUsers });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
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

    community.bannedUsers = community.bannedUsers.filter(b => b.user.toString() !== targetUserId);
    await community.save();

    res.json({ msg: "User unbanned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// APPEAL COMMUNITY BAN (Banned user)
router.post("/:communityId/appeal-ban", async (req, res) => {
  try {
    const { userId, appealMessage } = req.body || {};
    const community = await Community.findById(req.params.communityId);

    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    if (!userId) {
      return res.status(400).json({ msg: "userId is required" });
    }

    const activeBan = getActiveBanEntry(community, userId);
    if (!activeBan) {
      return res.status(400).json({ msg: "You do not have an active ban in this community" });
    }

    if (!String(appealMessage || "").trim()) {
      return res.status(400).json({ msg: "Appeal message is required" });
    }

    activeBan.appealStatus = "pending";
    activeBan.appealMessage = String(appealMessage).trim();
    activeBan.appealedAt = new Date();
    activeBan.appealReviewedBy = null;
    activeBan.appealReviewedAt = null;
    activeBan.appealReviewNote = "";
    await community.save();

    const staffIds = getCommunityStaffIds(community).filter((staffId) => staffId !== userId);
    if (staffIds.length > 0) {
      await Promise.all(
        staffIds.map((staffId) =>
          Notification.createNotification({
            recipient: staffId,
            sender: userId,
            type: "system",
            title: `Ban appeal in ${community.name}`,
            message: "A banned user submitted an appeal that needs review.",
            relatedCommunity: community._id,
            actionUrl: `/communities?communityId=${community._id}`,
            metadata: {
              userId,
              appealMessage: String(appealMessage).trim(),
            },
          })
        )
      );
    }

    res.json({ msg: "Appeal submitted. Community staff will review it." });
  } catch (err) {
    console.error("Ban appeal error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// REVIEW BAN APPEAL (Community Admin or Moderator)
router.post("/:communityId/review-ban-appeal", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { targetUserId, action, reviewNote } = req.body || {};
    const community = req.community;

    if (!targetUserId) {
      return res.status(400).json({ msg: "targetUserId is required" });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ msg: "Invalid review action" });
    }

    const activeBan = getActiveBanEntry(community, targetUserId);
    if (!activeBan) {
      return res.status(400).json({ msg: "No active ban found for this user" });
    }

    if (activeBan.appealStatus !== "pending") {
      return res.status(400).json({ msg: "This ban does not have a pending appeal" });
    }

    if (action === "approve") {
      community.bannedUsers = community.bannedUsers.filter(
        (banEntry) => banEntry.user.toString() !== targetUserId
      );

      if (!community.members.some((memberId) => memberId.toString() === targetUserId)) {
        community.members.push(targetUserId);
      }

      await community.save();

      try {
        await Notification.createNotification({
          recipient: targetUserId,
          sender: req.userId,
          type: "system",
          title: `Appeal approved in ${community.name}`,
          message: "Your appeal was approved. You can join the community again now.",
          relatedCommunity: community._id,
          actionUrl: `/communities?communityId=${community._id}`,
          metadata: {
            reviewNote: String(reviewNote || "").trim(),
          },
        });
      } catch (notificationError) {
        console.error("Ban appeal approval notification error:", notificationError);
      }

      return res.json({ msg: "Appeal approved and user restored to the community" });
    }

    activeBan.appealStatus = "rejected";
    activeBan.appealReviewNote = String(reviewNote || "").trim();
    activeBan.appealReviewedBy = req.userId;
    activeBan.appealReviewedAt = new Date();
    await community.save();

    try {
      await Notification.createNotification({
        recipient: targetUserId,
        sender: req.userId,
        type: "system",
        title: `Appeal rejected in ${community.name}`,
        message: activeBan.appealReviewNote
          ? `Your appeal was rejected. Note: ${activeBan.appealReviewNote}`
          : "Your appeal was rejected by the community staff.",
        relatedCommunity: community._id,
        actionUrl: `/communities?communityId=${community._id}`,
      });
    } catch (notificationError) {
      console.error("Ban appeal rejection notification error:", notificationError);
    }

    res.json({ msg: "Appeal rejected" });
  } catch (err) {
    console.error("Review ban appeal error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ADD MEMBER (Community Admin or Moderator) - Add a user directly to the community
router.post("/:communityId/add-member", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { targetUsername, targetUserId } = req.body;
    const community = req.community;

    // Accept either username or userId
    let userToAdd;
    if (targetUsername) {
      userToAdd = await User.findOne({ username: targetUsername });
    } else if (targetUserId) {
      userToAdd = await User.findById(targetUserId);
    } else {
      return res.status(400).json({ msg: "targetUsername or targetUserId is required" });
    }

    if (!userToAdd) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if already a member
    if (community.members.some(m => m.toString() === userToAdd._id.toString())) {
      return res.status(400).json({ msg: "User is already a member" });
    }

    // Check if banned
    const isBanned = isUserCurrentlyBanned(community, userToAdd._id.toString());

    if (isBanned) {
      return res.status(400).json({ msg: "User is banned from this community" });
    }

    // Add to members
    community.members.push(userToAdd._id);
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

    const visibilityQuery = getPublicPostQuery();
    const posts = await Post.find({ $and: [{ community: req.params.communityId }, visibilityQuery] })
      .select("-reports")
      .populate("user", "username profileImage")
      .populate("comments.user", "username profileImage")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// CREATE POST IN COMMUNITY (Must be a member)
router.post(
  "/:communityId/posts",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 6 },
  ]),
  async (req, res) => {
  try {
    const { userId, text, tags } = req.body || {};
    const uploadedFiles = [
      ...(req.files?.image || []),
      ...(req.files?.images || []),
    ].slice(0, 6);
    const postText = String(text || "").trim();
    const community = await Community.findById(req.params.communityId);

    if (!userId || (!postText && uploadedFiles.length === 0)) {
      return res.status(400).json({ msg: "Add text or at least one image" });
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
    const isBanned = isUserCurrentlyBanned(community, userId);

    if (isBanned) {
      return res.status(403).json({ msg: "You are banned from this community" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Handle image upload
    let imageUrls = [];
    if (uploadedFiles.length > 0) {
      try {
        imageUrls = await Promise.all(
          uploadedFiles.map((file) =>
            uploadBufferToCloudinary(file.buffer, "skillnest_posts")
          )
        );
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
      text: postText,
      image: imageUrls[0] || "",
      images: imageUrls,
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

// REPORT COMMUNITY POST (Community members only)
router.post("/:communityId/posts/:postId/report", async (req, res) => {
  try {
    const { userId, reason, details } = req.body;
    const { communityId, postId } = req.params;

    if (!userId || !String(reason || "").trim()) {
      return res.status(400).json({ msg: "Reason is required" });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ msg: "Community not found" });
    }

    if (!community.members.some((memberId) => memberId.toString() === userId)) {
      return res.status(403).json({ msg: "You must be a member to report posts" });
    }

    if (isUserCurrentlyBanned(community, userId)) {
      return res.status(403).json({ msg: "You are banned from this community" });
    }

    const post = await Post.findById(postId);
    if (!post || post.community?.toString() !== communityId) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.user.toString() === userId) {
      return res.status(400).json({ msg: "You cannot report your own post" });
    }

    const duplicatePendingReport = post.reports.some(
      (report) => report.reporter.toString() === userId && report.status === "pending"
    );

    if (duplicatePendingReport) {
      return res.status(400).json({ msg: "You already reported this post" });
    }

    post.reports.push({
      reporter: userId,
      reason: String(reason).trim(),
      details: typeof details === "string" ? details.trim() : "",
      status: "pending",
      createdAt: new Date(),
    });
    await post.save();

    const staffIds = getCommunityStaffIds(community).filter((staffId) => staffId !== userId);
    if (staffIds.length > 0) {
      await Promise.all(
        staffIds.map((staffId) =>
          Notification.createNotification({
            recipient: staffId,
            sender: userId,
            type: "community_post_report",
            title: `Post reported in ${community.name}`,
            message: `A post was reported for \"${String(reason).trim()}\" and needs review.`,
            relatedCommunity: community._id,
            actionUrl: `/communities?communityId=${community._id}`,
            metadata: {
              postId: post._id,
              reason: String(reason).trim(),
            },
          })
        )
      );
    }

    res.json({ msg: "Post reported. Community staff will review it." });
  } catch (err) {
    console.error("Community post report error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET REPORTED COMMUNITY POSTS (Community Admin or Moderator)
router.get("/:communityId/reported-posts", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const posts = await Post.find({
      community: req.params.communityId,
      reports: { $exists: true, $ne: [] },
    })
      .populate("user", "username profileImage")
      .populate("reports.reporter", "username profileImage")
      .populate("reports.reviewedBy", "username")
      .sort({ createdAt: -1 });

    const reportedPosts = posts
      .map((post) => {
        const pendingReports = post.reports.filter(
          (report) => !report.status || report.status === "pending"
        );
        return {
          ...post.toObject(),
          reports: pendingReports,
        };
      })
      .filter((post) => post.reports.length > 0)
      .sort((left, right) => {
        const latestLeft = Math.max(
          ...left.reports.map((report) => new Date(report.createdAt || left.createdAt).getTime())
        );
        const latestRight = Math.max(
          ...right.reports.map((report) => new Date(report.createdAt || right.createdAt).getTime())
        );
        return latestRight - latestLeft;
      });

    res.json(reportedPosts);
  } catch (err) {
    console.error("Get reported posts error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// REVIEW REPORTED COMMUNITY POST (Community Admin or Moderator)
router.post("/:communityId/posts/:postId/review-report", isCommunityAdminOrModerator, async (req, res) => {
  try {
    const { action, reviewNote, banType, expiresAt } = req.body || {};
    const { communityId, postId } = req.params;
    const community = req.community;
    const reviewerId = req.userId;

    if (!["dismiss", "ban", "delete"].includes(action)) {
      return res.status(400).json({ msg: "Invalid review action" });
    }

    const post = await Post.findById(postId);
    if (!post || post.community?.toString() !== communityId) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const pendingReports = post.reports.filter((report) => report.status === "pending");
    if (pendingReports.length === 0) {
      return res.status(400).json({ msg: "This post has no pending reports" });
    }

    const trimmedReviewNote = String(reviewNote || "").trim();

    if ((action === "ban" || action === "delete") && !trimmedReviewNote) {
      return res.status(400).json({
        msg: action === "ban" ? "Ban reason is required" : "Delete reason is required",
      });
    }

    const resolvedBanType = banType || "permanent";
    if (action === "ban" && !["temporary", "permanent"].includes(resolvedBanType)) {
      return res.status(400).json({ msg: "Invalid ban type" });
    }

    const reviewedAt = new Date();
    post.reports.forEach((report) => {
      if (report.status !== "pending") return;
      report.status = action === "dismiss" ? "dismissed" : "actioned";
      report.reviewedBy = reviewerId;
      report.reviewNote = trimmedReviewNote;
      report.reviewedAt = reviewedAt;
    });

    if (action === "dismiss") {
      await post.save();
      return res.json({ msg: "Report marked as nothing to worry about" });
    }

    if (action === "delete") {
      const postOwnerId = post.user.toString();

      await post.save();
      await Post.findByIdAndDelete(postId);

      try {
        await Notification.createNotification({
          recipient: postOwnerId,
          sender: reviewerId,
          type: "system",
          title: `Post removed in ${community.name}`,
          message: `Your post in "${community.name}" was removed by community staff. Reason: ${trimmedReviewNote}`,
          relatedCommunity: community._id,
          actionUrl: `/communities?communityId=${community._id}`,
          metadata: {
            postId: post._id,
            reason: trimmedReviewNote,
            action: "delete_post_after_report",
          },
        });
      } catch (notificationError) {
        console.error("Reported post delete notification error:", notificationError);
      }

      return res.json({ msg: "Reported post deleted and author notified" });
    }

    const banResult = await banUserFromCommunity({
      community,
      targetUserId: post.user.toString(),
      adminId: reviewerId,
      banType: resolvedBanType,
      reason: trimmedReviewNote,
      expiresAt: resolvedBanType === "temporary" ? expiresAt || null : null,
      sourcePostId: postId,
    });

    if (!banResult.ok) {
      return res.status(banResult.status || 400).json({ msg: banResult.msg });
    }

    await post.save();
    await Post.findByIdAndDelete(postId);

    res.json({
      msg:
        resolvedBanType === "temporary"
          ? "Reported post resolved and author temporarily banned"
          : "Reported post resolved and author permanently banned",
    });
  } catch (err) {
    console.error("Review reported post error:", err);
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

// LIKE POST (Any member of community)
router.post("/:communityId/posts/:postId/like", async (req, res) => {
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
    await post.populate("likes", "username");
    res.json({ msg: alreadyLiked ? "Like removed" : "Post liked", likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ADD COMMENT TO POST (Any member of community)
router.post("/:communityId/posts/:postId/comment", async (req, res) => {
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
router.delete("/:communityId/posts/:postId/comments/:commentIdx", async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId, commentIdx } = req.params;
    const community = req.community || await Community.findById(req.params.communityId);

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
    const isAdmin = community?.admins?.some(admin => {
      const adminId = typeof admin === 'string' ? admin : admin._id;
      return adminId.toString() === userId.toString();
    });

    if (!isCommentOwner && !isAdmin) {
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

export default router;
