import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { verifyAdmin } from "../api/auth";

function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImage, setNewPostImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState({ pendingCreations: [], pendingDeletions: [] });
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [communityMembers, setCommunityMembers] = useState({ members: [], admins: [], moderators: [], bannedUsers: [] });
  const [showEditModal, setShowEditModal] = useState(false);
  const [adminTab, setAdminTab] = useState("requests"); // 'requests', 'members', 'roles'
  const navigate = useNavigate();

  // Get userId from localStorage or URL
  const getUserId = () => {
    const token = localStorage.getItem("token");
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("userId") || localStorage.getItem("userId");
  };

  const userId = getUserId();

  // Check admin status on mount
  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await verifyAdmin();
      setIsAdmin(adminStatus.isAdmin || false);
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    fetchCommunities();
    if (isAdmin) {
      fetchPendingRequests();
    }
  }, [isAdmin]);

  const fetchCommunities = async () => {
    try {
      const adminParam = isAdmin ? '&admin=true' : '';
      const url = userId 
        ? `http://localhost:4000/api/communities?userId=${userId}${adminParam}`
        : `http://localhost:4000/api/communities${adminParam ? '?admin=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setCommunities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch("http://localhost:4000/api/communities/pending/all", {
        headers: {
          "x-admin-token": adminToken || "",
        },
      });
      const data = await res.json();
      if (res.ok) setPendingRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCommunityPosts = async (communityId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/posts`);
      const data = await res.json();
      if (res.ok) setCommunityPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.target);
    formData.append("creatorId", userId);

    try {
      const res = await fetch("http://localhost:4000/api/communities", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        fetchCommunities();
        e.target.reset();
        alert("Community creation request submitted! Waiting for admin approval.");
      } else {
        alert(data.msg || "Failed to create community");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating community");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async (communityId) => {
    if (!userId) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to request deletion of this community? This will be reviewed by an admin.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/request-deletion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Deletion request submitted! Waiting for admin approval.");
        fetchCommunities();
        if (isAdmin) {
          fetchPendingRequests();
        }
      } else {
        alert(data.msg || "Failed to request deletion");
      }
    } catch (err) {
      console.error(err);
      alert("Error requesting deletion");
    }
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (res.ok) {
        fetchCommunities();
        if (selectedCommunity?._id === communityId) {
          await fetchCommunityDetails(communityId);
        }
        alert("Join request submitted! Waiting for admin approval.");
      } else {
        alert(data.msg || "Failed to join");
      }
    } catch (err) {
      console.error(err);
      alert("Error joining community");
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (res.ok) {
        fetchCommunities();
        if (selectedCommunity?._id === communityId) {
          setSelectedCommunity({ 
            ...selectedCommunity, 
            members: selectedCommunity.members?.filter(m => {
              const memberId = typeof m === 'string' ? m : m._id;
              return memberId !== userId;
            }) || []
          });
        }
        alert("Left community");
      } else {
        alert(data.msg || "Failed to leave");
      }
    } catch (err) {
      console.error(err);
      alert("Error leaving community");
    }
  };

  const handleViewCommunity = async (community) => {
    setSelectedCommunity(community);
    await fetchCommunityPosts(community._id);
    // Fetch full community details with admins/moderators
    await fetchCommunityDetails(community._id);
  };

  const fetchCommunityDetails = async (communityId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedCommunity(data);
        // Fetch join requests and members if user is admin/moderator
        if (isCommunityAdminOrModerator(data)) {
          await fetchJoinRequests(communityId);
          await fetchCommunityMembers(communityId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJoinRequests = async (communityId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/join-requests?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setJoinRequests(data.joinRequests || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCommunityMembers = async (communityId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/communities/${communityId}/members?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setCommunityMembers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("text", newPostText);
    if (newPostImage) {
      formData.append("image", newPostImage);
    }

    try {
      const res = await fetch(
        `http://localhost:4000/api/communities/${selectedCommunity._id}/posts`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (res.ok) {
        setNewPostText("");
        setNewPostImage(null);
        fetchCommunityPosts(selectedCommunity._id);
      } else {
        alert(data.msg || "Failed to create post");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating post");
    }
  };

  const isMember = (community) => {
    return community.members?.some(m => {
      const memberId = typeof m === 'string' ? m : (m._id || m);
      return memberId === userId;
    });
  };

  const isCreator = (community) => {
    if (!community.creator || !userId) return false;
    const creatorId = typeof community.creator === 'string' 
      ? community.creator 
      : (community.creator._id || community.creator);
    return creatorId === userId;
  };

  const isCommunityAdmin = (community) => {
    if (!community.admins || !userId) return false;
    return community.admins.some(adminId => {
      const id = typeof adminId === 'string' ? adminId : (adminId._id || adminId);
      return id === userId;
    });
  };

  const isCommunityModerator = (community) => {
    if (!community.moderators || !userId) return false;
    return community.moderators.some(modId => {
      const id = typeof modId === 'string' ? modId : (modId._id || modId);
      return id === userId;
    });
  };

  const isCommunityAdminOrModerator = (community) => {
    return isCommunityAdmin(community) || isCommunityModerator(community);
  };

  const hasPendingJoinRequest = (community) => {
    if (!community.joinRequests || !userId) return false;
    return community.joinRequests.some(req => {
      const reqUserId = typeof req.user === 'string' ? req.user : (req.user?._id || req.user);
      return reqUserId === userId && req.status === 'pending';
    });
  };

  // Admin Action Handlers
  const handleApproveJoinRequest = async (requestId) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/communities/${selectedCommunity._id}/join-requests/${requestId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        await fetchJoinRequests(selectedCommunity._id);
        await fetchCommunityDetails(selectedCommunity._id);
        alert("Join request approved");
      } else {
        alert(data.msg || "Failed to approve");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving request");
    }
  };

  const handleRejectJoinRequest = async (requestId) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/communities/${selectedCommunity._id}/join-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        await fetchJoinRequests(selectedCommunity._id);
        alert("Join request rejected");
      } else {
        alert(data.msg || "Failed to reject");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting request");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/communities/${selectedCommunity._id}/remove-member`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, memberId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        await fetchCommunityMembers(selectedCommunity._id);
        await fetchCommunityDetails(selectedCommunity._id);
        alert("Member removed");
      } else {
        alert(data.msg || "Failed to remove member");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing member");
    }
  };

  const handleBanUser = async (targetUserId, banType, reason, expiresAt) => {
    if (!window.confirm(`Are you sure you want to ${banType === 'permanent' ? 'permanently ban' : 'temporarily ban'} this user?`)) return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/communities/${selectedCommunity._id}/ban-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userId: targetUserId, banType, reason, expiresAt }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        await fetchCommunityMembers(selectedCommunity._id);
        await fetchCommunityDetails(selectedCommunity._id);
        alert("User banned");
      } else {
        alert(data.msg || "Failed to ban user");
      }
    } catch (err) {
      console.error(err);
      alert("Error banning user");
    }
  };

  const handleUnbanUser = async (targetUserId) => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/communities/${selectedCommunity._id}/unban-user`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userId: targetUserId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        await fetchCommunityMembers(selectedCommunity._id);
        alert("User unbanned");
      } else {
        alert(data.msg || "Failed to unban user");
      }
    } catch (err) {
      console.error(err);
      alert("Error unbanning user");
    }
  };

  const handlePromoteModerator = async (memberId) => {
    if (!isCommunityAdmin(selectedCommunity)) {
      alert("Only admins can promote moderators");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:4000/api/communities/${selectedCommunity._id}/promote-moderator`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userId: memberId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        await fetchCommunityMembers(selectedCommunity._id);
        await fetchCommunityDetails(selectedCommunity._id);
        alert("User promoted to moderator");
      } else {
        alert(data.msg || "Failed to promote");
      }
    } catch (err) {
      console.error(err);
      alert("Error promoting user");
    }
  };

  const handleDemoteModerator = async (moderatorId) => {
    if (!isCommunityAdmin(selectedCommunity)) {
      alert("Only admins can demote moderators");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:4000/api/communities/${selectedCommunity._id}/demote-moderator`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userId: moderatorId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        await fetchCommunityMembers(selectedCommunity._id);
        await fetchCommunityDetails(selectedCommunity._id);
        alert("Moderator demoted");
      } else {
        alert(data.msg || "Failed to demote");
      }
    } catch (err) {
      console.error(err);
      alert("Error demoting moderator");
    }
  };

  const handleEditCommunity = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    formData.append("userId", userId);

    try {
      const res = await fetch(
        `http://localhost:4000/api/communities/${selectedCommunity._id}/edit`,
        {
          method: "PUT",
          body: formData,
        }
      );
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        await fetchCommunityDetails(selectedCommunity._id);
        alert("Community updated successfully");
      } else {
        alert(data.msg || "Failed to update community");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating community");
    } finally {
      setLoading(false);
    }
  };

  if (selectedCommunity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button 
            onClick={() => setSelectedCommunity(null)} 
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Communities
          </button>

          {/* Community Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            {selectedCommunity.coverImage && (
              <div className="w-full h-64 overflow-hidden">
                <img 
                  src={selectedCommunity.coverImage} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedCommunity.name}</h1>
              <p className="text-gray-600 mb-4">{selectedCommunity.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">{selectedCommunity.members?.length || 0} members</span>
                </div>
                
                {selectedCommunity.interests && selectedCommunity.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCommunity.interests.map((interest, i) => (
                      <span 
                        key={i} 
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                {!isMember(selectedCommunity) ? (
                  hasPendingJoinRequest(selectedCommunity) ? (
                    <span className="px-6 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Join Request Pending
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleJoinCommunity(selectedCommunity._id)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Request to Join
                    </button>
                  )
                ) : (
                  <button 
                    onClick={() => handleLeaveCommunity(selectedCommunity._id)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Leave Community
                  </button>
                )}
                
                {isCommunityAdminOrModerator(selectedCommunity) && (
                  <button
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {isCommunityAdmin(selectedCommunity) ? "Admin Panel" : "Moderator Panel"}
                  </button>
                )}
                
                {isCreator(selectedCommunity) && (
                  selectedCommunity.deletionRequested ? (
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Deletion Requested - Pending Admin Approval
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleRequestDeletion(selectedCommunity._id)}
                      className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Request Deletion
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Create Post Form */}
          {isMember(selectedCommunity) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Post</h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="What's on your mind?"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewPostImage(e.target.files[0])}
                      className="hidden"
                    />
                    {newPostImage ? "Change Image" : "Add Image"}
                  </label>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Post
                  </button>
                </div>
                {newPostImage && (
                  <div className="mt-2">
                    <img 
                      src={URL.createObjectURL(newPostImage)} 
                      alt="Preview" 
                      className="max-w-md h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Community Posts */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Posts</h2>
            {communityPosts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No posts yet. Be the first to post!</p>
              </div>
            ) : (
              communityPosts.map((post) => (
                <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={post.user?.profileImage || "/default-avatar.png"}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{post.user?.username}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.text}</p>
                  {post.image && (
                    <img 
                      src={post.image} 
                      alt="Post" 
                      className="w-full max-w-2xl rounded-lg object-cover"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = pendingRequests.pendingCreations.length + pendingRequests.pendingDeletions.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
            <p className="text-gray-600 mt-1">Discover and join communities that match your interests</p>
          </div>
          <div className="flex gap-3 items-center">
            {isAdmin && (
              <>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Admin Mode
                </span>
                <button 
                  onClick={() => navigate("/admin/dashboard")}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors relative"
                >
                  Admin Dashboard
                  {pendingCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </>
            )}
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Community
            </button>
          </div>
        </div>

        {/* Create Community Modal */}
        {showCreateModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <div 
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Create Community</h2>
                <p className="text-sm text-gray-600 mt-1">Your request will be reviewed by an admin</p>
              </div>
              <form onSubmit={handleCreateCommunity} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Community Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter community name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    placeholder="Describe your community"
                    rows="4"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interests (comma-separated)</label>
                  <input
                    type="text"
                    name="interests"
                    placeholder="e.g., Technology, Programming, Web Development"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                  <input 
                    type="file" 
                    name="coverImage" 
                    accept="image/*" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit for Approval"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Communities Grid */}
        {communities.filter(c => c.status === 'approved' && !c.deletionRequested).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No communities yet</h3>
            <p className="text-gray-500 mb-4">Be the first to create a community!</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Community
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.filter(c => c.status === 'approved' && !c.deletionRequested).map((community) => (
              <div 
                key={community._id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewCommunity(community)}
              >
                {community.coverImage && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={community.coverImage} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{community.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{community.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm font-medium">{community.members?.length || 0} members</span>
                    </div>
                  </div>

                  {community.interests && community.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {community.interests.slice(0, 3).map((interest, i) => (
                        <span 
                          key={i} 
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                      {community.interests.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          +{community.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isMember(community) ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCommunity(community);
                        }}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        View Community
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinCommunity(community._id);
                        }}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        Join
                      </button>
                    )}
                    
                    {isCreator(community) && !community.deletionRequested && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestDeletion(community._id);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        title="Request Deletion"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunitiesPage;
