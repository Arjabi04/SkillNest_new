import React from 'react';
import defaultHeader from '../assets/default-header.jpeg';
import { getRoleLabel, getRoleColor, isCommunityMember } from '../utils/communityUtils';

// SVG Icons
const Users = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const Clock = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Star = ({ className, filled = false }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
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
  const roleColor = getRoleColor(community, userId);
  const isMember = isCommunityMember(community, userId);
  
  const getCardStyle = () => {
    if (isOwned) {
      return "border-yellow-200 bg-yellow-50/50 hover:shadow-yellow-200/20";
    }
    if (isPending) {
      return "border-yellow-200 bg-yellow-50/30 hover:shadow-yellow-200/15";
    }
    if (isRecommended) {
      return "border-blue-200 bg-blue-50/30 hover:shadow-blue-200/15";
    }
    return "border-green-200 bg-green-50/30 hover:shadow-green-200/15";
  };

  const getActionButton = () => {
    if (isPending) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-bold text-xs border border-yellow-200">
          <Clock className="w-3 h-3" />
          Pending
        </div>
      );
    }
    
    if (isMember) {
      return (
        <button 
          onClick={(e) => { e.stopPropagation(); onViewCommunity(community); }}
          className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-blue-600 transition-all hover:shadow-md"
        >
          Open
        </button>
      );
    }
    
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); onJoinCommunity(community._id); }}
        className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all hover:shadow-md"
      >
        Join
      </button>
    );
  };

  const getSpecialIcon = () => {
    if (isOwned) {
      return (
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 bg-yellow-100 border border-yellow-200 rounded-full flex items-center justify-center">
            <Star className="w-4 h-4 text-yellow-600" filled />
          </div>
        </div>
      );
    }
    if (isRecommended) {
      return (
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      onClick={() => onViewCommunity(community)}
      className={`group relative bg-white rounded-3xl border-2 p-6 hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col h-full transform hover:-translate-y-1 ${
        getCardStyle()
      }`}
    >
      {/* Image Container */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 mb-6">
        <img 
          src={community.coverImage || defaultHeader} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
          alt={community.name} 
        />
        
        {/* Role Badge */}
        {roleLabel && (
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md bg-white/90 ${
              roleColor
            }`}>
              {roleLabel}
            </span>
          </div>
        )}
        
        {/* Special Icon */}
        {getSpecialIcon()}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
            {community.name}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
            {community.description}
          </p>
        </div>
        
        {/* Stats & Action */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Member Avatars */}
            {/* <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 shadow-sm" />
              ))}
            </div> */}
            <div className="flex items-center gap-1 text-slate-500">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold">{community.members?.length || 0}</span>
            </div>
          </div>

          {getActionButton()}
        </div>
      </div>
    </div>
  );
};

export default CommunityCard;