import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layouts/Sidebar";
import useSidebarLayout from "../hooks/useSidebarLayout";
import defaultAvatar from "../assets/default-avatar.jpg";
import defaultHeader from "../assets/default-header.jpeg";
import PostCard from "../components/PostCard";

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

  const handleCommentDraftChange = (postId, value) => {
    setNewComment((prev) => ({
      ...prev,
      [postId]: value,
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
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserId={currentUserId}
                    isExpanded={!!expandedComments[post._id]}
                    commentDraft={newComment[post._id] || ''}
                    onCommentDraftChange={handleCommentDraftChange}
                    onToggleComments={toggleComments}
                    onLike={handleLikePost}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    variant="gray"
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ProfileViewPage;
