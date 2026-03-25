import { Router } from 'express';
const router = Router();

import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Event from '../models/Event.js';
import Post from '../models/Post.js';

const toSet = (arr) => 
  new Set(Array.isArray(arr) ? arr.map(s => String(s).trim().toLowerCase()) : []);

const jaccardSimilarity = (arrA, arrB) => {
  const setA = toSet(arrA);
  const setB = toSet(arrB);

  if (setA.size === 0 && setB.size === 0) return 0;

  let intersection = 0;
  for (const value of setA) {
    if (setB.has(value)) intersection += 1;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const normalizeByMax = (value, maxValue) => {
  if (!maxValue || maxValue <= 0) return 0;
  return value / maxValue;
};

const buildInteractionTokenMap = (posts) => {
  const tokenMap = new Map();

  for (const post of posts) {
    const postId = String(post._id);

    for (const likerId of post.likes || []) {
      const key = String(likerId);
      if (!tokenMap.has(key)) tokenMap.set(key, []);
      tokenMap.get(key).push(`like:${postId}`);
    }

    for (const comment of post.comments || []) {
      const commenterId = comment?.user;
      if (!commenterId) continue;
      const key = String(commenterId);
      if (!tokenMap.has(key)) tokenMap.set(key, []);
      tokenMap.get(key).push(`comment:${postId}`);
    }
  }

  return tokenMap;
};

const tokenizeText = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

const getPostContentTokens = (post) => {
  const tags = Array.isArray(post.tags) ? post.tags : [];
  return [...tags, ...tokenizeText(post.text)];
};

const buildBehaviorScore = (postTokens, interactedPostTokenSets) => {
  if (!interactedPostTokenSets.length) return 0;

  let bestScore = 0;
  for (const tokens of interactedPostTokenSets) {
    const score = jaccardSimilarity(postTokens, tokens);
    if (score > bestScore) bestScore = score;
  }
  return bestScore;
};

const buildUserRecommendations = async (userId, limit = 10) => {
  const currentUser = await User.findById(userId).lean();
  if (!currentUser) {
    return { missingUser: true, recommendations: [] };
  }

  const [allUsers, approvedCommunities, approvedEvents, posts] = await Promise.all([
    User.find({ _id: { $ne: userId } }).select('username profileImage interests').lean(),
    Community.find({ status: 'approved' }).select('members').lean(),
    Event.find({
      status: 'published',
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }]
    }).select('attendees').lean(),
    Post.find({}).select('likes comments.user').lean()
  ]);

  const currentUserId = String(userId);
  const interactionTokenMap = buildInteractionTokenMap(posts);
  const currentInteractionTokens = interactionTokenMap.get(currentUserId) || [];

  const currentCommunities = approvedCommunities
    .filter((community) => (community.members || []).some((memberId) => String(memberId) === currentUserId))
    .map((community) => String(community._id));

  const currentEvents = approvedEvents
    .filter((event) => (event.attendees || []).some((attendee) => String(attendee.user) === currentUserId && attendee.status === 'going'))
    .map((event) => String(event._id));

  const recommendations = allUsers
    .map((candidate) => {
      const interestSimilarity = jaccardSimilarity(currentUser.interests, candidate.interests);
      const candidateInteractionTokens = interactionTokenMap.get(String(candidate._id)) || [];
      const interactionSimilarity = jaccardSimilarity(currentInteractionTokens, candidateInteractionTokens);

      const candidateCommunityIds = approvedCommunities
        .filter((community) => (community.members || []).some((memberId) => String(memberId) === String(candidate._id)))
        .map((community) => String(community._id));

      const candidateEventIds = approvedEvents
        .filter((event) => (event.attendees || []).some((attendee) => String(attendee.user) === String(candidate._id) && attendee.status === 'going'))
        .map((event) => String(event._id));

      const sharedCommunityCount = candidateCommunityIds.filter((id) => currentCommunities.includes(id)).length;
      const sharedEventCount = candidateEventIds.filter((id) => currentEvents.includes(id)).length;

      const communityOverlap = normalizeByMax(
        sharedCommunityCount,
        Math.max(currentCommunities.length, candidateCommunityIds.length, 1)
      );

      const mutualConnections = normalizeByMax(
        sharedEventCount,
        Math.max(currentEvents.length, candidateEventIds.length, 1)
      );

      const score = (0.4 * interestSimilarity) + (0.2 * interactionSimilarity) + (0.25 * mutualConnections) + (0.15 * communityOverlap);

      return {
        userId: candidate._id,
        username: candidate.username,
        profileImage: candidate.profileImage || '',
        score: Number(score.toFixed(4)),
        explanation: {
          sharedInterests: Number((interestSimilarity * 100).toFixed(1)),
          interactionSimilarity: Number((interactionSimilarity * 100).toFixed(1)),
          mutualConnections: Number((mutualConnections * 100).toFixed(1)),
          communityOverlap: Number((communityOverlap * 100).toFixed(1))
        }
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    missingUser: false,
    strategy: 'hybrid-content-interaction-overlap',
    scoring: '0.4*interest + 0.2*interaction(likes/comments) + 0.25*mutual + 0.15*community',
    recommendations
  };
};

const buildCommunityRecommendations = async (userId, limit = 10) => {
  const currentUser = await User.findById(userId).lean();
  if (!currentUser) {
    return { missingUser: true, recommendations: [] };
  }

  const communities = await Community.find({
    status: 'approved',
    deletionRequested: { $ne: true }
  })
    .select('name description interests members coverImage')
    .lean();

  const currentUserId = String(userId);
  const notJoinedCommunities = communities.filter(
    (community) => !(community.members || []).some((memberId) => String(memberId) === currentUserId)
  );

  const maxMembers = Math.max(...notJoinedCommunities.map((community) => (community.members || []).length), 1);

  const recommendations = notJoinedCommunities
    .map((community) => {
      const interestSimilarity = jaccardSimilarity(currentUser.interests, community.interests);
      const popularity = normalizeByMax((community.members || []).length, maxMembers);
      const score = (0.7 * interestSimilarity) + (0.3 * popularity);

      return {
        communityId: community._id,
        name: community.name,
        description: community.description,
        coverImage: community.coverImage || '',
        memberCount: (community.members || []).length,
        score: Number(score.toFixed(4)),
        explanation: {
          interestMatch: Number((interestSimilarity * 100).toFixed(1)),
          popularity: Number((popularity * 100).toFixed(1))
        }
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    missingUser: false,
    strategy: 'content-popularity',
    scoring: '0.7*interest + 0.3*popularity',
    recommendations
  };
};

const buildEventRecommendations = async (userId, limit = 10) => {
  const currentUser = await User.findById(userId).lean();
  if (!currentUser) {
    return { missingUser: true, recommendations: [] };
  }

  const [userCommunities, events] = await Promise.all([
    Community.find({ status: 'approved', members: userId }).select('_id').lean(),
    Event.find({
      status: 'published',
      startDate: { $gte: new Date() },
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
      organizer: { $ne: userId }
    })
      .populate('organizer', 'username profileImage')
      .populate('community', 'name coverImage')
      .select('title description tags category startDate endDate attendees community organizer coverImage')
      .lean()
  ]);

  const userCommunityIds = userCommunities.map((community) => String(community._id));
  const currentUserId = String(userId);

  const candidateEvents = events.filter(
    (event) => !(event.attendees || []).some((attendee) => String(attendee.user) === currentUserId && attendee.status === 'going')
  );

  const maxAttendeeCount = Math.max(
    ...candidateEvents.map((event) => (event.attendees || []).filter((attendee) => attendee.status === 'going').length),
    1
  );

  const recommendations = candidateEvents
    .map((event) => {
      const contentTokens = [
        ...(Array.isArray(event.tags) ? event.tags : []),
        event.category || ''
      ].filter(Boolean);

      const interestSimilarity = jaccardSimilarity(currentUser.interests, contentTokens);
      const communityAffinity = event.community && userCommunityIds.includes(String(event.community._id)) ? 1 : 0;
      const attendeeCount = (event.attendees || []).filter((attendee) => attendee.status === 'going').length;
      const popularity = normalizeByMax(attendeeCount, maxAttendeeCount);

      const score = (0.6 * interestSimilarity) + (0.2 * communityAffinity) + (0.2 * popularity);

      return {
        eventId: event._id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        coverImage: event.coverImage || '',
        organizer: event.organizer,
        community: event.community,
        attendeeCount,
        score: Number(score.toFixed(4)),
        explanation: {
          interestMatch: Number((interestSimilarity * 100).toFixed(1)),
          communityAffinity: Number((communityAffinity * 100).toFixed(1)),
          popularity: Number((popularity * 100).toFixed(1))
        }
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    missingUser: false,
    strategy: 'content-community-popularity',
    scoring: '0.6*interest + 0.2*community + 0.2*popularity',
    recommendations
  };
};

router.get('/users', auth, async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const result = await buildUserRecommendations(req.user._id, limit);
    if (result.missingUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(result);
  } catch (err) {
    console.error('User recommendations error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/feed', auth, async (req, res) => {
  try {
    const postLimit = parseInt(req.query.postLimit) || 50;
    const currentUserId = String(req.user._id);

    // 1. Get Similarity & Posts
    const userResult = await buildUserRecommendations(req.user._id, 100);
    const similarityByUserId = new Map(userResult.recommendations.map(i => [String(i.userId), i.score]));
    
    // Self-post similarity is high, but handled by decay later
    similarityByUserId.set(currentUserId, 0.8); 

    const posts = await Post.find({})
      .populate('user', 'username profileImage')
      .populate('community', 'name')
      .lean();

    // Only members can see community posts in Explore feed.
    const userCommunityIds = new Set(
      (
        await Community.find({ members: req.user._id, status: 'approved' }).select('_id').lean()
      ).map((community) => String(community._id))
    );

    const visiblePosts = posts.filter((post) => {
      if (!post.community) return true;
      return userCommunityIds.has(String(post.community._id || post.community));
    });

    // 2. Build "Active Topic Affinity"
    // We look at the tags of posts the user RECENTLY interacted with
    const interactedPosts = visiblePosts.filter(post =>
      (post.likes || []).some(id => String(id) === currentUserId) ||
      (post.comments || []).some(c => String(c.user) === currentUserId)
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 15);

    const activeTopicTags = new Set(interactedPosts.flatMap(p => p.tags || []));

    // 3. Score calculation
    const maxLikes = Math.max(...visiblePosts.map(p => (p.likes || []).length), 1);
    const maxComments = Math.max(...visiblePosts.map(p => (p.comments || []).length), 1);
    const now = new Date();

    const scoredPosts = visiblePosts.map(post => {
      const postTags = post.tags || [];
      const authorId = String(post.user?._id || post.user);

      // --- 1. THE ANCHOR: Profile Interests (Art) ---
      // This is the most important signal.
      const interestTagSim = jaccardSimilarity(req.user.interests || [], postTags);

      // --- 2. THE MODIFIER: Interaction Affinity (Gaming) ---
      // We check if this post matches things you've liked recently.
      const hasActiveTopicMatch = postTags.some(tag => activeTopicTags.has(tag)) ? 1 : 0;

      // --- 3. THE SOCIAL SIGNAL: Author & Decay ---
      const baseAuthorSim = similarityByUserId.get(authorId) || 0;
      const hoursOld = (now - new Date(post.createdAt)) / (1000 * 60 * 60);
      const timeDecay = Math.pow(0.92, hoursOld); // Slightly faster decay (8% per hour)
      const authorScore = baseAuthorSim * timeDecay;

      // Engagement score from likes + comments.
      const likesCount = (post.likes || []).length;
      const commentsCount = (post.comments || []).length;
      const engagementScore =
        (0.5 * (likesCount / maxLikes)) +
        (0.5 * (commentsCount / maxComments));

      // --- 4. NEW BALANCED FORMULA ---
      const feedScore = 
        (0.55 * interestTagSim) +      // PRIMARY: Your "Art" tags (highest weight)
        (0.20 * hasActiveTopicMatch) + // SECONDARY: Your "Gaming" interactions
        (0.15 * authorScore) +         // TERTIARY: Social proximity
        (0.10 * engagementScore);      // QUATERNARY: Quality/Popularity

      // NOTE: We removed the "directBehaviorBoost" (+0.2) entirely.
      // This stops liked posts from teleporting to the top.
      return {
        ...post,
        postedAt: post.createdAt,
        communityMeta: post.community
          ? {
              id: String(post.community._id || post.community),
              name: post.community.name || 'Community'
            }
          : null,
        feedScore: Number(feedScore.toFixed(4)),
        debug: {
          interestTagSim: Number(interestTagSim.toFixed(4)),
          hasActiveTopicMatch,
          authorScore: Number(authorScore.toFixed(4))
        }
      };
    });

    // 4. Sort and Return
    const rankedPosts = scoredPosts
      .sort((a, b) => b.feedScore - a.feedScore)
      .slice(0, postLimit);

    res.json({ strategy: 'decay-topic-affinity-v2', posts: rankedPosts });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/communities', auth, async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const result = await buildCommunityRecommendations(req.user._id, limit);
    if (result.missingUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(result);
  } catch (err) {
    console.error('Community recommendations error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/events', auth, async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const result = await buildEventRecommendations(req.user._id, limit);
    if (result.missingUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(result);
  } catch (err) {
    console.error('Event recommendations error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/overview', auth, async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 5;
    const [users, communities, events] = await Promise.all([
      buildUserRecommendations(req.user._id, limit),
      buildCommunityRecommendations(req.user._id, limit),
      buildEventRecommendations(req.user._id, limit)
    ]);

    if (users.missingUser || communities.missingUser || events.missingUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      users: users.recommendations,
      communities: communities.recommendations,
      events: events.recommendations
    });
  } catch (err) {
    console.error('Recommendations overview error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
