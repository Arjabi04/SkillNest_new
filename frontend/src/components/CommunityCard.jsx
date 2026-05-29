import React from "react";
import { Users, Clock, Star as LucideStar } from "lucide-react";
import defaultHeader from "../assets/default-header.jpeg";
import {
    getRoleLabel,
    getRoleColor,
    isCommunityMember,
} from "../utils/communityUtils";
import "./CommunityCard.css";

const Star = ({ className, filled = false }) => (
    <LucideStar className={`${className}${filled ? " fill-current" : ""}`} />
);

const CommunityCard = ({
    community,
    userId,
    onViewCommunity,
    onJoinCommunity,
    isOwned = false,
    isPending = false,
    isRecommended = false,
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
                    <Clock style={{ width: "0.75rem", height: "0.75rem" }} />
                    Pending
                </div>
            );
        }

        if (isMember) {
            return (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewCommunity(community);
                    }}
                    className="community-card-btn-open">
                    Open
                </button>
            );
        }

        return (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onJoinCommunity(community._id, community);
                }}
                className="community-card-btn-join">
                Join
            </button>
        );
    };

    const getSpecialIcon = () => {
        if (isOwned) {
            return (
                <div className="community-card-special-icon owned">
                    <Star style={{ width: "1rem", height: "1rem" }} filled />
                </div>
            );
        }
        if (isRecommended) {
            return (
                <div className="community-card-special-icon recommended">
                    <Star style={{ width: "1rem", height: "1rem" }} />
                </div>
            );
        }
        return null;
    };

    return (
        <div
            onClick={() => onViewCommunity(community)}
            className={`community-card ${getCardStyle()}`}>
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
                    <h3 className="community-card-title">{community.name}</h3>
                    <p className="community-card-desc">
                        {community.description}
                    </p>
                </div>

                {/* Stats & Action */}
                <div className="community-card-footer">
                    <div className="community-card-stats">
                        <div className="community-card-members">
                            <Users style={{ width: "1rem", height: "1rem" }} />
                            <span className="community-card-members-count">
                                {community.members?.length || 0}
                            </span>
                        </div>
                    </div>

                    {getActionButton()}
                </div>
            </div>
        </div>
    );
};

export default CommunityCard;
