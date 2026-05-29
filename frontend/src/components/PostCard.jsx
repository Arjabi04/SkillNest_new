import PostComments from './PostComments';
import defaultAvatar from '../assets/default-avatar.jpg';
import { useState } from 'react';
import ReportPostModal from './ReportPostModal';

const PostCard = ({
  post,
  currentUserId,
  isExpanded,
  commentDraft,
  onCommentDraftChange,
  onToggleComments,
  onLike,
  onAddComment,
  onDeleteComment,
  onUserClick,
  onTagClick,
  selectedTag = '',
  onCommunityClick,
  onDelete,
  showDelete = false,
  variant = 'explore',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isLiked = (post.likes || []).some((likeUserId) => {
    const id = typeof likeUserId === 'string' ? likeUserId : likeUserId?._id;
    return String(id) === String(currentUserId);
  });

  const postImages = Array.isArray(post.images) && post.images.length > 0
    ? post.images
    : (post.image ? [post.image] : []);

  const isExplore = variant === 'explore';
  const isGray = variant === 'gray';
  const isOwnPost = String(post.user?._id || post.user?.id || post.user) === String(currentUserId);

  return (
    <article className={isExplore ? 'rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200' : 'bg-white rounded-2xl shadow-sm border border-gray-100 p-5'}>
      <div className={isExplore ? 'flex items-center gap-4 mb-4' : 'flex items-center gap-3 mb-4'}>
        <button
          type="button"
          onClick={() => onUserClick?.(post.user?._id || post.user?.id)}
          className={isExplore ? 'shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200' : 'shrink-0'}
        >
          <img
            src={post.user?.profileImage || defaultAvatar}
            alt={post.user?.username || 'User'}
            className={isExplore ? 'w-12 h-12 rounded-full border-2 border-slate-100 object-cover' : 'w-10 h-10 rounded-full object-cover'}
          />
        </button>
        <div className="flex-1">
          <button
            type="button"
            onClick={() => onUserClick?.(post.user?._id || post.user?.id)}
            className={isExplore ? 'font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left' : 'font-semibold text-slate-900 text-left'}
          >
            {post.user?.username || 'Unknown User'}
          </button>
          <p className={isExplore ? 'text-sm text-slate-500' : 'text-xs text-slate-500'}>
            {new Date(post.postedAt || post.createdAt).toLocaleDateString(isExplore ? 'en-US' : undefined, isExplore ? {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            } : undefined)}
          </p>
          {isExplore && post.communityMeta?.id && (
            <button
              onClick={() => onCommunityClick?.(post.communityMeta.id)}
              className="mt-1 inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              from {post.communityMeta.name || 'Community'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showDelete && (
            <button
              onClick={() => onDelete?.(post._id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-lg px-2 py-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Post options"
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-10">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  disabled={isOwnPost}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    isOwnPost
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Report Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {post.text && (
        <p className={isExplore ? 'text-slate-800 leading-relaxed whitespace-pre-wrap mb-4' : 'text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap'}>
          {post.text}
        </p>
      )}

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className={isExplore ? `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${String(selectedTag).toLowerCase() === String(tag).toLowerCase() ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}` : 'px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium'}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {postImages.length > 0 && (
        <div className={isExplore ? `mt-4 grid gap-2 rounded-xl overflow-hidden ${postImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} mb-4` : 'mb-4'}>
          {postImages.length > 1 && !isExplore ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
              {postImages.map((img, idx) => (
                <div key={`${post._id}-img-${idx}`} className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={img} alt={`Post image ${idx + 1}`} className="w-full h-32 object-cover" />
                </div>
              ))}
            </div>
          ) : (
            postImages.slice(0, 6).map((img, idx) => (
              <div key={`${post._id}-img-${idx}`} className={isExplore ? 'bg-slate-100' : 'rounded-lg border border-gray-200'}>
                <img
                  src={img}
                  alt={`Post content ${idx + 1}`}
                  className={isExplore ? `w-full object-cover ${postImages.length === 1 ? 'max-h-105' : 'h-48'}` : 'w-full max-h-96 object-contain'}
                />
              </div>
            ))
          )}
        </div>
      )}

      <div className={isExplore ? 'flex items-center gap-4 pt-4 border-t border-slate-100' : 'flex gap-4 mt-4 pt-4 border-t border-gray-100'}>
        <button
          onClick={() => onLike?.(post._id)}
          className={isExplore ? `flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${isLiked ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-slate-600 hover:bg-slate-100'}` : `flex items-center gap-2 text-sm transition-colors ${isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
        >
          <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {post.likes?.length || 0}
        </button>

        <button
          onClick={() => onToggleComments?.(post._id)}
          className={isExplore ? 'flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm text-slate-600 hover:bg-slate-100 transition-all' : 'flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comments?.length || 0}
        </button>
      </div>

      <PostComments
        post={post}
        currentUserId={currentUserId}
        isExpanded={isExpanded}
        commentDraft={commentDraft}
        onCommentDraftChange={onCommentDraftChange}
        onAddComment={onAddComment}
        onDeleteComment={onDeleteComment}
        variant={isGray ? 'gray' : 'slate'}
      />

      <ReportPostModal
        open={reportOpen}
        postId={post._id}
        onClose={() => setReportOpen(false)}
        onSubmitted={() => {}}
      />
    </article>
  );
};

export default PostCard;
