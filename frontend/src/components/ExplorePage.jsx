import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from './Sidebar';
import useSidebarLayout from '../hooks/useSidebarLayout';
import defaultAvatar from "../assets/default-avatar.jpg";
import { clearAuth } from "../utils/tokenUtils";

function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const navigate = useNavigate();
  const { mainContentClass } = useSidebarLayout();

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId") || localStorage.getItem("userId") || "";

  const trendingTopics = Object.entries(
    posts.reduce((acc, post) => {
      (post.tags || []).forEach((rawTag) => {
        const tag = String(rawTag || "").trim();
        if (!tag) return;
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const peopleYouMayKnow = Object.values(
    posts.reduce((acc, post) => {
      const user = post.user;
      const userKey = user?._id || user?.id;
      if (!user || !userKey || userKey.toString() === userId.toString()) return acc;
      if (!acc[userKey]) {
        acc[userKey] = {
          id: userKey,
          username: user.username || "Unknown User",
          profileImage: user.profileImage || defaultAvatar,
          postsCount: 1,
        };
      } else {
        acc[userKey].postsCount += 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b.postsCount - a.postsCount)
    .slice(0, 4);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const loadFeed = async () => {
    try {
      const token = localStorage.getItem("token");
      const personalizedRes = await fetch(
        "http://localhost:4000/api/recommendations/feed?postLimit=50&relevantLimit=35&exploreLimit=15&relevantThreshold=0.25",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (personalizedRes.ok) {
        const personalizedData = await personalizedRes.json();
        setPosts(personalizedData.posts || []);
      } else {
        const res = await fetch("http://localhost:4000/api/posts");
        const data = await res.json();
        if (res.ok) setPosts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  // --- Handle post interactions ---
  const handleLikePost = async (postId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setPosts((prev) =>
          prev.map((post) => {
            if (post._id !== postId) return post;

            const isLiked = (post.likes || []).some((likeUserId) => {
              const id = typeof likeUserId === "string" ? likeUserId : likeUserId?._id;
              return String(id) === String(userId);
            });

            return {
              ...post,
              likes: isLiked
                ? (post.likes || []).filter((id) => {
                    const likeId = typeof id === "string" ? id : id?._id;
                    return String(likeId) !== String(userId);
                  })
                : [...(post.likes || []), userId],
            };
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
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text: commentText }),
      });

      const data = await res.json();

      if (res.ok) {
        setPosts(prev => prev.map(post => 
          post._id === postId ? { ...post, comments: data.comments || post.comments } : post
        ));
        setNewComment(prev => ({ ...prev, [postId]: "" }));
      } else {
        alert(data.msg || 'Failed to add comment');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding comment');
    }
  };

  const handleDeleteComment = async (postId, commentIdx) => {
    if (!confirm('Delete this comment?')) return;
    
    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/comments/${commentIdx}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (res.ok) {
        setPosts(prev => prev.map(post => 
          post._id === postId ? { ...post, comments: data.comments || post.comments } : post
        ));
      } else {
        alert(data.msg || 'Failed to delete comment');
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
        <header className="mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-blue-600 rounded-full" />
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                Explore
              </h1>
            </div>
            <p className="text-slate-500 text-sm ml-5">
              Discover posts and connect with the community.
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
                (() => {
                  const isLiked = (post.likes || []).some((likeUserId) => {
                    const id = typeof likeUserId === "string" ? likeUserId : likeUserId?._id;
                    return String(id) === String(userId);
                  });
                  return (
                <article
                  key={post._id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
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
                        isLiked
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <svg 
                        className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} 
                        fill={isLiked ? "currentColor" : "none"}
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
                          {post.comments.map((comment, commentIdx) => (
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
                                        onClick={() => handleDeleteComment(post._id, commentIdx)}
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
                  );
                })()
              ))
            )}
          </main>

          {/* Right sidebar */}
          <aside className="hidden lg:block w-80 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12a.58.58 0 01-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.45-.46-.87-.77-1.26zm-4.05 6.28c-.6.44-1.44.57-2.13.32-.55-.2-.88-.73-.81-1.3.07-.5.42-.82.83-1.09.38-.26.81-.45 1.13-.77.15-.16.28-.34.4-.53.27.41.43.88.46 1.37.04.75-.21 1.56-.88 2z"/>
                </svg>
                <h3 className="text-sm font-bold text-slate-800">Trending Topics</h3>
              </div>

              {trendingTopics.length === 0 ? (
                <p className="text-xs text-slate-500">No topics yet. Add tags to posts to see trends.</p>
              ) : (
                <div className="space-y-1">
                  {trendingTopics.map(([tag, count]) => (
                    <div key={tag} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-slate-700 bg-slate-100">#{tag}</span>
                      <span className="text-xs text-slate-500">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-sm font-bold text-slate-800">People You May Know</h3>
              </div>

              {peopleYouMayKnow.length === 0 ? (
                <p className="text-xs text-slate-500">Not enough activity yet to suggest people.</p>
              ) : (
                <div className="space-y-3">
                  {peopleYouMayKnow.map((person) => (
                    <div key={person.id} className="flex items-center gap-3">
                      <img
                        src={person.profileImage}
                        alt={person.username}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{person.username}</p>
                        <p className="text-xs text-slate-500">{person.postsCount} post{person.postsCount > 1 ? "s" : ""}</p>
                      </div>
                      <button className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors border border-slate-200">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
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