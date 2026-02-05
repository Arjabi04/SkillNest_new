import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.jpg";
import defaultHeader from "../assets/default-header.jpeg";
import logo from "../assets/Logo.png";
import { clearAuth } from "../utils/tokenUtils";

function UserProfile() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");
  const location = useLocation();
  const navigate = useNavigate();
  
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
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- Posts ---
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostFile, setNewPostFile] = useState(null);
  const [newPostPreview, setNewPostPreview] = useState(null);
  const [newPostTags, setNewPostTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [posting, setPosting] = useState(false);

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

  // --- Preview for new post image ---
  useEffect(() => {
    if (!newPostFile) return setNewPostPreview(null);
    const objectUrl = URL.createObjectURL(newPostFile);
    setNewPostPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [newPostFile]);

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

  // --- Handle image selection for post ---
  const handlePostImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPostFile(file);
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

  // --- Remove image from post ---
  const handleRemovePostImage = () => {
    setNewPostFile(null);
    setNewPostPreview(null);
  };

  // --- New Post ---
  const handleNewPost = async () => {
    if (!newPostText.trim() && !newPostFile) {
      alert("Please add some text or an image");
      return;
    }
    setPosting(true);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("text", newPostText || "");
    if (newPostFile) formData.append("image", newPostFile);
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
        setNewPostFile(null);
        setNewPostPreview(null);
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

  const isHome = location.pathname === "/";
  const isProfile = location.pathname.startsWith("/profile");
  const isCommunities = location.pathname.startsWith("/communities");
  const isMarketplace = location.pathname.startsWith("/marketplace");
  const isEvents = location.pathname.startsWith("/events");
  const isNotifications = location.pathname.startsWith("/notifications");
  const isSettings = location.pathname.startsWith("/settings");

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* Sidebar navigation */}
      <aside className="hidden md:flex flex-col w-50 border-r border-gray-200 bg-white py-8 px-6 gap-6 fixed inset-y-0 left-0">
        <div className="px-1">
          <img src={logo} alt="SkillNest Logo" className="h-20 mb-2" />
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
      <div className="flex-1 md:ml-72">
        {/* Header */}
        <div className="relative w-full h-96 overflow-hidden bg-gray-300">
          <img
            src={headerPreview || headerImage || defaultHeader}
            alt="Header"
            className="w-full h-full object-cover"
          />
          <label 
            htmlFor="headerInput" 
            className="absolute bottom-4 right-4 bg-blue-500 text-white rounded-full p-3 cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
            title="Change header"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </label>
          <input
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
        <div className="flex justify-end px-8 mt-4 relative">
          <button
            onClick={() => setEditingBio(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Edit profile
          </button>
        </div>

        {/* Profile info */}
        <div className="bg-white px-8 pb-6 border-b border-gray-200">
        <div className="relative -mt-16 mb-4">
          <div className="relative inline-block">
          <img
        src={preview || profileImage || defaultAvatar}
        alt="Avatar"
        className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
      />
            <label 
              htmlFor="avatarInput" 
              className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors shadow-md"
              title="Change avatar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{username}</h2>

          {!editingBio ? (
            <>
              <p className="text-gray-700 mb-3">{bio || "No bio yet. Click edit to add one!"}</p>
              <button 
                onClick={() => setEditingBio(true)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Edit Bio
              </button>
            </>
          ) : (
            <>
              <textarea
                className="w-full mt-3 px-4 py-3 rounded-lg border border-gray-300 resize-none text-base font-sans text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows="3"
              />
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={handleBioUpdate} 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Save Bio
                </button>
                <button 
                  onClick={() => setEditingBio(false)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {bioMessage && <p className="text-sm text-green-600 mt-2">{bioMessage}</p>}
        </div>
      </div>

        {/* New Post Card - Improved UI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mx-8 mt-6 mb-6">
        <div className="p-4">
          <div className="flex gap-3 mb-4">
          <img
            src={profileImage || defaultAvatar}
            alt="Avatar"
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
            <div className="flex-1">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 rounded-lg border-none resize-none text-base font-sans text-gray-700 placeholder-gray-400 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                rows="4"
              />
            </div>
          </div>

          {/* Image Preview */}
          {newPostPreview && (
            <div className="relative mb-4 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={newPostPreview}
                alt="Post Preview"
                className="w-full max-h-96 object-cover"
              />
              <button
                onClick={handleRemovePostImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                title="Remove image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-gray-600 hover:text-blue-500 cursor-pointer transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Photo</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePostImageSelect} 
                  className="hidden" 
                />
              </label>
            </div>
            <button 
              onClick={handleNewPost} 
              disabled={posting || (!newPostText.trim() && !newPostFile)}
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
        <div className="flex flex-col gap-4 px-8 pb-8">
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No posts yet. Share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={profileImage || "/default-avatar.png"} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-100" 
                />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900 block">{username}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              {post.text && (
                <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">{post.text}</p>
              )}
              {post.image && (
                <div className="rounded-lg overflow-hidden mb-2 border border-gray-200">
                  <img 
                    src={post.image} 
                    alt="Post" 
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}

              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-1">
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