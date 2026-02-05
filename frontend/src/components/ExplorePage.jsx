import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.jpg";
import logo from "../assets/Logo.png";
import { clearAuth } from "../utils/tokenUtils";

function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const navigate = useNavigate();

  const location = useLocation();
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId") || localStorage.getItem("userId") || "";

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const isHome = location.pathname === "/";
  const isProfile = location.pathname.startsWith("/profile");
  const isCommunities = location.pathname.startsWith("/communities");
  const isMarketplace = location.pathname.startsWith("/marketplace");
  const isEvents = location.pathname.startsWith("/events");
  const isNotifications = location.pathname.startsWith("/notifications");
  const isSettings = location.pathname.startsWith("/settings");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/posts");
        const data = await res.json();
        if (res.ok) setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // --- Handle post interactions ---
  const handleLikePost = async (postId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        // Refresh posts to get updated likes
        const resPosts = await fetch("http://localhost:4000/api/posts");
        const data = await resPosts.json();
        if (resPosts.ok) setPosts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId) => {
    const text = newComment[postId]?.trim();
    if (!text) return;
    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text })
      });
      if (res.ok) {
        setNewComment({ ...newComment, [postId]: '' });
        // Refresh posts to get updated comments
        const resPosts = await fetch("http://localhost:4000/api/posts");
        const data = await resPosts.json();
        if (resPosts.ok) setPosts(data);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to add comment');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding comment');
    }
  };

  const handleDeleteComment = async (postId, commentIdx) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/comments/${commentIdx}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        // Refresh posts to get updated comments
        const resPosts = await fetch("http://localhost:4000/api/posts");
        const data = await resPosts.json();
        if (resPosts.ok) setPosts(data);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to delete comment');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting comment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* Sidebar navigation */}
      <aside className="hidden md:flex flex-col w-50 border-r border-gray-200 bg-white py-8 px-6 gap-6 fixed inset-y-0 left-0">
        <div className="px-1">
          <img src={logo} alt="SkillNest Logo" className="h-20 mb-2"  />
          <p className="mt-1 text-xs text-gray-500">Your learning space</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isHome ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Home</span>
          </Link>
          <Link
            to={`/profile?userId=${userId}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isProfile ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Profile</span>
          </Link>
          <Link
            to="/communities"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isCommunities ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Communities</span>
          </Link>
          <Link
            to="/marketplace"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isMarketplace ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Marketplace</span>
          </Link>
          <Link
            to="/events"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isEvents ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Events</span>
          </Link>
          <Link
            to="/notifications"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isNotifications ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Notifications</span>
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isSettings ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Settings</span>
          </Link>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left border-none bg-transparent cursor-pointer"
          >
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-72 flex justify-center px-4 py-8">
        <div className="w-full max-w-6xl space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
              <p className="mt-1 text-sm text-gray-500">
                See what the SkillNest community is sharing right now.
              </p>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main feed */}
            <main className="flex-1 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className="rounded-2xl bg-white border border-gray-200 p-4 animate-pulse space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-2 w-32 bg-gray-100 rounded" />
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center">
                <p className="text-gray-600">
                  No posts yet. Be the first to share something on SkillNest!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post._id}
                  className="rounded-2xl bg-white border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={post.user?.profileImage || defaultAvatar}
                      alt={post.user?.username || "User"}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {post.user?.username || "Unknown user"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {post.text && (
                    <p className="text-gray-800 text-sm sm:text-base leading-relaxed mb-3 whitespace-pre-wrap">
                      {post.text}
                    </p>
                  )}

                  {post.image && (
                    <div className="rounded-xl overflow-hidden border border-gray-100 mb-2 bg-gray-50 flex items-center justify-center">
                      <img
                        src={post.image}
                        alt="Post"
                        className="w-full max-h-[460px] object-contain"
                      />
                    </div>
                  )}

                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Like and Comment Actions */}
                  <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                    {(() => {
                      const isLiked = post.likes?.some(likeUserId => {
                        const id = typeof likeUserId === 'string' ? likeUserId : likeUserId._id;
                        return id === userId;
                      });
                      return (
                        <button 
                          onClick={() => handleLikePost(post._id)}
                          className={`flex items-center gap-2 text-sm transition-colors ${
                            isLiked 
                              ? 'text-red-600' 
                              : 'text-gray-600 hover:text-red-600'
                          }`}
                        >
                          <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {post.likes?.length || 0}
                        </button>
                      );
                    })()}
                    <button 
                      onClick={() => setExpandedComments({ ...expandedComments, [post._id]: !expandedComments[post._id] })}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {post.comments?.length || 0}
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post._id] && (
                    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {post.comments?.map((comment, idx) => {
                          const commentUserId = typeof comment.user === 'string' ? comment.user : comment.user._id;
                          const isCommentOwner = commentUserId === userId;
                          return (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg relative">
                              <div className="flex items-start gap-3 mb-2">
                                <img src={comment.user?.profileImage || defaultAvatar} className="w-8 h-8 rounded-full" alt="" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm">{comment.user?.username}</span>
                                    {isCommentOwner && (
                                      <button 
                                        onClick={() => handleDeleteComment(post._id, idx)}
                                        className="ml-auto text-gray-400 hover:text-red-600 text-xs font-medium"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.text}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newComment[post._id] || ''}
                          onChange={(e) => setNewComment({ ...newComment, [post._id]: e.target.value })}
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                          onClick={() => handleAddComment(post._id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
            </main>

            {/* Right sidebar */}
            <aside className="hidden lg:block w-80 space-y-4">
              <div className="rounded-2xl bg-white border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Discover topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Design",
                    "Web Dev",
                    "AI & ML",
                    "Marketing",
                    "Photography",
                    "Writing",
                    "Fitness",
                    "Startup",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Tips
                </h2>
                <p className="text-xs text-gray-600">
                  Share what you&apos;re learning, add an image when it helps,
                  and keep posts focused so others can learn from you quickly.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[101] flex justify-center items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout? Your session will expire.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300">Cancel</button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExplorePage;
