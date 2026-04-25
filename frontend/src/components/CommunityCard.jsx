import React from 'react';
import defaultHeader from '../assets/default-header.jpeg';
import { getRoleLabel, getRoleColor, isCommunityMember } from '../utils/communityUtils';
import './CommunityCard.css';

// SVG Icons
const Users = ({ className, style }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const Clock = ({ className, style }) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Star = ({ className, style, filled = false }) => (
  <svg className={className} style={style} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const CommunityCard = ({ 
  community, 
  userId, 
  onViewCommunity, 
  onJoinCommunity, 
  isOwned = false,
  isPending = false,
  isRecommended = false 
}) => {
  const roleLabel = getRoleLabel(community, userId);
  // For role color, we might need to rely on Tailwind classes still unless getRoleColor returns vanilla classes or inline styles.
  // Assuming getRoleColor returns tailwind color classes, we should probably update communityUtils later.
  // For now, let's keep it as is, or use an inline style if possible.
  const roleColor = getRoleColor(community, userId);
  const isMember = isCommunityMember(community, userId);
  
  const getCardStyle = () => {
    if (isOwned) return "community-card-owned";
    if (isPending) return "community-card-pending";
    if (isRecommended) return "community-card-recommended";
    return "community-card-default";
  };

  const getActionButton = () => {
    if (isPending) {
      return (
        <div className="community-card-btn-pending">
          <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
          Pending
        </div>
      );
    }
    
    if (isMember) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onViewCommunity(community); }}
          className="community-card-btn-open"
        >
          Open
        </button>
      );
    }
    
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); onJoinCommunity(community._id); }}
        className="community-card-btn-join"
      >
        Join
      </button>
    );
  };

  const getSpecialIcon = () => {
    if (isOwned) {
      return (
        <div className="community-card-special-icon owned">
          <Star style={{ width: '1rem', height: '1rem' }} filled />
        </div>
      );
    }
    if (isRecommended) {
      return (
        <div className="community-card-special-icon recommended">
          <Star style={{ width: '1rem', height: '1rem' }} />
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      onClick={() => onViewCommunity(community)}
      className={`community-card ${getCardStyle()}`}
    >
      {/* Image Container */}
      <div className="community-card-img-container">
        <img 
          src={community.coverImage || defaultHeader} 
          className="community-card-img" 
          alt={community.name} 
        />
        
        {/* Role Badge */}
        {roleLabel && (
          <div className={`community-card-role-badge ${roleColor}`}>
            {roleLabel}
          </div>
        )}
        
        {/* Special Icon */}
        {getSpecialIcon()}
        
        {/* Overlay */}
        <div className="community-card-overlay" />
      </div>

      {/* Content */}
      <div className="community-card-content">
        <div className="community-card-text">
          <h3 className="community-card-title">
            {community.name}
          </h3>
          <p className="community-card-desc">
            {community.description}
          </p>
        </div>
        
        {/* Stats & Action */}
        <div className="community-card-footer">
          <div className="community-card-stats">
            <div className="community-card-members">
              <Users style={{ width: '1rem', height: '1rem' }} />
              <span className="community-card-members-count">{community.members?.length || 0}</span>
            </div>
          </div>

          {getActionButton()}
        </div>
      </div>
    </div>
  );
};

export default CommunityCard;