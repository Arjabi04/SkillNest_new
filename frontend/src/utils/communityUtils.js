/**
 * Utility functions for determining user's relationship to communities
 */

export const getCommunityStatus = (community, userId) => {
  if (!community || !userId) return 'none';

  const normalizedUserId = String(userId);

  // Check if user is admin
  if (community.admins?.some(admin => {
    const adminId = typeof admin === 'string' ? admin : admin._id;
    return String(adminId) === normalizedUserId;
  })) {
    return 'admin';
  }

  // Check if user is moderator
  if (community.moderators?.some(mod => {
    const modId = typeof mod === 'string' ? mod : mod._id;
    return String(modId) === normalizedUserId;
  })) {
    return 'moderator';
  }

  // Check if user is member
  if (community.members?.some(member => {
    const memberId = typeof member === 'string' ? member : member._id;
    return String(memberId) === normalizedUserId;
  })) {
    return 'member';
  }

  // Check if user has pending request (if this data is available)
  if (community.pendingRequests?.some(request => {
    const requesterId = typeof request === 'string' ? request : request._id;
    return String(requesterId) === normalizedUserId;
  })) {
    return 'pending';
  }

  return 'none';
};

export const isCommunityAdmin = (community, userId) => {
  return getCommunityStatus(community, userId) === 'admin';
};

export const isCommunityModerator = (community, userId) => {
  return getCommunityStatus(community, userId) === 'moderator';
};

export const isCommunityMember = (community, userId) => {
  const status = getCommunityStatus(community, userId);
  return ['admin', 'moderator', 'member'].includes(status);
};

export const hasAdminOrModeratorAccess = (community, userId) => {
  const status = getCommunityStatus(community, userId);
  return ['admin', 'moderator'].includes(status);
};

export const getRoleLabel = (community, userId) => {
  const status = getCommunityStatus(community, userId);
  switch (status) {
    case 'admin':
      return 'Admin';
    case 'moderator':
      return 'Moderator';
    case 'member':
      return 'Member';
    case 'pending':
      return 'Pending';
    default:
      return null;
  }
};

export const getRoleColor = (community, userId) => {
  const status = getCommunityStatus(community, userId);
  switch (status) {
    case 'admin':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'moderator':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'member':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const categorizeCommunitiesByStatus = (communities, userId) => {
  const categorized = {
    myCommunitiesOwned: [],
    myCommunitiesJoined: [],
    pendingRequests: [],
    recommended: []
  };

  communities.forEach(community => {
    const status = getCommunityStatus(community, userId);
    
    switch (status) {
      case 'admin':
        categorized.myCommunitiesOwned.push(community);
        break;
      case 'moderator':
      case 'member':
        categorized.myCommunitiesJoined.push(community);
        break;
      case 'pending':
        categorized.pendingRequests.push(community);
        break;
      default:
        categorized.recommended.push(community);
    }
  });

  return categorized;
};