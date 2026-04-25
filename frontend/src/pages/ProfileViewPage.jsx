import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layouts/Sidebar";
import useSidebarLayout from "../hooks/useSidebarLayout";
import defaultAvatar from "../assets/default-avatar.jpg";
import defaultHeader from "../assets/default-header.jpeg";

function ProfileViewPage() {
  const params = new URLSearchParams(window.location.search);
  const viewedUserId = params.get("userId") || "";
  const currentUserId = localStorage.getItem("userId") || "";
  const navigate = useNavigate();
  const { mainContentClass } = useSidebarLayout();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [newComment, setNewComment] = useState({});

  const token = localStorage.getItem("token");

  const fetchProfileAndPosts = async () => {
    if (!viewedUserId) {
      setLoading(false);
      return;
    }

    try {
      const [profileRes, postsRes] = await Promise.all([
        fetch(`http://localhost:4000/api/profile/${viewedUserId}`),
        fetch(`http://localhost:4000/api/posts/${viewedUserId}`),
      ]);

      const profileData = await profileRes.json();
      const postsData = await postsRes.json();

      if (profileRes.ok) {
        setProfile(profileData);
      }

      if (postsRes.ok) {
        setPosts(Array.isArray(postsData) ? postsData : []);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error(err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPosts();
  }, [viewedUserId]);

  const handleLikePost = async (postId) => {
    if (!currentUserId) return;

    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (res.ok) {
        await fetchProfileAndPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId) => {
    const text = String(newComment[postId] || "").trim();
    if (!text || !currentUserId) return;

    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: currentUserId, text }),
      });

      if (res.ok) {
        setNewComment((prev) => ({ ...prev, [postId]: "" }));
        await fetchProfileAndPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId, commentIdx) => {
    if (!currentUserId) return;

    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}/comments/${commentIdx}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (res.ok) {
        await fetchProfileAndPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  if (!viewedUserId) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex">
        <Sidebar />
        <div className={`flex-1 ${mainContentClass} p-8`}>
          <p className="text-slate-600">Invalid profile link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <Sidebar />

      <div className={`flex-1 ${mainContentClass}`}>
        {loading ? (
          <div className="p-8 text-slate-600">Loading profile...</div>
        ) : !profile ? (
          <div className="p-8 text-slate-600">Profile not found.</div>
        ) : (
          <>
            <div className="relative w-full h-56 overflow-hidden bg-linear-to-br from-blue-400 to-indigo-600">
              <img
                src={profile.headerImage || defaultHeader}
                alt="Header"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none bg-linear-to-t from-black/20 to-transparent" />
            </div>

            <div className="bg-white px-8 pb-6 border-b border-gray-100">
              <div className="relative -mt-12 mb-4">
                <img
                  src={profile.profileImage || defaultAvatar}
                  alt="Avatar"
                  className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-xl ring-2 ring-slate-100"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{profile.username}</h3>
              <p className="text-gray-500 mb-3 text-sm leading-relaxed">
                {profile.bio || "No bio yet."}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(profile.interests || []).length > 0 ? (
                  profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                      #{interest}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">No interests yet.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 mx-6 mt-5 pb-10 max-w-2xl">
              {posts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                  <p className="text-gray-500 text-sm font-medium">No posts yet.</p>
                </div>
              ) : (
                posts.map((post) => {
                  const isLiked = (post.likes || []).some((likeUserId) => {
                    const id = typeof likeUserId === "string" ? likeUserId : likeUserId?._id;
                    return String(id) === String(currentUserId);
                  });

                  return (
                    <article key={post._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={post.user?.profileImage || defaultAvatar}
                          alt={post.user?.username || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{post.user?.username || "Unknown User"}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(post.postedAt || post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {post.text && (
                        <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">{post.text}</p>
                      )}

                      {post.images && Array.isArray(post.images) && post.images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                          {post.images.map((img, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={img}
                                alt={`Post image ${idx + 1}`}
                                className="w-full h-32 object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : post.image && (
                        <div className="rounded-lg mb-4 border border-gray-200">
                          <img
                            src={post.image}
                            alt="Post"
                            className="w-full max-h-96 object-contain"
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

                      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleLikePost(post._id)}
                          className={`flex items-center gap-2 text-sm transition-colors ${
                            isLiked ? "text-red-600" : "text-gray-600 hover:text-red-600"
                          }`}
                        >
                          <svg className={`w-5 h-5 ${isLiked ? "fill-current" : "fill-none"}`} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {post.likes?.length || 0}
                        </button>

                        <button
                          onClick={() => toggleComments(post._id)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.comments?.length || 0}
                        </button>

                      </div>

                      {expandedComments[post._id] && (
                        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {post.comments?.map((comment, idx) => {
                              const commentUserId = typeof comment.user === "string" ? comment.user : comment.user?._id;
                              const isCommentOwner = String(commentUserId) === String(currentUserId);
                              return (
                                <div key={comment._id || `${post._id}-comment-${idx}`} className="bg-gray-50 p-3 rounded-lg relative">
                                  <div className="flex items-start gap-3 mb-2">
                                    <img
                                      src={comment.user?.profileImage || defaultAvatar}
                                      className="w-8 h-8 rounded-full object-cover"
                                      alt=""
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">{comment.user?.username || "User"}</span>
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
                              value={newComment[post._id] || ""}
                              onChange={(e) =>
                                setNewComment((prev) => ({ ...prev, [post._id]: e.target.value }))
                              }
                              placeholder="Add a comment..."
                              className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(post._id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfileViewPage;
