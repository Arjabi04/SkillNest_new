import { Router } from "express";
import { isValidObjectId } from "mongoose";

import auth from "../middleware/auth.js";
import Post from "../models/Post.js";
import Report, { REPORT_REASONS } from "../models/Report.js";
import ModerationLog from "../models/ModerationLog.js";
import User from "../models/User.js";
import {
  RECENT_REPORT_WINDOW_MS,
  USER_REPORT_RATE_LIMIT,
  USER_REPORT_RATE_WINDOW_MS,
  calculatePriorityScore,
  getPriorityLevel,
} from "../utils/moderation.js";

const router = Router();

const clampText = (value, maxLen) => String(value || "").trim().slice(0, maxLen);

router.post("/posts/:postId", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) return res.status(400).json({ msg: "Invalid postId" });

    const reason = clampText(req.body?.reason, 120);
    const description = clampText(req.body?.description, 500);

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ msg: "Invalid report reason" });
    }

    const post = await Post.findById(postId).select("user moderation").lean();
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (String(post.user) === String(req.user._id)) {
      return res.status(400).json({ msg: "You cannot report your own post" });
    }

    if (post.moderation?.state === "removed") {
      return res.status(410).json({ msg: "This post is no longer available" });
    }

    const now = Date.now();
    const rateWindowStart = new Date(now - USER_REPORT_RATE_WINDOW_MS);
    const recentReporterCount = await Report.countDocuments({
      reportedBy: req.user._id,
      createdAt: { $gte: rateWindowStart },
    });

    if (recentReporterCount >= USER_REPORT_RATE_LIMIT) {
      return res.status(429).json({ msg: "Too many reports. Please try again later." });
    }

    const recentWindowStart = new Date(now - RECENT_REPORT_WINDOW_MS);
    const [uniqueReportersBefore, recentReportsBefore, previousViolations] = await Promise.all([
      Report.distinct("reportedBy", { postId }),
      Report.countDocuments({ postId, createdAt: { $gte: recentWindowStart } }),
      ModerationLog.countDocuments({
        $or: [{ targetPost: postId }, { targetUser: post.user }],
        action: { $in: ["remove_post", "warn_user", "suspend_user", "ban_user"] },
      }),
    ]);

    const uniqueReports = (uniqueReportersBefore?.length || 0) + 1;
    const recentReports = Number(recentReportsBefore || 0) + 1;
    const reporterTrustScore = typeof req.user.trustScore === "number" ? req.user.trustScore : 0.5;

    const priorityScore = calculatePriorityScore({
      uniqueReports,
      recentReports,
      previousViolations,
      reporterTrustScore,
    });

    let postIsSuspicious = false;

    let reportDoc;
    try {
      reportDoc = await Report.create({
        postId,
        reportedBy: req.user._id,
        reason,
        description,
        status: "pending",
        priorityScore,
        signals: {
          uniqueReports,
          recentReports,
          previousViolations,
          reporterTrustScore,
          massReportingSuspected: false,
        },
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({ msg: "You already reported this post" });
      }
      throw err;
    }

    // Recompute post-level moderation summary (cheap counters + snapshots).
    const massWindowStart = new Date(now - Math.min(RECENT_REPORT_WINDOW_MS, 10 * 60 * 1000));
    const [totalReports, uniqueReportersAfter, firstReport, recentReporterIds] = await Promise.all([
      Report.countDocuments({ postId }),
      Report.distinct("reportedBy", { postId }),
      Report.findOne({ postId }).sort({ createdAt: 1 }).select("createdAt").lean(),
      Report.distinct("reportedBy", { postId, createdAt: { $gte: massWindowStart } }),
    ]);

    const firstReportedAt = firstReport?.createdAt || reportDoc.createdAt;
    const lastReportedAt = reportDoc.createdAt;
    const uniqueReportCount = uniqueReportersAfter?.length || 0;

    if (Array.isArray(recentReporterIds) && recentReporterIds.length >= 8) {
      const recentUsers = await User.find({ _id: { $in: recentReporterIds } })
        .select("trustScore createdAt")
        .lean();

      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const nowMs = Date.now();

      const suspiciousCount = recentUsers.filter((user) => {
        const trust = typeof user.trustScore === "number" ? user.trustScore : 0.5;
        const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
        const accountAgeMs = createdAt ? nowMs - createdAt : Infinity;
        return trust < 0.35 && accountAgeMs < sevenDaysMs;
      }).length;

      postIsSuspicious = recentUsers.length > 0 && (suspiciousCount / recentUsers.length) >= 0.6;
    }

    if (postIsSuspicious) {
      await Report.updateOne(
        { _id: reportDoc._id },
        { $set: { "signals.massReportingSuspected": true } }
      );
    }

    const latestPriorityScore = await Report.findOne({ postId })
      .sort({ priorityScore: -1, createdAt: -1 })
      .select("priorityScore")
      .lean();

    const effectivePriorityScore = latestPriorityScore?.priorityScore ?? priorityScore;
    const priorityLevel = getPriorityLevel(effectivePriorityScore);

    const update = {
      "moderation.reportCount": totalReports,
      "moderation.uniqueReportCount": uniqueReportCount,
      "moderation.firstReportedAt": firstReportedAt,
      "moderation.lastReportedAt": lastReportedAt,
      "moderation.priorityScore": effectivePriorityScore,
      "moderation.priorityLevel": priorityLevel,
      "moderation.previousViolations": previousViolations,
      "moderation.flags.massReportingSuspected": postIsSuspicious,
      "moderation.flags.repeatedOffender": previousViolations > 0,
    };

    await Post.updateOne({ _id: postId }, { $set: update });

    res.json({
      msg: "Thank you. Your report has been submitted for review.",
      reportId: reportDoc._id,
    });
  } catch (err) {
    console.error("Post report error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
