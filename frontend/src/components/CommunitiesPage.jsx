import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/Logo.png';
import defaultHeader from '../assets/default-header.jpeg';
import { clearAuth } from '../utils/tokenUtils';

// SVG Icon Components
const Users = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const Plus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const Check = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const X = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const Shield = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const Crown = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l7 7 7-7M5 21h14M5 21l2-6m12 6l-2-6" />
  </svg>
);
const Settings = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const Ban = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);
const UserMinus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
  </svg>
);
const AlertCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CommunitiesPage = () => {
  const [communities, setCommunities] = useState([]);
  const [pendingRequests, setPendingRequests] = useState({ pendingCreations: [], pendingDeletions: [] });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showCommunityAdminPanel, setShowCommunityAdminPanel] = useState(false);
  const [communityMembers, setCommunityMembers] = useState({ members: [], admins: [], moderators: [], bannedUsers: [] });
  const [communityPosts, setCommunityPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedMemberForAction, setSelectedMemberForAction] = useState(null);
  const [banType, setBanType] = useState('permanent');
  const [banReason, setBanReason] = useState('');
  const [banExpiresAt, setBanExpiresAt] = useState('');

  // const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const location = useLocation();
  const API_BASE = 'http://localhost:4000/api';
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId') || localStorage.getItem('userId');
  const adminToken = localStorage.getItem('adminToken');

  const isHome = location.pathname === '/';
  const isProfile = location.pathname.startsWith('/profile');
  const isCommunities = location.pathname.startsWith('/communities');
  const isMarketplace = location.pathname.startsWith('/marketplace');
  const isEvents = location.pathname.startsWith('/events');
  const isNotifications = location.pathname.startsWith('/notifications');
  const isSettings = location.pathname.startsWith('/settings');

  useEffect(() => {
    checkAdminStatus();
    loadCommunities();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadPendingRequests();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-admin`, {
        headers: { 'x-admin-token': adminToken || '' }
      });
      const data = await res.json();
      setIsAdmin(data.isAdmin || false);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadCommunities = async () => {
    try {
      const adminParam = isAdmin ? '&admin=true' : '';
      const url = `${API_BASE}/communities?userId=${userId}${adminParam}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setCommunities(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/communities/pending/all`, {
        headers: { 'x-admin-token': adminToken || '' }
      });
      const data = await res.json();
      if (res.ok) setPendingRequests(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadCommunityDetails = async (communityId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/members?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setCommunityMembers(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadCommunityPosts = async (communityId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/posts`);
      const data = await res.json();
      if (res.ok) setCommunityPosts(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    formData.append('creatorId', userId);
    try {
      const res = await fetch(`${API_BASE}/communities`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setShowCreateModal(false);
        e.target.reset();
        alert('Community request submitted!');
        if (isAdmin) loadPendingRequests();
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed');
      }
    } catch (err) {
      alert('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommunity = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${id}/approve`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken || '' }
      });
      if (res.ok) {
        alert('Approved!');
        loadPendingRequests();
        loadCommunities();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleRejectCommunity = async (id) => {
    if (!window.confirm('Reject?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${id}/reject`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken || '' }
      });
      if (res.ok) {
        alert('Rejected');
        loadPendingRequests();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleApproveDeletion = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${id}/approve-deletion`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken || '' }
      });
      if (res.ok) {
        alert('Approved deletion!');
        loadPendingRequests();
        loadCommunities();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleRejectDeletion = async (id) => {
    if (!window.confirm('Reject deletion?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${id}/reject-deletion`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken || '' }
      });
      if (res.ok) {
        alert('Rejected deletion');
        loadPendingRequests();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.msg || 'Joined!');
        loadCommunities();
      } else {
        alert(data.msg || 'Failed to join');
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    if (!window.confirm('Are you sure you want to leave this community?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        alert('Left community');
        setSelectedCommunity(null);
        loadCommunities();
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to leave');
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleViewCommunity = async (community) => {
    setSelectedCommunity(community);
    await loadCommunityPosts(community._id);
    if (isCommunityAdmin(community) || isCommunityModerator(community)) {
      await loadCommunityDetails(community._id);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('text', newPostText);
    if (newPostImage) {
      formData.append('image', newPostImage);
    }
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/posts`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setNewPostText('');
        setNewPostImage(null);
        loadCommunityPosts(selectedCommunity._id);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to create post');
      }
    } catch (err) {
      alert('Error creating post');
    }
  };

  const handleAddMember = async (userIdToAdd) => {
    if (!userIdToAdd) {
      alert('Please enter a user ID');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/add-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUserId: userIdToAdd })
      });
      if (res.ok) {
        alert('Member added');
        loadCommunityDetails(selectedCommunity._id);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to add member');
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove member?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/remove-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUserId: memberId })
      });
      if (res.ok) {
        alert('Removed');
        loadCommunityDetails(selectedCommunity._id);
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        alert('Post deleted');
        loadCommunityPosts(selectedCommunity._id);
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to delete post');
      }
    } catch (err) {
      alert('Error deleting post');
    }
  };

  const handleBanUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/ban-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          targetUserId: selectedMemberForAction._id, 
          banType, 
          reason: banReason, 
          expiresAt: banExpiresAt 
        })
      });
      if (res.ok) {
        alert('Banned');
        setShowBanModal(false);
        setSelectedMemberForAction(null);
        loadCommunityDetails(selectedCommunity._id);
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handlePromoteModerator = async (memberId) => {
    try {
      const res = await fetch(`${API_BASE}/communities/${selectedCommunity._id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetUserId: memberId })
      });
      if (res.ok) {
        alert('Promoted!');
        loadCommunityDetails(selectedCommunity._id);
      }
    } catch (err) {
      alert('Error');
    }
  };

  const handleRequestDeletion = async (communityId) => {
    if (!window.confirm('Request deletion of this community? A site admin will review your request.')) return;
    try {
      const res = await fetch(`${API_BASE}/communities/${communityId}/request-deletion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        alert('Deletion request submitted. Waiting for admin approval.');
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to request deletion');
      }
    } catch (err) {
      alert('Error requesting deletion');
    }
  };

  const isCommunityAdmin = (community) => {
    if (!community?.admins || !userId) return false;
    return community.admins.some(admin => {
      const adminId = typeof admin === 'string' ? admin : admin._id;
      return adminId === userId;
    });
  };

  const isCommunityModerator = (community) => {
    if (!community?.moderators || !userId) return false;
    return community.moderators.some(mod => {
      const modId = typeof mod === 'string' ? mod : mod._id;
      return modId === userId;
    });
  };

  const isMember = (community) => {
    if (!community?.members || !userId) return false;
    return community.members.some(member => {
      const memberId = typeof member === 'string' ? member : member._id;
      return memberId === userId;
    });
  };

  const getRoleLabel = (community) => {
    if (isCommunityAdmin(community)) return 'Admin';
    if (isCommunityModerator(community)) return 'Moderator';
    if (isMember(community)) return 'Member';
    return null;
  };

  // COMMUNITY DETAIL VIEW (RENDERED IF A COMMUNITY IS SELECTED)
  if (selectedCommunity) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-50 border-r border-gray-200 bg-white py-8 px-6 gap-6 fixed inset-y-0 left-0">
          <div className="px-1">
            <img src={logo} alt="SkillNest Logo" className="h-20 mb-2" />
          </div>
          <nav className="flex flex-col gap-1 text-sm font-medium">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Home</Link>
            <Link to="/communities" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600">Communities</Link>
            <Link to="/marketplace" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Marketplace</Link>
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left border-none bg-transparent cursor-pointer"
            >
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Detail Content */}
        <div className="flex-1 md:ml-72 flex justify-center px-4 py-8">
          <div className="w-full max-w-4xl space-y-6">
            <button 
              onClick={() => setSelectedCommunity(null)}
              className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Back to List
            </button>

            <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              {selectedCommunity.coverImage ? (
                <img src={selectedCommunity.coverImage} className="w-full h-48 object-cover" alt="" />
              ) : (
                <img src={defaultHeader} className="w-full h-48 object-cover" alt="Default header" />
              )}
              <div className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-black text-gray-900">{selectedCommunity.name}</h1>
                    <p className="text-gray-500 mt-2">{selectedCommunity.description}</p>
                    {isMember(selectedCommunity) && (
                      <button 
                        onClick={() => handleLeaveCommunity(selectedCommunity._id)} 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                      >
                        Leave Community
                      </button>
                    )}
                  </div>
                  {(isCommunityAdmin(selectedCommunity) || isCommunityModerator(selectedCommunity)) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        loadCommunityDetails(selectedCommunity._id);
                        setShowCommunityAdminPanel(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      <Settings className="w-4 h-4" /> Manage
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Post Feed */}
            <div className="space-y-4">
               {isMember(selectedCommunity) && (
                 <div className="bg-white p-6 rounded-3xl border border-gray-200">
                    <form onSubmit={handleCreatePost} className="space-y-4">
                      <textarea 
                        value={newPostText}
                        onChange={(e) => setNewPostText(e.target.value)}
                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        placeholder="Share something with the community..." 
                      />
                      <div className="flex justify-between">
                         <input type="file" onChange={(e) => setNewPostImage(e.target.files[0])} className="text-xs" />
                         <button type="submit" className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold">Post</button>
                      </div>
                    </form>
                 </div>
               )}
               
               <div className="space-y-4">
                 {communityPosts.map(post => (
                    <div key={post._id} className="bg-white p-6 rounded-3xl border border-gray-200 relative">
                       <p className="text-gray-800">{post.text}</p>
                       {post.image && <img src={post.image} className="mt-4 rounded-2xl w-full" alt="" />}
                       {(isCommunityAdmin(selectedCommunity) || isCommunityModerator(selectedCommunity)) && (
                         <button 
                           onClick={() => handleDeletePost(post._id)} 
                           className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                         >
                           Delete
                         </button>
                       )}
                    </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT DRAWER ADMIN PANEL */}
        {showCommunityAdminPanel && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCommunityAdminPanel(false)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b flex justify-between items-center bg-gray-900 text-white">
                <h2 className="font-black flex items-center gap-2"><Shield className="w-5 h-5" /> Community Admin</h2>
                <button onClick={() => setShowCommunityAdminPanel(false)}><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Members</h3>
                {isCommunityAdmin(selectedCommunity) && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-2xl">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Add Member</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter User ID"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        id="addMemberInput"
                      />
                      <button
                        onClick={() => {
                          const userIdToAdd = document.getElementById('addMemberInput').value.trim();
                          handleAddMember(userIdToAdd);
                          document.getElementById('addMemberInput').value = '';
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {communityMembers.members?.map(member => (
                    <div key={member._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <img src={member.profileImage || '/default-avatar.png'} className="w-10 h-10 rounded-full border" alt="" />
                        <span className="font-bold text-sm text-gray-900">{member.username}</span>
                      </div>
                      <div className="flex gap-2">
                        {isCommunityAdmin(selectedCommunity) && (
                          <button onClick={() => handlePromoteModerator(member._id)} className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"><Crown className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => { setSelectedMemberForAction(member); setShowBanModal(true); }} className="p-2 hover:bg-red-100 text-red-600 rounded-lg"><Ban className="w-4 h-4" /></button>
                        <button onClick={() => handleRemoveMember(member._id)} className="p-2 hover:bg-gray-200 text-gray-500 rounded-lg"><UserMinus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                {isCommunityAdmin(selectedCommunity) && (
                  <button 
                    onClick={() => handleRequestDeletion(selectedCommunity._id)} 
                    className="mt-6 w-full px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                  >
                    Request Community Deletion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MAIN LIST VIEW (The Grid UI)
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* Sidebar navigation - Professional Sleek Sidebar */}
      <aside className="hidden lg:flex flex-col w-50 border-r border-slate-200 bg-white py-8 px-6 gap-6 fixed inset-y-0 left-0 shadow-sm">
        <div className="px-2">
          <img src={logo} alt="SkillNest Logo" className="h-20 mb-2" />
        </div>
        <nav className="flex flex-col gap-1 text-sm font-semibold">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
            Home
          </Link>
          <Link to="/communities" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 shadow-sm shadow-blue-100">
            Communities
          </Link>
          <Link to="/marketplace" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
            Marketplace
          </Link>
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all border-none bg-transparent cursor-pointer font-semibold"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="max-w-[1400px] mx-auto w-full px-6 py-10">
          
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Explore Communities</h1>
              <p className="text-slate-500 font-medium text-lg">Join collaborative spaces tailored to your learning path.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              {isAdmin && (
                <button 
                  onClick={() => setShowAdminDashboard(true)}
                  className="flex-1 md:flex-none px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4 text-blue-500" /> 
                  Admin <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px]">{pendingRequests.pendingCreations.length}</span>
                </button>
              )}
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Create
              </button>
            </div>
          </header>

          {/* THE GRID LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {communities.map((community) => (
              <div 
                key={community._id}
                onClick={() => handleViewCommunity(community)}
                className="group relative bg-white rounded-[32px] border border-slate-100 p-4 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col h-full"
              >
                {/* Image Container */}
                <div className="relative w-full h-48 rounded-[24px] overflow-hidden bg-slate-100 mb-5">
                  <img 
                    src={community.coverImage || defaultHeader} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                    alt={community.name} 
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {getRoleLabel(community) && (
                      <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                        {getRoleLabel(community)}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="px-2 flex-1 flex flex-col">
                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                    {community.name}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-6">
                    {community.description}
                  </p>
                  
                  {/* Stats & Action */}
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                         ))}
                      </div>
                      <span className="text-xs font-bold text-slate-500">{community.members?.length || 0}</span>
                    </div>

                    {isMember(community) ? (
                      <button className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors">
                        Open
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleJoinCommunity(community._id); }}
                        className="px-5 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-[101] flex justify-center items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBanModal(false)} />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Ban User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ban Type</label>
                <select value={banType} onChange={(e) => setBanType(e.target.value)} className="w-full p-2 border rounded">
                  <option value="temporary">Temporary</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              {banType === 'temporary' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Expires At</label>
                  <input type="datetime-local" value={banExpiresAt} onChange={(e) => setBanExpiresAt(e.target.value)} className="w-full p-2 border rounded" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} className="w-full p-2 border rounded" placeholder="Reason for ban" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowBanModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button onClick={handleBanUser} className="px-4 py-2 bg-red-600 text-white rounded">Ban</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[101] flex justify-center items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Create Community</h3>
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input name="name" required className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" required className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interests (comma separated)</label>
                <input name="interests" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cover Image</label>
                <input name="coverImage" type="file" className="w-full p-2 border rounded" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <div className="fixed inset-0 z-[101] flex justify-center items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdminDashboard(false)} />
          <div className="relative bg-white p-6 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Admin Dashboard</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold mb-2">Pending Community Creations</h4>
                <div className="space-y-2">
                  {pendingRequests.pendingCreations.map(community => (
                    <div key={community._id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                      <div>
                        <p className="font-bold">{community.name}</p>
                        <p className="text-sm text-gray-600">{community.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveCommunity(community._id)} className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                        <button onClick={() => handleRejectCommunity(community._id)} className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-2">Pending Deletions</h4>
                <div className="space-y-2">
                  {pendingRequests.pendingDeletions.map(community => (
                    <div key={community._id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                      <div>
                        <p className="font-bold">{community.name}</p>
                        <p className="text-sm text-gray-600">Requested by: {community.deletionRequestedBy?.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveDeletion(community._id)} className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                        <button onClick={() => handleRejectDeletion(community._id)} className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesPage;