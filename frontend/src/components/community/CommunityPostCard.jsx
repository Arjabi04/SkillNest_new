import React from "react";
import defaultAvatar from "../../assets/default-avatar.jpg";
import {
    Flag,
    Heart,
    MessageCircle,
} from "./CommunityIcons";
import {
    isCommunityAdmin,
    isCommunityMember,
    isCommunityModerator,
} from "../../utils/communityUtils";

const REPORT_REASONS = [
    "Spam",
    "Harassment",
    "Hate speech",
    "Misinformation",
    "Rule violation",
];

const CommunityPostCard = ({
    post,
    selectedCommunity,
    userId,
    isExpanded,
    commentDraft,
    reportOpen,
    reportData,
    reportLoading,
    onLike,
    onToggleComments,
    onCommentChange,
    onAddComment,
    onDeleteComment,
    onDeletePost,
    onToggleReport,
    onReportFieldChange,
    onCancelReport,
    onSubmitReport,
}) => {
    const isLiked = post.likes?.some((likeUserId) => {
        const id = typeof likeUserId === "string" ? likeUserId : likeUserId?._id;
        return String(id) === String(userId);
    });
    const postUserId = String(
        typeof post.user === "string" ? post.user : post.user?._id || "",
    );
    const isPostOwner = postUserId === String(userId || "");
    const canDelete =
        isPostOwner ||
        isCommunityAdmin(selectedCommunity, userId) ||
        isCommunityModerator(selectedCommunity, userId);
    const canReport = isCommunityMember(selectedCommunity, userId) && !isPostOwner;
    const postImages =
        Array.isArray(post.images) && post.images.length > 0
            ? post.images
            : post.image
              ? [post.image]
              : [];

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 relative">
            <div className="flex items-center gap-3 mb-4">
                <img
                    src={post.user?.profileImage || defaultAvatar}
                    className="w-10 h-10 rounded-full border"
                    alt=""
                />
                <div className="flex-1">
                    <span className="font-bold text-sm text-gray-900 block">
                        {post.user?.username || "Unknown User"}
                    </span>
                    <span className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {post.text && <p className="text-gray-800 mb-3">{post.text}</p>}

            {postImages.length > 0 && (
                <div
                    className={`mb-3 grid gap-2 ${
                        postImages.length === 1
                            ? "grid-cols-1"
                            : "grid-cols-2"
                    }`}>
                    {postImages.map((imageUrl, index) => (
                        <div
                            key={imageUrl}
                            className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                            <img
                                src={imageUrl}
                                className={`w-full object-cover ${
                                    postImages.length === 1
                                        ? "max-h-96 object-contain"
                                        : "h-48"
                                }`}
                                alt={`Post image ${index + 1}`}
                            />
                        </div>
                    ))}
                </div>
            )}

            {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {reportOpen && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <h4 className="text-sm font-bold text-amber-900 mb-3">
                        Report post
                    </h4>
                    <div className="space-y-3">
                        <select
                            value={reportData?.reason || ""}
                            onChange={(e) =>
                                onReportFieldChange(post._id, "reason", e.target.value)
                            }
                            className="w-full rounded-lg border border-amber-200 bg-white p-2 text-sm">
                            <option value="">Select reason</option>
                            {REPORT_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                    {reason}
                                </option>
                            ))}
                        </select>
                        <textarea
                            value={reportData?.details || ""}
                            onChange={(e) =>
                                onReportFieldChange(post._id, "details", e.target.value)
                            }
                            rows={3}
                            placeholder="Add details for the community staff..."
                            className="w-full rounded-lg border border-amber-200 bg-white p-3 text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => onCancelReport(post._id)}
                                className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800">
                                Cancel
                            </button>
                            <button
                                onClick={() => onSubmitReport(post._id)}
                                disabled={Boolean(reportLoading)}
                                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                                {reportLoading ? "Submitting..." : "Submit report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <button
                    onClick={() => onLike(post._id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                        isLiked
                            ? "text-red-600"
                            : "text-gray-600 hover:text-red-600"
                    }`}>
                    <Heart className="w-5 h-5" filled={isLiked} />
                    {post.likes?.length || 0}
                </button>
                <button
                    onClick={() => onToggleComments(post._id)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    {post.comments?.length || 0}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {post.comments?.map((comment, idx) => {
                            const commentUserId =
                                typeof comment.user === "string"
                                    ? comment.user
                                    : comment.user?._id;
                            const canDeleteComment =
                                String(commentUserId) === String(userId) ||
                                isCommunityAdmin(selectedCommunity, userId);

                            return (
                                <div
                                    key={comment._id || `${post._id}-${idx}`}
                                    className="bg-gray-50 p-3 rounded-lg relative">
                                    <div className="flex flex-col items-start gap-2 mb-3">
                                        <img
                                            src={
                                                comment.user?.profileImage ||
                                                defaultAvatar
                                            }
                                            className="w-8 h-8 rounded-full"
                                            alt=""
                                        />
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="font-semibold text-sm">
                                                {comment.user?.username}
                                            </span>
                                            {canDeleteComment && (
                                                <button
                                                    onClick={() =>
                                                        onDeleteComment(post._id, idx)
                                                    }
                                                    className="ml-auto text-gray-400 hover:text-red-600 text-xs font-medium">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        {comment.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={commentDraft || ""}
                            onChange={(e) =>
                                onCommentChange(post._id, e.target.value)
                            }
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => onAddComment(post._id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                            Post
                        </button>
                    </div>
                </div>
            )}

            {(canDelete || canReport) && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    {canReport && (
                        <button
                            onClick={() => onToggleReport(post._id)}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">
                            <Flag className="w-3.5 h-3.5" />
                            Report
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => onDeletePost(post._id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium">
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommunityPostCard;
