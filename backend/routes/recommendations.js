import { Router } from 'express';
const router = Router();

import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Community from '../models/Community.js';
import Event from '../models/Event.js';

const toSet = (arr) => new Set(Array.isArray(arr) ? arr.map(String) : []);

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

const buildUserRecommendations = async (userId, limit = 10) => {
  const currentUser = await User.findById(userId).lean();
  if (!currentUser) {
    return { missingUser: true, recommendations: [] };
  }

  const [allUsers, approvedCommunities, approvedEvents] = await Promise.all([
    User.find({ _id: { $ne: userId } }).select('username profileImage interests').lean(),
    Community.find({ status: 'approved' }).select('members').lean(),
    Event.find({
      status: 'published',
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }]
    }).select('attendees').lean()
  ]);

  const currentUserId = String(userId);

  const currentCommunities = approvedCommunities
    .filter((community) => (community.members || []).some((memberId) => String(memberId) === currentUserId))
    .map((community) => String(community._id));

  const currentEvents = approvedEvents
    .filter((event) => (event.attendees || []).some((attendee) => String(attendee.user) === currentUserId && attendee.status === 'going'))
    .map((event) => String(event._id));

  const recommendations = allUsers
    .map((candidate) => {
      const interestSimilarity = jaccardSimilarity(currentUser.interests, candidate.interests);

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

      const score = (0.5 * interestSimilarity) + (0.3 * mutualConnections) + (0.2 * communityOverlap);

      return {
        userId: candidate._id,
        username: candidate.username,
        profileImage: candidate.profileImage || '',
        score: Number(score.toFixed(4)),
        explanation: {
          sharedInterests: Number((interestSimilarity * 100).toFixed(1)),
          mutualConnections: Number((mutualConnections * 100).toFixed(1)),
          communityOverlap: Number((communityOverlap * 100).toFixed(1))
        }
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    missingUser: false,
    strategy: 'hybrid-content-overlap',
    scoring: '0.5*interest + 0.3*mutual + 0.2*community',
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
