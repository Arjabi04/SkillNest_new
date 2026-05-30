import { Router } from "express";
import { isValidObjectId } from "mongoose";

import { verifyAdmin } from "../middleware/adminAuth.js";
import Post from "../models/Post.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import ModerationLog from "../models/ModerationLog.js";
import Notification from "../models/Notification.js";
import { getPriorityLevel } from "../utils/moderation.js";

const router = Router();

const adjustTrustScores = async (userIds = [], delta = 0) => {
  const ids = Array.isArray(userIds) ? userIds.filter(Boolean) : [];
  if (!ids.length || !delta) return;

  // Clamp trustScore to [0, 1] without requiring MongoDB pipeline updates.
  const users = await User.find({ _id: { $in: ids } })
    .select("_id trustScore")
    .lean();

  const ops = users.map((user) => {
    const current = typeof user.trustScore === "number" ? user.trustScore : 0.5;
    const next = Math.max(0, Math.min(1, current + delta));
    return {
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { trustScore: next } },
      },
    };
  });

  if (!ops.length) return;
  await User.bulkWrite(ops, { ordered: false });
};

const toReasonSummary = (reasons = []) => {
  const counts = new Map();
  for (const reason of reasons) {
    counts.set(reason, (counts.get(reason) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
};

router.get("/queue", verifyAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || "pending");
    const limit = Math.min(Number.parseInt(req.query.limit || "50", 10) || 50, 200);

    const match = status === "all" ? {} : { status };

    const [totalReports, totalPostsAgg] = await Promise.all([
      status === "all" ? Report.countDocuments({}) : Report.countDocuments({ status }),
      Report.aggregate([
        { $match: match },
        { $group: { _id: "$postId" } },
        { $count: "count" },
      ]),
    ]);

    const totalPosts = totalPostsAgg?.[0]?.count || 0;

    const grouped = await Report.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$postId",
          reportCount: { $sum: 1 },
          uniqueReporters: { $addToSet: "$reportedBy" },
          firstReportedAt: { $min: "$createdAt" },
          lastReportedAt: { $max: "$createdAt" },
          reasons: { $push: "$reason" },
          priorityScore: { $max: "$priorityScore" },
        },
      },
      { $addFields: { uniqueReportCount: { $size: "$uniqueReporters" } } },
      { $sort: { priorityScore: -1, lastReportedAt: -1 } },
      { $limit: limit },
    ]);

    const postIds = grouped.map((row) => row._id).filter(Boolean);
    const posts = await Post.find({ _id: { $in: postIds } })
      .populate("user", "username profileImage")
      .select("user text image images tags createdAt community moderation")
      .lean();

    const postById = new Map(posts.map((post) => [String(post._id), post]));

    const items = grouped
      .map((row) => {
        const post = postById.get(String(row._id));
        if (!post) return null;

        const reasonsSummary = toReasonSummary(row.reasons || []);
        const priorityLevel = getPriorityLevel(row.priorityScore);

        return {
          postId: row._id,
          post,
          reportCount: row.reportCount,
          uniqueReportCount: row.uniqueReportCount,
          firstReportedAt: row.firstReportedAt,
          lastReportedAt: row.lastReportedAt,
          priorityScore: row.priorityScore,
          priorityLevel,
          reasonsSummary,
          flags: post?.moderation?.flags || {},
        };
      })
      .filter(Boolean);

    res.json({
      items,
      totals: {
        posts: totalPosts,
        reports: totalReports,
      },
    });
  } catch (err) {
    console.error("Moderation queue error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/posts/:postId", verifyAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) return res.status(400).json({ msg: "Invalid postId" });

    const post = await Post.findById(postId)
      .populate("user", "username profileImage email")
      .lean();
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const reports = await Report.find({ postId })
      .populate("reportedBy", "username profileImage trustScore createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ post, reports });
  } catch (err) {
    console.error("Moderation post details error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/posts/:postId/dismiss", verifyAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) return res.status(400).json({ msg: "Invalid postId" });

    const note = String(req.body?.note || "").trim().slice(0, 1000);

    const post = await Post.findById(postId).select("user moderation").lean();
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const pendingReporterIds = await Report.distinct("reportedBy", { postId, status: "pending" });
    const result = await Report.updateMany(
      { postId, status: "pending" },
      { $set: { status: "dismissed" } }
    );

    await adjustTrustScores(pendingReporterIds, -0.01);

    await Post.updateOne(
      { _id: postId },
      {
        $set: {
          "moderation.lastReviewedAt": new Date(),
          "moderation.state": post?.moderation?.state === "removed" ? "removed" : "visible",
          "moderation.isHidden": false,
          "moderation.autoHidden": false,
        },
      }
    );

    await ModerationLog.create({
      targetPost: postId,
      targetUser: post.user,
      action: "dismiss_reports",
      note,
      actor: "admin",
      actorId: req.admin?.id || "admin",
      actorUsername: req.admin?.username || "admin",
      metadata: { reportCount: result.modifiedCount ?? null, priorityScore: post?.moderation?.priorityScore ?? null },
    });

    res.json({ msg: "Reports dismissed", dismissedCount: result.modifiedCount || 0 });
  } catch (err) {
    console.error("Dismiss reports error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/posts/:postId/remove", verifyAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) return res.status(400).json({ msg: "Invalid postId" });

    const note = String(req.body?.note || "").trim().slice(0, 1000);

    const post = await Post.findById(postId).select("user moderation").lean();
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const pendingReporterIds = await Report.distinct("reportedBy", { postId, status: "pending" });
    await Post.updateOne(
      { _id: postId },
      {
        $set: {
          "moderation.state": "removed",
          "moderation.isHidden": true,
          "moderation.removedAt": new Date(),
          "moderation.lastReviewedAt": new Date(),
        },
      }
    );

    await Report.updateMany({ postId, status: "pending" }, { $set: { status: "removed" } });
    await adjustTrustScores(pendingReporterIds, 0.02);

    await User.updateOne(
      { _id: post.user },
      {
        $inc: { "moderation.violationCount": 1 },
        $set: { "moderation.lastActionAt": new Date() },
      }
    );

    await adjustTrustScores([post.user], -0.05);

    try {
      await Notification.createNotification({
        recipient: post.user,
        sender: null,
        type: "system",
        title: "Your post was removed",
        message: note
          ? `An admin removed your post for a policy violation. Note: ${note}`
          : "An admin removed your post for a policy violation.",
        actionUrl: "/settings",
        metadata: { postId: String(postId) },
      });
    } catch (notifyErr) {
      console.error("Post removal notification error:", notifyErr);
    }

    await ModerationLog.create({
      targetPost: postId,
      targetUser: post.user,
      action: "remove_post",
      note,
      actor: "admin",
      actorId: req.admin?.id || "admin",
      actorUsername: req.admin?.username || "admin",
      metadata: { priorityScore: post?.moderation?.priorityScore ?? null },
    });

    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error("Remove post error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/users/:userId/warn", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) return res.status(400).json({ msg: "Invalid userId" });

    const { postId } = req.body || {};
    if (postId && !isValidObjectId(postId)) return res.status(400).json({ msg: "Invalid postId" });

    const note = String(req.body?.note || "").trim().slice(0, 1000);

    const user = await User.findById(userId).select("_id").lean();
    if (!user) return res.status(404).json({ msg: "User not found" });

    await User.updateOne(
      { _id: userId },
      {
        $inc: { "moderation.warningCount": 1, "moderation.violationCount": 1 },
        $set: { "moderation.lastActionAt": new Date() },
      }
    );

    await adjustTrustScores([userId], -0.03);

    await ModerationLog.create({
      targetPost: postId || null,
      targetUser: userId,
      action: "warn_user",
      note,
      actor: "admin",
      actorId: req.admin?.id || "admin",
      actorUsername: req.admin?.username || "admin",
    });

    res.json({ msg: "User warned" });
  } catch (err) {
    console.error("Warn user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/users/:userId/suspend", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) return res.status(400).json({ msg: "Invalid userId" });

    const days = Math.max(1, Math.min(365, Number.parseInt(req.body?.days || "7", 10) || 7));
    const note = String(req.body?.note || "").trim().slice(0, 1000);
    const expiresAt = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));

    const user = await User.findById(userId).select("_id").lean();
    if (!user) return res.status(404).json({ msg: "User not found" });

    await User.updateOne(
      { _id: userId },
      {
        $inc: { "moderation.violationCount": 1 },
        $set: { "moderation.suspendedUntil": expiresAt, "moderation.lastActionAt": new Date() },
      }
    );

    await adjustTrustScores([userId], -0.05);

    await ModerationLog.create({
      targetUser: userId,
      action: "suspend_user",
      note,
      actor: "admin",
      actorId: req.admin?.id || "admin",
      actorUsername: req.admin?.username || "admin",
      metadata: { durationDays: days, expiresAt },
    });

    res.json({ msg: "User suspended", suspendedUntil: expiresAt });
  } catch (err) {
    console.error("Suspend user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/users/:userId/ban", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) return res.status(400).json({ msg: "Invalid userId" });

    const note = String(req.body?.note || "").trim().slice(0, 1000);
    const reason = String(req.body?.reason || note || "Policy violation").trim().slice(0, 500);

    const user = await User.findById(userId).select("_id").lean();
    if (!user) return res.status(404).json({ msg: "User not found" });

    await User.updateOne(
      { _id: userId },
      {
        $inc: { "moderation.violationCount": 1 },
        $set: {
          "moderation.isBanned": true,
          "moderation.banReason": reason,
          "moderation.lastActionAt": new Date(),
        },
      }
    );

    await adjustTrustScores([userId], -0.1);

    await ModerationLog.create({
      targetUser: userId,
      action: "ban_user",
      note,
      actor: "admin",
      actorId: req.admin?.id || "admin",
      actorUsername: req.admin?.username || "admin",
    });

    res.json({ msg: "User banned" });
  } catch (err) {
    console.error("Ban user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Admin: list users for moderation (search + pagination).
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
    const limit = Math.min(100, Math.max(5, Number.parseInt(req.query.limit || "20", 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("username email profileImage trustScore createdAt moderation")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
