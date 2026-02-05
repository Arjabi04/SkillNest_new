import Community from "../models/Community.js";

export const isCommunityAdmin = async (req, res, next) => {
  try {
    const { communityId } = req.params;
    const userId = req.body.userId || req.query.userId;

    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ msg: "Community not found" });

    const isAdmin = community.admins.some(id => id.toString() === userId);
    if (!isAdmin) return res.status(403).json({ msg: "Only Community Admins can do this" });

    req.community = community;
    req.userId = userId;
    next();
  } catch (err) {
    res.status(500).json({ msg: "Auth error" });
  }
};

export const isCommunityAdminOrModerator = async (req, res, next) => {
  try {
    const { communityId } = req.params;
    const userId = req.body.userId || req.query.userId;
    
    console.log('Community auth middleware - communityId:', communityId);
    console.log('Community auth middleware - userId from body/query:', userId);
    console.log('Community auth middleware - req.body:', req.body);

    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ msg: "Community not found" });

    const isAdmin = community.admins.some(id => id.toString() === userId);
    const isMod = community.moderators.some(id => id.toString() === userId);
    
    console.log('Community auth middleware - isAdmin:', isAdmin, 'isMod:', isMod);

    if (!isAdmin && !isMod) return res.status(403).json({ msg: "Staff permission required" });

    req.community = community;
    req.userId = userId;
    next();
  } catch (err) {
    console.error('Community auth middleware error:', err);
    res.status(500).json({ msg: "Auth error" });
  }
};