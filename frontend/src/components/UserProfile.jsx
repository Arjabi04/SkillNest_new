import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Sidebar from './Sidebar';
import useSidebarLayout from '../hooks/useSidebarLayout';
import TagInput from './TagInput';
import defaultAvatar from "../assets/default-avatar.jpg";
import defaultHeader from "../assets/default-header.jpeg";
import logo from "../assets/Logo.png";
import { clearAuth } from "../utils/tokenUtils";

function UserProfile() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");
  const headerInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { mainContentClass } = useSidebarLayout();
  
  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // --- Profile states ---
  const [profileImage, setProfileImage] = useState("");
  const [headerImage, setHeaderImage] = useState("");
  const [file, setFile] = useState(null);
  const [headerFile, setHeaderFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [headerPreview, setHeaderPreview] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [bioMessage, setBioMessage] = useState("");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState([]);
  const [editingInterests, setEditingInterests] = useState(false);
  const [interestDraft, setInterestDraft] = useState([]);
  const [interestsMessage, setInterestsMessage] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- Posts ---
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostFiles, setNewPostFiles] = useState([]);
  const [newPostPreviews, setNewPostPreviews] = useState([]);
  const [newPostTags, setNewPostTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showPostMenu, setShowPostMenu] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [editPostText, setEditPostText] = useState('');
  const [editPostTags, setEditPostTags] = useState([]);

  const resolveAvatarSrc = (image) => (typeof image === "string" && image.trim() ? image : defaultAvatar);

  const handleAvatarError = (e) => {
    if (e.currentTarget.src !== defaultAvatar) {
      e.currentTarget.src = defaultAvatar;
    }
  };

  // --- Previews for avatar/header ---
  useEffect(() => {
    if (!file) return setPreview(null);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!headerFile) return setHeaderPreview(null);
    const objectUrl = URL.createObjectURL(headerFile);
    setHeaderPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [headerFile]);

  // --- Preview for new post images ---
  useEffect(() => {
    if (newPostFiles.length === 0) {
      setNewPostPreviews([]);
      return;
    }
    const previews = newPostFiles.map((file) => URL.createObjectURL(file));
    setNewPostPreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [newPostFiles]);

  // --- Fetch user and posts ---
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/profile/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setUsername(data.username);
          setBio(data.bio || "");
          setProfileImage(data.profileImage || "");
          setHeaderImage(data.headerImage || "");
          const userInterests = Array.isArray(data.interests) ? data.interests : [];
          setInterests(userInterests);
          setInterestDraft(userInterests);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/posts/${userId}`);
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setPosts([]);
      }
    };

    fetchUser();
    fetchPosts();
  }, [userId]);

  // --- Upload avatar or header immediately ---
  const handleFileSelect = async (file, type) => {
    if (!file || !userId) return;

    const formData = new FormData();
    formData.append(type === "avatar" ? "profileImage" : "headerImage", file);
    formData.append("userId", userId);

    setUploading(true);
    setMessage("");

    try {
      const endpoint = type === "avatar" ? "upload" : "upload-header";
      const res = await fetch(`http://localhost:4000/api/profile/${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok || res.status === 200) {
        setMessage(`${type === "avatar" ? "Avatar" : "Header"} uploaded!`);
        if (type === "avatar") setProfileImage(data.url);
        else setHeaderImage(data.url);
      } else {
        setMessage(data.msg || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload failed: network/server error");
    } finally {
      setUploading(false);
      if (type === "avatar") setFile(null);
      else setHeaderFile(null);
    }
  };

  // --- Update bio ---
  const handleBioUpdate = async () => {
    if (!userId) return setBioMessage("User ID missing");
    try {
      const res = await fetch("http://localhost:4000/api/profile/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bio }),
      });
      const data = await res.json();
      setBioMessage(res.ok ? "Bio updated!" : data.msg || "Failed");
      setEditingBio(false);
    } catch (err) {
      console.error(err);
      setBioMessage("Network error");
    }
  };

  const handleInterestsSave = async () => {
    if (!userId) {
      setInterestsMessage("User ID missing");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, interests: interestDraft }),
      });

      const data = await res.json();
      if (res.ok) {
        const updatedInterests = Array.isArray(data.interests) ? data.interests : interestDraft;
        setInterests(updatedInterests);
        setInterestDraft(updatedInterests);
        setEditingInterests(false);
        setInterestsMessage("Interests updated successfully");
      } else {
        setInterestsMessage(data.msg || "Failed to update interests");
      }
    } catch (err) {
      console.error(err);
      setInterestsMessage("Network error while updating interests");
    }
  };

  const handleInterestsCancel = () => {
    setInterestDraft(interests);
    setEditingInterests(false);
  };

  // --- Handle image selection for post (up to 6 images) ---
  const handlePostImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const selected = files.slice(0, 6); // Limit to 6 images
      setNewPostFiles(selected);
    }
  };

  // --- Tags helpers ---
  const addTagFromInput = () => {
    const value = newTagInput.trim();
    if (!value) return;
    const pieces = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...newPostTags, ...pieces]));
    setNewPostTags(merged);
    setNewTagInput("");
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagFromInput();
    }
  };

  const removeTag = (tag) => {
    setNewPostTags((prev) => prev.filter((t) => t !== tag));
  };

  // --- Remove image(s) from post ---
  const handleRemovePostImage = (index) => {
    setNewPostFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPostPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // --- New Post ---
  const handleNewPost = async () => {
    if (!newPostText.trim() && newPostFiles.length === 0) {
      alert("Please add some text or at least one image");
      return;
    }
    setPosting(true);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("text", newPostText || "");
    newPostFiles.forEach((file) => formData.append("images", file));
    if (newPostTags.length) {
      formData.append("tags", JSON.stringify(newPostTags));
    }

    try {
      const res = await fetch("http://localhost:4000/api/posts", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const resPosts = await fetch(
          `http://localhost:4000/api/posts/${userId}`
        );
        setPosts(await resPosts.json());
        setNewPostText("");
        setNewPostFiles([]);
        setNewPostPreviews([]);
        setNewPostTags([]);
        setNewTagInput("");
      } else {
        alert(data.msg || "Failed to post");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setPosting(false);
    }
  };

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
        const resPosts = await fetch(`http://localhost:4000/api/posts/${userId}`);
        setPosts(await resPosts.json());
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
        const resPosts = await fetch(`http://localhost:4000/api/posts/${userId}`);
        setPosts(await resPosts.json());
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
        const resPosts = await fetch(`http://localhost:4000/api/posts/${userId}`);
        setPosts(await resPosts.json());
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to delete comment');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting comment');
    }
  };

  // --- Handle post update and delete ---
  const handleEditPost = (post) => {
    setEditingPost(post._id);
    setEditPostText(post.text);
    setEditPostTags(post.tags || []);
    setShowPostMenu({});
  };

  const handleUpdatePost = async (postId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          text: editPostText,
          tags: editPostTags
        })
      });
      if (res.ok) {
        // Refresh posts
        const resPosts = await fetch(`http://localhost:4000/api/posts/${userId}`);
        setPosts(await resPosts.json());
        setEditingPost(null);
        setEditPostText('');
        setEditPostTags([]);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to update post');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        // Refresh posts
        const resPosts = await fetch(`http://localhost:4000/api/posts/${userId}`);
        setPosts(await resPosts.json());
        setShowPostMenu({});
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to delete post');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting post');
    }
  };

  const cancelEditPost = () => {
    setEditingPost(null);
    setEditPostText('');
    setEditPostTags([]);
  };

  const removeEditTag = (tag) => {
    setEditPostTags(prev => prev.filter(t => t !== tag));
  };

  const addEditTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !editPostTags.includes(trimmedTag)) {
      setEditPostTags(prev => [...prev, trimmedTag]);
    }
  };

  const isHome = location.pathname === "/";
  const isProfile = location.pathname.startsWith("/profile");
  const isCommunities = location.pathname.startsWith("/communities");
  const isMarketplace = location.pathname.startsWith("/marketplace");
  const isEvents = location.pathname.startsWith("/events");
  const isNotifications = location.pathname.startsWith("/notifications");
  const isSettings = location.pathname.startsWith("/settings");

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <Sidebar />
      
      {/* Main content */}
      <div className={`flex-1 ${mainContentClass}`}>
        {/* Header */}
        <div className="relative w-full h-56 overflow-hidden bg-linear-to-br from-blue-400 to-indigo-600">
          <img
            src={headerPreview || headerImage || defaultHeader}
            alt="Header"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none bg-linear-to-t from-black/20 to-transparent" />
          <button
            type="button"
            onClick={() => headerInputRef.current?.click()}
            className="absolute z-10 bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl px-3 py-2 hover:bg-white transition-all shadow-md inline-flex items-center gap-2 text-sm font-medium"
            title="Change header"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Change cover
          </button>
          <input
            ref={headerInputRef}
            id="headerInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              setHeaderFile(file);
              handleFileSelect(file, "header");
            }}
          />
        </div>

        {/* Edit profile button row (BELOW header, right side) */}
        {/* Profile info */}
        <div className="bg-white px-8 pb-6 border-b border-gray-100">
        <div className="relative -mt-12 mb-4">
          <div className="relative inline-block">
          <img
        src={resolveAvatarSrc(preview || profileImage)}
        alt="Avatar"
        onError={handleAvatarError}
        className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-xl ring-2 ring-slate-100"
      />
            <label 
              htmlFor="avatarInput" 
              className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors shadow-md border-2 border-white"
              title="Change avatar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </label>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                setFile(file);
                handleFileSelect(file, "avatar");
              }}
            />
          </div>
        </div>

        <div className="profile-details">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{username}</h3>

          {!editingBio ? (
            <>
              <p className="text-gray-500 mb-3 text-sm leading-relaxed">{bio || "No bio yet — tell the community about yourself!"}</p>
              <button 
                onClick={() => setEditingBio(true)} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit bio
              </button>
            </>
          ) : (
            <>
              <textarea
                className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 resize-none text-sm font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows="3"
              />
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={handleBioUpdate} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Save
                </button>
                <button 
                  onClick={() => setEditingBio(false)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {bioMessage && <p className="text-xs text-green-600 mt-2 font-medium">{bioMessage}</p>}

          {/* Interests — flat section with divider */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Interests</span>
              {!editingInterests && (
                <button
                  onClick={() => {
                    setInterestDraft(interests);
                    setEditingInterests(true);
                    setInterestsMessage("");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {interests.length > 0 ? 'Edit' : '+ Add interests'}
                </button>
              )}
            </div>

            {editingInterests ? (
              <>
                <TagInput
                  tags={interestDraft}
                  setTags={setInterestDraft}
                  placeholder="Type an interest and press Enter..."
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInterestsSave}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleInterestsCancel}
                    className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {interests.length > 0 ? (
                  interests.map((interest) => (
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
            )}

            {interestsMessage && <p className="text-xs text-green-600 mt-2">{interestsMessage}</p>}
          </div>
        </div>
      </div>

        {/* New Post Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mx-6 mt-5 mb-3 max-w-2xl">
        <div className="p-4">
          <div className="flex gap-3 mb-3">
          <img
            src={resolveAvatarSrc(profileImage)}
            alt="Avatar"
            onError={handleAvatarError}
            className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-slate-100"
          />
            <div className="flex-1">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 resize-none text-sm font-sans text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                rows="3"
              />
            </div>
          </div>

          {/* Image Previews */}
          {newPostPreviews.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {newPostPreviews.map((preview, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePostImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{newPostPreviews.length}/6 images selected</p>
            </div>
          )}

          {/* Tags input */}
          <div className="mt-2 mb-3 flex flex-wrap items-center gap-2 px-1">
            {newPostTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tags (press Enter)"
              className="flex-1 min-w-[160px] px-3 py-1.5 text-xs rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-gray-600 hover:text-blue-500 cursor-pointer transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Photo (up to 6)</span>
                <input 
                  type="file" 
                  multiple
                  accept="image/*"
                  onChange={handlePostImageSelect} 
                  className="hidden" 
                />
              </label>
            </div>
            <button 
              onClick={handleNewPost} 
              disabled={posting || (!newPostText.trim() && newPostFiles.length === 0)}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {posting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </span>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </div>
      </div>

        {/* Posts List */}
        <div className="flex flex-col gap-3 mx-6 pb-10 max-w-2xl">
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No posts yet. Share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <img 
                  src={resolveAvatarSrc(profileImage)} 
                  alt="Avatar" 
                  onError={handleAvatarError}
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-100" 
                />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block text-sm">{username}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {/* 3-dot menu */}
                <div className="relative">
                  <button 
                    onClick={() => setShowPostMenu({ ...showPostMenu, [post._id]: !showPostMenu[post._id] })}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                  {showPostMenu[post._id] && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                      <button 
                        onClick={() => handleEditPost(post)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post._id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Post content - editable if in edit mode */}
              {editingPost === post._id ? (
                <div className="mb-4">
                  <textarea
                    value={editPostText}
                    onChange={(e) => setEditPostText(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 resize-none text-base font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                    rows="4"
                    placeholder="What's on your mind?"
                  />
                  
                  {/* Edit tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {editPostTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeEditTag(tag)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add tag (press Enter)"
                      className="flex-1 min-w-[120px] px-3 py-1.5 text-xs rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addEditTag(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdatePost(post._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button 
                      onClick={cancelEditPost}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                </>
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
                            <img src={resolveAvatarSrc(comment.user?.profileImage)} className="w-8 h-8 rounded-full" alt="" onError={handleAvatarError} />
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
            </div>
          ))
        )}
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

export default UserProfile;