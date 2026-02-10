import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from './Sidebar';
import useSidebarLayout from '../hooks/useSidebarLayout';
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
  const { mainContentClass } = useSidebarLayout();

  const location = useLocation();
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId") || localStorage.getItem("userId") || "";

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

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
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/like`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPosts((prev) =>
          prev.map((post) => {
            if (post._id === postId) {
              const isLiked = post.likes?.includes(userId);
              return {
                ...post,
                likes: isLiked
                  ? post.likes.filter((id) => id !== userId)
                  : [...(post.likes || []), userId],
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = async (postId) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(post => 
          post._id === postId ? updatedPost : post
        ));
        setNewComment(prev => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error(err);
      alert('Error adding comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('Delete this comment?')) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/comment/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(prev => prev.map(post => 
          post._id === postId ? updatedPost : post
        ));
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting comment');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <Sidebar />
      
      {/* Main content */}
      <div className={`flex-1 ${mainContentClass} max-w-[1200px] mx-auto px-6 py-8`}>
        
        {/* Header */}
        <header className="mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-12 bg-blue-600 rounded-full" />
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
                Explore
              </h1>
            </div>
            <p className="text-slate-600 font-medium text-lg max-w-2xl leading-relaxed">
              Discover posts, connect with the community, and explore trending content.
            </p>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main feed */}
          <main className="flex-1 space-y-6">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className="rounded-2xl bg-white border border-slate-200 p-6 animate-pulse space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-24 bg-slate-100 rounded" />
                      </div>
                    </div>
                    <div className="h-4 bg-slate-100 rounded w-5/6" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Posts Yet</h3>
                <p className="text-slate-500">
                  Be the first to share something on SkillNest!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post._id}
                  className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={post.user?.profileImage || defaultAvatar}
                      alt={post.user?.username || "User"}
                      className="w-12 h-12 rounded-full border-2 border-slate-100"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {post.user?.username || "Unknown User"}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Post content */}
                  <div className="mb-4">
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {post.text}
                    </p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {post.image && (
                      <div className="mt-4 rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={post.image}
                          alt="Post content"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Post actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleLikePost(post._id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        post.likes?.includes(userId)
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <svg 
                        className={`w-5 h-5 ${post.likes?.includes(userId) ? 'fill-current' : ''}`} 
                        fill={post.likes?.includes(userId) ? "currentColor" : "none"}
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {post.likes?.length || 0}
                    </button>
                    
                    <button
                      onClick={() => toggleComments(post._id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm text-slate-600 hover:bg-slate-100 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {post.comments?.length || 0}
                    </button>
                  </div>

                  {/* Comments section */}
                  {expandedComments[post._id] && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                      {/* Add comment */}
                      <div className="flex gap-3">
                        <img
                          src={defaultAvatar}
                          alt="Your avatar"
                          className="w-8 h-8 rounded-full border border-slate-200"
                        />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment[post._id] || ""}
                            onChange={(e) => setNewComment(prev => ({
                              ...prev,
                              [post._id]: e.target.value
                            }))}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post._id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(post._id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Post
                          </button>
                        </div>
                      </div>

                      {/* Comments list */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="space-y-3">
                          {post.comments.map((comment) => (
                            <div key={comment._id} className="flex gap-3">
                              <img
                                src={comment.user?.profileImage || defaultAvatar}
                                alt={comment.user?.username}
                                className="w-8 h-8 rounded-full border border-slate-200"
                              />
                              <div className="flex-1 bg-slate-50 rounded-lg px-4 py-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm text-slate-900">
                                    {comment.user?.username || "Unknown User"}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">
                                      {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                    {comment.user?._id === userId && (
                                      <button
                                        onClick={() => handleDeleteComment(post._id, comment._id)}
                                        className="text-xs text-red-500 hover:text-red-700"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-slate-700">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
          </main>

          {/* Right sidebar with trending */}
          <aside className="hidden lg:block w-80 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Trending Topics</h3>
              <div className="space-y-3">
                {['JavaScript', 'React', 'Web Development', 'UI/UX', 'Machine Learning'].map((topic) => (
                  <div key={topic} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className="font-medium text-slate-700">#{topic}</span>
                    <span className="text-sm text-slate-500">127 posts</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Suggested Users</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">User {i}</p>
                      <p className="text-xs text-slate-500">Web Developer</p>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Logout</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExplorePage;