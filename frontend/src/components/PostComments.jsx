import defaultAvatar from '../assets/default-avatar.jpg';

const PostComments = ({
  post,
  currentUserId,
  isExpanded,
  commentDraft,
  onCommentDraftChange,
  onAddComment,
  onDeleteComment,
  variant = 'slate',
}) => {
  if (!isExpanded) return null;

  const palette =
    variant === 'gray'
      ? {
          wrapper: 'mt-4 space-y-3 border-t border-gray-100 pt-4',
          listItem: 'bg-gray-50 p-3 rounded-lg relative',
          input: 'flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500',
          text: 'text-sm text-gray-700',
          deleteBtn: 'ml-auto text-gray-400 hover:text-red-600 text-xs font-medium',
        }
      : {
          wrapper: 'mt-4 pt-4 border-t border-slate-100 space-y-4',
          listItem: 'flex gap-3',
          bubble: 'flex-1 bg-slate-50 rounded-lg px-4 py-2',
          input: 'flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          text: 'text-sm text-slate-700',
          deleteBtn: 'text-xs text-red-500 hover:text-red-700',
        };

  return (
    <div className={palette.wrapper}>
      {post.comments && post.comments.length > 0 && (
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {post.comments.map((comment, commentIdx) => {
            const commentUserId = typeof comment.user === 'string' ? comment.user : comment.user?._id;
            const isCommentOwner = String(commentUserId) === String(currentUserId);

            if (variant === 'gray') {
              return (
                <div key={comment._id || `${post._id}-comment-${commentIdx}`} className={palette.listItem}>
                  <div className="flex items-start gap-3 mb-2">
                    <img
                      src={comment.user?.profileImage || defaultAvatar}
                      className="w-8 h-8 rounded-full object-cover"
                      alt={comment.user?.username || 'User'}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.user?.username || 'User'}</span>
                        {isCommentOwner && (
                          <button
                            onClick={() => onDeleteComment(post._id, commentIdx)}
                            className={palette.deleteBtn}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className={palette.text}>{comment.text}</p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={comment._id || `${post._id}-comment-${commentIdx}`} className={palette.listItem}>
                <img
                  src={comment.user?.profileImage || defaultAvatar}
                  alt={comment.user?.username || 'User'}
                  className="w-8 h-8 rounded-full border border-slate-200"
                />
                <div className={palette.bubble}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-slate-900">{comment.user?.username || 'Unknown User'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      {isCommentOwner && (
                        <button
                          onClick={() => onDeleteComment(post._id, commentIdx)}
                          className={palette.deleteBtn}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={palette.text}>{comment.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={commentDraft || ''}
          onChange={(e) => onCommentDraftChange(post._id, e.target.value)}
          placeholder="Add a comment..."
          className={palette.input}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onAddComment(post._id);
            }
          }}
        />
        <button
          type="button"
          onClick={() => onAddComment(post._id)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default PostComments;
